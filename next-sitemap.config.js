/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://poems.jerryz.com.cn',
    generateRobotsTxt: true,
    robotsTxtOptions: {
      policies: [
        {
          userAgent: '*',
          allow: '/',
        },
      ],
    },
    changefreq: 'weekly',
    priority: 0.7,
    sitemapSize: 5000,
    outDir: 'public',
    exclude: ['/api/*'],
    generateIndexSitemap: false,
  };