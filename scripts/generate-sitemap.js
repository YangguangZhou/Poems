const fs = require('fs');
const path = require('path');
const { parsePoems } = require('../lib/parsePoems');

// 获取当前日期，格式化为YYYY-MM-DD
const formatDate = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

// 生成sitemap XML
async function generateSitemap() {
  // 读取诗词数据
  const filePath = path.join(process.cwd(), 'public', 'poems.txt');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const poems = parsePoems(fileContents);
  
  const baseUrl = 'https://poems.jerryz.com.cn';
  const today = formatDate();
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // 添加首页
  sitemap += `  <url>\n`;
  sitemap += `    <loc>${baseUrl}</loc>\n`;
  sitemap += `    <lastmod>${today}</lastmod>\n`;
  sitemap += `    <changefreq>weekly</changefreq>\n`;
  sitemap += `    <priority>1.0</priority>\n`;
  sitemap += `  </url>\n`;
  
  // 添加背诵进度页面
  sitemap += `  <url>\n`;
  sitemap += `    <loc>${baseUrl}/recite-progress</loc>\n`;
  sitemap += `    <lastmod>${today}</lastmod>\n`;
  sitemap += `    <changefreq>weekly</changefreq>\n`;
  sitemap += `    <priority>0.8</priority>\n`;
  sitemap += `  </url>\n`;
  
  // 添加每个诗词页面和对应的背诵页面
  poems.forEach(poem => {
    const encodedTitle = encodeURIComponent(poem.title);
    
    // 原诗词页面
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/${encodedTitle}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    sitemap += `    <priority>0.8</priority>\n`;
    sitemap += `  </url>\n`;
    
    // 背诵页面
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}/recite/${encodedTitle}</loc>\n`;
    sitemap += `    <lastmod>${today}</lastmod>\n`;
    sitemap += `    <changefreq>monthly</changefreq>\n`;
    sitemap += `    <priority>0.7</priority>\n`;
    sitemap += `  </url>\n`;
  });
  
  sitemap += '</urlset>';
  
  // 将sitemap写入文件
  fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), sitemap);
  console.log('Sitemap generated successfully!');
  
  // 生成robots.txt
  const robots = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`;
  fs.writeFileSync(path.join(process.cwd(), 'public', 'robots.txt'), robots);
  console.log('Robots.txt generated successfully!');
}

// 执行生成函数
generateSitemap().catch(console.error);