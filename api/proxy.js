export default async function handler(req, res) {
  const NGROK_URL = 'https://fe58-2601-646-100-38d0-40db-4e0d-e01-c714.ngrok-free.app';
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // For WebSocket upgrades, redirect to ngrok directly
  if (req.headers.upgrade === 'websocket') {
    res.writeHead(301, { Location: NGROK_URL + req.url });
    res.end();
    return;
  }
  
  try {
    const url = NGROK_URL + req.url;
    const response = await fetch(url, {
      method: req.method,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });
    
    // Copy response headers
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'content-length'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }
    
    res.status(response.status);
    
    if (response.headers.get('content-type')?.includes('text/html')) {
      let html = await response.text();
      // Replace ngrok URLs with Vercel URLs in the HTML
      html = html.replace(/https:\/\/fe58-2601-646-100-38d0-40db-4e0d-e01-c714\.ngrok-free\.app/g, '');
      res.send(html);
    } else {
      const data = await response.arrayBuffer();
      res.send(Buffer.from(data));
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
}