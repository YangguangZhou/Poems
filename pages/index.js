import Head from 'next/head';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import styles from '../styles/Home.module.css';
import { useState, useEffect } from 'react';
import { parsePoems } from '../lib/parsePoems';
import { NextSeo } from 'next-seo';

export default function Home({ poems }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [accessOrder, setAccessOrder] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    const access = JSON.parse(localStorage.getItem('accessOrder')) || [];
    setSearchHistory(history);
    setAccessOrder(access);
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleSearchClick = (poem) => {
    const updatedAccess = [poem.title, ...accessOrder.filter(title => title !== poem.title)];
    setAccessOrder(updatedAccess);
    localStorage.setItem('accessOrder', JSON.stringify(updatedAccess));
    const newHistory = [searchTerm, ...searchHistory.filter(term => term !== searchTerm)];
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const getPreview = (poem) => {
    const isClassical = poem.tags.includes('文言文');
    const firstTwoLines = poem.content.slice(0, 2).join('\n');
    if (isClassical && firstTwoLines.length > 100) {
      let preview = '';
      let count = 0;
      for (let char of firstTwoLines) {
        if (count < 100) {
          preview += char;
          count++;
        } else {
          preview += '...';
          break;
        }
      }
      return preview.split('\n').map((line, index) => (
        <p key={index}>{line}</p>
      ));
    } else {
      return poem.content.slice(0, 2).map((line, i) => (
        <p key={i}>{line}</p>
      ));
    }
  };

  const filteredPoems = poems
    .filter((poem) => {
      const searchContent = (
        poem.title +
        poem.author +
        poem.content.join('') +
        poem.translation.join('') +
        poem.tags.join(',')
      ).toLowerCase();
      return searchContent.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const aIndex = accessOrder.indexOf(a.title);
      const bIndex = accessOrder.indexOf(b.title);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

  const handleClearCache = async () => {
    await fetch('/api/clearCache', { method: 'POST' });
    localStorage.clear();
    setSearchHistory([]);
    setAccessOrder([]);
    alert('缓存已清除');
  };

  return (
    <>
      <NextSeo
        title="高中语文必背古诗文"
        description="提供高中语文必背古诗文，包含诗经、唐诗、宋词、元曲等经典作品，支持查看原文、翻译和拼音标注。"
        canonical="https://poems.jerryz.com.cn/"
      />
      <Head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2597042766299857" crossorigin="anonymous"></script>
        <script defer src="https://umami.jerryz.com.cn/script.js" data-website-id="2146d192-8185-4e7d-a402-e005dd097571"></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>
      <div className={styles.container}>
        <h1 className={styles.title}>古诗文</h1>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="搜索诗词或标签..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className={styles.searchInput}
          />
          {isSearchFocused && searchHistory.length > 0 && (
            <div className={styles.searchHistoryDropdown}>
              {searchHistory.map((term, i) => (
                <div
                  key={i}
                  className={styles.searchHistoryItem}
                  onClick={() => handleSearch(term)}
                >
                  {term}
                </div>
              ))}
            </div>
          )}
        </div>

        <ul className={styles.poemList}>
          {filteredPoems.map((poem, index) => (
            <li key={index} className={styles.poemItem}>
              <Link
                href={`/${encodeURIComponent(poem.title)}`}
                onClick={() => handleSearchClick(poem)}
              >
                <div className={styles.poemCard}>
                  <div className={styles.poemHeader}>
                    <span className={styles.poemTitle}>{poem.title}</span>
                    <span className={styles.poemAuthor}>{poem.author}</span>
                  </div>
                  <div className={styles.poemTags}>
                    {poem.tags.map((tag, i) => (
                      <span key={i} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  <div className={styles.poemPreview}>
                    {getPreview(poem)}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

      </div>
      {/* 底部 Footer */}
      <footer className={styles.footer}>
        <a className={styles.clearCacheLink} onClick={handleClearCache}>
          清除缓存
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