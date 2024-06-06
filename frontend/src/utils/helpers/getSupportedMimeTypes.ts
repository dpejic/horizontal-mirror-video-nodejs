export const getSupportedMimeTypes = (media: 'video' | 'audio') => {
  const videoTypes = ['webm', 'ogg', 'mp4', 'x-matroska']
  const audioTypes = ['webm', 'ogg', 'mp3', 'x-matroska']
  const codecs = [
    'should-not-be-supported',
    'vp9',
    'vp9.0',
    'vp8',
    'vp8.0',
    'avc1',
    'av1',
    'h265',
    'h.265',
    'h264',
    'h.264',
    'opus',
    'pcm',
    'aac',
    'mpeg',
    'mp4a',
  ]
  const supported: Array<string> = []
  const isSupported = MediaRecorder.isTypeSupported
  const types = media === 'video' ? videoTypes : audioTypes

  types.forEach((type: string) => {
    const mimeType = `${media}/${type}`
    isSupported(mimeType) && supported.push(mimeType)

    codecs.forEach((codec) =>
      [`${mimeType};codecs=${codec}`, `${mimeType};codecs=${codec.toUpperCase()}`].forEach(
        (variation) => isSupported(variation) && supported.push(variation),
      ),
    )
  })
  return supported[0]
}
