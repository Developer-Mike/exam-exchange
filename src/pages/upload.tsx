import styles from "@/styles/Upload.module.scss"
import { useAuthContext } from "@/components/AuthContext"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import useTranslation from "next-translate/useTranslation"
import * as config from "@/config"
import RegexInput, { RegexInputSuggestion } from "@/components/RegexInput"
import ExamPage, { exportPage } from "@/components/ExamPage"
import { supabase } from "@/lib/supabase"

export default function Upload({ subjectSuggestions, teacherSuggestions }: {
  subjectSuggestions: RegexInputSuggestion[],
  teacherSuggestions: RegexInputSuggestion[]
}) {
  const { t } = useTranslation("upload")

  const router = useRouter()
  const authContext = useAuthContext()
  const [uploadedPages, setUploadedPages] = useState<MediaSource[]>([])

  const fileUploaded = (e: any) => {
    setUploadedPages(uploadedPages.concat(...e.target.files))
    e.target.files = new DataTransfer().files
  }

  const upload = async () => {
    const topic = document.getElementById(styles.topic) as HTMLInputElement
    const subject = document.getElementById(styles.subject) as HTMLInputElement
    const teacher = document.getElementById(styles.teacher) as HTMLInputElement
    const class_ = document.getElementById(styles.class) as HTMLInputElement
    const issueYear = document.getElementById(styles.issueYear) as HTMLInputElement

    const examPagesCanvases = document.getElementById(styles.uploadImagesContainer)?.getElementsByTagName("canvas") as HTMLCollectionOf<HTMLCanvasElement>
    const examPagesImagesPromises = Array.prototype.map.call(examPagesCanvases, canvas => exportPage(canvas)) as Promise<File>[]
    const examPagesImages = await Promise.all(examPagesImagesPromises)

    if (!(config.topicRegex.test(topic.value) && config.subjectRegex.test(subject.value) && config.teacherRegex.test(teacher.value) && config.classRegex.test(class_.value) && config.yearRegex.test(issueYear.value)
      && examPagesImages.length > 0 && examPagesImages.length <= config.maxImageCount && examPagesImages.every((page) => page.size <= config.maxImageSize)))
      return

    // TODO: Show loading screen

    // Get Teacher ID
    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select("id")
      .eq("abbreviation", teacher.value)

    // Get Subject ID
    const { data: subjectData, error: subjectError } = await supabase
      .from("subjects")
      .select("id")
      .eq("subject_name", subject.value)

    // Check if teacher and subject exist
    if (teacherError || subjectError || teacherData?.length == 0 || subjectData?.length == 0) return

    // Upload Exam
    const { data: examData, error: examError } = await supabase
      .from("uploaded_exams")
      .insert(
        {
          topic: topic.value,
          teacher_id: teacherData[0].id,
          subject_id: subjectData[0].id,
          class: class_.value,
          issue_year: issueYear.value,
          student_id: authContext.uid
        }
      )
      .select()

    // Check if exam was uploaded
    if (examError || examData.length == 0) return
    
    // Upload Images
    var uploadImagesPromises = []
    for (let i = 0; i < examPagesImages.length; i++) {
      uploadImagesPromises.push(supabase
        .storage
        .from("exam-images")
        .upload(`${authContext.uid}/${examData[0].id}/${i}.webp`, examPagesImages[i]))
    }
    const uploadImagesResults = await Promise.all(uploadImagesPromises)
    if (uploadImagesResults.some(result => result.error)) return

    router.push("/upload-success")
  }

  useEffect(() => {
    if (authContext != undefined && authContext == null) {
      router.push("/login")
      return
    }

    if (window && process.env.NODE_ENV !== "development") window.onbeforeunload = e => ""
  }, [authContext])

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
    <>
      <main>
        <div className={styles.uploadContainer}>
          <div id={styles.uploadImagesContainer}>
            <div className={styles.uploadNewPage}>
              <div className={styles.uploadPageVariant}>
                <input id="upload-image" name="upload-image" type="file" accept="image/*" multiple={true} onChange={fileUploaded}/>
                <span className="material-symbols-outlined" onClick={e => document.getElementById("upload-image")?.click()}>upload</span>
                <label htmlFor="upload-image">{t("uploadImage")}</label>
              </div>
              <div className={styles.uploadPageVariant}>
                <input id="take-photo" name="take-photo" type="file" accept="image/*" capture="environment" onChange={fileUploaded}/>
                <span className="material-symbols-outlined" onClick={e => document.getElementById("take-photo")?.click()}>photo_camera</span>
                <label htmlFor="take-photo">{t("takePhoto")}</label>
              </div>
            </div>

            { uploadedPages.map((source, index) => <ExamPage key={index} index={index} source={source} move={up => moveUploadedFile(index, up)} remove={() => removeUploadedFile(index)} />)}
          </div>
          <div id={styles.uploadDetailsContainer}>
            <h1>{t("upload")}</h1>

            <RegexInput id={styles.topic} label={t("topic")} partialRegex={config.partialTopicRegex} regex={config.topicRegex} example={t("topicExample")}/>
            <RegexInput id={styles.subject} label={t("subject")} partialRegex={config.partialSubjectRegex} regex={config.subjectRegex} example={t("subjectExample")} forceSuggestion={true} dropdownSuggestions={subjectSuggestions}/>
            <RegexInput id={styles.teacher} label={t("teacher")} partialRegex={config.partialTeacherRegex} regex={config.teacherRegex} example={t("teacherExample")} forceSuggestion={true} dropdownSuggestions={teacherSuggestions}/>
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

export async function getStaticProps() {
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("subject_name")

  const { data: teachers, error: teachersError } = await supabase
    .from("teachers")
    .select("abbreviation, first_name, last_name")

  return {
    props: {
      subjectSuggestions: subjects?.map((subject: any) =>
        ({
          label: subject.subject_name, 
          value: subject.subject_name
        } as RegexInputSuggestion)
      ) ?? [],

      teacherSuggestions: teachers?.map((teacher: any) =>
        ({
          label: `${teacher.first_name} ${teacher.last_name} (${teacher.abbreviation})`, 
          value: teacher.abbreviation
        } as RegexInputSuggestion)
      ) ?? [],
    },
  }
}