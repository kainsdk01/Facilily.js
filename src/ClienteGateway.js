const WebSocket = require('ws');
const { EventEmitter } = require('node:events');

const URL_GATEWAY = 'wss://gateway.discord.gg/?v=10&encoding=json';
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30000;

const OpCodes = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  RESUME: 6,
  RECONNECT: 7,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
};

class ClienteGateway extends EventEmitter {
  constructor(token, intencoes) {
    super();
    this.token = token;
    this.intencoes = intencoes;
    this.ws = null;
    this.intervaloHeartbeat = null;
    this.sequencia = null;
    this.sessionId = null;
    this.urlResume = null;
    this.tentativasReconexao = 0;
  }

  proximoDelayReconexao() {
    const exponencial = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** this.tentativasReconexao);
    this.tentativasReconexao++;
    // Jitter completo (0 a exponencial): evita que várias instâncias
    // reconectando ao mesmo tempo batam no gateway no mesmo instante.
    return Math.random() * exponencial;
  }

  conectar(url = URL_GATEWAY) {
    this.ws = new WebSocket(url);

    this.ws.on('open', () => this.emit('depuracao', 'Conectado ao gateway'));
    this.ws.on('message', (dados) => this.processarMensagem(JSON.parse(dados)));
    this.ws.on('close', (codigo) => this.processarFechamento(codigo));
    this.ws.on('error', (err) => this.emit('erro', err));
  }

  processarMensagem(payload) {
    const { op, d, s, t } = payload;
    if (s) this.sequencia = s;

    switch (op) {
      case OpCodes.HELLO:
        this.iniciarHeartbeat(d.heartbeat_interval);
        this.sessionId ? this.retomar() : this.identificar();
        break;

      case OpCodes.DISPATCH:
        if (t === 'READY') {
          this.sessionId = d.session_id;
          this.urlResume = d.resume_gateway_url;
          this.tentativasReconexao = 0;
        }
        this.emit('dispatch', t, d);
        break;

      case OpCodes.HEARTBEAT_ACK:
        this.confirmado = true;
        break;

      case OpCodes.INVALID_SESSION:
        this.sessionId = null;
        setTimeout(() => this.identificar(), 2000);
        break;

      case OpCodes.RECONNECT:
        this.ws.close();
        this.conectar(this.urlResume ?? URL_GATEWAY);
        break;
    }
  }

  iniciarHeartbeat(intervalo) {
    this.confirmado = true;
    if (this.intervaloHeartbeat) clearInterval(this.intervaloHeartbeat);
    this.intervaloHeartbeat = setInterval(() => {
      if (!this.confirmado) {
        // Não recebeu ACK: conexão morta, reconectar
        this.ws.close();
        return;
      }
      this.confirmado = false;
      this.enviar(OpCodes.HEARTBEAT, this.sequencia);
    }, intervalo);
  }

  identificar() {
    this.enviar(OpCodes.IDENTIFY, {
      token: this.token,
      intents: this.intencoes,
      properties: {
        os: 'linux',
        browser: 'facility.js',
        device: 'facility.js',
      },
    });
  }

  retomar() {
    this.enviar(OpCodes.RESUME, {
      token: this.token,
      session_id: this.sessionId,
      seq: this.sequencia,
    });
  }

  enviar(op, d) {
    if (this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ op, d }));
  }

  processarFechamento(codigo) {
    clearInterval(this.intervaloHeartbeat);
    this.emit('depuracao', `Conexão fechada (código ${codigo})`);

    // Códigos que não permitem reconexão
    const codigosFatais = [4004, 4010, 4011, 4012, 4013, 4014];
    if (codigosFatais.includes(codigo)) {
      this.emit('erro', new Error(`Gateway fechou com código fatal: ${codigo}`));
      return;
    }

    setTimeout(() => this.conectar(this.urlResume ?? URL_GATEWAY), this.proximoDelayReconexao());
  }
}

module.exports = { ClienteGateway, OpCodes };
