import styles from "@/styles/Exam.module.scss"
import { useEffect, useState } from "react"
import useTranslation from "next-translate/useTranslation"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { GetServerSidePropsContext } from "next/types"
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs"

export default function Exam({ topic, subject, teacher, class: class_, issueYear, imagePaths }: {
  topic: string,
  subject: string,
  teacher: string,
  class: string,
  issueYear: string,
  imagePaths: string[],
}) {
  const { t } = useTranslation("exam")

  const supabaseClient = useSupabaseClient()

  const [examImages, setExamImages] = useState<string[]>([])

  useEffect(() => { (async () => {
    let examImages: string[] = []

    await Promise.all(imagePaths.map(async (imagePath) => {
      const { data: image, error } = await supabaseClient.storage
        .from("exam-images")
        .download(imagePath)

      if (error) return

      examImages.push(URL.createObjectURL(image))
    }))

    setExamImages(examImages)
  })() }, [])

  return (
    <>
      <main id={styles.main}>
        <div id={styles.examImagesContainer}>
          { examImages.map((image, index) => 
            <img key={index} src={image}/>
          )}
        </div>
        <div id={styles.examDetailsContainer}>
          <h1>{t("exam")}</h1>
          
          <span>{t("topic")}</span>
          <h2>{topic}</h2>

          <span>{t("subject")}</span>
          <h3>{subject}</h3>

          <span>{t("teacher")}</span>
          <h3>{teacher}</h3>

          <span>{t("class")}</span>
          <h3>{class_}</h3>

          <span>{t("issue_year")}</span>
          <h3>{issueYear}</h3>
        </div>
      </main>
    </>
  )
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const supabase = createServerSupabaseClient(ctx)
  const examId = ctx.params?.exam_id as string

  const { data: exam, error: examError } = await supabase
    .from("uploaded_exams")
    .select("student_id, topic, subject_id, teacher_id, class, issue_year, validated")
    .eq("id", examId)
    .single()

  if (examError || !exam.validated) return { notFound: true }

  var subjectName = ""
  var teacherName = ""
  var imagePaths: string[] = []

  const subjectRequest = (async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("subject_name")
      .eq("id", exam.subject_id)
      .single()

    if (!error) subjectName = data.subject_name
  })()

  const teacherRequest = (async () => {
    const { data, error } = await supabase
      .from("teachers")
      .select("abbreviation, first_name, last_name")
      .eq("id", exam.teacher_id)
      .single()

    if (!error) teacherName = `${data.first_name} ${data.last_name} (${data.abbreviation})`
  })()

  const imagePathsRequest = (async () => {
    let parentPath = `${exam.student_id}/${examId}`

    const { data, error } = await supabase.storage
      .from("exam-images")
      .list(parentPath)

    if (!error) imagePaths = data.map((image) => `${parentPath}/${image.name}`)
  })()

  await Promise.all([subjectRequest, teacherRequest, imagePathsRequest])

  return {
    props: {
      topic: exam.topic,
      subject: subjectName,
      teacher: teacherName,
      class: exam.class,
      issueYear: exam.issue_year,
      imagePaths: imagePaths
    }
  }
}