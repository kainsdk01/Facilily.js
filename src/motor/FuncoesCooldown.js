const { registrar } = require('./RegistroFuncoes');

// Guardado em memória (reseta se o bot reiniciar) — de propósito, é pra travas
// rápidas de spam/flood, não pra dado que precisa sobreviver a um restart.
const cooldowns = new Map(); // chave "usuario:chave" -> timestamp de quando libera

function chaveDe(usuarioId, chave) {
  return `${usuarioId}:${chave}`;
}

// #definirCooldown[usuario;chave;segundos] -> trava aquela chave pro usuário pelos próximos X segundos
registrar('definirCooldown', (args) => {
  const [usuario, chave, segundos] = args;
  if (!usuario || !chave || Number.isNaN(Number(segundos))) {
    return '⚠️ Uso: `#definirCooldown[usuario;chave;segundos]`';
  }
  cooldowns.set(chaveDe(usuario, chave), Date.now() + Number(segundos) * 1000);
  return '';
});

// #estaEmCooldown[usuario;chave] -> "true"/"false"
registrar('estaEmCooldown', (args) => {
  const [usuario, chave] = args;
  const expiraEm = cooldowns.get(chaveDe(usuario, chave));
  if (!expiraEm) return 'false';
  if (Date.now() >= expiraEm) {
    cooldowns.delete(chaveDe(usuario, chave));
    return 'false';
  }
  return 'true';
});

// #tempoRestanteCooldown[usuario;chave] -> segundos restantes, "0" se não tá em cooldown
registrar('tempoRestanteCooldown', (args) => {
  const [usuario, chave] = args;
  const expiraEm = cooldowns.get(chaveDe(usuario, chave));
  if (!expiraEm) return '0';
  return String(Math.max(0, Math.ceil((expiraEm - Date.now()) / 1000)));
});

// #limparCooldown[usuario;chave]
registrar('limparCooldown', (args) => {
  const [usuario, chave] = args;
  cooldowns.delete(chaveDe(usuario, chave));
  return '';
});

module.exports = {};
