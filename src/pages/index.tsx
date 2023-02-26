import Head from 'next/head'
import styles from '@/styles/Index.module.scss'
import Navbar from '@/components/Navbar'

export default function Index() {
  var caruselStrings: string[] = ["All exams in one place.", "Easy and fast.", "For all subjects.", "Practice exercises.", "Free."]
  caruselStrings.push(caruselStrings[0])

  return (
    <>
      <Head>
        <title>Exam Exchange</title>
      </Head>
      <main>
        <Navbar />

        <div className={styles.fullscreen}>
          <div className={styles.textCarusel}>
            <div className={styles.textHolder}>
              {caruselStrings.map((text, i) => <span key={i} className={styles.textItem}>{text}<br/></span>)}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
