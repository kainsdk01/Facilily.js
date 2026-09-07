class Mensagem {
  constructor(cliente, dados) {
    this.cliente = cliente;
    this.id = dados.id;
    this.conteudo = dados.content;
    this.canalId = dados.channel_id;
    this.servidorId = dados.guild_id ?? null;
    this.autor = dados.author;
  }

  responder(conteudo) {
    const corpo = typeof conteudo === 'string' ? { content: conteudo } : conteudo;
    return this.cliente.rest.post(`/channels/${this.canalId}/messages`, {
      ...corpo,
      message_reference: { message_id: this.id },
    });
  }

  enviarNoCanal(conteudo) {
    const corpo = typeof conteudo === 'string' ? { content: conteudo } : conteudo;
    return this.cliente.rest.post(`/channels/${this.canalId}/messages`, corpo);
  }
}

module.exports = { Mensagem };
