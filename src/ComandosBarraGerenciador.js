const { Interacao, TiposInteracao, TiposComponente } = require('./estruturas/Interacao');
const { ErroFacility } = require('./ErroFacility');

class ComandosBarraGerenciador {
  constructor(cliente) {
    this.cliente = cliente;
    this.comandos = new Map();
  }

  registrar(definicao, executar) {
    const dados = definicao.construir ? definicao.construir() : definicao;
    this.comandos.set(dados.name.toLowerCase(), { dados, executar });
  }

  /** Envia a definição de todos os comandos de barra registrados pro Discord */
  async sincronizar({ servidorId } = {}) {
    const corpo = [...this.comandos.values()].map((c) => c.dados);
    const caminho = servidorId
      ? `/applications/${this.cliente.aplicacaoId}/guilds/${servidorId}/commands`
      : `/applications/${this.cliente.aplicacaoId}/commands`;
    return this.cliente.rest.put(caminho, corpo);
  }

  async processar(dadosBrutos) {
    const interacao = new Interacao(this.cliente, dadosBrutos);

    switch (interacao.tipo) {
      case TiposInteracao.COMANDO_APLICACAO: {
        const comando = this.comandos.get(interacao.nomeComando?.toLowerCase());
        this.cliente.emit('comandoBarraExecutado', interacao);
        if (comando) {
          try {
            await comando.executar(interacao);
          } catch (erro) {
            const erroFinal = erro instanceof ErroFacility
              ? erro
              : new ErroFacility('BARRA_EXECUCAO_FALHOU', `(comando: /${interacao.nomeComando})`, erro);
            this.cliente.emit('erro', erroFinal);
          }
        }
        break;
      }

      case TiposInteracao.COMPONENTE_MENSAGEM: {
        if (interacao.tipoComponente === TiposComponente.BOTAO) {
          this.cliente.emit('botaoClicado', interacao);
        } else {
          this.cliente.emit('menuSelecionado', interacao);
        }
        break;
      }

      case TiposInteracao.ENVIO_MODAL:
        this.cliente.emit('modalEnviado', interacao);
        break;

      case TiposInteracao.AUTOCOMPLETE:
        this.cliente.emit('autocompleteSolicitado', interacao);
        break;
    }
  }
}

module.exports = { ComandosBarraGerenciador };
