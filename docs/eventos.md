# Eventos disponíveis

[< Voltar ao README](../README.md)

Cada arquivo `.txt` dentro da pasta de eventos roda automaticamente quando
aquele evento acontece — sem precisar escrever `bot.on(...)` em JS. Todas as
tags que já existem para comandos (`#nomeAutor[]`, `#idAutor[]`,
`#mencaoAutor[]`, `#idCanal[]`, `#idServidor[]`, `#nomeServidor[]`,
`#avatarAutor[]`, `#darCargo[]`, `#enviarEm[]`, etc.) também funcionam dentro
dos eventos, porque cada evento monta um "autor" e um "servidor" — quando
fizer sentido — do mesmo jeito que uma mensagem normal.

Além disso, quase todo evento carrega dados extras específicos, lidos com a
tag genérica **`#evento[chave]`**. Exemplo (`eventos/cargoCriado.txt`):

```
#log[Novo cargo criado: #evento[nomeCargo] (id #evento[idCargo]) em #nomeServidor[]]
```

Use `#temEvento[chave]` pra checar se uma chave existe antes de usar (útil
dentro de `#se[...]`).

### Tabela completa

| Evento (nome do arquivo)      | Dispara quando...                          | `#nomeAutor[]`/`#idAutor[]` é...        | Chaves de `#evento[chave]`                          | Intenção necessária |
|---                             |---                                          |---                                        |---                                                    |---|
| `pronto`                       | o bot termina de conectar                  | —                                          | —                                                     | — |
| `mensagemCriada`               | chega uma mensagem                         | quem mandou                               | — (use as tags normais de mensagem)                  | `MENSAGENS_DO_SERVIDOR` / `MENSAGENS_DIRETAS` |
| `mensagemEditada`              | uma mensagem é editada                     | quem mandou (pode faltar em edição só de embed) | `conteudo`                                      | `MENSAGENS_DO_SERVIDOR` |
| `mensagemDeletada`             | uma mensagem é apagada                     | vazio (a Discord não manda o autor)       | `idMensagem`                                          | `MENSAGENS_DO_SERVIDOR` |
| `mensagensDeletadasEmMassa`    | apagam várias mensagens de uma vez         | vazio                                     | `quantidade`, `ids`                                   | `MENSAGENS_DO_SERVIDOR` |
| `canalPinsAtualizado`          | uma mensagem é fixada/desafixada           | vazio                                     | `ultimoPin`                                           | `SERVIDORES` |
| `digitando`                    | alguém começa a digitar                    | quem está digitando                       | `timestamp`                                           | `DIGITANDO_NO_SERVIDOR` / `DIGITANDO_EM_DM` |
| `membroEntrou`                 | alguém entra no servidor                   | quem entrou                               | `apelido`, `cargos`, `dataEntrada`                    | `MEMBROS_DO_SERVIDOR` (privilegiada) |
| `membroSaiu`                   | alguém sai ou é expulso do servidor        | quem saiu                                 | —                                                      | `MEMBROS_DO_SERVIDOR` (privilegiada) |
| `membroAtualizado`             | apelido/cargos/boost de alguém mudam       | quem mudou                                | `apelido`, `cargos`, `estaBoostando`                  | `MEMBROS_DO_SERVIDOR` (privilegiada) |
| `membroBanido`                 | alguém é banido                            | quem foi banido                           | —                                                      | `MODERACAO_DO_SERVIDOR` |
| `membroDesbanido`              | um banimento é revertido                   | quem foi desbanido                        | —                                                      | `MODERACAO_DO_SERVIDOR` |
| `presencaAtualizada`           | status/atividade de alguém muda            | quem mudou                                | `status`, `atividade`                                 | `PRESENCAS` (privilegiada) |
| `reacaoAdicionada`             | alguém reage a uma mensagem                | quem reagiu                               | `emoji`, `idEmoji`                                    | `REACOES_DE_MENSAGEM` |
| `reacaoRemovida`               | alguém tira uma reação                     | quem tirou                                | `emoji`, `idEmoji`                                    | `REACOES_DE_MENSAGEM` |
| `todasReacoesRemovidas`        | todas as reações de uma mensagem somem     | vazio                                     | —                                                      | `REACOES_DE_MENSAGEM` |
| `reacaoEmojiRemovida`          | um emoji específico some de uma mensagem   | vazio                                     | `emoji`                                               | `REACOES_DE_MENSAGEM` |
| `cargoCriado`                  | um cargo é criado                          | vazio                                     | `idCargo`, `nomeCargo`, `corCargo`                    | `SERVIDORES` |
| `cargoAtualizado`              | um cargo é editado                         | vazio                                     | `idCargo`, `nomeCargo`, `corCargo`                    | `SERVIDORES` |
| `cargoDeletado`                | um cargo é apagado                         | vazio                                     | `idCargo`                                             | `SERVIDORES` |
| `canalCriado`                  | um canal é criado                          | vazio (mas `#idCanal[]` funciona)         | `nomeCanal`, `tipoCanal`                              | `SERVIDORES` |
| `canalAtualizado`              | um canal é editado                         | vazio                                     | `nomeCanal`, `tipoCanal`                              | `SERVIDORES` |
| `canalDeletado`                | um canal é apagado                         | vazio                                     | `nomeCanal`, `tipoCanal`                              | `SERVIDORES` |
| `threadCriada`                 | uma thread é criada                        | vazio                                     | `nomeThread`, `idCanalPai`                            | `SERVIDORES` |
| `threadAtualizada`             | uma thread é editada                       | vazio                                     | `nomeThread`, `idCanalPai`                            | `SERVIDORES` |
| `threadDeletada`               | uma thread é apagada                       | vazio                                     | `idCanalPai`                                          | `SERVIDORES` |
| `threadMembrosAtualizados`     | membros de uma thread mudam                | vazio                                     | `totalMembrosThread`                                  | `SERVIDORES` |
| `conviteCriado`                | um convite é gerado                        | quem criou o convite                      | `codigoConvite`                                       | `CONVITES` |
| `conviteDeletado`              | um convite expira/é apagado                | vazio                                     | `codigoConvite`                                       | `CONVITES` |
| `emojisAtualizados`            | emojis do servidor mudam                   | vazio                                     | `quantidadeEmojis`                                    | `EMOJIS_E_FIGURINHAS` |
| `figurinhasAtualizadas`        | figurinhas do servidor mudam                | vazio                                     | `quantidadeFigurinhas`                                | `EMOJIS_E_FIGURINHAS` |
| `integracaoAtualizada`         | uma integração do servidor muda            | vazio                                     | —                                                      | `INTEGRACOES` |
| `webhooksAtualizados`          | um webhook de canal muda                   | vazio                                     | —                                                      | `WEBHOOKS` |
| `automodRegraCriada`           | uma regra de AutoMod é criada              | vazio                                     | `idRegra`, `nomeRegra`                                | `CONFIGURACAO_AUTOMOD` |
| `automodRegraAtualizada`       | uma regra de AutoMod é editada             | vazio                                     | `idRegra`, `nomeRegra`                                | `CONFIGURACAO_AUTOMOD` |
| `automodRegraDeletada`         | uma regra de AutoMod é apagada             | vazio                                     | `idRegra`, `nomeRegra`                                | `CONFIGURACAO_AUTOMOD` |
| `automodAcaoExecutada`         | o AutoMod bloqueia algo                    | quem disparou a regra                     | `idRegra`, `palavraDetectada`, `conteudoDetectado`    | `EXECUCAO_AUTOMOD` |
| `eventoAgendadoCriado`         | um evento do servidor é criado             | vazio                                     | `idEventoAgendado`, `nomeEventoAgendado`              | `EVENTOS_AGENDADOS` |
| `eventoAgendadoAtualizado`     | um evento do servidor é editado            | vazio                                     | `idEventoAgendado`, `nomeEventoAgendado`              | `EVENTOS_AGENDADOS` |
| `eventoAgendadoDeletado`       | um evento do servidor é apagado            | vazio                                     | `idEventoAgendado`, `nomeEventoAgendado`              | `EVENTOS_AGENDADOS` |
| `usuarioInteressadoEvento`     | alguém marca interesse num evento          | quem marcou                               | `idEventoAgendado`                                    | `EVENTOS_AGENDADOS` |
| `usuarioDesinteressadoEvento`  | alguém desmarca interesse                  | quem desmarcou                            | `idEventoAgendado`                                    | `EVENTOS_AGENDADOS` |
| `votoEnqueteAdicionado`        | alguém vota numa enquete                   | quem votou                                | `idResposta`                                          | `ENQUETES_DO_SERVIDOR` / `ENQUETES_DIRETAS` |
| `votoEnqueteRemovido`          | alguém tira o voto                         | quem tirou                                | `idResposta`                                          | `ENQUETES_DO_SERVIDOR` / `ENQUETES_DIRETAS` |
| `servidorAtualizado`           | nome/ícone/config do servidor mudam        | vazio                                     | —                                                      | `SERVIDORES` |
| `servidorSaiu`                 | o bot é removido/expulso do servidor       | vazio                                     | —                                                      | `SERVIDORES` |
| `servidorIndisponivel`         | o servidor cai por instabilidade da Discord | vazio                                     | —                                                      | `SERVIDORES` |
| `entrouNoVoz`                  | alguém entra num canal de voz              | quem entrou                               | `mutado`, `ensurdecido`, `transmitindo`, `cameraLigada` | `ESTADOS_DE_VOZ` |
| `saiuDoVoz`                    | alguém sai de um canal de voz              | quem saiu                                 | idem                                                   | `ESTADOS_DE_VOZ` |
| `mudouDeCanalVoz`              | alguém troca de canal de voz               | quem trocou                               | idem + `idCanalAnterior`                              | `ESTADOS_DE_VOZ` |
| `estadoVozAtualizado`          | qualquer mudança de voz (inclusive mute)   | quem mudou                                | idem                                                   | `ESTADOS_DE_VOZ` |
| `interacaoCriada`              | qualquer interação (comando de barra, botão, menu, modal) | quem interagiu             | `idInteracao`, `customId`, `nomeComandoBarra`         | — |
| `comandoBarraExecutado`        | um `/comando` é executado                  | quem executou                             | idem + use `#valorOpcao[nome]`                        | — |
| `botaoClicado`                 | um botão é clicado                         | quem clicou                               | idem                                                   | — |
| `menuSelecaoUsado`             | um menu (seleção/usuário/canal/cargo) é usado | quem usou                              | idem + use `#valoresMenu[]`                           | — |
| `autocompleteSolicitado`       | a Discord pede sugestões de autocomplete   | quem está digitando                       | idem                                                   | — |
| `modalEnviado`                 | um modal é enviado                         | quem enviou                               | idem + use `#campoModal[customId]`                    | — |
| `comandoExecutado`             | um comando de prefixo roda com sucesso     | quem executou                             | `nomeComando`, `argumentos`                           | — |
| `comandoComErro`               | um comando de prefixo lança um erro        | quem executou                             | `nomeComando`, `erro`                                 | — |
| `comandoDesconhecido`          | usam o prefixo com um comando que não existe | quem tentou                             | `nomeComando`                                         | — |
| `tagDesconhecidaUsada`         | uma `#tag[]` que não existe é usada em qualquer comando/evento | —              | `nome`                                                | — |
| `erro`                         | um erro interno acontece                   | —                                          | `texto`, `pilha`                                      | — |
| `depuracao`                    | logs internos (conexão, carregamento...)   | —                                          | `texto`                                               | — |

> ⚠️ Eventos marcados **(privilegiada)** (`membroEntrou`/`membroSaiu`/
> `membroAtualizado` e `presencaAtualizada`) exigem também ativar a
> respectiva "Privileged Gateway Intent" no [Discord Developer Portal](https://discord.com/developers/applications),
> além de incluir a intenção na sua lista de `INTENCOES`.

### Tags novas de eventos

- `#evento[chave]` — pega qualquer valor extra do evento atual (tabela acima).
- `#temEvento[chave]` — `"true"`/`"false"`, se aquela chave existe no evento atual.
- `#nomeComando[]` / `#erroComando[]` — dentro de `comandoExecutado`/`comandoComErro`/`comandoDesconhecido`.
- `#nomeTagDesconhecida[]` — dentro de `tagDesconhecidaUsada`.
- `#idCanalVozAnterior[]`, `#estaMutado[]`, `#estaEnsurdecido[]`, `#estaTransmitindo[]` — dentro dos eventos de voz.
- `#idInteracao[]`, `#customId[]`, `#nomeComandoBarra[]`, `#valorOpcao[nome]`, `#valoresMenu[]`, `#campoModal[customId]` — dentro dos eventos de interação.
- `#responderInteracao[texto;efemero]`, `#deferirInteracao[]`, `#atualizarMensagemInteracao[texto]` — respondem a interação direto de dentro do evento.
