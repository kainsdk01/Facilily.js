const test = require('node:test');
const assert = require('node:assert/strict');

const { avaliarCodigo } = require('../src/motor/Analisador');
const { registrar } = require('../src/motor/RegistroFuncoes');

// Contexto mínimo usado pelos testes. As funções reais (FuncoesEmbutidas etc.)
// esperam um `ctx.mensagem`/`ctx.cliente` mais completo, mas o motor em si
// (Analisador.js) só depende de `contexto.cliente?.emit?.(...)`.
function criarContextoFalso() {
  const eventosEmitidos = [];
  return {
    cliente: {
      emit: (evento, ...args) => eventosEmitidos.push({ evento, args }),
    },
    eventosEmitidos,
  };
}

test('texto sem tags passa direto', async () => {
  const ctx = criarContextoFalso();
  const resultado = await avaliarCodigo('Fala, mundo!', ctx);
  assert.equal(resultado, 'Fala, mundo!');
});

test('escapes \\# \\[ \\] \\; viram caracteres literais', async () => {
  const ctx = criarContextoFalso();
  const resultado = await avaliarCodigo('\\#naoEhTag\\[1\\;2\\]', ctx);
  assert.equal(resultado, '#naoEhTag[1;2]');
});

test('funcao registrada eh chamada com os argumentos certos', async () => {
  const ctx = criarContextoFalso();
  registrar('somaTeste', (args) => String(Number(args[0]) + Number(args[1])));

  const resultado = await avaliarCodigo('2 + 3 = #somaTeste[2;3]', ctx);
  assert.equal(resultado, '2 + 3 = 5');
});

test('tags aninhadas resolvem de dentro pra fora', async () => {
  const ctx = criarContextoFalso();
  registrar('dobroTeste', (args) => String(Number(args[0]) * 2));

  // #dobroTeste[#dobroTeste[3]] -> #dobroTeste[6] -> 12
  const resultado = await avaliarCodigo('#dobroTeste[#dobroTeste[3]]', ctx);
  assert.equal(resultado, '12');
});

test('funcao desconhecida volta como veio e emite tagDesconhecidaUsada', async () => {
  const ctx = criarContextoFalso();
  const resultado = await avaliarCodigo('#issoNaoExiste[abc]', ctx);

  assert.equal(resultado, '#issoNaoExiste[abc]');
  assert.equal(ctx.eventosEmitidos.length, 1);
  assert.equal(ctx.eventosEmitidos[0].evento, 'tagDesconhecidaUsada');
  assert.equal(ctx.eventosEmitidos[0].args[0], 'issoNaoExiste');
});

test('funcao "bruto" recebe args crus e avalia so o ramo escolhido (estilo #se[])', async () => {
  const ctx = criarContextoFalso();
  const efeitosColaterais = [];

  registrar('marcarTeste', (args) => {
    efeitosColaterais.push(args[0]);
    return args[0] ?? '';
  });

  registrar(
    'seTeste',
    async (argsCrus, contexto, avaliar) => {
      const condicaoVerdadeira = argsCrus[0] === 'sim';
      const ramo = condicaoVerdadeira ? argsCrus[1] : argsCrus[2];
      return avaliar(ramo ?? '');
    },
    { bruto: true }
  );

  const resultado = await avaliarCodigo(
    '#seTeste[sim;#marcarTeste[ramoA];#marcarTeste[ramoB]]',
    ctx
  );

  assert.equal(resultado, 'ramoA');
  // O ramo não escolhido nunca deveria ter sido avaliado (sem efeito colateral).
  assert.deepEqual(efeitosColaterais, ['ramoA']);
});

test('aninhamento acima do limite lança ErroFacility em vez de estourar a pilha', async () => {
  const ctx = criarContextoFalso();
  registrar('ecoTeste', (args) => args[0] ?? '');

  // Monta #ecoTeste[#ecoTeste[#ecoTeste[...x...]]] com mais níveis que o limite interno.
  let codigo = 'x';
  for (let i = 0; i < 100; i++) {
    codigo = `#ecoTeste[${codigo}]`;
  }

  await assert.rejects(
    () => avaliarCodigo(codigo, ctx),
    (erro) => {
      assert.equal(erro.name, 'ErroFacility');
      assert.equal(erro.codigo, 'MOTOR_PROFUNDIDADE_EXCEDIDA');
      return true;
    }
  );
});

test('aninhamento dentro do limite continua funcionando normalmente', async () => {
  const ctx = criarContextoFalso();
  registrar('ecoTeste2', (args) => args[0] ?? '');

  let codigo = 'ok';
  for (let i = 0; i < 10; i++) {
    codigo = `#ecoTeste2[${codigo}]`;
  }

  const resultado = await avaliarCodigo(codigo, ctx);
  assert.equal(resultado, 'ok');
});

test('colchete nao fechado eh tratado como texto literal (nao quebra o parser)', async () => {
  const ctx = criarContextoFalso();
  const resultado = await avaliarCodigo('#semFechar[abc', ctx);
  assert.equal(resultado, '#semFechar[abc');
});
