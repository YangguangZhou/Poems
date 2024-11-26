import fs from 'fs';
import path from 'path';
import styles from '../styles/Poem.module.css';

export default function Poem({ poem }) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{poem.title}</h1>
      <h2 className={styles.author}>{poem.author}</h2>
      {poem.preface && <div className={styles.preface}>{poem.preface}</div>}
      <div className={styles.content}>
        {poem.content.map((line, index) => (
          <div key={index} className={styles.poemLine}>
            {line}
            {poem.translation[index] && (
              <div className={styles.translation}>{poem.translation[index]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  const filePath = path.join(process.cwd(), 'public', 'poems.txt');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const poems = parsePoems(fileContents);
  const paths = poems.map((poem) => ({
    params: { poem: encodeURIComponent(poem.title) },
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'public', 'poems.txt');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const poems = parsePoems(fileContents);
  const poem = poems.find((p) => p.title === decodeURIComponent(params.poem));
  return {
    props: {
      poem,
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