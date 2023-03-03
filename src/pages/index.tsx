import Head from 'next/head'
import styles from '@/styles/Index.module.scss'
import useTranslation from 'next-translate/useTranslation'

export default function Index() {
  const { t } = useTranslation('home')

  var caruselStrings: string[] = new Array(5).fill(null).map((_val, i) => t(`caruselText${i}`))
  caruselStrings.push(caruselStrings[0])

  return (
    <>
      <main className="fullscreen">
        <div className={styles.textCarusel}>
          <div className={styles.textHolder}>
            {caruselStrings.map((text, i) => <span key={i} className={styles.textItem}>{text}<br/></span>)}
          </div>
        </div>
      </main>
    </>
  )
}
