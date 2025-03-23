import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import styles from '../../styles/Recite.module.css';
import { parsePoems } from '../../lib/parsePoems';
import { NextSeo } from 'next-seo';

export default function RecitePage({ poem }) {
  const router = useRouter();
  const [mode, setMode] = useState('prepare'); // prepare, recite, test, complete
  const [hideLevel, setHideLevel] = useState(0);
  const [mastery, setMastery] = useState({});
  const [stats, setStats] = useState({ startTime: null, attempts: 0, hints: 0 });
  const [theme, setTheme] = useState('light');
  const [nextReviewDate, setNextReviewDate] = useState(null);
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [isFirstRecitation, setIsFirstRecitation] = useState(true);
  const timerRef = useRef(null);
  
  // 定义标点符号集合
  const punctuations = "，。、；：？！「」『』《》（）【】—…,.;:?!\"'`()<>{}[]“”‘’……";
  
  // 初始化数据
  useEffect(() => {
    // 确保 poem 对象存在后再执行后续操作
    if (!poem || !poem.title) return;
    
    // 获取主题设置
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // 获取背诵进度
    const savedMastery = JSON.parse(localStorage.getItem('poemMastery')) || {};
    if (savedMastery[poem.title]) {
      setMastery(savedMastery[poem.title]);
      setIsFirstRecitation(false);
      
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
    
    // 返回清理函数
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [poem]);

  // 根据掌握程度决定初始挖空难度
  const getDifficultyByMastery = (masteryLevel) => {
    // 基于掌握程度自动设置难度
    switch(masteryLevel) {
      case 0:
      case 1:
        return 1; // 初学阶段：少量挖空
      case 2:
        return 2; // 已记阶段：中等挖空
      case 3:
        return 3; // 熟悉阶段：大量挖空
      case 4:
      case 5:
        return 4; // 精通或完美阶段：几乎全部挖空
      default:
        return 1;
    }
  };

  // 开始背诵
  const startReciting = () => {
    if (isFirstRecitation) {
      // 首次背诵从通读模式开始
      setHideLevel(0);
    } else {
      // 非首次背诵直接进入挖空模式，根据掌握程度设置难度
      const difficulty = getDifficultyByMastery(mastery.level || 0);
      setHideLevel(difficulty);
    }
    
    setShowTranslations(true); // 默认显示翻译（仅在普通模式）
    setMode('recite');
    setStats({ ...stats, startTime: new Date() });
  };

  // 开始高难度模式
  const startHardMode = () => {
    setMode('recite');
    setHideLevel(6); // 高难度模式
    setShowTranslations(false); // 强制关闭翻译
    setStats({ ...stats, startTime: new Date() });
  };

  // 开始测试
  const startTest = () => {
    setMode('test');
    setHideLevel(5); // 测试模式，全部隐藏
    setShowTranslations(false); // 强制关闭翻译
    setStats({ ...stats, startTime: new Date() });
  };
  
  // 重置背诵记录
  const resetRecitingRecord = () => {
    const confirmReset = window.confirm("确定要清除此诗的背诵记录吗？");
    if (confirmReset) {
      // 清除当前诗的背诵记录
      const allMastery = JSON.parse(localStorage.getItem('poemMastery')) || {};
      if (allMastery[poem.title]) {
        delete allMastery[poem.title];
        localStorage.setItem('poemMastery', JSON.stringify(allMastery));
        setMastery({});
        setNextReviewDate(null);
        setIsFirstRecitation(true);
        alert("背诵记录已清除");
      }
    }
  };

  // 从通读模式进入背诵模式
  const startHiding = () => {
    setHideLevel(1); // 开始少量挖空
  };

  // 增加挖空级别（更难）
  const increaseHideLevel = () => {
    if (hideLevel < 4) {
      setHideLevel(hideLevel + 1);
      setStats({ ...stats, hints: stats.hints - 1 }); // 减少提示次数
    }
  };
  
  // 减少挖空级别（更简单，算作使用提示）
  const decreaseHideLevel = () => {
    if (hideLevel > 1) {
      setHideLevel(hideLevel - 1);
      setStats({ ...stats, hints: stats.hints + 1 }); // 增加提示次数
    }
  };

  // 查看原文
  const toggleOriginal = () => {
    if (!showingOriginal) {
      // 显示原文
      setShowingOriginal(true);
      setStats({ ...stats, hints: stats.hints + 1 }); // 增加提示次数
      // 3秒后自动隐藏
      timerRef.current = setTimeout(() => {
        setShowingOriginal(false);
      }, 3000);
    } else {
      // 手动隐藏原文
      setShowingOriginal(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
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
    
    // 更新首次背诵状态
    setIsFirstRecitation(false);
    
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

  // 获取难度级别的描述
  const getDifficultyLabel = (level) => {
    const labels = ['通读模式', '入门难度', '中等难度', '高级难度', '专家难度', '测试模式', '挑战模式'];
    return labels[level] || '未知难度';
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

  // 检查字符是否是标点符号
  const isPunctuation = (char) => {
    return punctuations.includes(char);
  };

  // 根据难度级别生成挖空内容
  const generateHiddenContent = (line, level, index) => {
    if (showingOriginal || level === 0) return line;
    
    switch (level) {
      case 1: // 入门难度：隐藏约25%，随机
        return line.split('').map((char, i) => 
          isPunctuation(char) || Math.random() > 0.25 ? char : '__'
        ).join('');
        
      case 2: // 中等难度：隐藏约50%，随机
        return line.split('').map((char, i) => 
          isPunctuation(char) || Math.random() > 0.5 ? char : '__'
        ).join('');
        
      case 3: // 高级难度：隐藏约75%，随机
        return line.split('').map((char, i) => 
          isPunctuation(char) || Math.random() > 0.75 ? char : '__'
        ).join('');
        
      case 4: // 专家难度：隐藏约90%，随机保留几个关键字
        return line.split('').map((char, i) => 
          isPunctuation(char) || Math.random() > 0.9 ? char : '__'
        ).join('');
        
      case 5: // 测试模式：隐藏全部（只保留标点）
        return line.split('').map(char => 
          isPunctuation(char) ? char : '__'
        ).join('');
        
      case 6: // 挑战模式：只显示每段第一个字，其余全部隐藏（除标点）
        return line.split('').map((char, i) => {
          if (isPunctuation(char)) return char;
          // 只显示每段的第一个字
          if (i === 0) return char;
          return '__';
        }).join('');
        
      default:
        return line;
    }
  };

  // 检查页面是否在加载中
  if (router.isFallback || !poem) {
    return (
      <div className="container">
        <div className={styles.reciteContainer}>
          <div className={styles.loading}>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 构建富结构化数据
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

  // 检查当前模式是否允许切换翻译
  const canToggleTranslation = hideLevel !== 5 && hideLevel !== 6;

  // 主要内容渲染
  return (
    <>
      <NextSeo
        title={`背诵 ${poem.title} | 古诗文背诵练习`}
        description={`背诵《${poem.title}》- ${poem.author}的经典作品。提供分步提示、记忆辅助功能和艾宾浩斯复习计划。学习古诗文，提高记忆力。`}
        canonical={`https://poems.jerryz.com.cn/recite/${encodeURIComponent(poem.title)}`}
        openGraph={{
          type: 'website',
          title: `背诵《${poem.title}》| 古诗文背诵练习`,
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
                {isFirstRecitation 
                  ? "首次背诵将从通读全文开始，熟悉内容后进入背诵模式。" 
                  : "背诵难度将根据您的掌握程度自动调整，助您高效记忆。"}
              </p>
              
              <div className={styles.buttonGroup}>
                <button className={styles.primaryButton} onClick={startReciting}>
                  开始背诵
                </button>
                <button className={styles.secondaryButton} onClick={startTest}>
                  测试模式
                </button>
                <button className={styles.challengeButton} onClick={startHardMode}>
                  挑战模式
                </button>
                {mastery.history && mastery.history.length > 0 && (
                  <button className={styles.dangerButton} onClick={resetRecitingRecord}>
                    清除记录
                  </button>
                )}
              </div>
              
              <div className={styles.modeDescription}>
                <div className={styles.modeItem}>
                  <span className={styles.modeName}>普通背诵:</span> 根据熟悉度自适应挖空，可查看翻译
                </div>
                <div className={styles.modeItem}>
                  <span className={styles.modeName}>测试模式:</span> 除标点外全部隐藏，不显示翻译
                </div>
                <div className={styles.modeItem}>
                  <span className={styles.modeName}>挑战模式:</span> 仅显示每句首字，强制禁用翻译
                </div>
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
              <div className={styles.reciteHeader}>
                <div className={styles.difficultyInfo}>
                  <span className={`${styles.difficultyLabel} ${styles['level' + hideLevel]}`}>
                    {getDifficultyLabel(hideLevel)}
                  </span>
                </div>
                
                <div className={styles.controlButtons}>
                  {canToggleTranslation && (
                    <button 
                      className={`${styles.controlButton} ${styles.translationToggle}`} 
                      onClick={() => setShowTranslations(!showTranslations)}
                    >
                      {showTranslations ? '隐藏翻译' : '显示翻译'}
                    </button>
                  )}
                  
                  {hideLevel !== 0 && hideLevel < 5 && (
                    <>
                      <button 
                        className={`${styles.controlButton} ${styles.difficultyUp}`} 
                        onClick={increaseHideLevel}
                        disabled={hideLevel >= 4}
                      >
                        增加难度
                      </button>
                      <button 
                        className={`${styles.controlButton} ${styles.difficultyDown}`} 
                        onClick={decreaseHideLevel}
                        disabled={hideLevel <= 1}
                      >
                        降低难度
                      </button>
                    </>
                  )}
                  
                  {hideLevel > 0 && hideLevel < 5 && (
                    <button 
                      className={`${styles.controlButton} ${styles.showOriginal}`} 
                      onClick={toggleOriginal}
                    >
                      {showingOriginal ? '隐藏原文' : '查看原文'}
                    </button>
                  )}
                </div>
              </div>
              
              <div className={styles.reciteContent}>
                {hideLevel === 0 ? (
                  // 通读模式：显示全部内容
                  <div className={styles.readthroughMode}>
                    {poem.content.map((line, index) => (
                      <div key={index} className={styles.lineWithTranslation}>
                        <div className={styles.originalLine}>{line}</div>
                        {showTranslations && (
                          <div className={styles.translationLine}>{poem.translation[index]}</div>
                        )}
                      </div>
                    ))}
                    
                    <button className={styles.startButton} onClick={startHiding}>
                      开始背诵
                    </button>
                  </div>
                ) : (
                  // 背诵或测试模式：一次性显示全部内容，但应用不同级别的挖空
                  <div className={styles.reciteAllContent}>
                    {poem.content.map((line, index) => (
                      <div key={index} className={styles.lineWithTranslation}>
                        <div className={styles.hiddenLine}>
                          {generateHiddenContent(line, hideLevel, index)}
                        </div>
                        {showTranslations && (
                          <div className={styles.translationLine}>{poem.translation[index]}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {hideLevel > 0 && (
                <div className={styles.finishButtonContainer}>
                  <button 
                    className={styles.finishButton} 
                    onClick={finishReciting}
                  >
                    完成背诵
                  </button>
                </div>
              )}
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
      {/* 底部 Footer */}
      <footer className={styles.footer}>
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
  try {
    const filePath = path.join(process.cwd(), 'public', 'poems.txt');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const poems = parsePoems(fileContents);
    const paths = poems.map(poem => ({
      params: { poem: encodeURIComponent(poem.title) },
    }));
    return { paths, fallback: 'blocking' };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return { paths: [], fallback: 'blocking' };
  }
}

export async function getStaticProps({ params }) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'poems.txt');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const poems = parsePoems(fileContents);
    const poem = poems.find(p => p.title === decodeURIComponent(params.poem));
    
    if (!poem) {
      return { notFound: true };
    }
    
    return {
      props: { poem },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Error fetching poem:', error);
    return { notFound: true };
  }
}