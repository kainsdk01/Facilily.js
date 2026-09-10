// Tipos da facility.js — escritos à mão para cobrir a superfície pública
// (index.js). Não são gerados automaticamente, então cobrem só a API
// principal; os muitos eventos custom emitidos pelo Cliente (mensagemCriada,
// entrouNoVoz, botaoClicado, etc.) ficam tipados como `string` genérico em
// `on`/`once`/`emit` — o autocomplete de nomes de evento específicos fica
// para uma versão futura.

// Não importamos `node:events` diretamente para o pacote funcionar mesmo em
// projetos sem @types/node instalado — só a fatia da API que usamos aqui.
interface EmissorDeEventos {
  on(evento: string, listener: (...args: any[]) => void): this;
  once(evento: string, listener: (...args: any[]) => void): this;
  emit(evento: string, ...args: any[]): boolean;
}

// ---------------------------------------------------------------------------
// Intenções (gateway intents)
// ---------------------------------------------------------------------------

export type NomeIntencao =
  | 'SERVIDORES'
  | 'MEMBROS_DO_SERVIDOR'
  | 'MODERACAO_DO_SERVIDOR'
  | 'EMOJIS_E_FIGURINHAS'
  | 'INTEGRACOES'
  | 'WEBHOOKS'
  | 'CONVITES'
  | 'ESTADOS_DE_VOZ'
  | 'PRESENCAS'
  | 'MENSAGENS_DO_SERVIDOR'
  | 'REACOES_DE_MENSAGEM'
  | 'DIGITANDO_NO_SERVIDOR'
  | 'MENSAGENS_DIRETAS'
  | 'DIGITANDO_EM_DM'
  | 'CONTEUDO_DE_MENSAGEM'
  | 'EVENTOS_AGENDADOS'
  | 'CONFIGURACAO_AUTOMOD'
  | 'EXECUCAO_AUTOMOD'
  | 'ENQUETES_DO_SERVIDOR'
  | 'ENQUETES_DIRETAS';

export const Intencoes: Record<NomeIntencao, number>;

/** Combina múltiplas flags de intenção (números) num único bitfield. */
export function combinar(...flags: number[]): number;

// ---------------------------------------------------------------------------
// Estruturas
// ---------------------------------------------------------------------------

export interface UsuarioDiscord {
  id: string;
  username: string;
  avatar?: string | null;
  [chave: string]: unknown;
}

export class Mensagem {
  constructor(cliente: Cliente, dados: Record<string, unknown>);
  cliente: Cliente;
  id: string;
  conteudo: string;
  canalId: string;
  servidorId: string | null;
  autor: UsuarioDiscord;
  mencoes: UsuarioDiscord[];

  /** Responde citando esta mensagem (message_reference). */
  responder(conteudo: string | Record<string, unknown>): Promise<unknown>;
  /** Envia uma nova mensagem no mesmo canal, sem citar esta. */
  enviarNoCanal(conteudo: string | Record<string, unknown>): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Cliente REST
// ---------------------------------------------------------------------------

export class ClienteRest {
  constructor(token: string);
  token: string;

  get(caminho: string, cabecalhosExtras?: Record<string, string>): Promise<unknown>;
  post(
    caminho: string,
    corpo?: unknown,
    cabecalhosExtras?: Record<string, string>
  ): Promise<unknown>;
  patch(
    caminho: string,
    corpo?: unknown,
    cabecalhosExtras?: Record<string, string>
  ): Promise<unknown>;
  put(
    caminho: string,
    corpo?: unknown,
    cabecalhosExtras?: Record<string, string>
  ): Promise<unknown>;
  deletar(caminho: string, cabecalhosExtras?: Record<string, string>): Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Cliente Gateway
// ---------------------------------------------------------------------------

export class ClienteGateway implements EmissorDeEventos {
  constructor(token: string, intencoes: number);
  conectar(url?: string): void;

  on(evento: string, listener: (...args: any[]) => void): this;
  once(evento: string, listener: (...args: any[]) => void): this;
  emit(evento: string, ...args: any[]): boolean;
}

// ---------------------------------------------------------------------------
// Cliente principal
// ---------------------------------------------------------------------------

export interface OpcoesCliente {
  /** Bitfield ou array de nomes de intenção (ex: ['SERVIDORES', 'MENSAGENS_DO_SERVIDOR']). */
  intencoes?: number;
  /** Prefixo usado pelos comandos de texto. Padrão: '!'. */
  prefixo?: string;
}

export class Cliente implements EmissorDeEventos {
  constructor(opcoes?: OpcoesCliente);

  intencoes: number;
  prefixo: string;
  usuario: UsuarioDiscord | null;
  servidores: Map<string, Record<string, unknown>>;
  variaveis: Map<string, unknown>;
  token?: string;
  rest?: ClienteRest;
  gateway?: ClienteGateway;

  /** Registra um comando de texto (equivalente a criar `./comandos/nome.js` ou `.txt`). */
  comando(nome: string, opcoes: Record<string, unknown>): this;
  /** Carrega todos os comandos (.js ou .txt) de dentro de uma pasta. */
  carregarComandos(caminhoPasta: string): this;
  /** Carrega eventos em texto puro (pronto.txt, erro.txt, etc.) de uma pasta, se ela existir. */
  carregarEventos(caminhoPasta: string): this;
  /** Conecta ao gateway da Discord com o token informado. */
  entrar(token: string): this;

  on(evento: string, listener: (...args: any[]) => void): this;
  once(evento: string, listener: (...args: any[]) => void): this;
  emit(evento: string, ...args: any[]): boolean;
}

// ---------------------------------------------------------------------------
// Motor de tags (extensibilidade)
// ---------------------------------------------------------------------------

export interface OpcoesRegistrarFuncao {
  /**
   * Quando true, a função recebe os argumentos NÃO avaliados (código de tag
   * cru) mais um helper `avaliar(trecho)`, em vez dos argumentos já
   * resolvidos. Necessário para tags que ramificam, tipo `#se[]`.
   */
  bruto?: boolean;
}

/**
 * Registra uma nova tag `#nome[...]` no motor de código.
 * `executar` recebe `(args, contexto)` no modo padrão, ou
 * `(argsCrus, contexto, avaliar)` no modo `bruto: true`.
 */
export function registrarFuncao(
  nome: string,
  executar: (...args: any[]) => unknown | Promise<unknown>,
  opcoes?: OpcoesRegistrarFuncao
): void;
