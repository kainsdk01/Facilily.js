require('./motor/FuncoesEmbutidas');
const { avaliarCodigo } = require('./motor/Analisador');
const { Contexto } = require('./motor/Contexto');

class ComandosGerenciador {
  constructor(cliente) {
    this.cliente = cliente;
    this.comandos = new Map();
  }

  registrar(nome, opcoes) {
    this.comandos.set(nome.toLowerCase(), {
      nome: nome.toLowerCase(),
      codigo: opcoes.codigo,
    });
  }

  async processarMensagem(mensagem) {
    const prefixo = this.cliente.prefixo;
    if (!mensagem.conteudo?.startsWith(prefixo)) return;
    if (mensagem.autor?.bot) return;

    const semPrefixo = mensagem.conteudo.slice(prefixo.length).trim();
    const partes = semPrefixo.split(/\s+/);
    const nomeComando = partes.shift().toLowerCase();
    const argumentos = partes;

    const comando = this.comandos.get(nomeComando);
    if (!comando) return;

    const contexto = new Contexto(this.cliente, mensagem, argumentos);

    let conteudoFinal;
    try {
      conteudoFinal = await avaliarCodigo(comando.codigo, contexto);
    } catch (erro) {
      this.cliente.emit('erro', erro);
      return;
    }

    await this.enviarResultado(mensagem, conteudoFinal, contexto.embed);
  }

  async enviarResultado(mensagem, conteudoFinal, embed) {
    const texto = conteudoFinal.trim();
    const temEmbed = Object.keys(embed).length > 0;

    if (!texto && !temEmbed) return;

    const payload = {};
    if (texto) payload.content = texto;
    if (temEmbed) payload.embeds = [embed];

    await mensagem.enviarNoCanal(payload);
  }
}

module.exports = { ComandosGerenciador };
