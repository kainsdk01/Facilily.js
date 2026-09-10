/**
 * Fila de reprodução de um servidor. Cada Cliente tem uma FilaMusica por
 * servidor (guardada dentro do GerenciadorVoz), independente das outras.
 */
class FilaMusica {
  constructor() {
    this.faixas = []; // [{ url, titulo, pedidoPor }]
    this.indiceAtual = -1;
    this.volume = 100; // 0-200, aplicado no pipeline de áudio
    this.repetir = false; // repete a faixa atual sozinha ao terminar
  }

  adicionar(faixa) {
    this.faixas.push(faixa);
    return this.faixas.length - 1;
  }

  atual() {
    return this.faixas[this.indiceAtual] ?? null;
  }

  /** Avança pra próxima faixa e a retorna, ou null se a fila acabou. */
  proxima() {
    if (this.repetir && this.atual()) return this.atual();

    this.indiceAtual += 1;
    return this.faixas[this.indiceAtual] ?? null;
  }

  vazia() {
    return this.indiceAtual + 1 >= this.faixas.length;
  }

  limpar() {
    this.faixas = [];
    this.indiceAtual = -1;
  }

  /** Faixas que ainda vão tocar (não inclui a atual). */
  proximas() {
    return this.faixas.slice(this.indiceAtual + 1);
  }
}

module.exports = { FilaMusica };
