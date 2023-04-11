import styles from "@/styles/Upload.module.scss"
import { useAuthContext } from "@/components/AuthContext"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/router"
import useTranslation from "next-translate/useTranslation"
import * as config from "@/config"
import RegexInput, { RegexInputSuggestion, setRegexInputValue } from "@/components/RegexInput"
import ExamPage, { exportPage } from "@/components/ExamPage"
import { supabase } from "@/lib/supabase"
import { makeSnackbar } from "@/components/Snackbar"
import Dialog, { DialogFunction } from "@/components/Dialog"

interface UploadedImage {
  source: MediaSource,
  filename: string
}

export default function Upload({ subjects, subjectSuggestions, teachers, teacherSuggestions }: {
  subjects: { subject_name: string, validated: boolean }[],
  subjectSuggestions: RegexInputSuggestion[],
  teachers: { abbreviation: string, first_name: string, last_name: string, validated: boolean }[],
  teacherSuggestions: RegexInputSuggestion[]
}) {
  const { t } = useTranslation("upload")

  const router = useRouter()
  const authContext = useAuthContext()

  const addNewTeacherDialog = useRef<DialogFunction>()

  const [uploadedPages, setUploadedPages] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)

  const fileUploaded = (e: any) => {
    let files = Array.prototype.map.call(e.target.files, (file: File) => (
      { source: file, filename: URL.createObjectURL(file) }
    )) as UploadedImage[]
    
    setUploadedPages(uploadedPages.concat(...files))
    e.target.files = new DataTransfer().files
  }

  const uploadFinished = (error: null | "server" | "data_invalid") => {
    switch (error) {
      case "server":
        makeSnackbar(t("uploadServerError"), "error")
        break
      case "data_invalid":
        makeSnackbar(t("uploadDataIncomplete"), "error")
        break
      default:
        router.push("/upload-success")
        break
    }

    setUploading(false)
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

    if (!(config.topicRegex.test(topic.value) && config.subjectRegex.test(subject.value) && config.teacherAbbreviationRegex.test(teacher.value) && config.classRegex.test(class_.value) && config.yearRegex.test(issueYear.value)
      && examPagesImages.length > 0 && examPagesImages.length <= config.maxImageCount && examPagesImages.every((page) => page.size <= config.maxImageSize)))
      return uploadFinished("data_invalid")

    setUploading(true)
    
    // Get Teacher ID
    var teacherId = null
    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select("id, first_name, last_name, validated")
      .eq("abbreviation", teacher.value)
      .single()

    if (teacherData && teacherData.validated) teacherId = teacherData.id
    else {
      // New teacher dialog
      let teacherAbbreviationInput = document.getElementById("newTeacherAbbreviation") as HTMLInputElement
      let teacherFirstNameInput = document.getElementById("newTeacherFirstName") as HTMLInputElement
      let teacherLastNameInput = document.getElementById("newTeacherLastName") as HTMLInputElement

      if (teacherAbbreviationInput)
        setRegexInputValue(teacherAbbreviationInput, teacher.value)

      if (teacherData) {
        setRegexInputValue(teacherFirstNameInput, teacherData.first_name)
        setRegexInputValue(teacherLastNameInput, teacherData.last_name)
      }

      let shouldAdd = await addNewTeacherDialog.current!()
      if (!shouldAdd) return uploadFinished("data_invalid")

      if (!config.nameRegex.test(teacherFirstNameInput.value) || !config.nameRegex.test(teacherLastNameInput.value))
        return uploadFinished("data_invalid")

      if (teacherData?.first_name != teacherFirstNameInput.value || teacherData?.last_name != teacherLastNameInput.value) {
        // Add teacher to database with validated = false
        const { data: newTeacherData, error: newTeacherError } = await supabase
          .from("teachers")
          .insert(
            {
              abbreviation: teacherAbbreviationInput.value,
              first_name: teacherFirstNameInput.value,
              last_name: teacherLastNameInput.value,
              validated: false
            }
          )
          .select()
          .single()
        
        if (newTeacherError || !newTeacherData) return uploadFinished("server")

        teacherId = newTeacherData.id
      } else {
        teacherId = teacherData.id
      }
    }

    // Get Subject ID
    var subjectId = null
    const { data: subjectData, error: subjectError } = await supabase
      .from("subjects")
      .select("id")
      .eq("subject_name", subject.value)
      .single()
    
    if (subjectData) subjectId = subjectData.id
    else {
      //TODO: New subject dialog
      subjectId = "todo"
    }

    // Upload Exam
    const { data: examData, error: examError } = await supabase
      .from("uploaded_exams")
      .insert(
        {
          topic: topic.value,
          teacher_id: teacherId,
          subject_id: subjectId,
          class: class_.value,
          issue_year: issueYear.value,
          student_id: authContext.uid
        }
      )
      .select()

    // Check if exam was uploaded
    if (examError || examData.length == 0) return uploadFinished("server")
    
    // Upload Images
    var uploadImagesPromises = []
    for (let i = 0; i < examPagesImages.length; i++) {
      uploadImagesPromises.push(supabase
        .storage
        .from("exam-images")
        .upload(`${authContext.uid}/${examData[0].id}/${i}.webp`, examPagesImages[i]))
    }
    const uploadImagesResults = await Promise.all(uploadImagesPromises)
    if (uploadImagesResults.some(result => result.error)) return uploadFinished("server")

    // Upload Finished
    uploadFinished(null)
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
    if (index == 0 && up || index == uploadedPages.length - 1 && !up) return

    const newUploadedFiles = [...uploadedPages]
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
            <div className={styles.uploadBar}>
              <span className={styles.uploadCount}>{uploadedPages.length}/{config.maxImageCount}</span>
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

            { uploadedPages.map((image, index) => 
              <ExamPage key={image.filename} source={image.source} move={up => moveUploadedFile(index, up)} remove={() => removeUploadedFile(index)} />
            )}
          </div>
          <div id={styles.uploadDetailsContainer}>
            <h1>{t("upload")}</h1>

            <RegexInput id={styles.topic} label={t("topic")} partialRegex={config.partialTopicRegex} regex={config.topicRegex} example={t("topicExample")}/>
            <RegexInput id={styles.subject} label={t("subject")} partialRegex={config.partialSubjectRegex} regex={config.subjectRegex} example={t("subjectExample")} dropdownSuggestions={subjectSuggestions}/>
            <RegexInput id={styles.teacher} label={t("teacher")} partialRegex={config.partialTeacherAbbreviationRegex} regex={config.teacherAbbreviationRegex} example={t("teacherExample")} dropdownSuggestions={teacherSuggestions}/>
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

        { uploading && <div className={styles.uploadingOverlay}>{t("uploading")}</div> }

        <Dialog reference={addNewTeacherDialog} title={t("registerTeacher")} negative={t("cancel")} positive={t("register")}>
          <RegexInput id={"newTeacherAbbreviation"} label={t("registerTeacherAbbreviation")} partialRegex={config.partialTeacherAbbreviationRegex} regex={config.teacherAbbreviationRegex} example={t("teacherExample")} disabled />
          <RegexInput id={"newTeacherFirstName"} label={t("registerTeacherFirstName")} partialRegex={config.partialNameRegex} regex={config.nameRegex} example={t("registerTeacherFirstNameExample")} />
          <RegexInput id={"newTeacherLastName"} label={t("registerTeacherLastName")} partialRegex={config.partialNameRegex} regex={config.nameRegex} example={t("registerTeacherLastNameExample")} />
        </Dialog>
      </main>
    </>
  )
}

export async function getStaticProps() {
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("subject_name, validated")
  const validatedSubjects = subjects?.filter((subject: any) => subject.validated)

  const { data: teachers, error: teachersError } = await supabase
    .from("teachers")
    .select("abbreviation, first_name, last_name, validated")
  const validatedTeachers = teachers?.filter((teacher: any) => teacher.validated)

  return {
    props: {
      subjects: subjects ?? [],
      subjectSuggestions: validatedSubjects?.map((subject: any) =>
        ({
          label: subject.subject_name, 
          value: subject.subject_name
        } as RegexInputSuggestion)
      ) ?? [],

      teachers: teachers ?? [],
      teacherSuggestions: validatedTeachers?.map((teacher: any) =>
        ({
          label: `${teacher.first_name} ${teacher.last_name} (${teacher.abbreviation})`, 
          value: teacher.abbreviation
        } as RegexInputSuggestion)
      ) ?? [],
    },
  }
}