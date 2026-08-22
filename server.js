// server.js — The web server that connects to database.js
// It listens for requests and sends back data from the database.

const http = require('http');
const database = require('./database');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Helper: read a file and send it as response
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

// Helper: send JSON response
function sendJSON(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Parse JSON body from a request
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

// Handle incoming requests
async function handleRequest(req, res) {
  const url = req.url;
  const method = req.method;

  console.log(`${method} ${url}`);

  // --- Serve static files ---
  if (url === '/' || url === '/index.html') {
    sendFile(res, path.join(__dirname, 'index.html'), 'text/html');
    return;
  }

  if (url === '/style.css') {
    sendFile(res, path.join(__dirname, 'style.css'), 'text/css');
    return;
  }

  // --- API endpoints ---

  // GET /api/books — list all books
  if (url === '/api/books' && method === 'GET') {
    const books = database.getAllBooks();
    sendJSON(res, books);
    return;
  }

  // GET /api/books/:id — get one book
  const bookIdMatch = url.match(/^\/api\/books\/(\d+)$/);
  if (bookIdMatch && method === 'GET') {
    const book = database.getBookById(parseInt(bookIdMatch[1]));
    if (book) {
      sendJSON(res, book);
    } else {
      sendJSON(res, { error: 'Book not found' }, 404);
    }
    return;
  }

  // GET /api/books/:id/notes — get notes for a book
  const bookNotesMatch = url.match(/^\/api\/books\/(\d+)\/notes$/);
  if (bookNotesMatch && method === 'GET') {
    const notes = database.getNotesForBook(parseInt(bookNotesMatch[1]));
    sendJSON(res, notes);
    return;
  }

  // POST /api/books — add a new book
  if (url === '/api/books' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const book = database.addBook(body.title, body.author);
      sendJSON(res, book, 201);
    } catch (e) {
      sendJSON(res, { error: 'Invalid data' }, 400);
    }
    return;
  }

  // POST /api/books/:id/notes — add a note to a book
  const addNoteMatch = url.match(/^\/api\/books\/(\d+)\/notes$/);
  if (addNoteMatch && method === 'POST') {
    try {
      const body = await parseBody(req);
      const note = database.addNote(parseInt(addNoteMatch[1]), body.text);
      sendJSON(res, note, 201);
    } catch (e) {
      sendJSON(res, { error: 'Invalid data' }, 400);
    }
    return;
  }

  // PUT /api/books/:id/status — update book status
  const statusMatch = url.match(/^\/api\/books\/(\d+)\/status$/);
  if (statusMatch && method === 'PUT') {
    try {
      const body = await parseBody(req);
      const book = database.updateBookStatus(parseInt(statusMatch[1]), body.status);
      sendJSON(res, book);
    } catch (e) {
      sendJSON(res, { error: 'Invalid data' }, 400);
    }
    return;
  }

  // 404 for everything else
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// Create and start the server
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
