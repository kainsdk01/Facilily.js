const crypto = require('node:crypto');
const { registrar } = require('./RegistroFuncoes');

// #hashTexto[texto] -> sha256 em hexadecimal, útil pra comparar/guardar sem expor o texto original
registrar('hashTexto', (args) => crypto.createHash('sha256').update(args[0] ?? '').digest('hex'));

// #codificarBase64[texto]
registrar('codificarBase64', (args) => Buffer.from(args[0] ?? '', 'utf8').toString('base64'));

// #decodificarBase64[texto]
registrar('decodificarBase64', (args) => {
  try {
    return Buffer.from(args[0] ?? '', 'base64').toString('utf8');
  } catch {
    return '⚠️ Base64 inválido';
  }
});

// #gerarUuid[] -> UUID v4
registrar('gerarUuid', () => crypto.randomUUID());

// #gerarSenha[tamanho] -> string aleatória segura (letras, números e símbolos)
registrar('gerarSenha', (args) => {
  const tamanho = Math.min(Math.max(Number(args[0]) || 12, 4), 128);
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  const bytes = crypto.randomBytes(tamanho);
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
});

// #gerarCodigoVerificacao[tamanho] -> só dígitos, pra fluxo de verificação por código (captcha simples)
registrar('gerarCodigoVerificacao', (args) => {
  const tamanho = Math.min(Math.max(Number(args[0]) || 6, 4), 10);
  let codigo = '';
  for (let i = 0; i < tamanho; i++) codigo += crypto.randomInt(0, 10);
  return codigo;
});

module.exports = {};
