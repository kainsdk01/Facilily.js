const { ConexaoVoz } = require('./ConexaoVoz');
const { FilaMusica } = require('./FilaMusica');

/**
 * Coordena tudo relacionado a voz de um Cliente: pedir pro Discord conectar
 * o bot num canal (isso acontece no gateway PRINCIPAL), juntar as duas
 * respostas que chegam separadas (VOICE_STATE_UPDATE + VOICE_SERVER_UPDATE)
 * pra então abrir a ConexaoVoz de verdade, e manter a FilaMusica de cada
 * servidor.
 */
class GerenciadorVoz {
  constructor(cliente) {
    this.cliente = cliente;
    this.conexoes = new Map(); // servidorId -> ConexaoVoz
    this.filas = new Map(); // servidorId -> FilaMusica
    this.pendentes = new Map(); // servidorId -> { canalId, sessionId?, token?, endpoint?, resolver, rejeitador }
    this.estadosVoz = new Map(); // servidorId -> Map(userId -> canalId|null)
  }

  /** Chamado a cada VOICE_STATE_UPDATE que chega no gateway principal. */
  processarEstadoVoz(dados) {
    const { guild_id: servidorId, user_id: userId, channel_id: canalId, session_id: sessionId } = dados;
    if (!servidorId) return;

    if (!this.estadosVoz.has(servidorId)) this.estadosVoz.set(servidorId, new Map());
    this.estadosVoz.get(servidorId).set(userId, canalId ?? null);

    const souEu = userId === this.cliente.usuario?.id;
    const pendente = this.pendentes.get(servidorId);
    if (souEu && pendente) {
      pendente.sessionId = sessionId;
      this._tentarFinalizarHandshake(servidorId);
    }
  }

  /** Chamado a cada VOICE_SERVER_UPDATE (token + endpoint do servidor de voz). */
  processarServidorVoz(dados) {
    const { guild_id: servidorId, token, endpoint } = dados;
    const pendente = this.pendentes.get(servidorId);
    if (!pendente) return;

    pendente.token = token;
    pendente.endpoint = endpoint;
    this._tentarFinalizarHandshake(servidorId);
  }

  async _tentarFinalizarHandshake(servidorId) {
    const pendente = this.pendentes.get(servidorId);
    if (!pendente?.sessionId || !pendente?.token || !pendente?.endpoint) return; // falta alguma peça ainda

    this.pendentes.delete(servidorId);

    const conexao = new ConexaoVoz({
      servidorId,
      canalId: pendente.canalId,
      userId: this.cliente.usuario.id,
      sessionId: pendente.sessionId,
      token: pendente.token,
      endpoint: pendente.endpoint,
    });

    conexao.on('erro', (erro) => this.cliente.emit('erro', erro));
    conexao.on('faixaTerminou', () => this._avancarFila(servidorId));
    conexao.on('desconectada', () => {
      this.conexoes.delete(servidorId);
      this.cliente.emit('saiuDoCanalDeVoz', servidorId);
    });

    try {
      await conexao.conectar();
      this.conexoes.set(servidorId, conexao);
      pendente.resolver(conexao);
    } catch (erro) {
      pendente.rejeitador(erro);
    }
  }

  /** Pede pro bot entrar num canal de voz. Resolve quando a conexão estiver pronta pra tocar. */
  entrar(servidorId, canalId) {
    const existente = this.conexoes.get(servidorId);
    if (existente && existente.canalId === canalId) return Promise.resolve(existente);

    this.cliente.gateway.enviar(4, {
      guild_id: servidorId,
      channel_id: canalId,
      self_mute: false,
      self_deaf: true, // o bot não precisa ouvir ninguém, só tocar
    });

    return new Promise((resolver, rejeitador) => {
      this.pendentes.set(servidorId, { canalId, resolver, rejeitador });
    });
  }

  /** Desconecta do canal de voz do servidor e descarta a fila. */
  sair(servidorId) {
    this.cliente.gateway.enviar(4, { guild_id: servidorId, channel_id: null, self_mute: false, self_deaf: false });
    this.conexoes.get(servidorId)?.destruir();
    this.conexoes.delete(servidorId);
    this.filas.delete(servidorId);
  }

  _obterFila(servidorId) {
    if (!this.filas.has(servidorId)) this.filas.set(servidorId, new FilaMusica());
    return this.filas.get(servidorId);
  }

  /** Em qual canal de voz um usuário está nesse servidor (ou null). Usado pelo #tocar[]. */
  obterCanalDoUsuario(servidorId, userId) {
    return this.estadosVoz.get(servidorId)?.get(userId) ?? null;
  }

  async tocar(servidorId, canalId, faixa) {
    let conexao = this.conexoes.get(servidorId);
    if (!conexao) conexao = await this.entrar(servidorId, canalId);

    const fila = this._obterFila(servidorId);
    fila.adicionar(faixa);

    if (conexao.estado === 'pronta') this._avancarFila(servidorId);
    return fila;
  }

  _avancarFila(servidorId) {
    const fila = this.filas.get(servidorId);
    const conexao = this.conexoes.get(servidorId);
    if (!fila || !conexao) return;

    const proxima = fila.proxima();
    if (!proxima) {
      this.cliente.emit('filaVazia', servidorId);
      return;
    }

    conexao.tocar(proxima.url, fila.volume);
    this.cliente.emit('musicaComecou', { servidorId, faixa: proxima });
  }

  pausar(servidorId) {
    this.conexoes.get(servidorId)?.pausar();
  }

  retomar(servidorId) {
    this.conexoes.get(servidorId)?.retomar();
  }

  /** Pula a faixa atual (funciona mesmo sem nada tocando: só avança a fila). */
  pular(servidorId) {
    this._avancarFila(servidorId);
  }

  pararMusica(servidorId) {
    this.filas.get(servidorId)?.limpar();
    this.sair(servidorId);
  }

  definirVolume(servidorId, volume) {
    const fila = this.filas.get(servidorId);
    if (!fila) return;
    fila.volume = Math.max(0, Math.min(200, volume));
    this.conexoes.get(servidorId)?.definirVolume(fila.volume);
  }

  obterFila(servidorId) {
    return this.filas.get(servidorId) ?? null;
  }
}

module.exports = { GerenciadorVoz };
