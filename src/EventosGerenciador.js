const fs = require('node:fs');
const path = require('node:path');
require('./motor/FuncoesEmbutidas');
require('./motor/FuncoesEventos');
require('./motor/FuncoesNovas');
const { avaliarCodigo } = require('./motor/Analisador');
const { Contexto } = require('./motor/Contexto');
const { MAPA_EVENTOS } = require('./motor/MapaEventos');

// Eventos que não usam o formato "mensagem" nem "dadosEvento" — tratados à
// parte dentro de registrarEvento().
const EVENTOS_SEM_DADOS = ['pronto'];
const EVENTOS_TEXTO_SIMPLES = ['depuracao']; // args[0] é uma string solta
const EVENTOS_ERRO = ['erro']; // args[0] é um Error

// Todos os eventos que vêm prontos de dentro do MAPA_EVENTOS (membroEntrou,
// cargoCriado, reacaoAdicionada, etc.) + os que o Cliente.js emite à parte
// (voz, interações, ciclo de vida do servidor) + os internos de comando/tag.
const EVENTOS_DE_DISPATCH = Object.values(MAPA_EVENTOS).map((m) => m.evento);
const EVENTOS_ESPECIAIS_CLIENTE = [
  'servidorAtualizado',
  'servidorIndisponivel',
  'servidorSaiu',
  'estadoVozAtualizado',
  'entrouNoVoz',
  'saiuDoVoz',
  'mudouDeCanalVoz',
  'interacaoCriada',
  'comandoBarraExecutado',
  'botaoClicado',
  'menuSelecaoUsado',
  'autocompleteSolicitado',
  'modalEnviado',
];
const EVENTOS_INTERNOS = [
  'comandoExecutado',
  'comandoComErro',
  'comandoDesconhecido',
  'tagDesconhecidaUsada',
];

// Eventos nativos que podem ser "escutados" por um arquivo de texto.
// ("bruto" fica de fora: carrega o payload cru da Discord, sem formato
// fixo, então não dá pra virar argumento de tag de forma simples.)
const EVENTOS_SUPORTADOS = [
  ...EVENTOS_SEM_DADOS,
  'mensagemCriada',
  ...EVENTOS_TEXTO_SIMPLES,
  ...EVENTOS_ERRO,
  ...EVENTOS_DE_DISPATCH,
  ...EVENTOS_ESPECIAIS_CLIENTE,
  ...EVENTOS_INTERNOS,
];

class EventosGerenciador {
  constructor(cliente) {
    this.cliente = cliente;
    this.registrados = new Set();
  }

  /**
   * Carrega uma pasta de eventos em texto puro. Cada arquivo .txt deve se
   * chamar igual a um dos eventos nativos (veja a tabela completa no
   * README: pronto, mensagemCriada, membroEntrou, cargoCriado,
   * reacaoAdicionada, entrouNoVoz, interacaoCriada, erro, depuracao...) e
   * seu conteúdo é código de tags, executado sempre que aquele evento
   * disparar.
   *
   * Exemplo (eventos/pronto.txt):
   *   #log[Online como #nomeBot[]!]
   *
   * Exemplo (eventos/membroEntrou.txt):
   *   #log[#nomeAutor[] entrou no servidor #nomeServidor[]!]
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
      let mensagem = null;
      let dadosEvento = null;

      if (nomeEvento === 'mensagemCriada') {
        mensagem = args[0];
      } else if (EVENTOS_SEM_DADOS.includes(nomeEvento)) {
        // 'pronto': sem argumentos mesmo.
      } else if (EVENTOS_ERRO.includes(nomeEvento)) {
        const erroOriginal = args[0];
        dadosEvento = {
          texto: erroOriginal?.message ?? String(erroOriginal),
          pilha: erroOriginal?.stack ?? '',
        };
      } else if (EVENTOS_TEXTO_SIMPLES.includes(nomeEvento)) {
        dadosEvento = { texto: args[0] ?? '' };
      } else if (nomeEvento === 'tagDesconhecidaUsada') {
        dadosEvento = { nome: args[0] ?? '' };
      } else {
        // Todo o resto (eventos do MAPA_EVENTOS, voz, interações,
        // servidor, e os internos de comando) chega como
        // (mensagemSintetica, extras).
        mensagem = args[0] ?? null;
        dadosEvento = args[1] ?? {};
      }

      const argumentos = [];
      const contexto = new Contexto(this.cliente, mensagem, argumentos, dadosEvento);

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
