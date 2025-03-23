import Head from 'next/head';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import styles from '../styles/Home.module.css';
import { useState, useEffect } from 'react';
import { parsePoems } from '../lib/parsePoems';
import { NextSeo } from 'next-seo';

export default function Home({ poems, showAds }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [accessOrder, setAccessOrder] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // 加载本地存储数据
    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    const access = JSON.parse(localStorage.getItem('accessOrder')) || [];
    const savedTheme = localStorage.getItem('theme') || 'light';

    setSearchHistory(history);
    setAccessOrder(access);
    setTheme(savedTheme);

    // 应用主题
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleSearchClick = (poem) => {
    const updatedAccess = [poem.title, ...accessOrder.filter(title => title !== poem.title)];
    setAccessOrder(updatedAccess);
    localStorage.setItem('accessOrder', JSON.stringify(updatedAccess));

    // 只有当搜索词不为空时才添加到历史记录
    if (searchTerm.trim()) {
      const newHistory = [searchTerm, ...searchHistory.filter(term => term !== searchTerm)].slice(0, 10); // 限制历史记录数量
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
  };

  // 修改后的预览生成函数
  const getPreview = (poem) => {
    const isClassical = poem.tags.includes('文言文');
    // 只获取内容的前两行
    const lines = poem.content.slice(0, 2);

    // 根据是否是文言文使用不同的样式
    const previewClass = isClassical ? `${styles.poemPreview} ${styles.classical}` : styles.poemPreview;

    return (
      <div className={previewClass}>
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    );
  };

  const filteredPoems = poems
    .filter((poem) => {
      if (!searchTerm.trim()) return true; // 如果没有搜索词，显示所有诗词

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

    // 保存无广告设置状态
    const noAdsStatus = localStorage.getItem('noAds');

    // 清除localStorage其他内容
    localStorage.clear();

    // 如果之前设置了无广告，则恢复该设置
    if (noAdsStatus === 'true') {
      localStorage.setItem('noAds', 'true');
    }

    setSearchHistory([]);
    setAccessOrder([]);
    alert('缓存已清除');
  };

  return (
    <>
      <NextSeo
        title="Poems - 古诗文"
        description="提供高中语文必背古诗文，支持查看原文、翻译和拼音标注。"
        canonical="https://poems.jerryz.com.cn/"
      />
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>

      <div className={styles.container}>
        <h1 className={styles.title}>古诗文</h1>

        <div className={styles.navigation}>
          <Link href="/recite-progress" className={styles.navLink}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            背诵进度
          </Link>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="搜索诗词、作者或标签..."
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

        {filteredPoems.length > 0 ? (
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
                    {getPreview(poem)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M19.71,6.29a1,1,0,0,0-1.42,0L16,8.59V7a3,3,0,0,0-3-3H5A3,3,0,0,0,2,7V17a3,3,0,0,0,3,3h8a3,3,0,0,0,3-3V15.41l2.29,2.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42l-4-4a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.42L16,15.41V17a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V7A1,1,0,0,1,5,6h8a1,1,0,0,1,1,1V8.59l-2.29-2.3a1,1,0,0,0-1.42,1.42l4,4a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L14,8.59V7a1,1,0,0,1,1-1h1V7a1,1,0,0,0,.38.78l4,3a1,1,0,0,0,1.24,0,1,1,0,0,0,0-1.56Z" />
            </svg>
            <p>没有找到符合条件的诗词</p>
            <button
              onClick={() => setSearchTerm('')}
              style={{
                background: 'var(--accent)',
                border: 'none',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius)',
                cursor: 'pointer'
              }}
            >
              查看全部诗词
            </button>
          </div>
        )}
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

      {/* 底部 Footer */}
      <footer className={styles.footer}>
        <a className={styles.clearCacheLink} onClick={handleClearCache}>
          清除缓存
        </a>
        <br/>
        {!showAds && (
          <div className={styles.noAdsIndicator}>
            No Ads
          </div>
        )}
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