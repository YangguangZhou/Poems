// pages/api/clearCache.js
export default function handler(req, res) {
    if (process.env.NODE_ENV === 'development') {
        if (req.method === 'POST') {
            res.setHeader('Set-Cookie', 'accessOrder=; Max-Age=0; path=/');
            res.setHeader('Set-Cookie', 'searchHistory=; Max-Age=0; path=/');
            res.status(200).json({ message: '缓存已清除' });
        } else {
            res.status(405).json({ message: 'Method not allowed' });
        }
    } else {
        res.status(403).json({ message: '禁止访问' });
    }
}