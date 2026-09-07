const { registrar } = require('./RegistroFuncoes');

const CORES_NOMEADAS = {
  VERMELHO: 0xed4245,
  VERDE: 0x57f287,
  AZUL: 0x3498db,
  AMARELO: 0xfee75c,
  ROXO: 0x9b59b6,
  LARANJA: 0xe67e22,
  PRETO: 0x23272a,
  BRANCO: 0xffffff,
  CINZA: 0x95a5a6,
};

function converterCor(valor) {
  if (!valor) return undefined;
  const v = valor.trim().toUpperCase();
  if (CORES_NOMEADAS[v] !== undefined) return CORES_NOMEADAS[v];
  const hex = v.replace('#', '');
  const numero = parseInt(hex, 16);
  return Number.isNaN(numero) ? undefined : numero;
}

// ---- Embed ----

function truncar(texto, limite) {
  return texto.length > limite ? texto.slice(0, limite - 1) + '…' : texto;
}

registrar('titulo', (args, ctx) => {
  ctx.embed.title = truncar(args[0] ?? '', 256);
  return '';
});

registrar('descricao', (args, ctx) => {
  ctx.embed.description = truncar(args[0] ?? '', 4096);
  return '';
});

registrar('cor', (args, ctx) => {
  ctx.embed.color = converterCor(args[0]);
  return '';
});

registrar('imagem', (args, ctx) => {
  ctx.embed.image = { url: args[0] ?? '' };
  return '';
});

registrar('thumbnail', (args, ctx) => {
  ctx.embed.thumbnail = { url: args[0] ?? '' };
  return '';
});

registrar('rodape', (args, ctx) => {
  ctx.embed.footer = { text: args[0] ?? '', icon_url: args[1] || undefined };
  return '';
});

registrar('autorEmbed', (args, ctx) => {
  ctx.embed.author = { name: args[0] ?? '', icon_url: args[1] || undefined };
  return '';
});

registrar('campo', (args, ctx) => {
  if (!ctx.embed.fields) ctx.embed.fields = [];
  ctx.embed.fields.push({
    name: truncar(args[0] ?? '\u200b', 256),
    value: truncar(args[1] ?? '\u200b', 1024),
    inline: args[2] === 'true',
  });
  return '';
});

// ---- Texto ----

registrar('texto', (args) => args[0] ?? '');

// ---- Contexto da mensagem ----

registrar('mencaoAutor', (_args, ctx) => `<@${ctx.mensagem.autor.id}>`);
registrar('nomeAutor', (_args, ctx) => ctx.mensagem.autor.username);
registrar('idAutor', (_args, ctx) => ctx.mensagem.autor.id);
registrar('idCanal', (_args, ctx) => ctx.mensagem.canalId);
registrar('idServidor', (_args, ctx) => ctx.mensagem.servidorId ?? '');

// ---- Argumentos do comando ----

registrar('argumento', (args, ctx) => {
  const indice = Number(args[0]);
  return ctx.argumentos[indice] ?? '';
});

registrar('argumentos', (_args, ctx) => ctx.argumentos.join(' '));

registrar('totalArgumentos', (_args, ctx) => String(ctx.argumentos.length));

// ---- Variáveis (em memória, por processo) ----

registrar('definirVar', (args, ctx) => {
  ctx.cliente.variaveis.set(args[0], args[1] ?? '');
  return '';
});

registrar('pegarVar', (args, ctx) => ctx.cliente.variaveis.get(args[0]) ?? '');

// ---- Condicional: #se[valorA==valorB;entao;senao] ----
// Suporta combinar condições com && (todas verdadeiras) e || (ao menos uma).
// Ex: #se[5>3&&2<4;sim;nao]  ou  #se[nivel==1||nivel==2;sim;nao]
// Não há precedência entre && e ||: use um só tipo por #se[] (encadeie #se[] pra misturar).

const OPERADORES = ['==', '!=', '>=', '<=', '>', '<'];

function avaliarComparacaoUnica(condicao) {
  for (const op of OPERADORES) {
    if (condicao.includes(op)) {
      const [esquerdaBruta, direitaBruta] = condicao.split(op);
      const esquerda = esquerdaBruta.trim();
      const direita = direitaBruta.trim();
      const numEsquerda = Number(esquerda);
      const numDireita = Number(direita);
      const comparavel = !Number.isNaN(numEsquerda) && !Number.isNaN(numDireita);
      const a = comparavel ? numEsquerda : esquerda;
      const b = comparavel ? numDireita : direita;

      switch (op) {
        case '==': return a === b;
        case '!=': return a !== b;
        case '>=': return a >= b;
        case '<=': return a <= b;
        case '>': return a > b;
        case '<': return a < b;
      }
    }
  }
  return false;
}

function avaliarCondicao(condicao) {
  if (condicao.includes('&&')) {
    return condicao.split('&&').every((parte) => avaliarComparacaoUnica(parte.trim()));
  }
  if (condicao.includes('||')) {
    return condicao.split('||').some((parte) => avaliarComparacaoUnica(parte.trim()));
  }
  return avaliarComparacaoUnica(condicao);
}

registrar('se', (args) => {
  const condicao = args[0] ?? '';
  const entao = args[1] ?? '';
  const senao = args[2] ?? '';
  return avaliarCondicao(condicao) ? entao : senao;
});

module.exports = { converterCor };

// ---- Botões (linha de ação é criada/reaproveitada automaticamente, até 5 por linha) ----

function linhaAtual(ctx) {
  let linha = ctx.componentes[ctx.componentes.length - 1];
  if (!linha || linha.components.length >= 5) {
    linha = { type: 1, components: [] };
    ctx.componentes.push(linha);
  }
  return linha;
}

const ESTILOS_BOTAO = { PRIMARIO: 1, SECUNDARIO: 2, SUCESSO: 3, PERIGO: 4 };

registrar('botao', (args, ctx) => {
  const linha = linhaAtual(ctx);
  linha.components.push({
    type: 2,
    label: args[0] ?? '',
    custom_id: args[1] ?? '',
    style: ESTILOS_BOTAO[(args[2] ?? 'PRIMARIO').toUpperCase()] ?? 1,
  });
  return '';
});

registrar('linkBotao', (args, ctx) => {
  const linha = linhaAtual(ctx);
  linha.components.push({ type: 2, style: 5, label: args[0] ?? '', url: args[1] ?? '' });
  return '';
});

registrar('novaLinha', (_args, ctx) => {
  ctx.componentes.push({ type: 1, components: [] });
  return '';
});

// ---- Música ----
// Todas dependem do intent ESTADOS_DE_VOZ pra saber em qual canal o autor está.

function canalDeVozDoAutor(ctx) {
  const { servidorId, autor } = ctx.mensagem;
  return ctx.cliente.gerenciadorVoz.obterCanalDoUsuario(servidorId, autor.id);
}

registrar('tocar', async (args, ctx) => {
  const url = args[0];
  if (!url) return 'Você precisa passar uma URL: `#tocar[url]`.';

  const canalId = canalDeVozDoAutor(ctx);
  if (!canalId) return 'Você precisa estar em um canal de voz pra tocar música.';

  await ctx.cliente.tocar(ctx.mensagem.servidorId, canalId, {
    url,
    titulo: url,
    pedidoPor: ctx.mensagem.autor.id,
  });
  return '';
});

registrar('pausar', (_args, ctx) => {
  ctx.cliente.pausarMusica(ctx.mensagem.servidorId);
  return '';
});

registrar('retomar', (_args, ctx) => {
  ctx.cliente.retomarMusica(ctx.mensagem.servidorId);
  return '';
});

registrar('pular', (_args, ctx) => {
  ctx.cliente.pularMusica(ctx.mensagem.servidorId);
  return '';
});

registrar('pararMusica', (_args, ctx) => {
  ctx.cliente.pararMusica(ctx.mensagem.servidorId);
  return '';
});

registrar('volume', (args, ctx) => {
  const nivel = Number(args[0]);
  if (Number.isNaN(nivel)) return 'Use um número de 0 a 200: `#volume[100]`.';
  ctx.cliente.definirVolumeMusica(ctx.mensagem.servidorId, nivel);
  return '';
});

registrar('fila', (_args, ctx) => {
  const fila = ctx.cliente.filaDeMusica(ctx.mensagem.servidorId);
  if (!fila || fila.faixas.length === 0) return 'A fila está vazia.';

  const atual = fila.atual();
  const linhas = [`Tocando agora: ${atual?.url ?? '—'}`];
  fila.proximas().forEach((faixa, i) => linhas.push(`${i + 1}. ${faixa.url}`));
  return linhas.join('\n');
});
