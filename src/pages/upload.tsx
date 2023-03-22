import styles from "@/styles/Upload.module.scss"
import { useAuthContext } from "@/components/AuthContext"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import useTranslation from "next-translate/useTranslation"
import * as config from "@/config"
import RegexInput from "@/components/RegexInput"
import PageComponent, { ExamPage } from "@/components/ExamPage"

export default function Upload() {
  const { t } = useTranslation("upload")

  const router = useRouter()
  const authContext = useAuthContext()
  const [uploadedPages, setUploadedPages] = useState<ExamPage[]>([])

  const openFilePicker = () => {
    document?.getElementById("file")?.click()
  }

  const fileUploaded = (e: any) => {
    let promises = []

    for (let file of e.target.files) {
      promises.push(ExamPage.fromSource(document, file));
    }

    Promise.all(promises).then((page) => {
      setUploadedPages(uploadedPages.concat(page))
    })

    e.target.files = new DataTransfer().files
  }

  const upload = () => {
    const topic = document.getElementById(styles.topic) as HTMLInputElement
    const subject = document.getElementById(styles.subject) as HTMLInputElement
    const teacher = document.getElementById(styles.teacher) as HTMLInputElement
    const class_ = document.getElementById(styles.class) as HTMLInputElement
    const issueYear = document.getElementById(styles.issueYear) as HTMLInputElement
    const legalAgreement = document.getElementById(styles.legalAgreement) as HTMLInputElement

    if (!legalAgreement.checked) return

    if (!(config.topicRegex.test(topic.value) && config.subjectRegex.test(subject.value) && config.teacherRegex.test(teacher.value) && config.classRegex.test(class_.value) && config.yearRegex.test(issueYear.value)
      && uploadedPages.length > 0 && uploadedPages.length <= config.maxImageCount && uploadedPages.every((page) => page.file.size <= config.maxImageSize) && issueYear.value <= new Date().getFullYear().toString()))
      return

    // TODO: Upload

    router.push("/upload-success")
  }

  useEffect(() => {
    if (authContext != undefined && authContext == null) router.push("/login")
  }, [authContext])

  return (
    <>
      <main>
        <div className={styles.uploadContainer}>
          <div className={styles.uploadImagesContainer}>
            { uploadedPages.map((page, index) => <PageComponent index={index} page={page} uploadedPages={uploadedPages} setUploadedPages={setUploadedPages} />)}

            <div className={styles.uploadNewPage}>
              <input id="file" name="image" type="file" accept="image/*" multiple={true} onChange={fileUploaded}/>

              <span className="material-symbols-outlined" onClick={openFilePicker}>upload</span>
              <label htmlFor="file">{t("uploadImage")}</label>
            </div>
          </div>
          <div className={styles.uploadDetailsContainer}>
            <h1>{t("upload")}</h1>

            <RegexInput id={styles.topic} label={t("topic")} regex={config.partialTopicRegex} example={t("topicExample")}/>
            <RegexInput id={styles.subject} label={t("subject")} regex={config.partialSubjectRegex} example={t("subjectExample")}/>
            <RegexInput id={styles.teacher} label={t("teacher")} regex={config.partialTeacherRegex} example={t("teacherExample")}/>
            <RegexInput id={styles.class} label={t("class")} regex={config.partialClassRegex} example={t("classExample")}/>
            <RegexInput id={styles.issueYear} label={t("yearIssued")} regex={config.partialYearRegex} example={new Date().getFullYear().toString()}/>

            <div id={styles.legalAgreementContainer}>
              <input id={styles.legalAgreement} type="checkbox"/>
              <label htmlFor={styles.legalAgreement}><a href="/legal/terms-of-service" target="_blank">{t("legalAgreement")}</a></label>
            </div>
          </div>
        </div>
        <button id={styles.uploadButton} onClick={upload}>
          {t("uploadNow")}

          <div id={styles.creditReward}>
            +1
            <img src="coin-inverted.svg"/>
          </div>
        </button>
      </main>
    </>
  )
}