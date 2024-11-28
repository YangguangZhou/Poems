// [poem].js
import fs from 'fs';
import path from 'path';
import styles from '../styles/Poem.module.css';
import { useState } from 'react';
import { parsePoems } from '../lib/parsePoems';

export default function PoemPage({ poem }) {
  const [showTranslations, setShowTranslations] = useState(false);

  const toggleTranslation = (index) => {
    const translation = document.getElementById(`translation-${index}`);
    if (translation) {
      translation.style.display = 
        translation.style.display === 'block' ? 'none' : 'block';
    }
  };

  const toggleAllTranslations = () => {
    setShowTranslations(!showTranslations);
    const translations = document.querySelectorAll(`.${styles.translation}`);
    translations.forEach(translation => {
      translation.style.display = !showTranslations ? 'block' : 'none';
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{poem.title}</h1>
      <h2 className={styles.author}>{poem.author}</h2>
      
      <div className={styles.translationToggle} onClick={toggleAllTranslations}>
        显示/隐藏翻译
      </div>

      <div className={styles.content}>
        {poem.content.map((line, index) => (
          <div
            key={index}
            className={styles.poemLine}
            onClick={() => toggleTranslation(index)}
          >
            {line}
            <div 
              id={`translation-${index}`}
              className={styles.translation}
            >
              {poem.translation[index]}
            </div>
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
  const paths = poems.map(poem => ({
    params: { poem: encodeURIComponent(poem.title) },
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const filePath = path.join(process.cwd(), 'public', 'poems.txt');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const poems = parsePoems(fileContents);
  const poem = poems.find(p => p.title === decodeURIComponent(params.poem));
  return {
    props: {
      poem,
    },
  };
}