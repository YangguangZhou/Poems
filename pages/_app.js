import { DefaultSeo } from 'next-seo';
import SEO from '../next-seo.config';
import { useState, useEffect } from 'react';
import '../styles/globals.css';
import AdvertisementScripts from './AdvertisementScripts';

function MyApp({ Component, pageProps }) {
  const [showAds, setShowAds] = useState(true);
  
  useEffect(() => {
    const adsDisabled = localStorage.getItem('noAds') === 'true';
    setShowAds(!adsDisabled);
    const handleSearch = (e) => {
      if (e.target.value === '0506') {
        alert('No Ads');
        localStorage.setItem('noAds', 'true');
        setShowAds(false);
        
        if (e.target.placeholder && e.target.placeholder.includes('搜索')) {
          setTimeout(() => {
            e.target.value = '';
          }, 100);
        }
      }
    };

    const searchInputs = document.querySelectorAll('input[type="text"]');
    searchInputs.forEach(input => {
      input.addEventListener('input', handleSearch);
    });
    
    return () => {
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