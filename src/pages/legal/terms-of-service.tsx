import styles from '@/styles/TermsOfService.module.scss'

export default function TermsOfService() {
  return (
    <>
      <main className="fullscreen">
        <h1>Tos</h1>
      </main>
    </>
  )
}

function getStaticProps() {
  return {
    props: {
      content: "none"
    },
  }
}
