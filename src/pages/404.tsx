import Navbar from "@/components/Navbar"
import Head from "next/head"
import styles from '@/styles/404.module.css'

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Exam Exchange - 404</title>
      </Head>
      <main>
        <Navbar/>

        <div className={styles.fullscreen}>
          <h1>404</h1>
        </div>
      </main>
    </>
  )
}
