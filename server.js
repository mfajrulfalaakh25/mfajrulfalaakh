// server.js — The web server that connects to database.js

const http = require('http');
const database = require('./database');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function sendJSON(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

async function handleRequest(req, res) {
  const url = req.url;
  const method = req.method;

  console.log(`${method} ${url}`);

  // --- Static files ---
  if (url === '/' || url === '/index.html') {
    sendFile(res, path.join(__dirname, 'index.html'), 'text/html');
    return;
  }
  if (url === '/style.css') {
    sendFile(res, path.join(__dirname, 'style.css'), 'text/css');
    return;
  }

  // --- API: GET all books ---
  if (url === '/api/books' && method === 'GET') {
    return sendJSON(res, database.getAllBooks());
  }

  // --- API: POST new book ---
  if (url === '/api/books' && method === 'POST') {
    try {
      const body = await parseBody(req);
      return sendJSON(res, database.addBook(body.title, body.author), 201);
    } catch (e) {
      return sendJSON(res, { error: 'Invalid data' }, 400);
    }
  }

  // --- API: GET one book by ID ---
  let m = url.match(/^\/api\/books\/(\d+)$/);
  if (m && method === 'GET') {
    const book = database.getBookById(parseInt(m[1]));
    return book ? sendJSON(res, book) : sendJSON(res, { error: 'Not found' }, 404);
  }

  // --- API: DELETE book by ID ---
  if (m && method === 'DELETE') {
    const removed = database.deleteBook(parseInt(m[1]));
    return removed
      ? sendJSON(res, { message: `Deleted "${removed.title}"`, book: removed })
      : sendJSON(res, { error: 'Not found' }, 404);
  }

  // --- API: GET notes for a book ---
  let m2 = url.match(/^\/api\/books\/(\d+)\/notes$/);
  if (m2 && method === 'GET') {
    return sendJSON(res, database.getNotesForBook(parseInt(m2[1])));
  }

  // --- API: POST note for a book ---
  if (m2 && method === 'POST') {
    try {
      const body = await parseBody(req);
      return sendJSON(res, database.addNote(parseInt(m2[1]), body.text), 201);
    } catch (e) {
      return sendJSON(res, { error: 'Invalid data' }, 400);
    }
  }

  // --- API: PUT update book status ---
  let m3 = url.match(/^\/api\/books\/(\d+)\/status$/);
  if (m3 && method === 'PUT') {
    try {
      const body = await parseBody(req);
      return sendJSON(res, database.updateBookStatus(parseInt(m3[1]), body.status));
    } catch (e) {
      return sendJSON(res, { error: 'Invalid data' }, 400);
    }
  }

  // --- 404 ---
  sendJSON(res, { error: 'Not found' }, 404);
}

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  🚀 Server running at http://localhost:${PORT}   ║
║  📚 Books API ready                          ║
║  📖 Try: curl http://localhost:${PORT}/api/books  ║
╚══════════════════════════════════════════════╝
  `);
});
