const { setTimeout: aguardar } = require('node:timers/promises');

const API_BASE = 'https://discord.com/api/v10';
const MAX_TENTATIVAS_429 = 5;

class ClienteRest {
  constructor(token) {
    this.token = token;
    this.buckets = new Map(); // rota -> { restante, reset }
  }

  chaveDaRota(metodo, caminho) {
    // Agrupa por rota "major" (ignora IDs variáveis simples)
    return caminho.replace(/\/\d{15,20}/g, '/:id');
  }

  async requisitar(metodo, caminho, corpo, cabecalhosExtras = {}, tentativa = 0) {
    const chave = this.chaveDaRota(metodo, caminho);
    const bucket = this.buckets.get(chave);

    if (bucket && bucket.restante <= 0 && Date.now() < bucket.reset) {
      await aguardar(bucket.reset - Date.now());
    }

    const res = await fetch(API_BASE + caminho, {
      method: metodo,
      headers: {
        Authorization: `Bot ${this.token}`,
        'Content-Type': 'application/json',
        ...cabecalhosExtras,
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });

    const restante = Number(res.headers.get('x-ratelimit-remaining'));
    const resetApos = Number(res.headers.get('x-ratelimit-reset-after'));

    if (!Number.isNaN(restante)) {
      this.buckets.set(chave, {
        restante,
        reset: Date.now() + (resetApos || 0) * 1000,
      });
    }

    if (res.status === 429) {
      if (tentativa >= MAX_TENTATIVAS_429) {
        throw new Error(`REST ${metodo} ${caminho} -> 429: limite de ${MAX_TENTATIVAS_429} tentativas excedido`);
      }
      const dados = await res.json().catch(() => ({}));
      const tentarApos = (dados.retry_after ?? 1) * 1000;
      await aguardar(tentarApos);
      return this.requisitar(metodo, caminho, corpo, cabecalhosExtras, tentativa + 1);
    }

    if (!res.ok) {
      const texto = await res.text();
      throw new Error(`REST ${metodo} ${caminho} -> ${res.status}: ${texto}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  get(caminho, cabecalhosExtras) { return this.requisitar('GET', caminho, undefined, cabecalhosExtras); }
  post(caminho, corpo, cabecalhosExtras) { return this.requisitar('POST', caminho, corpo, cabecalhosExtras); }
  patch(caminho, corpo, cabecalhosExtras) { return this.requisitar('PATCH', caminho, corpo, cabecalhosExtras); }
  put(caminho, corpo, cabecalhosExtras) { return this.requisitar('PUT', caminho, corpo, cabecalhosExtras); }
  deletar(caminho, cabecalhosExtras) { return this.requisitar('DELETE', caminho, undefined, cabecalhosExtras); }
}

module.exports = { ClienteRest };
