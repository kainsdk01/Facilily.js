const fs = require('node:fs');
const path = require('node:path');
require('./motor/FuncoesEmbutidas');
require('./motor/FuncoesEconomia');
require('./motor/FuncoesUtilitarias');
require('./motor/FuncoesInfo');
require('./motor/FuncoesAdmin');
require('./motor/FuncoesNovas');
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

  /**
   * Carrega todos os comandos de uma pasta. Aceita dois formatos, e pode
   * misturar os dois na mesma pasta:
   *
   *  - .js  (formato original): exporta { nome, codigo }.
   *      Exemplo (comandos/oi.js):
   *        module.exports = { nome: 'oi', codigo: 'Fala, #nomeAutor[]!' };
   *
   *  - .txt (sem escrever JS): o nome do arquivo já é o nome do comando,
   *    e o conteúdo do arquivo é o código de tags direto.
   *      Exemplo (comandos/oi.txt):
   *        Fala, #nomeAutor[]!
   */
  carregarPasta(caminhoPasta) {
    const pastaAbsoluta = path.resolve(caminhoPasta);

    if (!fs.existsSync(pastaAbsoluta)) {
      throw new Error(`Pasta de comandos não encontrada: ${pastaAbsoluta}`);
    }

    const todosArquivos = fs.readdirSync(pastaAbsoluta);
    const arquivosJs = todosArquivos.filter((arquivo) => arquivo.endsWith('.js'));
    const arquivosTxt = todosArquivos.filter((arquivo) => arquivo.endsWith('.txt'));

    let total = 0;

    for (const arquivo of arquivosJs) {
      const caminhoArquivo = path.join(pastaAbsoluta, arquivo);
      delete require.cache[require.resolve(caminhoArquivo)];
      const modulo = require(caminhoArquivo);

      const lista = Array.isArray(modulo) ? modulo : [modulo];

      for (const item of lista) {
        if (!item?.nome || !item?.codigo) {
          this.cliente.emit(
            'depuracao',
            `Comando ignorado em ${arquivo}: falta "nome" ou "codigo".`
          );
          continue;
        }
        this.registrar(item.nome, { codigo: item.codigo });
        total++;
      }
    }

    for (const arquivo of arquivosTxt) {
      const caminhoArquivo = path.join(pastaAbsoluta, arquivo);
      const nome = path.basename(arquivo, '.txt');
      const codigo = fs.readFileSync(caminhoArquivo, 'utf8');

      if (!nome || !codigo.trim()) {
        this.cliente.emit('depuracao', `Comando ignorado em ${arquivo}: arquivo vazio.`);
        continue;
      }

      this.registrar(nome, { codigo });
      total++;
    }

    this.cliente.emit('depuracao', `${total} comando(s) carregado(s) de ${pastaAbsoluta}`);
    return total;
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
    if (!comando) {
      this.cliente.emit('comandoDesconhecido', mensagem, { nomeComando });
      return;
    }

    const contexto = new Contexto(this.cliente, mensagem, argumentos);

    let conteudoFinal;
    try {
      conteudoFinal = await avaliarCodigo(comando.codigo, contexto);
    } catch (erro) {
      this.cliente.emit('comandoComErro', mensagem, { nomeComando, erro: erro.message });
      this.cliente.emit('erro', erro);
      return;
    }

    await this.enviarResultado(mensagem, conteudoFinal, contexto.embed);
    this.cliente.emit('comandoExecutado', mensagem, { nomeComando, argumentos: argumentos.join(' ') });
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
