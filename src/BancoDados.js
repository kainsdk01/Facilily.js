const fs = require('node:fs');
const path = require('node:path');
const { EventEmitter } = require('node:events');
const { ErroFacility } = require('./ErroFacility');

/**
 * Banco de dados chave-valor simples.
 * tipo: "memoria" (padrão, some ao reiniciar) ou "arquivo" (persiste em JSON no disco).
 * Mantém API compatível com Map (get/set/delete/has) pra não quebrar o motor,
 * e também expõe pegar/definir/apagar/tem em português.
 */
class BancoDados extends EventEmitter {
  constructor({ tipo = 'memoria', caminho = './dados.json' } = {}) {
    super();
    this.tipo = tipo;
    this.caminho = path.resolve(caminho);
    this.dados = new Map();

    if (this.tipo === 'arquivo') this.carregar();
  }

  carregar() {
    try {
      if (fs.existsSync(this.caminho)) {
        const bruto = fs.readFileSync(this.caminho, 'utf-8');
        const objeto = JSON.parse(bruto || '{}');
        this.dados = new Map(Object.entries(objeto));
      }
    } catch {
      // arquivo corrompido ou ilegível: começa vazio em vez de derrubar o bot
      this.dados = new Map();
    }
  }

  /**
   * Agenda um salvamento em disco (debounced). Várias chamadas seguidas
   * (ex: vários #definirVar[] num mesmo comando) resultam em uma única
   * escrita assíncrona, em vez de travar o event loop a cada set().
   */
  salvar() {
    if (this.tipo !== 'arquivo') return;

    clearTimeout(this._timeoutSalvar);
    this._timeoutSalvar = setTimeout(() => this._escreverEmDisco(), 100);
  }

  async _escreverEmDisco() {
    // Encadeia com a escrita anterior pra nunca ter duas escritas
    // concorrentes pisando uma na outra ou corrompendo o arquivo.
    this._filaEscrita = (this._filaEscrita ?? Promise.resolve())
      .then(async () => {
        const objeto = Object.fromEntries(this.dados);
        await fs.promises.writeFile(this.caminho, JSON.stringify(objeto, null, 2), 'utf-8');
      })
      .catch((erro) => {
        // Não derruba o bot por falha de escrita (disco cheio, permissão, etc).
        // Emite no evento 'erro' do banco (o Cliente repassa pro seu próprio 'erro').
        this.emit('erro', new ErroFacility('DB_ESCRITA_FALHOU', `(arquivo: ${this.caminho})`, erro));
      });

    return this._filaEscrita;
  }

  /** Força a escrita imediata (ignora o debounce). Útil antes de encerrar o processo. */
  async salvarAgora() {
    if (this.tipo !== 'arquivo') return;
    clearTimeout(this._timeoutSalvar);
    await this._escreverEmDisco();
  }

  // ---- API em português ----
  definir(chave, valor) {
    this.dados.set(chave, valor);
    this.salvar();
    return this;
  }

  pegar(chave) {
    return this.dados.get(chave);
  }

  apagar(chave) {
    const existia = this.dados.delete(chave);
    if (existia) this.salvar();
    return existia;
  }

  tem(chave) {
    return this.dados.has(chave);
  }

  // ---- API estilo Map, pro motor existente continuar funcionando sem mudanças ----
  set(chave, valor) {
    return this.definir(chave, valor);
  }

  get(chave) {
    return this.pegar(chave);
  }

  delete(chave) {
    return this.apagar(chave);
  }

  has(chave) {
    return this.tem(chave);
  }
}

module.exports = { BancoDados };
