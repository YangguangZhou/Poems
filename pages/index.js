// index.js
import Head from 'next/head';  // 添加这行
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import styles from '../styles/Home.module.css';
import { useState } from 'react';
import { parsePoems } from '../lib/parsePoems';

export default function Home({ poems }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredPoems = poems.filter(poem => {
    const searchContent = (
      poem.title + 
      poem.author + 
      poem.content.join('') + 
      poem.translation.join('')
    ).toLowerCase();
    return searchContent.includes(searchTerm.toLowerCase());
  });

  return (
    <>
      <Head>
        <title>古诗文</title>
        <link rel="icon" href="https://cdn.jerryz.com.cn/gh/YangguangZhou/picx-images-hosting@master/favicon.png"></link>
      </Head>
      <div className={styles.container}>
        <h1 className={styles.title}>古诗文</h1>
        
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="搜索诗词..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <ul className={styles.poemList}>
          {filteredPoems.map((poem, index) => (
            <li key={index} className={styles.poemItem}>
              <Link href={`/${encodeURIComponent(poem.title)}`}>
                <div className={styles.poemCard}>
                  <div className={styles.poemHeader}>
                    <span className={styles.poemTitle}>{poem.title}</span>
                    <span className={styles.poemAuthor}>{poem.author}</span>
                  </div>
                  <div className={styles.poemPreview}>
                    {poem.content.slice(0, 2).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
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