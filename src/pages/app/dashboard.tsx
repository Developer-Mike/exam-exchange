import styles from '@/styles/Dashboard.module.scss'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import useTranslation from 'next-translate/useTranslation'
import { getFirstName } from '@/utils/user-helper'
import { useEffect, useState } from 'react'
import { PostgrestSingleResponse } from '@supabase/supabase-js'

export default function Logout() {
  const { t } = useTranslation('dashboard')

  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const user = useUser()

  const [upcomingExams, setUpcomingExams] = useState<any[]|null>(null)

  useEffect(() => { (async () => {
    if (!user) return

    const { data: exams, error }: PostgrestSingleResponse<any> = await supabaseClient
      .from("uploaded_exams")
      .select("id, validated, topic")
      .eq("student_id", user?.id)

    if (error) return

    for (let exam of exams) {
      const { data: examImage, error: examImageError } = await supabaseClient.storage
        .from("exam-images")
        .download(`${user?.id}/${exam.id}/0.webp`)

      if (examImageError) return
      exam.image = URL.createObjectURL(examImage)
    }

    setUpcomingExams(exams)
  })() }, [user])

  return <>
    <main id={styles.main}>
      <h1>{`${t("hello")} ${user ? getFirstName(user.email!) : "..."}`}</h1>

      <h2 className={styles.sectionTitle}>{t("uploaded_exams")}</h2>
      <div className={styles.uploadedExamsContainer}>
        <div className={styles.uploadExam} onClick={() => { router.push("/app/upload") }}>
          <span className="material-symbols-outlined">add</span>
          <h2>{t("upload_exam")}</h2>
        </div>

        { upcomingExams?.map((exam) => (
          <div key={exam.id} className={styles.upcomingExam} onClick={() => { router.push(`/app/exam/${exam.id}`)}}>
            <div className={styles.examPreview}>
              <img src={exam.image} alt={exam.topic} />
              <div className={styles.examPreviewOverlay} />
            </div>

            <h2>{exam.topic}</h2>
            <p>{exam.validated ? t("validated") : t("not_validated")}</p>
          </div>
        )) }
      </div>

      <h2 className={styles.sectionTitle}>{t("upcoming_exams")}</h2>
      <div className={styles.upcomingExamsContainer}>
      </div>
    </main>
  </>
}