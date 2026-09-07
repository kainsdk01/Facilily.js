const TiposInteracao = {
  PING: 1,
  COMANDO_APLICACAO: 2,
  COMPONENTE_MENSAGEM: 3,
  AUTOCOMPLETE: 4,
  ENVIO_MODAL: 5,
};

const TiposComponente = {
  BOTAO: 2,
  MENU_SELECAO: 3,
  MENU_USUARIO: 5,
  MENU_CANAL: 6,
  MENU_CARGO: 7,
  MENU_MENCIONAVEL: 8,
};

class Interacao {
  constructor(cliente, dados) {
    this.cliente = cliente;
    this.id = dados.id;
    this.token = dados.token;
    this.tipo = dados.type;
    this.canalId = dados.channel_id;
    this.servidorId = dados.guild_id ?? null;
    this.membro = dados.member ?? null;
    this.usuario = dados.member?.user ?? dados.user;
    this.mensagem = dados.message ?? null;

    this._dadosBrutos = dados.data ?? {};
    this.nomeComando = this._dadosBrutos.name ?? null;
    this.customId = this._dadosBrutos.custom_id ?? null;
    this.tipoComponente = this._dadosBrutos.component_type ?? null;
    this.valores = this._dadosBrutos.values ?? [];

    this._respondida = false;
  }

  /** Valor de uma opção de comando de barra pelo nome */
  opcao(nome) {
    const encontrada = (this._dadosBrutos.options ?? []).find((o) => o.name === nome);
    return encontrada?.value ?? null;
  }

  /** Retorna { customId: valor } de todos os campos de um modal enviado */
  camposModal() {
    const resultado = {};
    for (const linha of this._dadosBrutos.components ?? []) {
      for (const campo of linha.components ?? []) {
        resultado[campo.custom_id] = campo.value;
      }
    }
    return resultado;
  }

  async responder(conteudo, { efemero = false } = {}) {
    const corpo = typeof conteudo === 'string' ? { content: conteudo } : conteudo;
    await this.cliente.rest.post(`/interactions/${this.id}/${this.token}/callback`, {
      type: 4,
      data: { ...corpo, flags: efemero ? 64 : undefined },
    });
    this._respondida = true;
  }

  async deferir({ efemero = false } = {}) {
    const tipo = this.tipo === TiposInteracao.COMPONENTE_MENSAGEM ? 6 : 5;
    await this.cliente.rest.post(`/interactions/${this.id}/${this.token}/callback`, {
      type: tipo,
      data: { flags: efemero ? 64 : undefined },
    });
    this._respondida = true;
  }

  /** Atualiza a mensagem original (usado em resposta a clique de botão/menu) */
  async atualizarMensagem(conteudo) {
    const corpo = typeof conteudo === 'string' ? { content: conteudo } : conteudo;
    await this.cliente.rest.post(`/interactions/${this.id}/${this.token}/callback`, {
      type: 7,
      data: corpo,
    });
    this._respondida = true;
  }

  async editarResposta(conteudo) {
    const corpo = typeof conteudo === 'string' ? { content: conteudo } : conteudo;
    return this.cliente.rest.patch(
      `/webhooks/${this.cliente.aplicacaoId}/${this.token}/messages/@original`,
      corpo,
    );
  }

  async enviarSeguimento(conteudo) {
    const corpo = typeof conteudo === 'string' ? { content: conteudo } : conteudo;
    return this.cliente.rest.post(`/webhooks/${this.cliente.aplicacaoId}/${this.token}`, corpo);
  }

  async mostrarModal(modal) {
    await this.cliente.rest.post(`/interactions/${this.id}/${this.token}/callback`, {
      type: 9,
      data: modal.construir ? modal.construir() : modal,
    });
    this._respondida = true;
  }
}

module.exports = { Interacao, TiposInteracao, TiposComponente };
        
