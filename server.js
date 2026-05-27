const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const HOST = '0.0.0.0';
const DATA_FILE = path.join(__dirname, 'gestures_data.txt');
const STATIC_FILES = {
  '/': 'hand-tracing.html',
  '/hand-tracing.html': 'hand-tracing.html',
  '/hand-tracing.js': 'hand-tracing.js'
};

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.html') return 'text/html; charset=utf-8';
  if (extension === '.js') return 'application/javascript; charset=utf-8';
  if (extension === '.css') return 'text/css; charset=utf-8';
  if (extension === '.json') return 'application/json; charset=utf-8';
  if (extension === '.txt') return 'text/plain; charset=utf-8';

  return 'application/octet-stream';
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      return sendJson(res, 500, { error: err.message });
    }

    res.writeHead(200, {
      'Content-Type': getContentType(filePath)
    });
    res.end(content);
  });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const requestedFile = STATIC_FILES[req.url];
  if (requestedFile && req.method === 'GET') {
    return sendFile(res, path.join(__dirname, requestedFile));
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (req.url === '/save-gesture' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const text = typeof data.text === 'string' ? data.text.trim() : '';

        if (!text) {
          return sendJson(res, 400, { error: 'Geen tekst ontvangen' });
        }

        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const line = `[${timestamp}] ${text}\n`;

        fs.appendFile(DATA_FILE, line, 'utf8', err => {
          if (err) {
            return sendJson(res, 500, { error: err.message });
          }
          sendJson(res, 200, { success: true, message: 'Tekst opgeslagen' });
        });
      } catch (error) {
        sendJson(res, 400, { error: 'Ongeldige JSON' });
      }
    });
    return;
  }

  if (req.url === '/get-gestures' && req.method === 'GET') {
    fs.readFile(DATA_FILE, 'utf8', (err, content) => {
      if (err && err.code !== 'ENOENT') {
        return sendJson(res, 500, { error: err.message });
      }

      const gestures = err && err.code === 'ENOENT' ? [] : content.split('\n').filter(Boolean).map(line => `${line}\n`);
      sendJson(res, 200, { gestures });
    });
    return;
  }

  if (req.url === '/clear-gestures' && req.method === 'POST') {
    fs.unlink(DATA_FILE, err => {
      if (err && err.code !== 'ENOENT') {
        return sendJson(res, 500, { error: err.message });
      }
      sendJson(res, 200, { success: true, message: 'Alle gegevens gewist' });
    });
    return;
  }

  sendJson(res, 404, { error: 'Niet gevonden' });
});

server.listen(PORT, HOST, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
  console.log(`Server bereikbaar in netwerk op http://<raspberry-pi-ip>:${PORT}`);
  console.log(`Opslagbestand: ${DATA_FILE}`);
});
