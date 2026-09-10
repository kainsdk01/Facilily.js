const prism = require('prism-media');

const TAXA_AMOSTRAGEM = 48000;
const CANAIS = 2;
const AMOSTRAS_POR_FRAME = 960; // 20ms a 48kHz

/**
 * Monta o pipeline: ffmpeg (decodifica a URL/arquivo pra PCM cru) ->
 * VolumeTransformer (ajusta ganho ainda em PCM) -> Encoder Opus (frames
 * de 20ms prontos pra ir de UDP). Aceita qualquer URL/arquivo que o
 * próprio ffmpeg souber abrir (http(s) direto, arquivo local, etc).
 *
 * Retorna { stream, definirVolume, destruir }. `stream` é legível: cada
 * .read() devolve um frame Opus (Buffer) pronto pra RTP.
 */
function criarPipelineAudio(url, volumeInicial = 100) {
  const transcoder = new prism.FFmpeg({
    args: [
      '-reconnect', '1',
      '-reconnect_streamed', '1',
      '-reconnect_delay_max', '5',
      '-analyzeduration', '0',
      '-loglevel', '0',
      '-i', url,
      '-f', 's16le',
      '-ar', String(TAXA_AMOSTRAGEM),
      '-ac', String(CANAIS),
    ],
  });

  const volume = new prism.VolumeTransformer({
    type: 's16le',
    volume: Math.max(0, volumeInicial) / 100,
  });

  const encoder = new prism.opus.Encoder({
    rate: TAXA_AMOSTRAGEM,
    channels: CANAIS,
    frameSize: AMOSTRAS_POR_FRAME,
  });

  const stream = transcoder.pipe(volume).pipe(encoder);

  // Erros de qualquer estágio do pipeline sobem pro stream final,
  // pra quem usa só precisar escutar um lugar.
  transcoder.on('error', (erro) => stream.emit('error', erro));
  volume.on('error', (erro) => stream.emit('error', erro));

  return {
    stream,
    definirVolume(novoVolume) {
      volume.setVolume(Math.max(0, novoVolume) / 100);
    },
    destruir() {
      transcoder.destroy();
      volume.destroy();
      encoder.destroy();
    },
  };
}

module.exports = { criarPipelineAudio };
