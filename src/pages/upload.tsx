import styles from "@/styles/Upload.module.scss"
import { useAuthContext } from "@/components/AuthContext"
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import useTranslation from "next-translate/useTranslation"
import * as config from "@/config"
import RegexInput from "@/components/RegexInput"
import PageComponent, { ExamPage } from "@/components/ExamPage"
import { supabase } from "@/lib/supabase"

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

  const upload = async () => {
    const topic = document.getElementById(styles.topic) as HTMLInputElement
    const subject = document.getElementById(styles.subject) as HTMLInputElement
    const teacher = document.getElementById(styles.teacher) as HTMLInputElement
    const class_ = document.getElementById(styles.class) as HTMLInputElement
    const issueYear = document.getElementById(styles.issueYear) as HTMLInputElement

    if (!(config.topicRegex.test(topic.value) && config.subjectRegex.test(subject.value) && config.teacherRegex.test(teacher.value) && config.classRegex.test(class_.value) && config.yearRegex.test(issueYear.value)
      && uploadedPages.length > 0 && uploadedPages.length <= config.maxImageCount && uploadedPages.every((page) => page.file.size <= config.maxImageSize) && issueYear.value <= new Date().getFullYear().toString()))
      return

    // Show loading screen
    // Get Teacher ID
    // Get Subject ID
    // Upload Exam
    // Upload Images
    
    /* const { data, error } = await supabase
      .from('uploaded_exams')
      .insert([
        { some_column: 'someValue', other_column: 'otherValue' },
    ])
    console.log(data, error)

    for (let page of uploadedPages) {
      const { data, error } = await supabase
        .storage
        .from('exam-images')
        .upload(`${authContext.uid}/${data}`, await page.export(), {
          cacheControl: '3600',
          upsert: false
      })
    }*/

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
            <div className={styles.uploadNewPage}>
              <input id="file" name="image" type="file" accept="image/*" multiple={true} onChange={fileUploaded}/>

              <span className="material-symbols-outlined" onClick={openFilePicker}>upload</span>
              <label htmlFor="file">{t("uploadImage")}</label>
            </div>

            { uploadedPages.map((page, index) => <PageComponent index={index} page={page} uploadedPages={uploadedPages} setUploadedPages={setUploadedPages} />)}
          </div>
          <div className={styles.uploadDetailsContainer}>
            <h1>{t("upload")}</h1>

            <RegexInput id={styles.topic} label={t("topic")} partialRegex={config.partialTopicRegex} regex={config.topicRegex} example={t("topicExample")}/>
            <RegexInput id={styles.subject} label={t("subject")} partialRegex={config.partialSubjectRegex} regex={config.subjectRegex} example={t("subjectExample")} forceSuggestion={true} dropdownSuggestions={["Biology", "Mathematics", "English", "Building"]} />
            <RegexInput id={styles.teacher} label={t("teacher")} partialRegex={config.partialTeacherRegex} regex={config.teacherRegex} example={t("teacherExample")}/>
            <RegexInput id={styles.class} label={t("class")} partialRegex={config.partialClassRegex} regex={config.classRegex} example={t("classExample")}/>
            <RegexInput id={styles.issueYear} label={t("yearIssued")} partialRegex={config.partialYearRegex} regex={config.yearRegex} example={new Date().getFullYear().toString()}/>
          </div>
        </div>
        <div className={styles.stickyBottom}>
          <a id={styles.legalAgreement} href="/legal/terms-of-service" target="_blank">{t("legalAgreement")}</a>

          <button id={styles.uploadButton} onClick={upload}>
            {t("uploadNow")}

            <div id={styles.creditReward}>
              +1
              <img src="coin-inverted.svg"/>
            </div>
          </button>
        </div>
      </main>
    </>
  )
}