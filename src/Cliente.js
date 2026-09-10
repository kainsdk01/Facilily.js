const { EventEmitter } = require('node:events');
const { ClienteGateway } = require('./ClienteGateway');
const { ClienteRest } = require('./ClienteRest');
const { Mensagem } = require('./estruturas/Mensagem');
const { Interacao, TiposInteracao, TiposComponente } = require('./estruturas/Interacao');
const { ComandosGerenciador } = require('./ComandosGerenciador');
const { EventosGerenciador } = require('./EventosGerenciador');
const { MAPA_EVENTOS, msg } = require('./motor/MapaEventos');

class Cliente extends EventEmitter {
  constructor({ intencoes = 0, prefixo = '!' } = {}) {
    super();
    this.intencoes = intencoes;
    this.prefixo = prefixo;
    this.usuario = null;
    this.servidores = new Map();
    this.variaveis = new Map();
    // Guarda o último canal de voz conhecido de cada membro (chave:
    // "idServidor:idUsuario"), só pra descobrir se um VOICE_STATE_UPDATE
    // significa "entrou", "saiu" ou "mudou de canal".
    this._estadosVoz = new Map();
    this.comandosGerenciador = new ComandosGerenciador(this);
    this.eventosGerenciador = new EventosGerenciador(this);
  }

  comando(nome, opcoes) {
    this.comandosGerenciador.registrar(nome, opcoes);
    return this;
  }

  /**
   * Carrega todos os comandos de dentro de uma pasta, ao invés de
   * registrar um por um com .comando().
   * Ex: bot.carregarComandos('./comandos');
   */
  carregarComandos(caminhoPasta) {
    this.comandosGerenciador.carregarPasta(caminhoPasta);
    return this;
  }

  /**
   * Carrega uma pasta de eventos em texto puro (pronto.txt, erro.txt, etc.),
   * sem precisar escrever bot.on(...) manualmente.
   * Ex: bot.carregarEventos('./eventos');
   * Se a pasta não existir, simplesmente não faz nada (é opcional).
   */
  carregarEventos(caminhoPasta) {
    if (require('node:fs').existsSync(caminhoPasta)) {
      this.eventosGerenciador.carregarPasta(caminhoPasta);
    }
    return this;
  }

  entrar(token) {
    this.token = token;
    this.rest = new ClienteRest(token);
    this.gateway = new ClienteGateway(token, this.intencoes);

    this.gateway.on('depuracao', (msg) => this.emit('depuracao', msg));
    this.gateway.on('erro', (err) => this.emit('erro', err));
    this.gateway.on('dispatch', (evento, dados) => this.processarDispatch(evento, dados));

    this.gateway.conectar();
    return this;
  }

  processarDispatch(evento, dados) {
    switch (evento) {
      case 'READY':
        this.usuario = dados.user;
        this.emit('pronto');
        break;

      case 'MESSAGE_CREATE': {
        const mensagem = new Mensagem(this, dados);
        this.emit('mensagemCriada', mensagem);
        this.comandosGerenciador.processarMensagem(mensagem).catch((erro) => this.emit('erro', erro));
        break;
      }

      case 'GUILD_CREATE':
        this.servidores.set(dados.id, dados);
        break;

      case 'GUILD_UPDATE':
        this.servidores.set(dados.id, dados);
        this.emit('servidorAtualizado', msg(null, null, dados.id), {});
        break;

      case 'GUILD_DELETE':
        if (dados.unavailable) {
          // Fora do ar por instabilidade da Discord, o bot continua no servidor.
          this.emit('servidorIndisponivel', msg(null, null, dados.id), {});
        } else {
          // O bot foi removido/expulso do servidor de verdade.
          this.servidores.delete(dados.id);
          this.emit('servidorSaiu', msg(null, null, dados.id), {});
        }
        break;

      case 'VOICE_STATE_UPDATE':
        this._processarVoz(dados);
        break;

      case 'INTERACTION_CREATE':
        this._processarInteracao(dados);
        break;

      default: {
        const mapeado = MAPA_EVENTOS[evento];
        if (mapeado) {
          const { mensagem, extras } = mapeado.construir(dados);
          this.emit(mapeado.evento, mensagem, extras);
        } else {
          this.emit('bruto', evento, dados);
        }
      }
    }
  }

  _processarVoz(dados) {
    const chave = `${dados.guild_id}:${dados.user_id}`;
    const canalAnterior = this._estadosVoz.get(chave) ?? null;
    const canalAtual = dados.channel_id ?? null;

    const mensagem = msg(dados.member?.user ?? { id: dados.user_id }, canalAtual, dados.guild_id);
    const extrasBase = {
      mutado: String(Boolean(dados.mute)),
      ensurdecido: String(Boolean(dados.deaf)),
      autoMutado: String(Boolean(dados.self_mute)),
      autoEnsurdecido: String(Boolean(dados.self_deaf)),
      transmitindo: String(Boolean(dados.self_stream)),
      cameraLigada: String(Boolean(dados.self_video)),
    };

    // Sempre emite o "cru", pra quem só quer saber que algo mudou (mute, etc.)
    this.emit('estadoVozAtualizado', mensagem, extrasBase);

    if (!canalAnterior && canalAtual) {
      this.emit('entrouNoVoz', mensagem, extrasBase);
    } else if (canalAnterior && !canalAtual) {
      this.emit('saiuDoVoz', { ...mensagem, canalId: canalAnterior }, extrasBase);
    } else if (canalAnterior && canalAtual && canalAnterior !== canalAtual) {
      this.emit('mudouDeCanalVoz', mensagem, { ...extrasBase, idCanalAnterior: canalAnterior });
    }

    if (canalAtual) {
      this._estadosVoz.set(chave, canalAtual);
    } else {
      this._estadosVoz.delete(chave);
    }
  }

  _processarInteracao(dados) {
    const interacao = new Interacao(this, dados);
    const mensagem = msg(interacao.usuario, interacao.canalId, interacao.servidorId);
    const extras = {
      idInteracao: interacao.id,
      customId: interacao.customId ?? '',
      nomeComandoBarra: interacao.nomeComando ?? '',
      // Referência ao objeto de verdade, pra quem quiser usar as tags
      // #responderInteracao[], #deferirInteracao[], #valorOpcao[], etc.
      interacao,
    };

    this.emit('interacaoCriada', mensagem, extras);

    switch (interacao.tipo) {
      case TiposInteracao.COMANDO_APLICACAO:
        this.emit('comandoBarraExecutado', mensagem, extras);
        break;
      case TiposInteracao.COMPONENTE_MENSAGEM:
        if (interacao.tipoComponente === TiposComponente.BOTAO) {
          this.emit('botaoClicado', mensagem, extras);
        } else {
          this.emit('menuSelecaoUsado', mensagem, extras);
        }
        break;
      case TiposInteracao.AUTOCOMPLETE:
        this.emit('autocompleteSolicitado', mensagem, extras);
        break;
      case TiposInteracao.ENVIO_MODAL:
        this.emit('modalEnviado', mensagem, extras);
        break;
    }
  }
}

module.exports = { Cliente };
