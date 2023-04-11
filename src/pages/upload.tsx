import styles from "@/styles/Upload.module.scss"
import { useAuthContext } from "@/components/AuthContext"
import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/router"
import useTranslation from "next-translate/useTranslation"
import * as config from "@/config"
import RegexInput, { RegexInputRef, SimpleInputSuggestion, SimpleInputSuggestions } from "@/components/RegexInput"
import ExamPage, { exportPage } from "@/components/ExamPage"
import { supabase } from "@/lib/supabase"
import { makeSnackbar } from "@/components/Snackbar"
import Dialog, { DialogRef } from "@/components/Dialog"

interface UploadedImage {
  source: MediaSource,
  filename: string
}

export default function Upload({ subjects, teachers }: {
  subjects: { subject_name: string, validated: boolean }[]
  teachers: { abbreviation: string, first_name: string, last_name: string, validated: boolean }[]
}) {
  const { t } = useTranslation("upload")

  const router = useRouter()
  const authContext = useAuthContext()

  // Suggestions for inputs
  const subjectSuggestions = useMemo(() => subjects.filter(subject => subject.validated).map(subject => (
    SimpleInputSuggestion(subject.subject_name)
  )), [subjects])
  const teacherSuggestions = useMemo(() => teachers.filter(teacher => teacher.validated).map(teacher => ({
    value: teacher.abbreviation,
    label: `${teacher.first_name} ${teacher.last_name} (${teacher.abbreviation})`
  })), [teachers])

  // Add new teacher dialog
  const addNewTeacherDialog = useRef<DialogRef>()
  const newTeacherAbbreviationInput = useRef<RegexInputRef>()
  const newTeacherFirstNameInput = useRef<RegexInputRef>()
  const newTeacherLastNameInput = useRef<RegexInputRef>()

  // States
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
    const topicInput = document.getElementById(styles.topic) as HTMLInputElement
    const subjectInput = document.getElementById(styles.subject) as HTMLInputElement
    const teacherInput = document.getElementById(styles.teacher) as HTMLInputElement
    const classInput = document.getElementById(styles.class) as HTMLInputElement
    const issueYearInput = document.getElementById(styles.issueYear) as HTMLInputElement

    const examPagesCanvases = document.getElementById(styles.uploadImagesContainer)?.getElementsByTagName("canvas") as HTMLCollectionOf<HTMLCanvasElement>
    const examPagesImagesPromises = Array.prototype.map.call(examPagesCanvases, canvas => exportPage(canvas)) as Promise<File>[]
    const examPagesImages = await Promise.all(examPagesImagesPromises)

    if (!(config.topicRegex.test(topicInput.value) && config.subjectRegex.test(subjectInput.value) && config.teacherAbbreviationRegex.test(teacherInput.value) && config.classRegex.test(classInput.value) && config.yearRegex.test(issueYearInput.value)
      && examPagesImages.length > 0 && examPagesImages.length <= config.maxImageCount && examPagesImages.every((page) => page.size <= config.maxImageSize)))
      return uploadFinished("data_invalid")

    setUploading(true)
    
    // Get Teacher ID
    var teacherId: string | null = null
    const { data: teacherData, error: teacherError } = await supabase
      .from("teachers")
      .select("id, first_name, last_name, validated")
      .eq("abbreviation", teacherInput.value)
    var teacher = teacherData?.find(teacher => teacher.validated)

    if (teacher) teacherId = teacher.id
    else {
      // New teacher dialog
      newTeacherAbbreviationInput.current?.setValue(teacherInput.value)

      if (teacherData && teacherData.length > 0) {
        const teacherFirstNames = teacherData.map(teacher => teacher.first_name)
        newTeacherFirstNameInput.current?.setValue(teacherData[0].first_name)
        newTeacherFirstNameInput.current?.setSuggestions(SimpleInputSuggestions(teacherFirstNames
          .filter((value, index) => teacherFirstNames.indexOf(value) == index)
        ))

        const teacherLastNames = teacherData.map(teacher => teacher.last_name)
        newTeacherLastNameInput.current?.setValue(teacherData[0].last_name)
        newTeacherLastNameInput.current?.setSuggestions(SimpleInputSuggestions(teacherLastNames
          .filter((value, index) => teacherLastNames.indexOf(value) == index)
        ))
      }

      let shouldAdd = await addNewTeacherDialog.current!.show()
      if (!shouldAdd) return uploadFinished("data_invalid")

      if (!config.nameRegex.test(newTeacherFirstNameInput.current!.getValue()) || !config.nameRegex.test(newTeacherLastNameInput.current!.getValue()))
        return uploadFinished("data_invalid")

      var existingTeacher = teacherData?.find(teacher => teacher.first_name == newTeacherFirstNameInput.current!.getValue() && teacher.last_name == newTeacherLastNameInput.current!.getValue())
      if (!existingTeacher) {
        // Add teacher to database with validated = false
        const { data: newTeacherData, error: newTeacherError } = await supabase
          .from("teachers")
          .insert(
            {
              abbreviation: newTeacherAbbreviationInput.current!.getValue(),
              first_name: newTeacherFirstNameInput.current!.getValue(),
              last_name: newTeacherLastNameInput.current!.getValue(),
              validated: false
            }
          )
          .select().limit(1).single()
        
        if (newTeacherError || !newTeacherData) return uploadFinished("server")
        teacherId = newTeacherData.id
      } else teacherId = existingTeacher.id
    }

    // Get Subject ID
    var subjectId: string | null = null
    const { data: subjectData, error: subjectError } = await supabase
      .from("subjects")
      .select("id, validated")
      .eq("subject_name", subjectInput.value)
    var subject = subjectData?.find(subject => subject.validated)
    
    if (subject) subjectId = subject.id
    else if (subjectData && subjectData.length > 0) subjectId = subjectData[0].id
    else {
      // Add the subject to database with validated = false
      const { data: newSubjectData, error: newSubjectError } = await supabase
        .from("subjects")
        .insert(
          {
            subject_name: subjectInput.value,
            validated: false
          }
        )
        .select().limit(1).single()
      
      if (newSubjectError || !newSubjectData) return uploadFinished("server")
      subjectId = newSubjectData.id
    }

    // Upload Exam
    const { data: examData, error: examError } = await supabase
      .from("uploaded_exams")
      .insert(
        {
          topic: topicInput.value,
          teacher_id: teacherId,
          subject_id: subjectId,
          class: classInput.value,
          issue_year: issueYearInput.value,
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
          <RegexInput reference={newTeacherAbbreviationInput} id={"newTeacherAbbreviation"} label={t("registerTeacherAbbreviation")} partialRegex={config.partialTeacherAbbreviationRegex} regex={config.teacherAbbreviationRegex} example={t("teacherExample")} disabled />
          <RegexInput reference={newTeacherFirstNameInput} id={"newTeacherFirstName"} label={t("registerTeacherFirstName")} partialRegex={config.partialNameRegex} regex={config.nameRegex} example={t("registerTeacherFirstNameExample")}/>
          <RegexInput reference={newTeacherLastNameInput} id={"newTeacherLastName"} label={t("registerTeacherLastName")} partialRegex={config.partialNameRegex} regex={config.nameRegex} example={t("registerTeacherLastNameExample")} />
        </Dialog>
      </main>
    </>
  )
}

export async function getStaticProps() {
  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("subject_name, validated")

  const { data: teachers, error: teachersError } = await supabase
    .from("teachers")
    .select("abbreviation, first_name, last_name, validated")

  return {
    props: {
      subjects: subjects,
      teachers: teachers,
    },
  }
}