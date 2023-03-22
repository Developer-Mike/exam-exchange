import styles from '@/styles/Legal.module.scss'
import path from 'path';
import { promises as fs } from 'fs';
import { remark } from 'remark';
import html from 'remark-html';

export default function TermsOfService({ contentHtml } : {
  contentHtml: string
}) {
  return (
    <>
      <main className={styles.content} dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </>
  )
}

export async function getStaticProps(context: any) {
  const markdownPath = path.join(process.cwd(), "legal", "terms_of_service.md")
  const fileContents = await fs.readFile(markdownPath, 'utf8')

  const processedContent = await remark()
    .use(html)
    .process(fileContents);
  const contentHtml = processedContent.toString();

  return {
    props: {
      contentHtml,
    },
  }
}
