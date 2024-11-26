import fs from 'fs';
import path from 'path';
import styles from '../styles/Poem.module.css';
import { useState } from 'react';

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
    const translations = document.querySelectorAll('.translation');
    translations.forEach(translation => {
      translation.style.display = !showTranslations ? 'block' : 'none';
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{poem.title}</h1>
      <h2 className={styles.author}>{poem.author}</h2>
      
      <div className={styles.translationToggle} onClick={toggleAllTranslations}>
        显示/隐藏注解
      </div>

      {poem.preface && (
        <div className={styles.preface}>
          {poem.preface}
        </div>
      )}

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

function toggleTranslation(index) {
  const translation = document.querySelectorAll('.translation')[index];
  if (translation.style.display === 'block') {
    translation.style.display = 'none';
  } else {
    translation.style.display = 'block';
  }
}

function toggleAllTranslations() {
  const translations = document.querySelectorAll('.translation');
  const isAnyVisible = Array.from(translations).some(t => t.style.display === 'block');
  translations.forEach(translation => {
    translation.style.display = isAnyVisible ? 'none' : 'block';
  });
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
      const original = lines[i].split('、')[0].replace('。', '');
      const trans = lines[i].split('、')[1]?.replace('。', '');
      content.push(original.trim());
      if (trans) translation.push(trans.trim());
    }
    return { title, author, preface, content, translation };
  });
}