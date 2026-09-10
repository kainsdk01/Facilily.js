const { registrar } = require('./RegistroFuncoes');

// #formatarTimestamp[timestampUnix;estilo] -> gera a tag de timestamp dinâmico da Discord
// estilos: t (hora curta), T (hora longa), d (data curta), D (data longa),
//          f (data+hora), F (data+hora completa), R (relativo, "há 2 minutos")
registrar('formatarTimestamp', (args) => {
  const unix = args[0] || String(Math.floor(Date.now() / 1000));
  const estilo = args[1] || 'f';
  return `<t:${unix}:${estilo}>`;
});

// #diferencaEntreDatas[dataISO1;dataISO2] -> diferença em dias (sempre positivo)
registrar('diferencaEntreDatas', (args) => {
  const d1 = new Date(args[0]);
  const d2 = new Date(args[1]);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return '⚠️ Data inválida';
  return String(Math.abs(Math.round((d2.getTime() - d1.getTime()) / 86400000)));
});

// #calcularPorcentagem[valor;total] -> valor/total em %, arredondado
registrar('calcularPorcentagem', (args) => {
  const valor = Number(args[0]);
  const total = Number(args[1]);
  if (!total) return '0';
  return String(Math.round((valor / total) * 100));
});

module.exports = {};
