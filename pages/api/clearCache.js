export default function handler(req, res) {
    if (req.method === 'POST') {
      try {
        // 服务端缓存清理逻辑（如果有的话）
        res.status(200).json({ success: true });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    } else {
      res.setHeader('Allow', 'POST');
      res.status(405).end('Method Not Allowed');
    }
  }