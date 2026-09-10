const { registrar } = require('./RegistroFuncoes');

function paraTexto(valor) {
  if (valor === undefined || valor === null) return '';
  return String(valor);
}

// ---- Tag genérica: funciona pra QUALQUER evento novo ----
// #evento[chave] -> lê um campo dos "extras" do evento atual.
// Ex: dentro de eventos/cargoCriado.txt -> #evento[nomeCargo]
// A lista de chaves de cada evento está documentada no README.
registrar('evento', (args, ctx) => paraTexto(ctx.dadosEvento?.[args[0]]));

// #temEvento[chave] -> "true"/"false", pra usar dentro de #se[]
registrar('temEvento', (args, ctx) => {
  return paraTexto(ctx.dadosEvento != null && args[0] in ctx.dadosEvento);
});

// ---- Comandos (comandoExecutado / comandoComErro / comandoDesconhecido) ----
registrar('nomeComando', (_args, ctx) => paraTexto(ctx.dadosEvento?.nomeComando));
registrar('erroComando', (_args, ctx) => paraTexto(ctx.dadosEvento?.erro));

// ---- Tag desconhecida (tagDesconhecidaUsada) ----
registrar('nomeTagDesconhecida', (_args, ctx) => paraTexto(ctx.dadosEvento?.nome));

// ---- Voz (entrouNoVoz / saiuDoVoz / mudouDeCanalVoz / estadoVozAtualizado) ----
registrar('idCanalVozAnterior', (_args, ctx) => paraTexto(ctx.dadosEvento?.idCanalAnterior));
registrar('estaMutado', (_args, ctx) => ctx.dadosEvento?.mutado ?? 'false');
registrar('estaEnsurdecido', (_args, ctx) => ctx.dadosEvento?.ensurdecido ?? 'false');
registrar('estaTransmitindo', (_args, ctx) => ctx.dadosEvento?.transmitindo ?? 'false');

// ---- Interações (interacaoCriada / comandoBarraExecutado / botaoClicado / ----
// ----              menuSelecaoUsado / autocompleteSolicitado / modalEnviado) ----
registrar('idInteracao', (_args, ctx) => paraTexto(ctx.dadosEvento?.idInteracao));
registrar('nomeComandoBarra', (_args, ctx) => paraTexto(ctx.dadosEvento?.nomeComandoBarra));
registrar('customId', (_args, ctx) => paraTexto(ctx.dadosEvento?.customId));

// #valorOpcao[nomeDaOpcao] -> valor de uma opção de comando de barra
registrar('valorOpcao', (args, ctx) => {
  const interacao = ctx.dadosEvento?.interacao;
  if (!interacao) return '';
  return paraTexto(interacao.opcao(args[0]));
});

// #valoresMenu[] -> valores escolhidos num menu de seleção, separados por vírgula
registrar('valoresMenu', (_args, ctx) => {
  const interacao = ctx.dadosEvento?.interacao;
  return interacao ? interacao.valores.join(',') : '';
});

// #campoModal[customId] -> valor de um campo específico de um modal enviado
registrar('campoModal', (args, ctx) => {
  const interacao = ctx.dadosEvento?.interacao;
  if (!interacao) return '';
  return paraTexto(interacao.camposModal()[args[0]]);
});

// #responderInteracao[texto;efemero] -> responde a interação direto
// (efemero: "true" pra só o usuário que clicou/usou o comando ver a resposta)
registrar('responderInteracao', async (args, ctx) => {
  const interacao = ctx.dadosEvento?.interacao;
  if (!interacao) return '';
  await interacao.responder(args[0] ?? '', { efemero: args[1] === 'true' });
  return '';
});

// #deferirInteracao[] -> avisa a Discord "recebi, já te respondo"
// (usar quando a resposta pode demorar mais de 3 segundos)
registrar('deferirInteracao', async (_args, ctx) => {
  const interacao = ctx.dadosEvento?.interacao;
  if (interacao) await interacao.deferir();
  return '';
});

// #atualizarMensagemInteracao[texto] -> edita a própria mensagem do botão/menu clicado
registrar('atualizarMensagemInteracao', async (args, ctx) => {
  const interacao = ctx.dadosEvento?.interacao;
  if (interacao) await interacao.atualizarMensagem(args[0] ?? '');
  return '';
});

module.exports = {};
