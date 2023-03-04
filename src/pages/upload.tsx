import Head from "next/head"
import styles from "@/styles/Upload.module.scss"
import { useAuthContext } from "@/components/AuthContext"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import useTranslation from "next-translate/useTranslation"

export default function Upload() {
  const { t } = useTranslation("upload")

  const router = useRouter()
  const authContext = useAuthContext()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const openFilePicker = () => {
    document?.getElementById("file")?.click()
  }

  const fileUploaded = (e: any) => {
    const file = e.target.files[0]
    e.target.files = new DataTransfer().files

    const image = new Image()
    image.src = URL.createObjectURL(file)
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas?.getContext("2d")?.drawImage(image, 0, 0)

      canvas.toBlob((blob) => {
        if (!blob) return
        setUploadedFiles(uploadedFiles.concat(new File([blob], `page${uploadedFiles.length}.webp`, { type: blob.type })))
      }, "image/webp")
    }
  }

  const removeUploadedFile = (index: number) => {
    let newUploadedFiles = [...uploadedFiles]
    newUploadedFiles.splice(index, 1)

    setUploadedFiles(newUploadedFiles)
  }

  useEffect(() => {
    if (authContext != undefined && authContext == null) router.push("/login")
  }, [authContext])

  return (
    <>
      <main>
        <div className={styles.uploadContainer}>
          <div className={styles.uploadImagesContainer}>
            { uploadedFiles.map((image, index) => (
              <div key={index} className={styles.uploadedPage}>
                <span className={`${styles.deleteImage} material-symbols-outlined`} onClick={() => { removeUploadedFile(index) }}>delete</span>
                <img src={URL.createObjectURL(image)}/>
              </div>
            ))}

            <div className={styles.uploadNewPage}>
              <input id="file" name="image" type="file" accept="image/*" onChange={fileUploaded}/>

              <span className="material-symbols-outlined" onClick={openFilePicker}>upload</span>
              <label htmlFor="file">{t("uploadImage")}</label>
            </div>
          </div>
          <div className={styles.uploadDetailsContainer}>
            <h1>{t("upload")}</h1>
          </div>
        </div>
      </main>
    </>
  )
}
