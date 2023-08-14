import styles from '@/styles/Validate.module.scss'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { GetServerSidePropsContext } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import useTranslation from 'next-translate/useTranslation'
import { banDuration } from '@/config'
import Dialog, { DialogRef } from '@/components/Dialog'
import { makeSnackbar } from '@/components/Snackbar'

export default function Validate({ serviceKey, unverifiedExams, subjects, teachers }: {
  serviceKey: string
  unverifiedExams: any[]
  subjects: any[]
  teachers: any[]
}) {
  const { t } = useTranslation('validate')
  const supabaseServiceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    serviceKey
  )

  const [exams, setExams] = useState<any[]>(unverifiedExams)
  const [images, setImages] = useState<{[key: string]: string[]}|null>(null)

  const confirmDialogRef = useRef<DialogRef>()
  const dialogTextRef = useRef<HTMLParagraphElement>(null)

  const confirmDialog = (dialogText: string, onConfirm: () => Promise<boolean>) => {
    if (dialogTextRef.current) dialogTextRef.current.innerText = dialogText

    confirmDialogRef.current?.show().then(async (result) => {
      if (!result) return
      let success = await onConfirm()
      if (!success) makeSnackbar(t("action_failed"), "error")
    })
  }

  const banUser = (exam: any) => {
    confirmDialog(`${t("ban")} ${exam.student_id}?`, async () => {
      const { data, error } = await supabaseServiceClient.auth.admin.updateUserById(exam.student_id, {
        ban_duration: banDuration
      })

      return !error
    })
  }

  const rejectExam = (exam: any) => {
    confirmDialog(`${t("reject")} ${exam.topic}?`, async () => {
      // Delete exam from database
      const { error: dbError } = await supabaseServiceClient
        .from("uploaded_exams")
        .delete()
        .eq("id", exam.id)

      // Delete exam images from storage
      let examImagesPath = `${exam.student_id}/${exam.id}`
      const { data: images, error: storageListError } = await supabaseServiceClient.storage
        .from("exam-images")
        .list(examImagesPath)
      const examImagesList = images?.map(image => `${examImagesPath}/${image.name}`) ?? []

      const { error: storageError } = await supabaseServiceClient.storage
        .from('exam-images')
        .remove(examImagesList)
      
      // Delete not validated teacher if this is their only exam
      const { count: sameTeacherExamsCount, error: sameTeacherExamsError } = await supabaseServiceClient
        .from("uploaded_exams")
        .select('*', { count: 'exact', head: true })
        .eq("teacher_id", exam.teacher_id)

      var teacherError = null
      if (sameTeacherExamsCount == 0) {
        const { error } = await supabaseServiceClient
          .from("teachers")
          .delete()
          .eq("id", exam.teacher_id)
          .eq("validated", false)
        teacherError = error
      }

      // Delete not validated subject if this is its only exam
      const { count: sameSubjectExamsCount, error: sameSubjectExamsError } = await supabaseServiceClient
        .from("uploaded_exams")
        .select('*', { count: 'exact', head: true })
        .eq("subject_id", exam.subject_id)

      var subjectError = null
      if (sameSubjectExamsCount == 0) {
        const { error } = await supabaseServiceClient
          .from("subjects")
          .delete()
          .eq("id", exam.subject_id)
          .eq("validated", false)
        subjectError = error
      }

      let success = !dbError && !storageListError && !storageError && !sameTeacherExamsError && !teacherError && !sameSubjectExamsError && !subjectError
      
      if (success) setExams(exams.filter(e => e.id !== exam.id))
      else {
        console.error("DB error:", dbError)
        console.error("Storage list error:", storageListError)
        console.error("Storage error:", storageError)
        console.error("Same teacher exams error:", sameTeacherExamsError)
        console.error("Teacher error:", teacherError)
        console.error("Same subject exams error:", sameSubjectExamsError)
        console.error("Subject error:", subjectError)
      }

      return success
    })
  }

  const approveExam = (exam: any) => {
    confirmDialog(`${t("approve")} ${exam.topic}?`, async () => {
      const { error: validateExamError } = await supabaseServiceClient
        .from("uploaded_exams")
        .update({ validated: true })
        .eq("id", exam.id)

      const { error: validateTeacherError } = await supabaseServiceClient
        .from("teachers")
        .update({ validated: true })
        .eq("id", exam.teacher_id)

      const { error: validateSubjectError } = await supabaseServiceClient
        .from("subjects")
        .update({ validated: true })
        .eq("id", exam.subject_id)

      if (!validateExamError && !validateTeacherError && !validateSubjectError) setExams(exams.filter(e => e.id !== exam.id))
      return !validateExamError && !validateTeacherError && !validateSubjectError
    })
  }

  useEffect(() => {
    for (const exam of unverifiedExams) {
      let examPath = `${exam.student_id}/${exam.id}`

      supabaseServiceClient.storage
        .from("exam-images")
        .list(examPath)
        .then(({ data, error }) => {
          if (error || !data) return

          for (const image of data) {
            supabaseServiceClient.storage
              .from("exam-images")
              .download(`${examPath}/${image.name}`)
              .then(({ data, error }) => {
                if (error || !data) return

                setImages((images) => (
                  {
                    ...images, 
                    [exam.id]: [
                      ...((images ? images[exam.id] : undefined) ?? []), 
                      URL.createObjectURL(data)
                    ]
                  }
                ))
              })
          }
        })
    }
  }, [])
  
  return <>
    <main id={styles.main}>
      { exams.map((exam: any) => {
        let subject = subjects.filter(subject => subject.id == exam.subject_id)[0]
        let teacher = teachers.filter(teacher => teacher.id == exam.teacher_id)[0]

        return (
          <div key={exam.id} className={styles.exam}>
            <div className={styles.examImagesContainer}>
              { images && images[exam.id] && images[exam.id].map(image => (
                <a key={image} href={image} target='_blank'><img className={styles.examImage} src={image} /></a>
              )) }
            </div>

            <h3 className={styles.examTopic}>{exam.topic}</h3>

            <div className={styles.examInfo}>
              <span className={subject.validated ? undefined : styles.notValidated}>{subject.subject_name}</span>
              <span className={teacher.validated ? undefined : styles.notValidated}>{`${teacher.abbreviation} (${teacher.first_name} ${teacher.last_name})`}</span>
              <span>{exam.issue_year}</span>
            </div>

            <div className={styles.examActions}>
              <button className={styles.banExamButton} onClick={() => banUser(exam)}>{t("ban")}</button>
              <button className={styles.rejectExamButton} onClick={() => rejectExam(exam)}>{t("reject")}</button>
              <button className={styles.approveExamButton} onClick={() => approveExam(exam)}>{t("approve")}</button>
            </div>
          </div>
        )
      }) }

      { exams.length == 0 && <h2 className={`fullscreen ${styles.noExams}`}>{t("no_exams")}</h2> }

      <Dialog reference={confirmDialogRef} title={t("confirm")} positive={t("confirm")} negative={t("cancel")}>
        <p ref={dialogTextRef}></p>
      </Dialog>
    </main>
  </>
}

export async function getServerSideProps() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY as string
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    serviceKey
  )

  const { data: unverifiedExams, error: examsError } = await supabase
    .from("uploaded_exams")
    .select("*")
    .eq("validated", false)

  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, subject_name, validated")

  const { data: teachers, error: teachersError } = await supabase
    .from("teachers")
    .select("id, abbreviation, first_name, last_name, validated")

  return {
    props: {
      serviceKey: serviceKey,
      unverifiedExams: unverifiedExams,
      subjects: subjects,
      teachers: teachers
    },
  }
}