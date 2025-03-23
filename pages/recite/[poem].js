import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import styles from '../../styles/Recite.module.css';
import { parsePoems } from '../../lib/parsePoems';
import { NextSeo } from 'next-seo';
import { pinyin } from 'pinyin-pro';

export default function RecitePage({ poem }) {
  const router = useRouter();
  const [mode, setMode] = useState('prepare'); // prepare, recite, test
  const [hideLevel, setHideLevel] = useState(1); // 1: 隐藏少量, 2: 隐藏一半, 3: 隐藏大部分, 4: 全部隐藏(测试模式)
  const [recitingIndex, setRecitingIndex] = useState(0);
  const [mastery, setMastery] = useState({});
  const [stats, setStats] = useState({ startTime: null, attempts: 0, hints: 0 });
  const [theme, setTheme] = useState('light');
  const [nextReviewDate, setNextReviewDate] = useState(null);
  
  // 初始化数据
  useEffect(() => {
    // 获取主题设置
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // 获取背诵进度
    const savedMastery = JSON.parse(localStorage.getItem('poemMastery')) || {};
    if (savedMastery[poem.title]) {
      setMastery(savedMastery[poem.title]);
      
      // 计算下次复习时间
      if (savedMastery[poem.title].lastReview) {
        const reviewIntervals = [1, 2, 4, 7, 15, 30, 60, 90]; // 复习间隔天数
        const level = Math.min(savedMastery[poem.title].level || 0, reviewIntervals.length - 1);
        const lastReview = new Date(savedMastery[poem.title].lastReview);
        const nextReview = new Date(lastReview);
        nextReview.setDate(nextReview.getDate() + reviewIntervals[level]);
        setNextReviewDate(nextReview);
      }
    }
  }, [poem.title]);

  // 开始背诵
  const startReciting = () => {
    setMode('recite');
    setHideLevel(1); // 开始时隐藏少量字
    setStats({ ...stats, startTime: new Date() });
  };

  // 开始测试
  const startTest = () => {
    setMode('test');
    setRecitingIndex(0);
    setHideLevel(4); // 测试模式，全部隐藏
  };

  // 显示更多提示(减少隐藏)
  const showMoreHint = () => {
    if (hideLevel > 1) {
      setHideLevel(hideLevel - 1);
      setStats({ ...stats, hints: stats.hints + 1 });
    }
  };

  // 下一句
  const nextLine = () => {
    if (recitingIndex < poem.content.length - 1) {
      setRecitingIndex(recitingIndex + 1);
      // 背诵模式时重置为隐藏少量，测试模式时保持全隐藏
      setHideLevel(mode === 'test' ? 4 : 1);
    } else {
      // 完成背诵
      finishReciting();
    }
  };

  // 完成背诵
  const finishReciting = () => {
    const endTime = new Date();
    const duration = Math.round((endTime - stats.startTime) / 1000); // 秒，使用整数
    
    // 更新掌握度
    const updatedMastery = {
      ...mastery,
      lastReview: endTime.toISOString(),
      reviewCount: (mastery.reviewCount || 0) + 1,
      level: calculateLevel(mastery.level || 0, stats.hints, duration),
      history: [...(mastery.history || []), {
        date: endTime.toISOString(),
        duration,
        hints: stats.hints
      }]
    };
    
    setMastery(updatedMastery);
    
    // 保存到localStorage
    const allMastery = JSON.parse(localStorage.getItem('poemMastery')) || {};
    allMastery[poem.title] = updatedMastery;
    localStorage.setItem('poemMastery', JSON.stringify(allMastery));
    
    // 计算下次复习时间
    const reviewIntervals = [1, 2, 4, 7, 15, 30, 60, 90]; // 复习间隔天数
    const level = Math.min(updatedMastery.level || 0, reviewIntervals.length - 1);
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + reviewIntervals[level]);
    setNextReviewDate(nextReview);
    
    // 回到完成状态
    setMode('complete');
  };

  // 计算掌握等级 (0-5)
  const calculateLevel = (currentLevel, hints, duration) => {
    // 基本逻辑: 根据提示使用次数和背诵速度计算掌握程度
    // 如果很少使用提示且速度快，提高等级
    // 如果频繁使用提示或速度慢，降低等级
    
    const avgTimePerLine = duration / poem.content.length;
    const avgHintsPerLine = hints / poem.content.length;
    
    if (avgHintsPerLine < 0.2 && avgTimePerLine < 5) {
      return Math.min(currentLevel + 1, 5);
    } else if (avgHintsPerLine > 1) {
      return Math.max(currentLevel - 1, 0);
    }
    return currentLevel;
  };
  
  // 切换主题
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // 根据掌握等级显示标记
  const getMasteryLabel = (level) => {
    const labels = ['初学', '已记', '熟悉', '掌握', '精通', '完美'];
    return labels[level] || '未学';
  };

  // 格式化时间显示
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  // 格式化日期显示
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 渲染带遮盖和提示的内容
  const renderReciteLine = (line, index) => {
    if (index !== recitingIndex) {
      return <div className={styles.inactiveLine}>{line}</div>;
    }
    
    // 根据不同级别的隐藏程度处理
    let processedLine;
    
    if (mode === 'test' || hideLevel === 4) {
      // 测试模式或最高隐藏级别：全部隐藏
      processedLine = line.split('').map(char => 
        char === ' ' || char === '\n' ? char : '__'
      ).join('');
    } else if (hideLevel === 3) {
      // 隐藏大部分（约75%）
      processedLine = line.split('').map((char, i) => 
        char === ' ' || char === '\n' || i % 4 === 0 ? char : '__'
      ).join('');
    } else if (hideLevel === 2) {
      // 隐藏一半
      processedLine = line.split('').map((char, i) => 
        char === ' ' || char === '\n' || i % 2 === 0 ? char : '__'
      ).join('');
    } else {
      // 隐藏少量（约25%）
      processedLine = line.split('').map((char, i) => 
        char === ' ' || char === '\n' || i % 4 !== 0 ? char : '__'
      ).join('');
    }
    
    // 处理换行，确保正确显示
    const parts = processedLine.split('\n');
    
    return (
      <div className={styles.activeLineContainer}>
        {parts.map((part, i) => (
          <div key={i} className={styles.activeLine}>{part}</div>
        ))}
      </div>
    );
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "name": `背诵《${poem.title}》`,
    "description": `练习背诵《${poem.title}》- ${poem.author}的经典作品，提供智能提示和记忆辅助。`,
    "author": {
      "@type": "Person",
      "name": poem.author
    },
    "educationalLevel": "高中",
    "learningResourceType": "背诵练习",
    "inLanguage": "zh-CN",
    "isPartOf": {
      "@type": "WebSite",
      "name": "古诗文网",
      "url": "https://poems.jerryz.com.cn/"
    }
  };

  return (
    <>
      <NextSeo
        title={`背诵 ${poem.title} | Poems`}
        description={`背诵《${poem.title}》- ${poem.author}的经典作品。提供分步提示、记忆辅助功能和艾宾浩斯复习计划。学习古诗文，提高记忆力。`}
        canonical={`https://poems.jerryz.com.cn/recite/${encodeURIComponent(poem.title)}`}
        openGraph={{
          type: 'website',
          title: `背诵《${poem.title}》| Poems`,
          description: `背诵《${poem.title}》- ${poem.author}的经典作品。与原文、翻译、解析对照背诵，提高记忆效率。`,
          url: `https://poems.jerryz.com.cn/recite/${encodeURIComponent(poem.title)}`,
          images: [
            {
              url: 'https://cdn.jerryz.com.cn/gh/YangguangZhou/picx-images-hosting@master/favicon.png',
              width: 512,
              height: 512,
              alt: '古诗文网',
            }
          ],
        }}
        additionalMetaTags={[
          {
            name: 'keywords',
            content: `${poem.title},${poem.author},${poem.tags.join(',')},背诵,记忆,古诗文,诗词背诵,艾宾浩斯记忆法`
          },
          {
            name: 'application-name',
            content: '古诗文背诵'
          }
        ]}
      />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>
      
      <div className="container">
        <div className={styles.reciteContainer}>
          <Link href={`/${encodeURIComponent(poem.title)}`} className={styles.backButton}>
            ← 返回原文
          </Link>
          
          <h1 className={styles.title}>{poem.title}</h1>
          <h2 className={styles.author}>{poem.author}</h2>
          
          {mode === 'prepare' && (
            <div className={styles.prepareMode}>
              <div className={styles.masteryInfo}>
                <div className={styles.masteryBadge} data-level={mastery.level || 0}>
                  {getMasteryLabel(mastery.level || 0)}
                </div>
                {nextReviewDate && (
                  <div className={styles.reviewDate}>
                    建议复习日期: {formatDate(nextReviewDate)}
                  </div>
                )}
              </div>
              
              <p className={styles.instructions}>
                背诵模式将帮助你逐步记忆这首诗。系统会根据学习进度隐藏部分内容，你可以根据需要获取提示。
              </p>
              
              <div className={styles.buttonGroup}>
                <button className={styles.primaryButton} onClick={startReciting}>
                  开始背诵
                </button>
                <button className={styles.secondaryButton} onClick={startTest}>
                  测试模式
                </button>
              </div>
              
              {mastery.history && mastery.history.length > 0 && (
                <div className={styles.history}>
                  <h3>背诵历史</h3>
                  <ul>
                    {mastery.history.slice(-5).map((entry, i) => (
                      <li key={i}>
                        {formatDate(entry.date)} - 
                        用时: {formatDuration(entry.duration)} - 
                        提示: {entry.hints}次
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {(mode === 'recite' || mode === 'test') && (
            <div className={styles.reciteMode}>
              <div className={styles.progress}>
                <div 
                  className={styles.progressBar} 
                  style={{width: `${(recitingIndex / poem.content.length) * 100}%`}}
                ></div>
                <span className={styles.progressText}>
                  {recitingIndex + 1} / {poem.content.length}
                </span>
              </div>
              
              <div className={styles.reciteContent}>
                {poem.content.map((line, index) => (
                  <div key={index} className={styles.lineContainer}>
                    {renderReciteLine(line, index)}
                    {index === recitingIndex && (
                      <div className={styles.translation}>
                        {poem.translation[index]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className={styles.reciteControls}>
                <button 
                  className={styles.hintButton} 
                  onClick={showMoreHint} 
                  disabled={hideLevel === 1 || mode === 'test'}
                >
                  {mode === 'test' ? '测试模式不可提示' : '显示提示'}
                </button>
                <button className={styles.nextButton} onClick={nextLine}>
                  {recitingIndex < poem.content.length - 1 ? '下一句' : '完成背诵'}
                </button>
              </div>
            </div>
          )}
          
          {mode === 'complete' && (
            <div className={styles.completeMode}>
              <div className={styles.completeBadge}>
                <svg viewBox="0 0 24 24" width="64" height="64">
                  <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                </svg>
                <h2>背诵完成！</h2>
              </div>
              
              <div className={styles.stats}>
                <p>掌握度: <span className={styles.highlight}>{getMasteryLabel(mastery.level || 0)}</span></p>
                <p>用时: <span className={styles.highlight}>
                  {formatDuration(Math.round((new Date() - stats.startTime) / 1000))}
                </span></p>
                <p>使用提示: <span className={styles.highlight}>{stats.hints}次</span></p>
              </div>
              
              <div className={styles.advice}>
                <h3>记忆建议</h3>
                <p>下次复习建议时间: <strong>{formatDate(nextReviewDate)}</strong></p>
                <p>记忆小技巧: 尝试在脑海中形象化诗词内容，创建与意境相关的联想。</p>
              </div>
              
              <div className={styles.buttonGroup}>
                <button className={styles.primaryButton} onClick={startReciting}>
                  再次背诵
                </button>
                <Link href="/" className={styles.secondaryButton}>
                  返回首页
                </Link>
              </div>
            </div>
          )}
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
    </>
  );
}