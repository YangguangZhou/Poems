import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/ReciteProgress.module.css';
import { NextSeo } from 'next-seo';

export default function ReciteProgress() {
  const [masteryData, setMasteryData] = useState({});
  const [poems, setPoems] = useState([]);
  const [todayReview, setTodayReview] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    mastered: 0,
    learning: 0,
    streakDays: 0
  });
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // 获取主题设置
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // 获取背诵数据
    const mastery = JSON.parse(localStorage.getItem('poemMastery')) || {};
    setMasteryData(mastery);
    
    // 获取诗词列表 (这里需要通过API或其他方式获取)
    // 这里只是示例，实际应该从数据源获取
    fetch('/api/poems')
      .then(res => res.json())
      .then(data => {
        setPoems(data);
        
        // 计算统计信息
        const poemStats = calculateStats(data, mastery);
        setStats(poemStats);
        
        // 获取今天应复习的诗词
        const today = new Date();
        const reviewList = data.filter(poem => {
          const poemMastery = mastery[poem.title];
          if (!poemMastery || !poemMastery.lastReview) return false;
          
          const reviewIntervals = [1, 2, 4, 7, 15, 30, 60, 90]; // 复习间隔天数
          const level = Math.min(poemMastery.level || 0, reviewIntervals.length - 1);
          const lastReview = new Date(poemMastery.lastReview);
          const nextReview = new Date(lastReview);
          nextReview.setDate(nextReview.getDate() + reviewIntervals[level]);
          
          return nextReview <= today;
        });
        
        setTodayReview(reviewList);
      });
  }, []);

  const calculateStats = (poemList, mastery) => {
    let total = poemList.length;
    let mastered = 0;
    let learning = 0;
    
    // 计算连续学习天数
    const history = [];
    
    Object.values(mastery).forEach(item => {
      if (item.level >= 3) mastered++;
      if (item.level > 0 && item.level < 3) learning++;
      
      if (item.history) {
        item.history.forEach(h => {
          const date = new Date(h.date).toLocaleDateString();
          if (!history.includes(date)) {
            history.push(date);
          }
        });
      }
    });
    
    // 计算连续学习天数
    let streakDays = 0;
    const today = new Date().toLocaleDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString();
    
    if (history.includes(today)) {
      streakDays = 1;
      let checkDate = yesterday;
      let continueStreak = true;
      
      while (continueStreak) {
        const checkDateStr = checkDate.toLocaleDateString();
        if (history.includes(checkDateStr)) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          continueStreak = false;
        }
      }
    }
    
    return {
      total,
      mastered,
      learning,
      streakDays
    };
  };
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // 根据掌握等级返回标签
  const getMasteryLabel = (level) => {
    const labels = ['初学', '已记', '熟悉', '掌握', '精通', '完美'];
    return labels[level] || '未学';
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "古诗文背诵进度",
    "description": "查看您的古诗文背诵学习进度、统计数据和复习计划。",
    "isPartOf": {
      "@type": "WebSite",
      "name": "古诗文网",
      "url": "https://poems.jerryz.com.cn/"
    }
  };
  
  return (
    <>
      <NextSeo
        title="背诵进度 | Poems"
        description="查看您的古诗文背诵进度、学习统计数据和智能复习计划。跟踪记忆效果，科学安排学习计划。"
        canonical="https://poems.jerryz.com.cn/recite-progress"
        openGraph={{
          type: 'website',
          title: '古诗文背诵进度 | Poems',
          description: '查看您的古诗文背诵进度、学习统计数据和智能复习计划。基于艾宾浩斯遗忘曲线科学安排学习。',
          url: 'https://poems.jerryz.com.cn/recite-progress',
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
            content: '背诵进度,学习统计,古诗文,记忆,艾宾浩斯遗忘曲线,复习计划,背诵统计'
          }
        ]}
      />
      <Head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2597042766299857" crossorigin="anonymous"></script>
        <script defer src="https://umami.jerryz.com.cn/script.js" data-website-id="2146d192-8185-4e7d-a402-e005dd097571"></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </Head>
      
      <div className="container">
        <div className={styles.progressContainer}>
          <Link href="/" className={styles.backButton}>
            ← 返回首页
          </Link>
          
          <h1 className={styles.title}>背诵进度</h1>
          
          <div className={styles.statsCards}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.streakDays}</div>
              <div className={styles.statLabel}>连续学习(天)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {Math.round((stats.mastered + stats.learning) / stats.total * 100)}%
              </div>
              <div className={styles.statLabel}>已学习</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.mastered}</div>
              <div className={styles.statLabel}>已掌握</div>
            </div>
          </div>
          
          {todayReview.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>今日复习</h2>
              <div className={styles.reviewList}>
                {todayReview.map(poem => (
                  <Link 
                    key={poem.title} 
                    href={`/recite/${encodeURIComponent(poem.title)}`}
                    className={styles.reviewItem}
                  >
                    <div className={styles.reviewTitle}>{poem.title}</div>
                    <div className={styles.reviewAuthor}>{poem.author}</div>
                    <div className={styles.reviewBadge}>
                      {getMasteryLabel(masteryData[poem.title]?.level || 0)}
                    </div>
                    <div className={styles.reviewArrow}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>所有诗词</h2>
            <div className={styles.poemProgress}>
              {poems.map(poem => {
                const poemMastery = masteryData[poem.title] || {};
                const level = poemMastery.level || 0;
                
                return (
                  <Link 
                    key={poem.title}
                    href={`/recite/${encodeURIComponent(poem.title)}`}
                    className={`${styles.poemProgressItem} ${level > 0 ? styles.started : ''}`}
                    data-level={level}
                  >
                    <div className={styles.poemProgressTitle}>{poem.title}</div>
                    <div className={styles.poemProgressAuthor}>{poem.author}</div>
                    <div className={styles.poemProgressBadge}>
                      {getMasteryLabel(level)}
                    </div>
                  </Link>
                );
              })}
            </div>
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
    </>
  );
}