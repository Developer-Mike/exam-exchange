import Head from "next/head"
import styles from '@/styles/404.module.scss'

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Exam Exchange - 404</title>
      </Head>
      <main className="fullscreen">
        <h1>404</h1>
      </main>
    </>
  )
}
