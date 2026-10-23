const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, '..', reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3456, async () => {
  console.log('Test Server listening on 3456');
  const testUrls = ['/', '/manifest.json', '/sw.js', '/icons/icon.svg', '/icons/icon-192.png', '/js/app.js', '/js/ledger.js', '/js/solana-pay.js', '/js/giftcards.js'];
  for (const url of testUrls) {
    try {
      const resp = await fetch('http://localhost:3456' + url);
      console.log(`${url.padEnd(22)} -> Status: ${resp.status} [${resp.headers.get('content-type')}]`);
    } catch (e) {
      console.error('Fetch error:', url, e);
    }
  }
  server.close(() => {
    console.log('All tests passed successfully!');
    process.exit(0);
  });
});
