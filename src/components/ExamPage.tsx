import styles from "@/styles/ExamPage.module.scss"
import { useState } from "react"

const quality = 0.5
const maxFileSide = 1500

export class ExamPage {
  file: File
  grayscale: boolean = false
  censoredRegions: number[][] = []

  constructor(file: File) {
    this.file = file
  }

  public static async fromSource(document: Document, source: MediaSource): Promise<ExamPage> {
    const image = new Image()
    image.src = URL.createObjectURL(source)
    
    return new ExamPage(await ExamPage.generateFile(document, source, false, null))
  }

  public static async generateFile(document: Document, source: File|MediaSource, grayscale: boolean, censoredRegions: number[][]|null = null): Promise<File> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.src = URL.createObjectURL(source)

      image.onload = () => {
        const aspectRatio = image.naturalWidth / image.naturalHeight
        var width = aspectRatio > 1 ? maxFileSide : maxFileSide * aspectRatio
        var height = aspectRatio > 1 ? maxFileSide / aspectRatio : maxFileSide

        if (width > image.naturalWidth || height > image.naturalHeight) {
          width = image.naturalWidth
          height = image.naturalHeight
        }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        var ctx = canvas.getContext("2d")
        if (!ctx) return

        if (grayscale) ctx.filter = 'grayscale(1)'
        ctx.drawImage(image, 0, 0, width, height)

        if (censoredRegions) {
          ctx.fillStyle = "black"

          for (let region of censoredRegions) {
            ctx.fillRect(region[0], region[1], region[2], region[3])
          }
        }

        canvas.toBlob(blob => {
          if (!blob) return

          resolve(new File([blob], `page.webp`, { type: blob.type }))
        }, "image/webp", quality)
      }
    })
  }
}

export default function PageComponent({ index, page, move, remove }: { 
  index: number,
  page: ExamPage,
  move: (up: boolean) => void,
  remove: () => void,
}) {
  const [grayscale, _setGrayscale] = useState(page.grayscale)
  const setGrayscale = (grayscale: boolean) => {
    page.grayscale = grayscale
    _setGrayscale(grayscale)
  }

  return (
    <div key={index} className={styles.uploadedPage}>
      <img src={URL.createObjectURL(page.file)} style={{ filter: grayscale ? "grayscale(1)" : "" }}/>
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