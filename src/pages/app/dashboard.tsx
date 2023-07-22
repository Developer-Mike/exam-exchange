import styles from '@/styles/Dashboard.module.scss'
import { useRouter } from 'next/router'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import useTranslation from 'next-translate/useTranslation'
import { getFirstName } from '@/utils/user-helper'
import { useEffect, useState } from 'react'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { GetServerSidePropsContext } from 'next'

export default function Logout({ username, unlockedSubjects, uploadedExams }: {
  username: string,
  unlockedSubjects: any[],
  uploadedExams: any[],
}) {
  const { t } = useTranslation('dashboard')

  const router = useRouter()
  const supabaseClient = useSupabaseClient()

  const [uploadedExamImages, setUploadedExamImages] = useState<{[key: string]: string}>({})

  useEffect(() => { (async () => {
    let uploadedExamImages: {[key: string]: string} = {}

    await Promise.all(uploadedExams.map(async (exam) => {
      const { data: examImage, error } = await supabaseClient.storage
        .from("exam-images")
        .download(exam.previewImagePath)

      if (error) return

      uploadedExamImages[exam.id] = URL.createObjectURL(examImage)
    }))

    setUploadedExamImages(uploadedExamImages)
  })() }, [])

  return <>
    <main id={styles.main}>
      <h1>{`${t("hello")} ${username}`}</h1>

      <h2 className={styles.sectionTitle}>{t("unlocked_subjects")}</h2>
      <div className={styles.unlockedSubjectsContainer}>
        <div className={styles.unlockNewSubject} onClick={() => { router.push("/app/unlock-subject") }}>
          <span className="material-symbols-outlined">add</span>
          <h2>{t("unlock_new_subject")}</h2>
        </div>

        { unlockedSubjects?.map((unlockedSubject) => (
          <div key={unlockedSubject.id} className={styles.unlockedSubject}>
            <h2>{unlockedSubject.subject_id.subject_name}</h2>
            <p>{t("access_expiring_in").replace("{days}", unlockedSubject.expires_in)}</p>
            <button onClick={() => { router.push(`/app/browse/${unlockedSubject.subject_id.id}`) }}>{t("browse_exams")}</button>
          </div>
        )) }
      </div>

      <h2 className={styles.sectionTitle}>{t("uploaded_exams")}</h2>
      <div className={styles.uploadedExamsContainer}>
        <div className={styles.uploadExam} onClick={() => { router.push("/app/upload") }}>
          <span className="material-symbols-outlined">add</span>
          <h2>{t("upload_exam")}</h2>
        </div>

        { uploadedExams.map((exam) => (
          <div key={exam.id} className={styles.uploadedExam} onClick={() => { router.push(`/app/exam/${exam.id}`)}}>
            <div className={styles.examPreview}>
              <img src={uploadedExamImages[exam.id] || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="} alt={exam.topic} />
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

  var unlockedSubjects: any[] = []
  let unlockedSubjectsRequest = (async () => {
    const { data, error } = await supabase
      .from("unlocked_subjects")
      .select("id, subject_id (id, subject_name), expiry_date")
      .eq("student_id", user?.id)
      .gt("expiry_date", new Date().toISOString())

    if (error) return
    unlockedSubjects = data

    for (let exam of unlockedSubjects) {
      exam.expires_in = Math.ceil((new Date(exam.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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
      exam.previewImagePath = `${user?.id}/${exam.id}/0.webp`
    }
  })()

  await Promise.all([unlockedSubjectsRequest, uploadedExamsRequest])

  return {
    props: {
      username: username,
      unlockedSubjects: unlockedSubjects,
      uploadedExams: uploadedExams
    }
  }
}