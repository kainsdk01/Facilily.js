const { registrar } = require('./RegistroFuncoes');

// ---- Matemática ----

registrar('somar', (args) => String(Number(args[0]) + Number(args[1])));
registrar('subtrair', (args) => String(Number(args[0]) - Number(args[1])));
registrar('multiplicar', (args) => String(Number(args[0]) * Number(args[1])));

registrar('dividir', (args) => {
  const divisor = Number(args[1]);
  if (divisor === 0) return '❌ Não dá pra dividir por zero.';
  return String(Number(args[0]) / divisor);
});

registrar('arredondar', (args) => String(Math.round(Number(args[0]))));

// #aleatorio[min;max] -> número inteiro aleatório entre min e max (inclusivos)
registrar('aleatorio', (args) => {
  const min = Number(args[0] ?? 0);
  const max = Number(args[1] ?? 100);
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
});

// ---- Texto ----

registrar('maiusculo', (args) => (args[0] ?? '').toUpperCase());
registrar('minusculo', (args) => (args[0] ?? '').toLowerCase());
registrar('tamanho', (args) => String((args[0] ?? '').length));

// ---- Tempo ----

registrar('timestamp', () => String(Math.floor(Date.now() / 1000)));
registrar('dataAgora', () => new Date().toLocaleDateString('pt-BR'));
registrar('horaAgora', () => new Date().toLocaleTimeString('pt-BR'));

module.exports = {};
