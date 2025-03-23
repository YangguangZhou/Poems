import { useEffect } from 'react';

export default function AdvertisementScripts() {
  useEffect(() => {
    // 载入脚本
    const gadsScript = document.createElement('script');
    gadsScript.async = true;
    gadsScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2597042766299857";
    gadsScript.crossOrigin = "anonymous";
    document.head.appendChild(gadsScript);
    
    const umamiScript = document.createElement('script');
    umamiScript.defer = true;
    umamiScript.src = "https://umami.jerryz.com.cn/script.js";
    umamiScript.dataset.websiteId = "2146d192-8185-4e7d-a402-e005dd097571";
    document.head.appendChild(umamiScript);
    
    // 清理函数
    return () => {
      document.head.removeChild(gadsScript);
      document.head.removeChild(umamiScript);
      
      // 清理广告内容
      const adElements = document.querySelectorAll('.adsbygoogle');
      adElements.forEach(el => el.remove());
      
      const adIframes = document.querySelectorAll('iframe[src*="googleads"]');
      adIframes.forEach(el => el.remove());
    };
  }, []);
  
  return null;
}