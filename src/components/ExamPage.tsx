import styles from "@/styles/ExamPage.module.scss"

export class ExamPage {
  file: File
  censoredRegions: number[][] = []

  constructor(file: File) {
    this.file = file
  }

  public async export(): Promise<File> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.src = URL.createObjectURL(this.file)

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
  }

  public static async fromSource(document: Document, source: MediaSource): Promise<ExamPage> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.src = URL.createObjectURL(source)
    
      image.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = image.naturalWidth
        canvas.height = image.naturalHeight
        canvas?.getContext("2d")?.drawImage(image, 0, 0)
  
        canvas.toBlob(blob => {
          if (!blob) return

          resolve(new ExamPage(new File([blob], `page.webp`, { type: blob.type })))
        }, "image/webp", 0.5)
      }
    })
  }
}

export default function PageComponent({ index, page, uploadedPages, setUploadedPages }: { 
  index: number,
  page: ExamPage,
  uploadedPages: ExamPage[],
  setUploadedPages: (uploadedPages: ExamPage[]) => void
}) {
  const removeUploadedFile = (index: number) => {
    let newUploadedFiles = [...uploadedPages]
    newUploadedFiles.splice(index, 1)

    setUploadedPages(newUploadedFiles)
  }

  const moveUploadedFile = (index: number, up: boolean) => {
    let newUploadedFiles = [...uploadedPages]
    const file = newUploadedFiles[index]
    newUploadedFiles.splice(index, 1)
    newUploadedFiles.splice(up ? index - 1 : index + 1, 0, file)

    setUploadedPages(newUploadedFiles)
  }

  return (
    <div key={index} className={styles.uploadedPage}>
      <img src={URL.createObjectURL(page.file)}/>
      <div className={styles.pageSettings}>
        <span className={`${styles.deleteImage} material-symbols-outlined`} onClick={() => { removeUploadedFile(index) }}>delete</span>
        <span className={`${styles.moveImage} material-symbols-outlined`} onClick={() => { moveUploadedFile(index, true) }}>keyboard_arrow_up</span>
        <span className={`${styles.moveImage} material-symbols-outlined`} onClick={() => { moveUploadedFile(index, false) }}>keyboard_arrow_down</span>
        <span className={`${styles.censorImage} material-symbols-outlined`} onClick={() => {  }}>blur_on</span>
      </div>
    </div>
  )
}