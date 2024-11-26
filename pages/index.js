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
    let index = 0;
    const title = lines[index++].trim();
    const author = lines[index++].trim();

    // 处理序
    index += 1; // 跳过两行换行
    const prefaceLines = [];
    while (index < lines.length && lines[index].startsWith('> ')) {
      prefaceLines.push(lines[index].substring(2).trim());
      index++;
    }
    const preface = prefaceLines.join('\n');

    // 跳过两行换行
    index += 1;

    // 处理原文
    const contentLines = [];
    while (index < lines.length && lines[index].trim() !== '') {
      contentLines.push(lines[index].trim());
      index++;
    }
    const content = contentLines.join('\n');

    // 跳过两行换行
    index += 1;

    // 处理翻译
    const translationLines = [];
    while (index < lines.length && lines[index].trim() !== '') {
      translationLines.push(lines[index].trim());
      index++;
    }
    const translation = translationLines.join('\n');

    return { title, author, preface, content, translation };
  });
}