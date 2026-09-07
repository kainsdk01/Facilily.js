const { obter } = require('./RegistroFuncoes');
const { ErroFacility } = require('../ErroFacility');

// Sentinelas privadas pra escapes não colidirem com separadores reais
const SENTINELA_PONTO_VIRGULA = '\u0000PV\u0000';
const SENTINELA_COLCHETE_ABRE = '\u0000CA\u0000';
const SENTINELA_COLCHETE_FECHA = '\u0000CF\u0000';
const SENTINELA_HASH = '\u0000HX\u0000';

const REGEX_NOME_FUNCAO = /^#([a-zA-Zà-úÀ-Ú_][\wà-úÀ-Ú]*)\[/;

/**
 * Avalia um trecho de código, resolvendo chamadas #funcao[...] de dentro pra fora.
 * Retorna a string final (texto puro), já com os efeitos colaterais aplicados no contexto.
 */
async function avaliar(codigo, contexto) {
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
        const argsResolvidos = await avaliar(argsBrutos, contexto);
        const args = dividirPorPontoVirgula(argsResolvidos);

        const funcao = obter(nomeFuncao);
        if (funcao) {
          let retorno;
          try {
            retorno = await funcao.executar(args, contexto);
          } catch (causa) {
            if (causa instanceof ErroFacility) throw causa;
            throw new ErroFacility('MOTOR_FUNCAO_FALHOU', `(função: #${nomeFuncao}{})`, causa);
          }
          resultado += retorno ?? '';
        } else {
          // Função desconhecida: devolve como veio
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

function restaurarSentinelas(texto) {
  return texto
    .replaceAll(SENTINELA_PONTO_VIRGULA, ';')
    .replaceAll(SENTINELA_COLCHETE_ABRE, '[')
    .replaceAll(SENTINELA_COLCHETE_FECHA, ']')
    .replaceAll(SENTINELA_HASH, '#');
}

async function avaliarCodigo(codigo, contexto) {
  const resultado = await avaliar(codigo, contexto);
  return restaurarSentinelas(resultado);
}

module.exports = { avaliarCodigo };
            
