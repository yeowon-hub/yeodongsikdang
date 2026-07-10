const MAX_BYTES = 280_000

type DrawableImage = ImageBitmap | HTMLImageElement

async function loadDrawableImage(file: File): Promise<{ source: DrawableImage; cleanup: () => void }> {
  try {
    const bitmap = await createImageBitmap(file)
    return { source: bitmap, cleanup: () => bitmap.close() }
  } catch {
    const url = URL.createObjectURL(file)
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다'))
      img.src = url
    })
    return {
      source: image,
      cleanup: () => URL.revokeObjectURL(url),
    }
  }
}

export async function compressImageToDataUrl(file: File, maxWidth = 480): Promise<string> {
  const { source, cleanup } = await loadDrawableImage(file)
  try {
    const width = 'width' in source ? source.width : 0
    const height = 'height' in source ? source.height : 0
    const scale = Math.min(1, maxWidth / Math.max(width, height))
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('이미지를 처리할 수 없습니다')
    ctx.drawImage(source, 0, 0, w, h)

    let quality = 0.85
    let dataUrl = canvas.toDataURL('image/jpeg', quality)
    while (dataUrl.length > MAX_BYTES && quality > 0.35) {
      quality -= 0.1
      dataUrl = canvas.toDataURL('image/jpeg', quality)
    }
    return dataUrl
  } finally {
    cleanup()
  }
}
