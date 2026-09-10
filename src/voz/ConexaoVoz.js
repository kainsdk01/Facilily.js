const WebSocket = require('ws');
const dgram = require('node:dgram');
const { EventEmitter } = require('node:events');
const nacl = require('tweetnacl');
const { ErroFacility } = require('../ErroFacility');
const { criarPipelineAudio } = require('./CodificadorAudio');

const OpCodesVoz = {
  IDENTIFY: 0,
  SELECT_PROTOCOL: 1,
  READY: 2,
  HEARTBEAT: 3,
  SESSION_DESCRIPTION: 4,
  SPEAKING: 5,
  HEARTBEAT_ACK: 6,
  HELLO: 8,
  RESUMED: 9,
};

const MODO_CRIPTOGRAFIA = 'xsalsa20_poly1305';
const AMOSTRAS_POR_FRAME = 960; // 20ms a 48kHz
const DURACAO_FRAME_MS = 20;

/**
 * Representa a conexão de voz ativa em UM servidor: abre o voice gateway
 * (um WebSocket separado do gateway principal), faz o handshake de UDP/
 * criptografia e manda os pacotes de áudio (RTP + Opus) durante a reprodução.
 *
 * Não sabe nada sobre fila de músicas — isso é responsabilidade do
 * GerenciadorVoz, que chama .tocar(url) uma faixa de cada vez.
 */
class ConexaoVoz extends EventEmitter {
  constructor({ servidorId, canalId, userId, sessionId, token, endpoint }) {
    super();
    this.servidorId = servidorId;
    this.canalId = canalId;
    this.userId = userId;
    this.sessionId = sessionId;
    this.token = token;
    this.endpoint = endpoint;

    this.ws = null;
    this.udp = null;
    this.intervaloHeartbeat = null;
    this.ssrc = null;
    this.ipServidor = null;
    this.portaServidor = null;
    this.chaveSecreta = null;

    this.sequencia = 0;
    this.timestamp = 0;
    this.timeoutEnvio = null;
    this.proximoEnvioEm = 0;

    this.pipeline = null; // { stream, definirVolume, destruir }
    this.estado = 'conectando'; // conectando | pronta | tocando | pausada | destruida
  }

  conectar() {
    return new Promise((resolve, reject) => {
      const url = `wss://${this.endpoint.replace(/:\d+$/, '')}?v=4`;
      this.ws = new WebSocket(url);

      this._resolverConexao = resolve;
      this._rejeitarConexao = reject;

      this.ws.on('open', () => this._enviar(OpCodesVoz.IDENTIFY, {
        server_id: this.servidorId,
        user_id: this.userId,
        session_id: this.sessionId,
        token: this.token,
      }));

      this.ws.on('message', (dados) => this._processarMensagem(JSON.parse(dados)));
      this.ws.on('error', (erro) => this.emit('erro', new ErroFacility('GATEWAY_ERRO_SOCKET', '(voice gateway)', erro)));
      this.ws.on('close', () => {
        if (this.estado !== 'destruida') this.emit('desconectada');
      });
    });
  }

  async _processarMensagem(payload) {
    const { op, d } = payload;

    switch (op) {
      case OpCodesVoz.HELLO:
        this._iniciarHeartbeat(d.heartbeat_interval);
        break;

      case OpCodesVoz.READY:
        this.ssrc = d.ssrc;
        this.ipServidor = d.ip;
        this.portaServidor = d.port;
        await this._descobrirIp();
        break;

      case OpCodesVoz.SESSION_DESCRIPTION:
        this.chaveSecreta = Uint8Array.from(d.secret_key);
        this.estado = 'pronta';
        this._resolverConexao?.(this);
        this.emit('pronta');
        break;

      case OpCodesVoz.HEARTBEAT_ACK:
        break;
    }
  }

  /** UDP IP Discovery: descobre nosso IP/porta público visto pelo Discord. */
  _descobrirIp() {
    return new Promise((resolveDescoberta) => {
      this.udp = dgram.createSocket('udp4');

      const pacote = Buffer.alloc(74);
      pacote.writeUInt16BE(1, 0); // tipo: request
      pacote.writeUInt16BE(70, 2); // tamanho do resto do pacote
      pacote.writeUInt32BE(this.ssrc, 4);

      this.udp.once('message', (resposta) => {
        const endereco = resposta.subarray(8, 72).toString('utf8').replace(/\0.*$/, '');
        const porta = resposta.readUInt16BE(72);

        this._enviar(OpCodesVoz.SELECT_PROTOCOL, {
          protocol: 'udp',
          data: { address: endereco, port: porta, mode: MODO_CRIPTOGRAFIA },
        });

        resolveDescoberta();
      });

      this.udp.on('error', (erro) => this.emit('erro', new ErroFacility('GATEWAY_ERRO_SOCKET', '(voice udp)', erro)));

      this.udp.send(pacote, this.portaServidor, this.ipServidor);
    });
  }

  _iniciarHeartbeat(intervalo) {
    if (this.intervaloHeartbeat) clearInterval(this.intervaloHeartbeat);
    this.intervaloHeartbeat = setInterval(() => this._enviar(OpCodesVoz.HEARTBEAT, Date.now()), intervalo);
  }

  _enviar(op, d) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ op, d }));
  }

  _falar(falando) {
    this._enviar(OpCodesVoz.SPEAKING, { speaking: falando ? 1 : 0, delay: 0, ssrc: this.ssrc });
  }

  /**
   * Começa a tocar uma URL de áudio (link direto http(s) ou arquivo local —
   * qualquer coisa que o ffmpeg abra). Interrompe o que estiver tocando antes.
   */
  tocar(url, volumeInicial = 100) {
    this._destruirPipeline();

    this.pipeline = criarPipelineAudio(url, volumeInicial);
    this.estado = 'tocando';
    this._falar(true);
    this._iniciarLoopDeEnvio();

    this.pipeline.stream.on('end', () => {
      this._falar(false);
      this.emit('faixaTerminou');
    });

    this.pipeline.stream.on('error', (erro) => {
      this.emit('erro', new ErroFacility('MOTOR_FUNCAO_FALHOU', `(falha ao tocar áudio: ${url})`, erro));
      this.emit('faixaTerminou');
    });
  }

  pausar() {
    if (this.estado !== 'tocando') return;
    this.estado = 'pausada';
    this._falar(false);
    clearTimeout(this.timeoutEnvio);
  }

  retomar() {
    if (this.estado !== 'pausada') return;
    this.estado = 'tocando';
    this._falar(true);
    this._iniciarLoopDeEnvio();
  }

  definirVolume(volume) {
    this.pipeline?.definirVolume(volume);
  }

  /**
   * Envia um frame Opus por vez, a cada 20ms, com correção de drift
   * (calcula o próximo horário absoluto em vez de só encadear setTimeout).
   */
  _iniciarLoopDeEnvio() {
    this.proximoEnvioEm = Date.now();
    this._agendarProximoEnvio();
  }

  _agendarProximoEnvio() {
    this.proximoEnvioEm += DURACAO_FRAME_MS;
    const espera = Math.max(0, this.proximoEnvioEm - Date.now());

    this.timeoutEnvio = setTimeout(() => {
      if (this.estado !== 'tocando') return;

      const frame = this.pipeline?.stream.read();
      if (frame) this._enviarFrame(frame);

      this._agendarProximoEnvio();
    }, espera);
  }

  _enviarFrame(frameOpus) {
    if (!this.udp || !this.chaveSecreta) return;

    const cabecalho = Buffer.alloc(12);
    cabecalho[0] = 0x80;
    cabecalho[1] = 0x78;
    cabecalho.writeUInt16BE(this.sequencia, 2);
    cabecalho.writeUInt32BE(this.timestamp, 4);
    cabecalho.writeUInt32BE(this.ssrc, 8);

    // Nonce (24 bytes) no modo xsalsa20_poly1305: o cabeçalho RTP + zeros
    const nonce = Buffer.alloc(24);
    cabecalho.copy(nonce, 0);

    const criptografado = nacl.secretbox(frameOpus, nonce, this.chaveSecreta);
    const pacote = Buffer.concat([cabecalho, Buffer.from(criptografado)]);

    this.udp.send(pacote, this.portaServidor, this.ipServidor);

    this.sequencia = (this.sequencia + 1) & 0xffff;
    this.timestamp = (this.timestamp + AMOSTRAS_POR_FRAME) >>> 0;
  }

  _destruirPipeline() {
    clearTimeout(this.timeoutEnvio);
    this.pipeline?.destruir();
    this.pipeline = null;
  }

  destruir() {
    this.estado = 'destruida';
    this._destruirPipeline();
    clearInterval(this.intervaloHeartbeat);
    this.udp?.close();
    this.ws?.close();
  }
}

module.exports = { ConexaoVoz, OpCodesVoz };
