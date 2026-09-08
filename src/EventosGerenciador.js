const fs = require('node:fs');
const path = require('node:path');
require('./motor/FuncoesEmbutidas');
const { avaliarCodigo } = require('./motor/Analisador');
const { Contexto } = require('./motor/Contexto');

// Eventos nativos que podem ser "escutados" por um arquivo de texto.
// (bruto e interacaoCriada ficam de fora por enquanto: passam dados que
// não têm como virar argumento de tag de forma simples.)
const EVENTOS_SUPORTADOS = ['pronto', 'mensagemCriada', 'erro', 'depuracao'];

class EventosGerenciador {
  constructor(cliente) {
    this.cliente = cliente;
    this.registrados = new Set();
  }

  /**
   * Carrega uma pasta de eventos em texto puro. Cada arquivo .txt deve se
   * chamar igual a um dos eventos nativos (pronto.txt, mensagemCriada.txt,
   * erro.txt, depuracao.txt) e seu conteúdo é código de tags, executado
   * sempre que aquele evento disparar.
   *
   * Exemplo (eventos/pronto.txt):
   *   #log[Online como #nomeBot[]!]
   */
  carregarPasta(caminhoPasta) {
    const pastaAbsoluta = path.resolve(caminhoPasta);

    if (!fs.existsSync(pastaAbsoluta)) {
      throw new Error(`Pasta de eventos não encontrada: ${pastaAbsoluta}`);
    }

    const arquivos = fs.readdirSync(pastaAbsoluta).filter((arquivo) => arquivo.endsWith('.txt'));

    let total = 0;
    for (const arquivo of arquivos) {
      const nomeEvento = path.basename(arquivo, '.txt');

      if (!EVENTOS_SUPORTADOS.includes(nomeEvento)) {
        this.cliente.emit(
          'depuracao',
          `Evento ignorado em ${arquivo}: "${nomeEvento}" não é um evento suportado por arquivo de texto. Opções: ${EVENTOS_SUPORTADOS.join(', ')}.`
        );
        continue;
      }

      const caminhoArquivo = path.join(pastaAbsoluta, arquivo);
      const codigo = fs.readFileSync(caminhoArquivo, 'utf8');
      this.registrarEvento(nomeEvento, codigo);
      total++;
    }

    this.cliente.emit('depuracao', `${total} evento(s) carregado(s) de ${pastaAbsoluta}`);
    return total;
  }

  registrarEvento(nomeEvento, codigo) {
    this.cliente.on(nomeEvento, async (...args) => {
      const mensagem = nomeEvento === 'mensagemCriada' ? args[0] : null;
      const argumentos = [];
      const contexto = new Contexto(this.cliente, mensagem, argumentos);

      try {
        await avaliarCodigo(codigo, contexto);
      } catch (erro) {
        // Evita loop infinito: se o próprio handler do evento 'erro' falhar,
        // manda pro console em vez de reemitir 'erro'.
        if (nomeEvento === 'erro') {
          console.error('[facility.js] erro dentro do eventos/erro.txt:', erro);
        } else {
          this.cliente.emit('erro', erro);
        }
      }
    });
  }
}

module.exports = { EventosGerenciador };
