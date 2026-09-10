// Tags novas adicionadas depois do lançamento original da lib.
// Tudo em estilo "atômico" (uma checagem ou uma ação por tag, sem sistema
// próprio de banco de dados por trás), com foco em segurança e utilidades
// de servidor que a Discord já oferece via API e a lib ainda não expunha.

require('./FuncoesMembros');
require('./FuncoesCargos');
require('./FuncoesCanais');
require('./FuncoesMensagens');
require('./FuncoesAuditoria');
require('./FuncoesAutomod');
require('./FuncoesEventosAgendados');
require('./FuncoesEmojisWebhooks');
require('./FuncoesVoz');
require('./FuncoesServidorAvancado');
require('./FuncoesTextoSeguranca');
require('./FuncoesCodificacao');
require('./FuncoesFormatacao');
require('./FuncoesBot');
require('./FuncoesCooldown');
require('./FuncoesBloqueio');
require('./FuncoesQuarentena');
require('./FuncoesFiltros');
require('./FuncoesPermissoesComando');
require('./FuncoesAntiRaid');

module.exports = {};
