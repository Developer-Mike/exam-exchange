import styles from "@/styles/Exam.module.scss"
import { useEffect, useState } from "react"
import useTranslation from "next-translate/useTranslation"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { GetServerSidePropsContext } from "next/types"
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs"
import { PostgrestSingleResponse } from "@supabase/supabase-js"

export default function Exam({ exam }: {
  exam: any
}) {
  const { t } = useTranslation("exam")

  const supabaseClient = useSupabaseClient()

  const [examImages, setExamImages] = useState<string[]>([])

  useEffect(() => { (async () => {
    let examImages = await Promise.all(exam.imagePaths.map(async (imagePath: string) => {
      const { data: image, error } = await supabaseClient.storage
        .from("exam-images")
        .download(imagePath)

      if (error) return ""
      return URL.createObjectURL(image)
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
          <h2>{exam.topic}</h2>

          <span>{t("subject")}</span>
          <h3>{exam.subject_id.subject_name}</h3>

          <span>{t("teacher")}</span>
          <h3>{`${exam.teacher_id.abbreviation} (${exam.teacher_id.first_name} ${exam.teacher_id.last_name})`}</h3>

          <span>{t("class")}</span>
          <h3>{exam.class}</h3>

          <span>{t("issue_year")}</span>
          <h3>{exam.issue_year}</h3>
        </div>
      </main>
    </>
  )
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const supabase = createServerSupabaseClient(ctx)
  const examId = ctx.params?.exam_id as string

  const { data: exam, error: examError }: PostgrestSingleResponse<any> = await supabase
    .from("uploaded_exams")
    .select("student_id, topic, subject_id (subject_name), teacher_id (abbreviation, first_name, last_name), class, issue_year, validated")
    .eq("id", examId)
    .single()

  if (examError || !exam.validated) return { notFound: true }

  let parentPath = `${exam.student_id}/${examId}`
  const { data: examImagesList, error: examImagesListError } = await supabase.storage
    .from("exam-images")
    .list(parentPath)

  if (!examImagesListError) exam.imagePaths = examImagesList.map((image) => `${parentPath}/${image.name}`)

  return {
    props: {
      exam: exam
    }
  }
}