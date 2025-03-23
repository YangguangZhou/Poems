import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import styles from '../styles/Poem.module.css';
import { useState, useEffect } from 'react';
import { parsePoems } from '../lib/parsePoems';
import Link from 'next/link';
import { pinyin } from 'pinyin-pro';
import { NextSeo } from 'next-seo';

export default function PoemPage({ poem }) {
  const [showTranslations, setShowTranslations] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const isClassical = poem.tags.includes('文言文') || poem.tags.includes('词');

  useEffect(() => {
    const access = JSON.parse(localStorage.getItem('accessOrder')) || [];
    const updatedAccess = [poem.title, ...access.filter(title => title !== poem.title)];
    localStorage.setItem('accessOrder', JSON.stringify(updatedAccess));
  }, [poem.title]);

  const toggleTranslation = (index) => {
    const translation = document.getElementById(`translation-${index}`);
    if (translation) {
      translation.style.display =
        translation.style.display === 'block' ? 'none' : 'block';
    }
  };

  const toggleAllTranslations = () => {
    setShowTranslations(!showTranslations);
    document.querySelectorAll(`.${styles.translation}`).forEach(translation => {
      translation.style.display = !showTranslations ? 'block' : 'none';
    });
  };

  const renderLineWithPinyin = (line) => (
    <>
      {line.split('').map((char, i) => (
        /\s/.test(char)
          ? <span key={i}>{char}</span>
          : (
            <ruby key={i}>
              {char}
              <rt>{pinyin(char, { toneType: 'mark' })}</rt>
            </ruby>
          )
      ))}
    </>
  );

  const handleClearCache = async () => {
    await fetch('/api/clearCache', { method: 'POST' });
    localStorage.clear();
    alert('缓存已清除');
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // 提取前两行诗句作为描述，并限制长度为160字符
  const poemDescription = `${poem.title}，${poem.author}。${poem.content.slice(0, 2).join('，')}...`;
  const truncatedDesc = poemDescription.length > 160 ? 
    poemDescription.substring(0, 157) + '...' : poemDescription;

  // 提取适合的关键词
  const keywords = `${poem.title},${poem.author},${poem.tags.join(',')},古诗文,诗词鉴赏`;

  return (
    <>
      <NextSeo
        title={poem.title}
        description={truncatedDesc}
        canonical={`https://poems.jerryz.com.cn/${encodeURIComponent(poem.title)}`}
        openGraph={{
          title: `${poem.title} | 古诗文`,
          description: truncatedDesc,
          url: `https://poems.jerryz.com.cn/${encodeURIComponent(poem.title)}`,
        }}
        additionalMetaTags={[
          {
            name: 'keywords',
            content: keywords
          }
        ]}
      />
      <Head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2597042766299857" crossorigin="anonymous"></script>
        <script defer src="https://umami.jerryz.com.cn/script.js" data-website-id="2146d192-8185-4e7d-a402-e005dd097571"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>
      <div className={styles.container}>
        <Link href="/" className={styles.homeButton}>
          ← 返回首页
        </Link>
        <h1 className={styles.title}>{poem.title}</h1>
        <h2 className={styles.author}>{poem.author}</h2>

        <div className={styles.tags}>
          {poem.tags.map((tag, i) => (
            <span key={i} className={styles.tag}>{tag}</span>
          ))}
        </div>

        <div className={styles.translationToggle} onClick={toggleAllTranslations}>
          显示/隐藏翻译
        </div>
        <div className={styles.translationToggle} onClick={() => setShowPinyin(!showPinyin)}>
          显示/隐藏拼音
        </div>

        <div className={isClassical ? styles.contentClassical : styles.content}>
          {poem.content.map((line, idx) => (
            <div
              key={idx}
              className={`${styles.poemLine} ${showPinyin ? styles.showPinyin : ''}`}
              onClick={() => toggleTranslation(idx)}
            >
              {showPinyin ? renderLineWithPinyin(line) : line}
              <div
                id={`translation-${idx}`}
                className={styles.translation}
                style={{ display: 'none' }}
              >
                {poem.translation[idx]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        <div id="printStamp" className={styles.printStamp}>Printed by poems.jerryz.com.cn</div>
        <a className={styles.clearCacheLink} onClick={handleClearCache}>
          清除缓存
        </a>
        <br></br>
        <a className={`${styles.clearCacheLink} printLink`} onClick={handlePrint}>
          打印为 PDF
        </a>
        <div>
          Copyright © 2024
          {' '}
          <a href="https://jerryz.com.cn" target="_blank" rel="noopener">
            Jerry Zhou
          </a>
        </div>
      </footer>
    </>
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