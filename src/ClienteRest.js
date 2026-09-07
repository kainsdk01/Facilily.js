const { setTimeout: aguardar } = require('node:timers/promises');

const API_BASE = 'https://discord.com/api/v10';

class ClienteRest {
  constructor(token) {
    this.token = token;
    this.buckets = new Map(); // rota -> { restante, reset }
  }

  chaveDaRota(metodo, caminho) {
    // Agrupa por rota "major" (ignora IDs variáveis simples)
    return caminho.replace(/\/\d{15,20}/g, '/:id');
  }

  async requisitar(metodo, caminho, corpo) {
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
      const dados = await res.json().catch(() => ({}));
      const tentarApos = (dados.retry_after ?? 1) * 1000;
      await aguardar(tentarApos);
      return this.requisitar(metodo, caminho, corpo);
    }

    if (!res.ok) {
      const texto = await res.text();
      throw new Error(`REST ${metodo} ${caminho} -> ${res.status}: ${texto}`);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  get(caminho) { return this.requisitar('GET', caminho); }
  post(caminho, corpo) { return this.requisitar('POST', caminho, corpo); }
  patch(caminho, corpo) { return this.requisitar('PATCH', caminho, corpo); }
  put(caminho, corpo) { return this.requisitar('PUT', caminho, corpo); }
  deletar(caminho) { return this.requisitar('DELETE', caminho); }
}

module.exports = { ClienteRest };
