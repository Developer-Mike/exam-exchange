import styles from '@/styles/Dashboard.module.scss'
import { useRouter } from 'next/router'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import useTranslation from 'next-translate/useTranslation'
import { getFirstName } from '@/utils/user-helper'
import { useEffect, useState } from 'react'
import { unlockSubjectDuration } from '@/config'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { GetServerSidePropsContext } from 'next'

export default function Logout({ username, upcomingExams, uploadedExams }: {
  username: string,
  upcomingExams: any[],
  uploadedExams: any[],
}) {
  const { t } = useTranslation('dashboard')

  const router = useRouter()
  const supabaseClient = useSupabaseClient()

  const [uploadedExamImages, setUploadedExamImages] = useState<{[key: string]: string}|null>(null)

  useEffect(() => { (async () => {
    let uploadedExamImages: {[key: string]: string} = {}

    await Promise.all(uploadedExams.map(async (exam) => {
      const { data: examImage, error } = await supabaseClient.storage
        .from("exam-images")
        .download(exam.imagePath)

      if (error) return

      uploadedExamImages[exam.id] = URL.createObjectURL(examImage)
    }))

    setUploadedExamImages(uploadedExamImages)
  })() }, [])

  return <>
    <main id={styles.main}>
      <h1>{`${t("hello")} ${username}`}</h1>

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
              <img src={uploadedExamImages && uploadedExamImages[exam.id] || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="} alt={exam.topic} />
              <div className={styles.examPreviewOverlay} />
            </div>

            <h2>{exam.topic}</h2>
            <p>{exam.validated ? t("validated") : t("not_validated")}</p>
          </div>
        )) }
      </div>
    </main>
  </>
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const supabase = createServerSupabaseClient(ctx)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { props: {} }

  const username = getFirstName(getFirstName(user.email!))

  var upcomingExams: any[] = []
  let upcomingExamsRequest = (async () => {
    const { data, error } = await supabase
      .from("upcoming_exams")
      .select("*")
      .eq("student_id", user?.id)

    if (error) return
    upcomingExams = data

    for (let exam of upcomingExams) {
      const { data: subject, error: subjectError } = await supabase
        .from("subjects")
        .select("subject_name")
        .eq("id", exam.subject_id)
        .single()

      if (!subjectError) exam.subject_name = subject.subject_name

      let expireTimestamp = new Date(exam.register_date).getTime() + unlockSubjectDuration
      exam.expires_in = Math.ceil((expireTimestamp - Date.now()) / (1000 * 60 * 60 * 24))
    }
  })() 

  var uploadedExams: any[] = []
  let uploadedExamsRequest = (async () => {
    const { data, error } = await supabase
      .from("uploaded_exams")
      .select("id, validated, topic")
      .eq("student_id", user?.id)

    if (error) return
    uploadedExams = data

    for (let exam of uploadedExams) {
      exam.imagePath = `${user?.id}/${exam.id}/0.webp`
    }
  })()

  await Promise.all([upcomingExamsRequest, uploadedExamsRequest])

  return {
    props: {
      username: username,
      upcomingExams: upcomingExams,
      uploadedExams: uploadedExams
    }
  }
}