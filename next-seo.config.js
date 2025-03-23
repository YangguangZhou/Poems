export default {
    titleTemplate: '%s | Poems',
    defaultTitle: '高中语文必背古诗文 | 诗词鉴赏学习网站',
    description: '提供高中语文必背古诗文，支持查看原文、翻译和拼音标注。',
    canonical: 'https://poems.jerryz.com.cn/',
    openGraph: {
      type: 'website',
      locale: 'zh_CN',
      url: 'https://poems.jerryz.com.cn/',
      siteName: 'Poems',
      title: '高中语文必背古诗文 | 诗词鉴赏学习网站',
      description: '提供高中语文必背古诗文，支持查看原文、翻译和拼音标注。',
      images: [
        {
          url: 'https://cdn.jerryz.com.cn/gh/YangguangZhou/picx-images-hosting@master/favicon.png',
          width: 512,
          height: 512,
          alt: 'Poems',
        }
      ],
    },
    twitter: {
      handle: '@YangguangZhou',
      site: '@YangguangZhou',
      cardType: 'summary_large_image',
    },
    additionalMetaTags: [
      {
        name: 'keywords',
        content: '古诗文,高中语文,必背古诗文,诗经,唐诗,宋词,元曲,文言文,古诗赏析,古诗翻译,古诗拼音'
      },
      {
        name: 'author',
        content: 'Jerry Zhou'
      },
      {
        name: 'application-name',
        content: 'Poems'
      }
    ],
    additionalLinkTags: [
      {
        rel: 'icon',
        href: 'https://cdn.jerryz.com.cn/gh/YangguangZhou/picx-images-hosting@master/favicon.png'
      }
    ]
  };