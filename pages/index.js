// index.js
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import styles from '../styles/Home.module.css';
import { parsePoems } from '../lib/parsePoems';

export default function Home({ poems }) {
  return (
    <>
      <Head>
        <title>古诗文</title>
      </Head>
      <div className={styles.container}>
        <h1 className={styles.title}>古诗文</h1>
        <ul className={styles.poemList}>
          {poems.map((poem, index) => (
            <li key={index}>
              <Link href={`/${encodeURIComponent(poem.title)}`}>
                <span className={styles.poemTitle}>{poem.title}</span>
                <span className={styles.poemAuthor}>{poem.author}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'public', 'poems.txt');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const poems = parsePoems(fileContents);
  return {
    props: {
      poems,
    },
  };
}