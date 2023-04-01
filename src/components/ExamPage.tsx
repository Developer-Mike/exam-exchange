import styles from "@/styles/ExamPage.module.scss"
import { useEffect, useRef, useState } from "react"

export default function PageComponent({ index, source, move, remove }: { 
  index: number,
  source: MediaSource,
  move: (up: boolean) => void,
  remove: () => void,
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement|null>(null)
  const [grayscale, setGrayscale] = useState(false)
  const [censoredRegions, setCensoredRegions] = useState<number[][]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return console.error("Canvas not found")

    const ctx = canvas.getContext("2d")
    if (!ctx) return console.error("Canvas context not found")

    if (!image) {
      const newImage = new Image()
      newImage.src = URL.createObjectURL(source)

      newImage.onload = () => {
        setImage(newImage)
        
        const [width, height] = [newImage.width, newImage.height]

        const aspectRatio = width / height
        var newWidth = aspectRatio > 1 ? maxFileSide : maxFileSide * aspectRatio
        var newHeight = aspectRatio > 1 ? maxFileSide / aspectRatio : maxFileSide

        canvas.width = newWidth > width ? width : newWidth
        canvas.height = newHeight > height ? height : newHeight

        ctx.drawImage(newImage, 0, 0, canvas.width, canvas.height)
      }

      return
    }

    if (grayscale) ctx.filter = 'grayscale(1)'
    else ctx.filter = 'none'
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "black"
    for (let region of censoredRegions) {
      ctx.fillRect(region[0], region[1], region[2], region[3])
    }
  })

  return (
    <div key={index} className={styles.uploadedPage}>
      <canvas ref={canvasRef} className={styles.pageCanvas} />
      <div className={styles.pageSettings}>
        <span className={`${styles.deleteImage} material-symbols-outlined`} onClick={() => { remove() }}>delete</span>
        <span className={`${styles.moveImage} material-symbols-outlined`} onClick={() => { move(true) }}>keyboard_arrow_up</span>
        <span className={`${styles.moveImage} material-symbols-outlined`} onClick={() => { move(false) }}>keyboard_arrow_down</span>
        <span className={`${styles.censorImage} material-symbols-outlined`} onClick={() => {  }}>blur_on</span>
        <span className={`${styles.censorImage} material-symbols-outlined`} onClick={() => { setGrayscale(!grayscale) }}>palette</span>
      </div>
    </div>
  )
}

const quality = 0.5
const maxFileSide = 1500

export async function exportPage(canvas: HTMLCanvasElement): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) return

      resolve(new File([blob], `page.webp`, { type: blob.type }))
    }, "image/webp", quality)
  })
}