import styles from '@/styles/Validate.module.scss'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { GetServerSidePropsContext } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import useTranslation from 'next-translate/useTranslation'

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

  const [images, setImages] = useState<{[key: string]: string[]}|null>(null)

  useEffect(() => {
    setImages({})

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
      { unverifiedExams.map((exam: any) => {
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
              <span className={teacher.validated ? undefined : styles.notValidated}>{teacher.abbreviation}</span>
              <span>{exam.issue_year}</span>
            </div>

            <div className={styles.examActions}>
              <button className={styles.banExamButton}>{t("ban")}</button>
              <button className={styles.rejectExamButton}>{t("reject")}</button>
              <button className={styles.approveExamButton}>{t("approve")}</button>
            </div>
          </div>
        )
      }) }
    </main>
  </>
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY as string
  
  const supabase = createServerSupabaseClient(ctx)

  const { data: unverifiedExams, error: examsError } = await supabase
    .from("uploaded_exams")
    .select("*")
    .eq("validated", false)

  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, subject_name, validated")

  const { data: teachers, error: teachersError } = await supabase
    .from("teachers")
    .select("id, abbreviation, validated")

  return {
    props: {
      serviceKey: serviceKey,
      unverifiedExams: unverifiedExams,
      subjects: subjects,
      teachers: teachers
    },
  }
}

/*const { data, error } = await supabaseServiceClient.auth.admin.updateUserById("f97afd77-399d-4438-9899-53e580bb2269", {
  ban_duration: "876600h"
})*/