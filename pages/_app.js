import { DefaultSeo } from 'next-seo';
import SEO from '../next-seo.config';
import { useState, useEffect } from 'react';
import '../styles/globals.css';
import AdvertisementScripts from './AdvertisementScripts';

function MyApp({ Component, pageProps }) {
  const [showAds, setShowAds] = useState(true);
  
  useEffect(() => {
    // 检查是否应该隐藏广告
    const adsDisabled = localStorage.getItem('noAds') === 'true';
    setShowAds(!adsDisabled);
    
    // 监听搜索框事件，检测特殊代码
    const handleSearch = (e) => {
      if (e.target.value === '0506') {
        alert('No Ads');
        localStorage.setItem('noAds', 'true');
        setShowAds(false);
        
        // 如果是首页搜索框，清空输入
        if (e.target.placeholder && e.target.placeholder.includes('搜索')) {
          setTimeout(() => {
            e.target.value = '';
          }, 100);
        }
      }
    };
    
    // 为所有可能的搜索输入框添加事件监听
    const searchInputs = document.querySelectorAll('input[type="text"]');
    searchInputs.forEach(input => {
      input.addEventListener('input', handleSearch);
    });
    
    return () => {
      // 清理事件监听
      searchInputs.forEach(input => {
        input.removeEventListener('input', handleSearch);
      });
    };
  }, []);
  
  return (
    <>
      <DefaultSeo {...SEO} />
      {showAds && <AdvertisementScripts />}
      <Component {...pageProps} showAds={showAds} />
    </>
  );
}

export default MyApp;