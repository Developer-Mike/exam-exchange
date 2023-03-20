export async function webpFromSource(document: Document, source: MediaSource): Promise<File> {
  const image = new Image()
  image.src = URL.createObjectURL(source)

  let blob = await new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas?.getContext("2d")?.drawImage(image, 0, 0)

      canvas.toBlob(blob => {
        if (!blob) return
        resolve(new File([blob], `page.webp`, { type: blob.type }))
      }, "image/webp", 0.5)
    }
  })
  
  return blob as File
}