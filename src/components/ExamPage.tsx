import styles from "@/styles/ExamPage.module.scss"
import { useEffect, useRef, useState } from "react"

export default function PageComponent({ source, move, remove }: { 
  source: MediaSource,
  move: (up: boolean) => void,
  remove: () => void,
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement|null>(null)
  const [color, setColor] = useState(false)
  const [drawMode, setDrawMode] = useState(false)

  const [drawPaths, setDrawPaths] = useState<number[][]>([])
  const [drawStartPos, setDrawStartPos] = useState<number[]|null>(null)
  const [drawLivePos, setDrawLivePos] = useState<number[]|null>(null)

  const toggleButton = (e: any, state: Boolean, stateSetter: any) => { 
    let newState = !state;

    (e.target as HTMLElement).setAttribute("data-active", newState.toString())
    stateSetter(newState)
  }

  const getCanvasPos = (pos: number[]): number[] => {
    const canvas = canvasRef.current
    if (!canvas) return [0, 0]

    let bounds = canvas.getBoundingClientRect()
    let scaleX = canvas.width / bounds.width;
    let scaleY = canvas.height / bounds.height;

    return [
      (pos[0] - bounds.left) * scaleX,
      (pos[1] - bounds.top) * scaleY
    ]
  }

  const canvasStartDraw = (e: any) => {
    if (!drawMode || drawStartPos) return

    setDrawStartPos(getCanvasPos([e.clientX, e.clientY]))
    canvasDrawPreview(e)
  }

  const canvasDrawPreview = (e: any) => {
    if (!drawMode || !drawStartPos) return
    
    setDrawLivePos(getCanvasPos([e.clientX, e.clientY]))
  }

  const canvasEndDraw = (e: any) => {
    if (!drawMode || drawStartPos == null) return

    setDrawPaths([...drawPaths, [...drawStartPos, ...getCanvasPos([e.clientX, e.clientY])]])
    setDrawStartPos(null)
    setDrawLivePos(null)
  }

  const undoDrawPath = () => {
    if (drawPaths.length == 0) return

    setDrawPaths(drawPaths.slice(0, drawPaths.length - 1))
  }

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

    if (!color) ctx.filter = 'grayscale(1)'
    else ctx.filter = 'none'
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    ctx.lineWidth = 30
    ctx.lineCap = 'round'
    let paths = drawStartPos && drawLivePos ? [...drawPaths, [...drawStartPos, ...drawLivePos]] : drawPaths
    for (const path of paths) {
      ctx.beginPath()
      ctx.moveTo(path[0], path[1])
      ctx.lineTo(path[2], path[3])
      ctx.stroke()
    }
  })

  return (
    <div className={styles.uploadedPage}>
      <canvas ref={canvasRef} className={styles.pageCanvas} onMouseDown={canvasStartDraw} onMouseMove={canvasDrawPreview} onMouseUp={canvasEndDraw} />
      <div className={styles.pageSettings}>
        <span className={`${styles.editImage} material-symbols-outlined`} onClick={(e) => { undoDrawPath() }}>undo</span>
        <span className={`${styles.editImage} material-symbols-outlined`} onClick={(e) => { toggleButton(e, drawMode, setDrawMode) }}>edit</span>
        <span className={`${styles.censorImage} material-symbols-outlined`} onClick={(e) => { toggleButton(e, color, setColor) }}>palette</span>
        <span className={`${styles.moveImage} material-symbols-outlined`} onClick={() => { move(true) }}>keyboard_arrow_up</span>
        <span className={`${styles.moveImage} material-symbols-outlined`} onClick={() => { move(false) }}>keyboard_arrow_down</span>
        <span className={`${styles.deleteImage} material-symbols-outlined`} onClick={() => { remove() }}>delete</span>
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