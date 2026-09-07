/**
 * Catálogo de códigos de erro da facility.js.
 * Cada erro emitido/lançado pela lib carrega um desses códigos, pra ser
 * consultado na documentação em vez de expor o stack trace bruto do JS.
 *
 * Formato: FCLY-<CATEGORIA>-<NUMERO> (números não são sequenciais de propósito,
 * cada categoria tem sua própria faixa reservada pra crescer sem colidir).
 */
const CODIGOS = {
  // ---- Gateway (conexão WebSocket com o Discord) ----
  GATEWAY_FECHAMENTO_FATAL: {
    codigo: 'FCLY-GATEWAY-41',
    mensagem: 'O gateway fechou a conexão com um código que não permite reconexão automática.',
  },
  GATEWAY_ERRO_SOCKET: {
    codigo: 'FCLY-GATEWAY-17',
    mensagem: 'Erro na conexão WebSocket com o gateway do Discord.',
  },

  // ---- REST (requisições HTTP pra API do Discord) ----
  REST_REQUISICAO_FALHOU: {
    codigo: 'FCLY-REST-22',
    mensagem: 'A API do Discord respondeu com um erro pra essa requisição.',
  },
  REST_TOKEN_INVALIDO: {
    codigo: 'FCLY-REST-90',
    mensagem: 'Token inválido ou sem permissão pra essa ação (HTTP 401/403).',
  },

  // ---- Banco de dados / persistência ----
  DB_ESCRITA_FALHOU: {
    codigo: 'FCLY-DB-08',
    mensagem: 'Não foi possível salvar o banco de dados em arquivo (disco cheio, permissão, etc).',
  },

  // ---- Motor de comandos por código (#funcao[]) ----
  MOTOR_FUNCAO_FALHOU: {
    codigo: 'FCLY-MOTOR-53',
    mensagem: 'Uma função do sistema #funcao[] lançou um erro durante a execução do comando.',
  },

  // ---- Comandos de texto (prefixo) ----
  COMANDO_PASTA_NAO_ENCONTRADA: {
    codigo: 'FCLY-COMANDO-14',
    mensagem: 'A pasta informada em carregarComandos() não existe.',
  },
  COMANDO_EXECUCAO_FALHOU: {
    codigo: 'FCLY-COMANDO-61',
    mensagem: 'Erro ao processar um comando de texto (prefixo).',
  },

  // ---- Comandos de barra (slash) e interações ----
  BARRA_EXECUCAO_FALHOU: {
    codigo: 'FCLY-BARRA-35',
    mensagem: 'Erro ao executar o handler de um comando de barra.',
  },

  // ---- Configuração (intents, opções inválidas) ----
  CONFIG_INTENCAO_DESCONHECIDA: {
    codigo: 'FCLY-CONFIG-09',
    mensagem: 'Intenção (intent) desconhecida.',
  },
};

/**
 * Erro customizado da facility.js. Sempre carrega um `codigo` consultável
 * e guarda o erro original em `causaOriginal` (não é escondido, só não é
 * a mensagem principal jogada pro console/logs).
 */
class ErroFacility extends Error {
  constructor(chaveCatalogo, detalhe, causaOriginal) {
    const entrada = CODIGOS[chaveCatalogo];
    const codigo = entrada?.codigo ?? 'FCLY-DESCONHECIDO-00';
    const mensagemBase = entrada?.mensagem ?? 'Erro não catalogado.';
    const mensagemFinal = detalhe ? `${mensagemBase} ${detalhe}` : mensagemBase;

    super(`[${codigo}] ${mensagemFinal}`);
    this.name = 'ErroFacility';
    this.codigo = codigo;
    this.causaOriginal = causaOriginal ?? null;
  }
}

module.exports = { ErroFacility, CODIGOS };
