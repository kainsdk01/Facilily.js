const { registrar } = require('./RegistroFuncoes');
const { criarArmazenamento } = require('../dados/ArmazenamentoJSON');

const { estado, salvar } = criarArmazenamento('filtros.json', () => ({ servidores: {} }));

function filtrosDoServidor(servidorId) {
  if (!estado.dados.servidores[servidorId]) {
    estado.dados.servidores[servidorId] = { palavras: [], dominiosPermitidos: [] };
  }
  return estado.dados.servidores[servidorId];
}

// #adicionarPalavraProibida[palavra]
registrar('adicionarPalavraProibida', (args, ctx) => {
  const palavra = (args[0] ?? '').toLowerCase().trim();
  if (!palavra) return '⚠️ Uso: `#adicionarPalavraProibida[palavra]`';
  const filtro = filtrosDoServidor(ctx.mensagem.servidorId);
  if (!filtro.palavras.includes(palavra)) filtro.palavras.push(palavra);
  salvar();
  return '✅ Palavra adicionada ao filtro.';
});

// #removerPalavraProibida[palavra]
registrar('removerPalavraProibida', (args, ctx) => {
  const palavra = (args[0] ?? '').toLowerCase().trim();
  const filtro = filtrosDoServidor(ctx.mensagem.servidorId);
  filtro.palavras = filtro.palavras.filter((p) => p !== palavra);
  salvar();
  return '✅ Palavra removida do filtro.';
});

// #listarPalavrasProibidas[]
registrar('listarPalavrasProibidas', (_args, ctx) => filtrosDoServidor(ctx.mensagem.servidorId).palavras.join(', '));

// #contemPalavraProibida[texto] -> "true"/"false"
registrar('contemPalavraProibida', (args, ctx) => {
  const texto = (args[0] ?? '').toLowerCase();
  const filtro = filtrosDoServidor(ctx.mensagem.servidorId);
  return String(filtro.palavras.some((p) => texto.includes(p)));
});

// #adicionarLinkPermitido[dominio] -> ex: "youtube.com"
registrar('adicionarLinkPermitido', (args, ctx) => {
  const dominio = (args[0] ?? '').toLowerCase().trim();
  if (!dominio) return '⚠️ Uso: `#adicionarLinkPermitido[dominio]`';
  const filtro = filtrosDoServidor(ctx.mensagem.servidorId);
  if (!filtro.dominiosPermitidos.includes(dominio)) filtro.dominiosPermitidos.push(dominio);
  salvar();
  return '✅ Domínio liberado.';
});

// #contemLinkSuspeito[texto] -> "true"/"false", link presente e fora da lista de permitidos
registrar('contemLinkSuspeito', (args, ctx) => {
  const texto = args[0] ?? '';
  const urls = texto.match(/https?:\/\/[^\s]+/g) ?? [];
  if (urls.length === 0) return 'false';
  const filtro = filtrosDoServidor(ctx.mensagem.servidorId);
  const suspeito = urls.some((url) => {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      return !filtro.dominiosPermitidos.some((permitido) => host === permitido || host.endsWith(`.${permitido}`));
    } catch {
      return true;
    }
  });
  return String(suspeito);
});

module.exports = {};
