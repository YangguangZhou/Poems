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
  const [theme, setTheme] = useState('light');
  const isClassical = poem.tags.includes('文言文') || poem.tags.includes('词');

  useEffect(() => {
    // 加载访问顺序
    const access = JSON.parse(localStorage.getItem('accessOrder')) || [];
    const updatedAccess = [poem.title, ...access.filter(title => title !== poem.title)];
    localStorage.setItem('accessOrder', JSON.stringify(updatedAccess));

    // 加载主题设置
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, [poem.title]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTranslation = (index) => {
    const translation = document.getElementById(`translation-${idx}`);
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

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // 提取前两行诗句作为描述，并限制长度为160字符
  const poemDescription = `${poem.title}，${poem.author}。${poem.content.slice(0, 2).join('，')}...`;
  const truncatedDesc = "高中必背古诗文 " + poemDescription.length > 160 ?
    poemDescription.substring(0, 157) + '...' : poemDescription;

  // 提取适合的关键词
  const keywords = `${poem.title},${poem.author},${poem.tags.join(',')},古诗文,诗词鉴赏,高中语文`;

  return (
    <>
      <NextSeo
        title={poem.title}
        description={truncatedDesc}
        canonical={`https://poems.jerryz.com.cn/${encodeURIComponent(poem.title)}`}
        openGraph={{
          title: `${poem.title} | Poems`,
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>

      <div className="container">
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

          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className={styles.translationToggle} onClick={toggleAllTranslations}>
              {showTranslations ? '隐藏翻译' : '显示翻译'}
            </div>
            <div className={styles.translationToggle} onClick={() => setShowPinyin(!showPinyin)}>
              {showPinyin ? '隐藏拼音' : '显示拼音'}
            </div>
            <Link href={`/recite/${encodeURIComponent(poem.title)}`} className={styles.translationToggle}>
              开始背诵
            </Link>
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
      </div>

      {/* 主题切换按钮 */}
      <div className="theme-switch" onClick={toggleTheme}>
        {theme === 'light' ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        )}
      </div>

      <footer className={styles.footer}>
        {/* 打印按钮 */}
        <a className={styles.printLink} onClick={handlePrint}>
          打印诗词
        </a>
        {/* 打印时显示的水印 */}
        <div className={styles.printStamp}>
          Printed by Poems | poems.jerryz.com.cn
        </div>
        <div>
          Copyright © {new Date().getFullYear()}
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