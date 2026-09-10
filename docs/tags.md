# Tags novas de segurança e utilidades (175 tags)

[< Voltar ao README](../README.md)

Tags atômicas — uma checagem ou uma ação por tag, no mesmo espírito de
`#isBanido[]`/`#existeMembro[]` — sem sistema de banco de dados próprio por
trás (exceto onde faz sentido guardar estado leve, como cooldowns, filtros e
quarentena, que ficam salvos em arquivos próprios: `filtros.json`,
`quarentena.json`, `bloqueios.json`, `permissoesComando.json`).

**Membros:** `#existeMembro`, `#estaBanido`, `#motivoDoBan`, `#temCargo`,
`#cargosDoMembro`, `#contarCargos`, `#cargoMaisAlto`, `#corDestaque`,
`#ehAdmin`, `#temPermissao`, `#podeGerenciarCargo`, `#estaSilenciado`,
`#tempoSilencioRestante`, `#estaBoostando`, `#dataEntradaServidor`,
`#tempoNoServidor`, `#ehBot`, `#tagUsuario`, `#bannerAutor`, `#dataDoId`

**Cargos:** `#existeCargo`, `#corCargo`, `#posicaoCargo`, `#cargoMencionavel`,
`#cargoEhGerenciado`, `#mencaoCargo`, `#criarCargo`, `#editarCargo`,
`#deletarCargo`, `#moverCargo`

**Canais e threads:** `#existeCanal`, `#tipoCanal`, `#canalENsfw`,
`#categoriaDoCanal`, `#canaisDaCategoria`, `#topicoCanal`,
`#limiteUsuariosVoz`, `#bitrateCanalVoz`, `#mencaoCanal`, `#definirTopico`,
`#definirNsfw`, `#definirLimiteVoz`, `#definirRegiaoVoz`, `#moverCanal`,
`#clonarCanal`, `#criarThread`, `#arquivarThread`, `#desarquivarThread`,
`#trancarThread`, `#threadEstaArquivada`, `#adicionarMembroThread`,
`#removerMembroThread`, `#definirPermissaoCanal`, `#removerPermissaoCanal`

**Mensagens:** `#buscarMensagem`, `#autorDaMensagem`, `#mensagemEstaFixada`,
`#anexosMensagem`, `#fixarMensagem`, `#desafixarMensagem`,
`#totalMensagensFixadas`, `#editarMensagemBot`, `#deletarMensagem`,
`#totalReacoesMensagem`, `#quemReagiu`, `#removerReacao`, `#limparReacoes`,
`#buscarUltimasMensagens`

**Auditoria e convites:** `#quemBaniu`, `#quemExpulsou`, `#quemDeletouCanal`,
`#quemDeletouCargo`, `#ultimaAcaoModeracao`, `#totalBanidos`,
`#listaBanidos`, `#codigoConviteValido`, `#usosConvite`, `#criadorConvite`,
`#validadeConvite`, `#deletarConvite`, `#totalConvitesAtivos`,
`#verificarLinkDiscord`, `#contemMencaoEveryone`

**AutoMod nativo:** `#criarRegraAutomod`, `#deletarRegraAutomod`,
`#listarRegrasAutomod`, `#regraAutomodAtiva`, `#ativarRegraAutomod`

**Eventos agendados:** `#criarEventoAgendado`, `#cancelarEventoAgendado`,
`#totalInteressadosEvento`, `#statusEventoAgendado`

**Emojis, stickers e webhooks:** `#existeEmoji`, `#urlEmoji`, `#criarEmoji`,
`#deletarEmoji`, `#listarStickers`, `#deletarSticker`, `#criarWebhook`,
`#deletarWebhook`, `#enviarWebhook`

**Voz:** `#estaEmVoz`, `#canalVozAtual`, `#totalUsuariosEmVoz`,
`#moverParaCanalVoz`, `#desconectarDeVoz`

**Servidor avançado:** `#nivelVerificacaoServidor`,
`#definirNivelVerificacaoServidor`, `#bannerServidor`, `#iconeServidor`,
`#descricaoServidor`, `#urlConviteVanity`, `#servidorEhCommunity`,
`#recursosServidor`, `#limiteEmojisServidor`, `#limiteUploadServidor`,
`#totalThreadsAtivas`

**Anti-spam / análise de texto:** `#proporcaoMaiusculas`,
`#contarCaracteresRepetidos`, `#similaridadeTexto`, `#contemZalgo`,
`#contemCaracteresInvisiveis`, `#removerEmojis`, `#contarPalavras`,
`#extrairIds`, `#validarEmail`, `#validarUrl`, `#limitarTexto`, `#mascarar`

**Codificação e geração:** `#hashTexto`, `#codificarBase64`,
`#decodificarBase64`, `#gerarUuid`, `#gerarSenha`, `#gerarCodigoVerificacao`

**Formatação e cálculo:** `#formatarTimestamp`, `#diferencaEntreDatas`,
`#calcularPorcentagem`

**Bot:** `#uptimeBot`, `#versaoBiblioteca`, `#totalServidoresBot`,
`#estaNoServidor`, `#listarServidoresBot`, `#ping`

**Cooldown genérico:** `#definirCooldown`, `#estaEmCooldown`,
`#tempoRestanteCooldown`, `#limparCooldown`

**Bloqueio interno do bot:** `#bloquearUsuario`, `#desbloquearUsuario`,
`#estaBloqueado`, `#motivoBloqueio`

**Quarentena:** `#colocarQuarentena`, `#removerQuarentena`,
`#estaQuarentena`, `#motivoQuarentena`, `#totalEmQuarentena`

**Filtro de palavras/links:** `#adicionarPalavraProibida`,
`#removerPalavraProibida`, `#listarPalavrasProibidas`,
`#contemPalavraProibida`, `#adicionarLinkPermitido`, `#contemLinkSuspeito`

**Permissão por comando:** `#definirPermissaoComando`,
`#removerPermissaoComando`, `#listarPermissoesComando`,
`#usuarioTemPermissaoComando`

**Anti-raid e lockdown:** `#configurarAntiRaid`, `#registrarEntradaAntiRaid`,
`#detectarRaid`, `#ativarModoAntiRaid`, `#desativarModoAntiRaid`,
`#modoAntiRaidAtivo`, `#ativarLockdown`, `#desativarLockdown`

Exemplo de uso do anti-raid, dentro de `eventos/membroEntrou.txt`:

```
#registrarEntradaAntiRaid[]
#se[#detectarRaid[]==true;#ativarLockdown[]#log[🚨 Raid detectado, lockdown ativado!];]
```

### Exemplo completo (`eventos/membroEntrou.txt`)

```
#definirVar[boasVindas;#idCanal[]]
#enviarEm[#pegarVar[boasVindas];🎉 Seja bem-vindo(a), #mencaoAutor[]! Você é o(a) #totalMembros[]º membro de #nomeServidor[].]
#darCargo[#idAutor[];123456789012345678]
```

