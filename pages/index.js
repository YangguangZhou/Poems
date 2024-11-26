import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import styles from '../styles/Home.module.css';

export default function Home({ poems }) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>古诗文</h1>
      <ul className={styles.poemList}>
        {poems.map((poem, index) => (
          <li key={index}>
            <Link href={`/${encodeURIComponent(poem.title)}`}>
              {poem.title} - {poem.author}
            </Link>
          </li>
        ))}
      </ul>
    </div>
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

function parsePoems(data) {
  const poemsData = data.trim().split('\n\n\n');
  return poemsData.map((poem) => {
    const lines = poem.split('\n');
    const title = lines[0];
    const author = lines[1];
    let preface = '';
    let contentStart = 2;
    if (lines[2].startsWith('>')) {
      preface = lines[2].substring(1).trim();
      contentStart = 4;
    }
    const content = [];
    const translation = [];
    for (let i = contentStart; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      const parts = lines[i].split('。');
      parts.forEach((part) => {
        if (part.trim()) {
          const [original, trans] = part.split('、');
          content.push(original.trim());
          if (trans) translation.push(trans.trim());
        }
      });
    }
    return { title, author, preface, content, translation };
  });
}