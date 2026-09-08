const { EventEmitter } = require('node:events');
const { ClienteGateway } = require('./ClienteGateway');
const { ClienteRest } = require('./ClienteRest');
const { Mensagem } = require('./estruturas/Mensagem');
const { ComandosGerenciador } = require('./ComandosGerenciador');
const { EventosGerenciador } = require('./EventosGerenciador');

class Cliente extends EventEmitter {
  constructor({ intencoes = 0, prefixo = '!' } = {}) {
    super();
    this.intencoes = intencoes;
    this.prefixo = prefixo;
    this.usuario = null;
    this.servidores = new Map();
    this.variaveis = new Map();
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

      default:
        this.emit('bruto', evento, dados);
    }
  }
}

module.exports = { Cliente };
