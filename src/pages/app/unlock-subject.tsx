import { makeSnackbar } from "@/components/Snackbar"
import * as config from "@/config"
import styles from '@/styles/UnlockSubject.module.scss'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react'
import { GetServerSidePropsContext } from 'next'
import useTranslation from 'next-translate/useTranslation'
import { useRouter } from "next/router"
import { useEffect, useRef, useState } from "react"

export default function UnlockSubject({ notUnlockedSubjects }: {
  notUnlockedSubjects: any[]
}) {
  const { t } = useTranslation('unlock-subject')
  const router = useRouter()
  const supabaseClient = useSupabaseClient()
  const user = useUser()

  const [subjectExamAmount, setSubjectExamAmount] = useState<number|null>(null)
  const subjectSelectionRef = useRef<HTMLSelectElement>(null)

  const updateAmountOfExams = async () => {
    setSubjectExamAmount(null)
    let subjectId = subjectSelectionRef.current?.value

    let { data, error } = await supabaseClient
      .rpc('get_number_of_exams', {
        requested_subject_id: subjectId
      })

    if (!error) setSubjectExamAmount(data)
  }

  const unlockSubject = async () => {
    if (!user) return
    let subjectId = subjectSelectionRef.current?.value

    let { data, error } = await supabaseClient
      .from('unlocked_subjects')
      .insert([{
        student_id: user?.id,
        subject_id: subjectId
      }])
      .select()

    console.log(error)
    if (!error) router.push('/app/dashboard')
    else makeSnackbar(t("error_unlocking_subject"), "error")
  }

  useEffect(() => {
    updateAmountOfExams()
  }, [notUnlockedSubjects])
  
  return <>
    <main id={styles.main}>
      <h1>Unlock Subject</h1>

      <select ref={subjectSelectionRef} id={styles.subjectSelection} onChange={updateAmountOfExams}>
        { notUnlockedSubjects.map(subject => (
          <option key={subject.id} value={subject.id}>{subject.subject_name}</option>
        )) }
      </select>
      <p id={styles.amountOfExams}>{ subjectExamAmount != null && t("exams_found").replace("{count}", subjectExamAmount.toString())}</p>

      <div className={styles.stickyBottom}>
        <button id={styles.unlockButton} onClick={unlockSubject}>
          {t("unlock_for_days").replace("{days}", config.subjectUnlockDuration.toString())}
          <div id={styles.creditPrice}>
            -1
            <img src="/coin-inverted.svg"/>
          </div>
        </button>
      </div>
    </main>
  </>
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const supabase = createServerSupabaseClient(ctx)
  const { data: { user } } = await supabase.auth.getUser()

  const { data: subjects, error: subjectsError } = await supabase
    .from("subjects")
    .select("id, subject_name")
    .eq("validated", true)

  const { data: unlockedSubjects, error: unlockedSubjectsError } = await supabase
    .from("unlocked_subjects")
    .select("subject_id")
    .eq("student_id", user?.id)
    .gt("expiry_date", new Date().toISOString())

  const notUnlockedSubjects = subjects?.filter(subject => (
    !unlockedSubjects?.some(unlockedSubject => unlockedSubject.subject_id === subject.id)
  ))

  return {
    props: {
      notUnlockedSubjects: notUnlockedSubjects
    }
  }
}