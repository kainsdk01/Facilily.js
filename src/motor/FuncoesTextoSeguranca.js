const { registrar } = require('./RegistroFuncoes');

// #proporcaoMaiusculas[texto] -> % de letras maiúsculas (detectar flood de CAPS LOCK)
registrar('proporcaoMaiusculas', (args) => {
  const texto = (args[0] ?? '').replace(/[^a-zA-ZÀ-ÿ]/g, '');
  if (texto.length === 0) return '0';
  const maiusculas = texto.replace(/[^A-ZÀ-Ý]/g, '').length;
  return String(Math.round((maiusculas / texto.length) * 100));
});

// #contarCaracteresRepetidos[texto] -> maior sequência de um mesmo caractere seguido
// (ex: "aaaaaaa" -> 7, útil pra travar flood tipo "kkkkkkkkkkk")
registrar('contarCaracteresRepetidos', (args) => {
  const texto = args[0] ?? '';
  let maior = 0;
  let atual = 1;
  for (let i = 1; i <= texto.length; i++) {
    if (texto[i] === texto[i - 1]) {
      atual++;
    } else {
      maior = Math.max(maior, atual);
      atual = 1;
    }
  }
  return String(Math.max(maior, atual));
});

// #similaridadeTexto[texto1;texto2] -> % de semelhança (distância de Levenshtein normalizada)
// Útil pra detectar spam de mensagens repetidas com pequenas variações.
registrar('similaridadeTexto', (args) => {
  const a = args[0] ?? '';
  const b = args[1] ?? '';
  if (a === b) return '100';
  if (a.length === 0 || b.length === 0) return '0';

  const linhas = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) linhas[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      linhas[i][j] = Math.min(linhas[i - 1][j] + 1, linhas[i][j - 1] + 1, linhas[i - 1][j - 1] + custo);
    }
  }
  const distancia = linhas[a.length][b.length];
  const maiorTamanho = Math.max(a.length, b.length);
  return String(Math.round((1 - distancia / maiorTamanho) * 100));
});

// #contemZalgo[texto] -> "true"/"false", detecta abuso de caracteres unicode combinantes
registrar('contemZalgo', (args) => {
  const texto = args[0] ?? '';
  const combinantes = (texto.match(/[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff]/g) ?? []).length;
  return String(combinantes > texto.length * 0.3 && combinantes > 5);
});

// #contemCaracteresInvisiveis[texto] -> "true"/"false" (usado pra burlar filtro de palavras)
registrar('contemCaracteresInvisiveis', (args) => {
  const texto = args[0] ?? '';
  return String(/[\u200b-\u200f\u2060-\u2064\ufeff]/.test(texto));
});

// #removerEmojis[texto] -> tira emojis unicode do texto
registrar('removerEmojis', (args) => {
  const texto = args[0] ?? '';
  return texto.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
});

// #contarPalavras[texto]
registrar('contarPalavras', (args) => {
  const texto = (args[0] ?? '').trim();
  if (texto === '') return '0';
  return String(texto.split(/\s+/).length);
});

// #extrairIds[texto] -> pega todos os IDs/menções (<@id>, <@&id>, <#id> ou número solto) do texto
registrar('extrairIds', (args) => {
  const texto = args[0] ?? '';
  const encontrados = texto.match(/\d{15,20}/g) ?? [];
  return [...new Set(encontrados)].join(',');
});

// #validarEmail[texto] -> "true"/"false"
registrar('validarEmail', (args) => String(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args[0] ?? '')));

// #validarUrl[texto] -> "true"/"false"
registrar('validarUrl', (args) => {
  try {
    new URL(args[0] ?? '');
    return 'true';
  } catch {
    return 'false';
  }
});

// #limitarTexto[texto;tamanho] -> corta e adiciona "…" se passar do limite
registrar('limitarTexto', (args) => {
  const texto = args[0] ?? '';
  const limite = Number(args[1]) || 100;
  return texto.length > limite ? `${texto.slice(0, limite - 1)}…` : texto;
});

// #mascarar[texto;visiveisNoFim] -> "joaosilva123" -> "*********123", pra exibir dado sensível parcialmente
registrar('mascarar', (args) => {
  const texto = args[0] ?? '';
  const visiveis = Math.max(0, Number(args[1] ?? 3));
  if (texto.length <= visiveis) return texto;
  return '*'.repeat(texto.length - visiveis) + texto.slice(texto.length - visiveis);
});

module.exports = {};
