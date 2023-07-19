import styles from '@/styles/Dashboard.module.scss'
import { useRouter } from 'next/router'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import useTranslation from 'next-translate/useTranslation'
import { getFirstName } from '@/utils/user-helper'
import { useEffect, useState } from 'react'
import { PostgrestSingleResponse } from '@supabase/supabase-js'
import { unlockSubjectDuration } from '@/config'

export default function Logout() {
  const { t } = useTranslation('dashboard')

  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const user = useUser()

  const [uploadedExams, setUploadedExams] = useState<any[]|null>(null)
  const [upcomingExams, setUpcomingExams] = useState<any[]|null>(null)

  const getUploadedExams = async () => {
    const { data: exams, error }: PostgrestSingleResponse<any> = await supabaseClient
      .from("uploaded_exams")
      .select("id, validated, topic")
      .eq("student_id", user?.id)

    if (error) return null

    for (let exam of exams) {
      const { data: examImage, error: examImageError } = await supabaseClient.storage
        .from("exam-images")
        .download(`${user?.id}/${exam.id}/0.webp`)

      if (!examImageError) exam.image = URL.createObjectURL(examImage)
    }

    return exams
  }

  const getUpcomingExams = async () => {
    const { data: exams, error }: PostgrestSingleResponse<any> = await supabaseClient
      .from("upcoming_exams")
      .select("*")
      .eq("student_id", user?.id)

    if (error) return null
    console.log(exams)

    for (let exam of exams) {
      const { data: subject, error: subjectError } = await supabaseClient
        .from("subjects")
        .select("subject_name")
        .eq("id", exam.subject_id)
        .single()

      if (!subjectError) exam.subject_name = subject.subject_name

      let expireTimestamp = new Date(exam.register_date).getTime() + unlockSubjectDuration
      exam.expires_in = Math.ceil((expireTimestamp - Date.now()) / (1000 * 60 * 60 * 24))
    }

    return exams
  }


  useEffect(() => {
    if (!user) return

    getUploadedExams().then(setUploadedExams)
    getUpcomingExams().then(setUpcomingExams)
  }, [user])

  return <>
    <main id={styles.main}>
      <h1>{`${t("hello")} ${user ? getFirstName(user.email!) : "..."}`}</h1>

      <h2 className={styles.sectionTitle}>{t("uploaded_exams")}</h2>
      <div className={styles.uploadedExamsContainer}>
        <div className={styles.uploadExam} onClick={() => { router.push("/app/upload") }}>
          <span className="material-symbols-outlined">add</span>
          <h2>{t("upload_exam")}</h2>
        </div>

        { !uploadedExams && <h2 className={styles.loading}>{t("loading")}</h2> }
        { uploadedExams?.map((exam) => (
          <div key={exam.id} className={styles.uploadedExam} onClick={() => { router.push(`/app/exam/${exam.id}`)}}>
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
        <div className={styles.addUpcomingExam} onClick={() => { router.push("/app/upcoming-exam") }}>
          <span className="material-symbols-outlined">add</span>
          <h2>{t("add_upcoming_exam")}</h2>
        </div>

        { upcomingExams?.map((exam) => (
          <div key={exam.id} className={styles.upcomingExam}>
            <h2>{exam.subject_name}</h2>
            <p>{t("access_expiring_in").replace("{days}", exam.expires_in)}</p>
            <button onClick={() => { router.push(`/app/browse/${exam.subject_id}?topic=${exam.topic}&class=${exam.class}&teacher=${exam.teacher_id}`) }}>{t("browse_exams")}</button>
          </div>
        )) }
      </div>
    </main>
  </>
}