const { obter } = require('./RegistroFuncoes');
const { ErroFacility } = require('../ErroFacility');

// Sentinelas privadas pra escapes não colidirem com separadores reais
const SENTINELA_PONTO_VIRGULA = '\u0000PV\u0000';
const SENTINELA_COLCHETE_ABRE = '\u0000CA\u0000';
const SENTINELA_COLCHETE_FECHA = '\u0000CF\u0000';
const SENTINELA_HASH = '\u0000HX\u0000';

const REGEX_NOME_FUNCAO = /^#([a-zA-Zà-úÀ-Ú_][\wà-úÀ-Ú]*)\[/;

// Limite de aninhamento de tags (#a[#b[#c[...]]]). Protege contra estouro de
// pilha em código de tag muito aninhado, seja por acidente ou por má-fé
// (ex: alguém cola um comando gerado/malicioso num arquivo de comando).
const MAX_PROFUNDIDADE = 64;

/**
 * Avalia um trecho de código, resolvendo chamadas #funcao[...] de dentro pra fora.
 * Retorna a string final (texto puro), já com os efeitos colaterais aplicados no contexto.
 *
 * @param {string} codigo
 * @param {object} contexto
 * @param {number} [nivel] uso interno, não passar manualmente
 */
async function avaliar(codigo, contexto, nivel = 0) {
  if (nivel > MAX_PROFUNDIDADE) {
    throw new ErroFacility(
      'MOTOR_PROFUNDIDADE_EXCEDIDA',
      `Aninhamento de tags excedeu o limite de ${MAX_PROFUNDIDADE} níveis — verifique se não há uma tag chamando a si mesma.`
    );
  }

  let resultado = '';
  let i = 0;

  while (i < codigo.length) {
    const atual = codigo[i];

    // Escapes: \# \[ \] \;
    if (atual === '\\' && i + 1 < codigo.length) {
      const proximo = codigo[i + 1];
      if (proximo === '#') { resultado += SENTINELA_HASH; i += 2; continue; }
      if (proximo === '[') { resultado += SENTINELA_COLCHETE_ABRE; i += 2; continue; }
      if (proximo === ']') { resultado += SENTINELA_COLCHETE_FECHA; i += 2; continue; }
      if (proximo === ';') { resultado += SENTINELA_PONTO_VIRGULA; i += 2; continue; }
    }

    if (atual === '#') {
      const match = REGEX_NOME_FUNCAO.exec(codigo.slice(i));
      if (match) {
        const nomeFuncao = match[1];
        const inicioArgs = i + match[0].length;

        let profundidade = 1;
        let j = inicioArgs;
        while (j < codigo.length && profundidade > 0) {
          if (codigo[j] === '\\') { j += 2; continue; } // pula caractere escapado
          if (codigo[j] === '[') profundidade++;
          else if (codigo[j] === ']') {
            profundidade--;
            if (profundidade === 0) break;
          }
          j++;
        }

        if (profundidade !== 0) {
          // Colchete não fechado: trata como texto literal
          resultado += atual;
          i++;
          continue;
        }

        const argsBrutos = codigo.slice(inicioArgs, j);
        const funcao = obter(nomeFuncao);

        if (funcao) {
          let retorno;
          try {
            if (funcao.bruto) {
              // Modo cru: a função recebe os pedaços NÃO avaliados e um
              // helper pra avaliar só o(s) que ela realmente precisar
              // (ex: só o branch escolhido de um #se[]).
              const argsCrus = dividirBrutoPorPontoVirgula(argsBrutos);
              const avaliarTrecho = (trecho) => avaliarCodigo(trecho, contexto, nivel + 1);
              retorno = await funcao.executar(argsCrus, contexto, avaliarTrecho);
            } else {
              const argsResolvidos = await avaliar(argsBrutos, contexto, nivel + 1);
              const args = dividirPorPontoVirgula(argsResolvidos);
              retorno = await funcao.executar(args, contexto);
            }
          } catch (causa) {
            if (causa instanceof ErroFacility) throw causa;
            throw new ErroFacility('MOTOR_FUNCAO_FALHOU', `(função: #${nomeFuncao}[])`, causa);
          }
          resultado += retorno ?? '';
        } else {
          // Função desconhecida: devolve como veio, e avisa quem estiver
          // escutando (útil pra pegar erro de digitação em #tag[]).
          contexto.cliente?.emit?.('tagDesconhecidaUsada', nomeFuncao);
          resultado += codigo.slice(i, j + 1);
        }

        i = j + 1;
        continue;
      }
    }

    resultado += atual;
    i++;
  }

  return resultado;
}

function dividirPorPontoVirgula(texto) {
  if (texto === '') return [];
  return texto.split(';').map(restaurarSentinelas);
}

// Igual dividirPorPontoVirgula, mas opera no código CRU (antes de resolver
// #funcoes[] internas), respeitando profundidade de colchetes e escapes —
// usado por funções "bruto" que precisam decidir sozinhas o que avaliar.
function dividirBrutoPorPontoVirgula(texto) {
  if (texto === '') return [];
  const partes = [];
  let atual = '';
  let profundidade = 0;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c === '\\' && i + 1 < texto.length) {
      atual += c + texto[i + 1];
      i++;
      continue;
    }
    if (c === '[') profundidade++;
    else if (c === ']') profundidade--;

    if (c === ';' && profundidade <= 0) {
      partes.push(atual);
      atual = '';
      continue;
    }
    atual += c;
  }
  partes.push(atual);
  return partes;
}

function restaurarSentinelas(texto) {
  return texto
    .replaceAll(SENTINELA_PONTO_VIRGULA, ';')
    .replaceAll(SENTINELA_COLCHETE_ABRE, '[')
    .replaceAll(SENTINELA_COLCHETE_FECHA, ']')
    .replaceAll(SENTINELA_HASH, '#');
}

async function avaliarCodigo(codigo, contexto, nivel = 0) {
  const resultado = await avaliar(codigo, contexto, nivel);
  return restaurarSentinelas(resultado);
}

module.exports = { avaliarCodigo };
            
