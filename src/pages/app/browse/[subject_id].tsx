import styles from '@/styles/Browse.module.scss'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { GetServerSidePropsContext } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { PostgrestSingleResponse } from '@supabase/supabase-js'
import { browsePageExamCount } from '@/config'
import useTranslation from 'next-translate/useTranslation'

export default function Browse({ exams, currentPage, totalPages }: {
  exams: any[],
  currentPage: number,
  totalPages: number
}) {
  const { t } = useTranslation("browse")
  const router = useRouter()
  const supabaseClient = useSupabaseClient()

  const [examsPreviewImages, setExamsPreviewImages] = useState<{[key: string]: string}>({})
  
  useEffect(() => { (async () => {
    let tempExamsPreviewImages: {[key: string]: string} = {}

    await Promise.all(exams.map(async (exam) => {
      const { data: examImage, error } = await supabaseClient.storage
        .from("exam-images")
        .download(exam.previewImagePath)

      if (error) return

      tempExamsPreviewImages[exam.id] = URL.createObjectURL(examImage)
    }))

    setExamsPreviewImages(tempExamsPreviewImages)
  })() }, [])

  return <>
    <main id={styles.main}>
      <h1>{t("browse")}</h1>
      <h2 className={styles.page}>{t("page").replace("{current}", currentPage.toString()).replace("{total}", totalPages.toString())}</h2>

      <div className={styles.examsContainer}>
        { exams.map((exam) => (
          <div key={exam.id} className={styles.exam} onClick={() => { router.push(`/app/exam/${exam.id}`)}}>
            <div className={styles.examPreview}>
              <img src={examsPreviewImages[exam.id] || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="} alt={exam.topic} />
              <div className={styles.examPreviewOverlay} />
            </div>

            <h2>{exam.topic}</h2>
            <p>{`${exam.teacher_id.abbreviation} (${exam.teacher_id.first_name} ${exam.teacher_id.last_name})`}</p>
          </div>
        )) }
      </div>
    </main>
  </>
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const supabase = createServerSupabaseClient(ctx)
  const { data: { user} } = await supabase.auth.getUser()

  const subjectId = ctx.params?.subject_id as string
  var page = +(ctx.query.page ?? "1")

  const { count: examsCount, error: examsCountError } = await supabase
    .from("uploaded_exams")
    .select('*', { count: 'exact', head: true })
    .eq("validated", true)
    .eq("subject_id", subjectId)

  const totalPages = Math.ceil((examsCount ?? 0) / browsePageExamCount)
  if (page > totalPages) page = totalPages
  if (page < 1) page = 1
  
  const { data: exams, error: examsError }: PostgrestSingleResponse<any> = await supabase
    .from("uploaded_exams")
    .select("id, upload_date, topic, class, issue_year, teacher_id (abbreviation, first_name, last_name)")
    .eq("subject_id", subjectId)
    .eq("validated", true)
    .order("issue_year", { ascending: false })
    .range((page - 1) * browsePageExamCount, page * browsePageExamCount - 1)

  for (let exam of exams) {
    exam.previewImagePath = `${user?.id}/${exam.id}/0.webp`
  }

  return {
    props: {
      exams: exams,
      currentPage: page,
      totalPages: totalPages
    }
  }
}