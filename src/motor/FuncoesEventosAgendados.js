const { registrar } = require('./RegistroFuncoes');

// #criarEventoAgendado[nome;dataInicioISO;dataFimISO;descricao;idCanalVoz]
registrar('criarEventoAgendado', async (args, ctx) => {
  const [nome, inicio, fim, descricao, idCanalVoz] = args;
  if (!nome || !inicio) {
    return '⚠️ Uso: `#criarEventoAgendado[nome;dataInicioISO;dataFimISO;descricao;idCanalVoz]`';
  }
  try {
    const corpo = {
      name: nome,
      description: descricao || undefined,
      scheduled_start_time: inicio,
      privacy_level: 2,
      entity_type: idCanalVoz ? 2 : 3, // 2 = canal de voz, 3 = externo
    };
    if (idCanalVoz) {
      corpo.channel_id = idCanalVoz;
    } else {
      corpo.entity_metadata = { location: descricao || 'A definir' };
      corpo.scheduled_end_time = fim || new Date(Date.now() + 3600000).toISOString();
    }
    if (fim) corpo.scheduled_end_time = fim;

    const evento = await ctx.cliente.rest.post(`/guilds/${ctx.mensagem.servidorId}/scheduled-events`, corpo);
    return evento.id;
  } catch (erro) {
    return `❌ Não consegui criar o evento: ${erro.message}`;
  }
});

// #cancelarEventoAgendado[idEvento]
registrar('cancelarEventoAgendado', async (args, ctx) => {
  const idEvento = args[0];
  if (!idEvento) return '⚠️ Uso: `#cancelarEventoAgendado[idEvento]`';
  try {
    await ctx.cliente.rest.deletar(`/guilds/${ctx.mensagem.servidorId}/scheduled-events/${idEvento}`);
    return '🗑️ Evento cancelado.';
  } catch (erro) {
    return `❌ Não consegui cancelar: ${erro.message}`;
  }
});

// #totalInteressadosEvento[idEvento]
registrar('totalInteressadosEvento', async (args, ctx) => {
  const idEvento = args[0];
  if (!idEvento) return '0';
  try {
    const usuarios = await ctx.cliente.rest.get(
      `/guilds/${ctx.mensagem.servidorId}/scheduled-events/${idEvento}/users?limit=100`
    );
    return String(usuarios.length);
  } catch {
    return '0';
  }
});

// #statusEventoAgendado[idEvento] -> "agendado" | "ativo" | "concluido" | "cancelado"
registrar('statusEventoAgendado', async (args, ctx) => {
  const idEvento = args[0];
  if (!idEvento) return '';
  const MAPA = { 1: 'agendado', 2: 'ativo', 3: 'concluido', 4: 'cancelado' };
  try {
    const evento = await ctx.cliente.rest.get(`/guilds/${ctx.mensagem.servidorId}/scheduled-events/${idEvento}`);
    return MAPA[evento.status] ?? '';
  } catch {
    return '';
  }
});

module.exports = {};
