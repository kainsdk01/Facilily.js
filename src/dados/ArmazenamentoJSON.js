const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');

/**
 * Cria um "banco" simples baseado em arquivo JSON, salvo na raiz do projeto
 * de quem está usando a lib.
 *
 * A escrita é:
 *  - Assíncrona (não trava o event loop a cada save).
 *  - Enfileirada (chamadas de salvar() concorrentes são executadas em
 *    sequência, nunca em paralelo — evita duas escritas pisando uma na outra).
 *  - Atômica (escreve num arquivo temporário e só então substitui o
 *    original com rename, então uma queda do processo no meio do caminho
 *    nunca deixa o arquivo de dados corrompido/pela metade).
 *
 * @param {string} nomeArquivo   ex: 'inventarios.json'
 * @param {() => object} estruturaInicial  função que devolve o objeto vazio inicial
 */
function criarArmazenamento(nomeArquivo, estruturaInicial) {
  const caminho = path.resolve(process.cwd(), nomeArquivo);
  const caminhoTemp = `${caminho}.${process.pid}.tmp`;

  function carregar() {
    if (!fs.existsSync(caminho)) return estruturaInicial();
    try {
      const bruto = JSON.parse(fs.readFileSync(caminho, 'utf8'));
      return { ...estruturaInicial(), ...bruto };
    } catch {
      return estruturaInicial();
    }
  }

  const estado = { dados: carregar() };

  // Fila de escrita: cada chamada de salvar() encadeia na anterior, então
  // duas escritas nunca rodam ao mesmo tempo, mesmo se salvar() for chamado
  // várias vezes seguidas sem await.
  let filaEscrita = Promise.resolve();

  async function escreverAtomico() {
    const conteudo = JSON.stringify(estado.dados, null, 2);
    await fsPromises.writeFile(caminhoTemp, conteudo, 'utf8');
    await fsPromises.rename(caminhoTemp, caminho);
  }

  function salvar() {
    filaEscrita = filaEscrita.then(escreverAtomico, escreverAtomico);
    return filaEscrita;
  }

  return { estado, salvar };
}

module.exports = { criarArmazenamento };
