const { registrar } = require('./RegistroFuncoes');
const avisos = require('../moderacao/Avisos');

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

// ---- Bot / eventos (não dependem de uma mensagem) ----

registrar('nomeBot', (_args, ctx) => ctx.cliente.usuario?.username ?? '');

registrar('log', (args) => {
  console.log('[facility.js]', args[0] ?? '');
  return '';
});

// ---- Contexto da mensagem ----

registrar('mencaoAutor', (_args, ctx) => `<@${ctx.mensagem.autor.id}>`);
registrar('nomeAutor', (_args, ctx) => ctx.mensagem.autor.username);
registrar('idAutor', (_args, ctx) => ctx.mensagem.autor.id);
registrar('idCanal', (_args, ctx) => ctx.mensagem.canalId);
registrar('idServidor', (_args, ctx) => ctx.mensagem.servidorId ?? '');

// #mencionado[] -> ID do 1º usuário mencionado na mensagem (não é o autor, é quem ele citou)
// #mencionado[1] -> ID do 2º mencionado, e assim por diante (índice começa em 0)
registrar('mencionado', (args, ctx) => {
  const indice = Number(args[0] ?? 0);
  const usuario = ctx.mensagem.mencoes[indice];
  return usuario ? usuario.id : '';
});

registrar('nomeMencionado', (args, ctx) => {
  const indice = Number(args[0] ?? 0);
  const usuario = ctx.mensagem.mencoes[indice];
  return usuario ? usuario.username : '';
});

// ---- Argumentos do comando ----

registrar('argumento', (args, ctx) => {
  const indice = Number(args[0]);
  return ctx.argumentos[indice] ?? '';
});

registrar('argumentos', (_args, ctx) => ctx.argumentos.join(' '));

registrar('totalArgumentos', (_args, ctx) => String(ctx.argumentos.length));

// ---- Moderação ----
// Todas recebem o ID de um usuário como 1º argumento — normalmente vindo de
// #mencionado[], mas também aceita um ID digitado direto.
// Se o bot não tiver permissão no servidor, a Discord recusa e a tag devolve
// uma mensagem de erro (não derruba o comando).

function cabecalhoMotivo(motivo) {
  return motivo ? { 'X-Audit-Log-Reason': encodeURIComponent(motivo) } : {};
}

// #banir[idOuMencao;motivo]
registrar('banir', async (args, ctx) => {
  const alvo = args[0];
  const motivo = args[1];
  if (!alvo) return '⚠️ Uso: `#banir[idOuMencao;motivo]`';

  try {
    await ctx.cliente.rest.put(
      `/guilds/${ctx.mensagem.servidorId}/bans/${alvo}`,
      {},
      cabecalhoMotivo(motivo)
    );
    return `🔨 <@${alvo}> foi banido.${motivo ? ` Motivo: ${motivo}` : ''}`;
  } catch (erro) {
    return `❌ Não consegui banir: ${erro.message}`;
  }
});

// #desbanir[idDoUsuario;motivo] — usuário já não está mais no servidor, por isso
// precisa do ID (não dá pra "mencionar" quem já saiu).
registrar('desbanir', async (args, ctx) => {
  const alvo = args[0];
  const motivo = args[1];
  if (!alvo) return '⚠️ Uso: `#desbanir[idDoUsuario;motivo]`';

  try {
    await ctx.cliente.rest.deletar(
      `/guilds/${ctx.mensagem.servidorId}/bans/${alvo}`,
      cabecalhoMotivo(motivo)
    );
    return `✅ Usuário com ID \`${alvo}\` foi desbanido.`;
  } catch (erro) {
    return `❌ Não consegui desbanir: ${erro.message}`;
  }
});

// #expulsar[idOuMencao;motivo] — kick (a pessoa pode voltar ao entrar de novo)
registrar('expulsar', async (args, ctx) => {
  const alvo = args[0];
  const motivo = args[1];
  if (!alvo) return '⚠️ Uso: `#expulsar[idOuMencao;motivo]`';

  try {
    await ctx.cliente.rest.deletar(
      `/guilds/${ctx.mensagem.servidorId}/members/${alvo}`,
      cabecalhoMotivo(motivo)
    );
    return `👢 <@${alvo}> foi expulso.${motivo ? ` Motivo: ${motivo}` : ''}`;
  } catch (erro) {
    return `❌ Não consegui expulsar: ${erro.message}`;
  }
});

// #mutar[idOuMencao;minutos;motivo] — timeout nativo do Discord (máx. 28 dias)
registrar('mutar', async (args, ctx) => {
  const alvo = args[0];
  const minutos = Number(args[1]);
  const motivo = args[2];
  if (!alvo || Number.isNaN(minutos)) {
    return '⚠️ Uso: `#mutar[idOuMencao;minutos;motivo]`';
  }

  const minutosLimitados = Math.min(minutos, 40320); // 28 dias, limite da Discord
  const ateQuando = new Date(Date.now() + minutosLimitados * 60000).toISOString();

  try {
    await ctx.cliente.rest.patch(
      `/guilds/${ctx.mensagem.servidorId}/members/${alvo}`,
      { communication_disabled_until: ateQuando },
      cabecalhoMotivo(motivo)
    );
    return `🔇 <@${alvo}> foi mutado por ${minutosLimitados} minuto(s).${motivo ? ` Motivo: ${motivo}` : ''}`;
  } catch (erro) {
    return `❌ Não consegui mutar: ${erro.message}`;
  }
});

// #desmutar[idOuMencao] — remove o timeout antes da hora
registrar('desmutar', async (args, ctx) => {
  const alvo = args[0];
  if (!alvo) return '⚠️ Uso: `#desmutar[idOuMencao]`';

  try {
    await ctx.cliente.rest.patch(`/guilds/${ctx.mensagem.servidorId}/members/${alvo}`, {
      communication_disabled_until: null,
    });
    return `🔊 <@${alvo}> não está mais mutado.`;
  } catch (erro) {
    return `❌ Não consegui desmutar: ${erro.message}`;
  }
});

// ---- Avisos ----
// Histórico salvo em arquivo (avisos.json), por servidor e usuário.

// #aviso[idOuMencao;motivo] -> registra um aviso e devolve o total acumulado
registrar('aviso', (args, ctx) => {
  const alvo = args[0];
  const motivo = args[1];
  if (!alvo) return '⚠️ Uso: `#aviso[idOuMencao;motivo]`';

  const total = avisos.adicionarAviso(ctx.mensagem.servidorId, alvo, motivo);
  return `⚠️ <@${alvo}> recebeu um aviso.${motivo ? ` Motivo: ${motivo}` : ''} (total: ${total})`;
});

// #avisos[alvo] -> lista os avisos. Sem argumento, mostra os de quem chamou.
registrar('avisos', (args, ctx) => {
  const alvo = args[0] || ctx.mensagem.autor.id;
  const lista = avisos.obterAvisos(ctx.mensagem.servidorId, alvo);
  if (lista.length === 0) return `<@${alvo}> não tem nenhum aviso.`;

  return lista
    .map((item, i) => `${i + 1}. ${item.motivo} (${new Date(item.data).toLocaleDateString('pt-BR')})`)
    .join('\n');
});

// #zerarAvisos[idOuMencao] -> apaga todo o histórico de avisos do usuário
registrar('zerarAvisos', (args, ctx) => {
  const alvo = args[0];
  if (!alvo) return '⚠️ Uso: `#zerarAvisos[idOuMencao]`';

  avisos.limparAvisos(ctx.mensagem.servidorId, alvo);
  return `🧼 Avisos de <@${alvo}> foram limpos.`;
});

// #limpar[quantidade] -> apaga várias mensagens do canal de uma vez.
// Atenção: a Discord só permite apagar em lote mensagens com até 14 dias.
registrar('limpar', async (args, ctx) => {
  const quantidade = Number(args[0]);
  if (!quantidade || quantidade < 1) return '⚠️ Uso: `#limpar[quantidade]`';

  const limite = Math.min(quantidade, 100);
  try {
    const mensagens = await ctx.cliente.rest.get(
      `/channels/${ctx.mensagem.canalId}/messages?limit=${limite}`
    );
    const ids = mensagens.map((m) => m.id);

    if (ids.length === 0) return '🧹 Não havia mensagens pra apagar.';
    if (ids.length === 1) {
      await ctx.cliente.rest.deletar(`/channels/${ctx.mensagem.canalId}/messages/${ids[0]}`);
      return '🧹 1 mensagem apagada.';
    }

    await ctx.cliente.rest.post(`/channels/${ctx.mensagem.canalId}/messages/bulk-delete`, {
      messages: ids,
    });
    return `🧹 ${ids.length} mensagens apagadas.`;
  } catch (erro) {
    return `❌ Não consegui limpar: ${erro.message}`;
  }
});

// #darCargo[idOuMencao;idDoCargo]
registrar('darCargo', async (args, ctx) => {
  const alvo = args[0];
  const idCargo = args[1];
  if (!alvo || !idCargo) return '⚠️ Uso: `#darCargo[idOuMencao;idDoCargo]`';

  try {
    await ctx.cliente.rest.put(
      `/guilds/${ctx.mensagem.servidorId}/members/${alvo}/roles/${idCargo}`,
      {}
    );
    return `✅ Cargo adicionado a <@${alvo}>.`;
  } catch (erro) {
    return `❌ Não consegui adicionar o cargo: ${erro.message}`;
  }
});

// #tirarCargo[idOuMencao;idDoCargo]
registrar('tirarCargo', async (args, ctx) => {
  const alvo = args[0];
  const idCargo = args[1];
  if (!alvo || !idCargo) return '⚠️ Uso: `#tirarCargo[idOuMencao;idDoCargo]`';

  try {
    await ctx.cliente.rest.deletar(`/guilds/${ctx.mensagem.servidorId}/members/${alvo}/roles/${idCargo}`);
    return `✅ Cargo removido de <@${alvo}>.`;
  } catch (erro) {
    return `❌ Não consegui remover o cargo: ${erro.message}`;
  }
});

// #apelido[idOuMencao;novoNome] -> sem novoNome, remove o apelido atual
registrar('apelido', async (args, ctx) => {
  const alvo = args[0];
  const novoNome = args[1];
  if (!alvo) return '⚠️ Uso: `#apelido[idOuMencao;novoNome]`';

  try {
    await ctx.cliente.rest.patch(`/guilds/${ctx.mensagem.servidorId}/members/${alvo}`, {
      nick: novoNome || null,
    });
    return novoNome
      ? `✏️ Apelido de <@${alvo}> alterado para "${novoNome}".`
      : `✏️ Apelido de <@${alvo}> removido.`;
  } catch (erro) {
    return `❌ Não consegui mudar o apelido: ${erro.message}`;
  }
});

// #trancar[] -> ninguém consegue mandar mensagem no canal atual
registrar('trancar', async (_args, ctx) => {
  try {
    await ctx.cliente.rest.put(
      `/channels/${ctx.mensagem.canalId}/permissions/${ctx.mensagem.servidorId}`,
      { type: 0, deny: '2048' } // 2048 = permissão SEND_MESSAGES
    );
    return '🔒 Canal trancado.';
  } catch (erro) {
    return `❌ Não consegui trancar o canal: ${erro.message}`;
  }
});

// #destrancar[] -> desfaz o #trancar[]
registrar('destrancar', async (_args, ctx) => {
  try {
    await ctx.cliente.rest.deletar(
      `/channels/${ctx.mensagem.canalId}/permissions/${ctx.mensagem.servidorId}`
    );
    return '🔓 Canal destrancado.';
  } catch (erro) {
    return `❌ Não consegui destrancar o canal: ${erro.message}`;
  }
});

// #modoLento[segundos] -> 0 desliga. Máximo permitido pela Discord: 21600 (6h)
registrar('modoLento', async (args, ctx) => {
  const segundos = Number(args[0]);
  if (Number.isNaN(segundos) || segundos < 0) {
    return '⚠️ Uso: `#modoLento[segundos]` (0 desliga)';
  }

  const limitado = Math.min(segundos, 21600);
  try {
    await ctx.cliente.rest.patch(`/channels/${ctx.mensagem.canalId}`, {
      rate_limit_per_user: limitado,
    });
    return limitado === 0
      ? '🐇 Modo lento desligado.'
      : `🐢 Modo lento definido para ${limitado} segundo(s).`;
  } catch (erro) {
    return `❌ Não consegui definir o modo lento: ${erro.message}`;
  }
});

// ---- Interação / Envio ----

// #reagir[emoji] -> reage na própria mensagem do comando com um emoji unicode
registrar('reagir', async (args, ctx) => {
  const emoji = args[0];
  if (!emoji) return '⚠️ Uso: `#reagir[emoji]`';

  try {
    await ctx.cliente.rest.put(
      `/channels/${ctx.mensagem.canalId}/messages/${ctx.mensagem.id}/reactions/${encodeURIComponent(emoji)}/@me`,
      {}
    );
    return '';
  } catch (erro) {
    return `❌ Não consegui reagir: ${erro.message}`;
  }
});

// #enviarEm[idDoCanal;texto] -> manda uma mensagem em outro canal do servidor
registrar('enviarEm', async (args, ctx) => {
  const idCanal = args[0];
  const texto = args[1];
  if (!idCanal || !texto) return '⚠️ Uso: `#enviarEm[idDoCanal;texto]`';

  try {
    await ctx.cliente.rest.post(`/channels/${idCanal}/messages`, { content: texto });
    return '';
  } catch (erro) {
    return `❌ Não consegui enviar: ${erro.message}`;
  }
});

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

// Modo "bruto": antes, #se[cond;então;senão] avaliava então E senão por
// completo (efeitos colaterais incluídos, tipo um #banir[] escondido no
// branch errado) antes de escolher qual devolver. Agora só a condição é
// avaliada de cara; o branch perdedor nunca chega a rodar.
registrar('se', async (argsCrus, ctx, avaliar) => {
  const condicao = await avaliar(argsCrus[0] ?? '');
  const ramoEscolhido = avaliarCondicao(condicao) ? argsCrus[1] : argsCrus[2];
  return avaliar(ramoEscolhido ?? '');
}, { bruto: true });

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
