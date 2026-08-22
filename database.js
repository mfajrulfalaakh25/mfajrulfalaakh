// database.js — A simple in-memory database for your journey
// This holds your data. server.js will ask it for information.

const books = [
  {
    id: 1,
    title: "Of Mice and Men",
    author: "John Steinbeck",
    status: "read",
    notes: "A story about friendship and dreams. George and Lennie travel together.",
    dateRead: "2026-08-20"
  },
  {
    id: 2,
    title: "The Old Man and the Sea",
    author: "Ernest Hemingway",
    status: "in-progress",
    notes: "An old fisherman's battle with a giant marlin.",
    dateRead: null
  }
];

const notes = [
  {
    id: 1,
    bookId: 1,
    text: "Learned the word 'soledad' — means loneliness in Spanish.",
    date: "2026-08-20"
  },
  {
    id: 2,
    bookId: 1,
    text: "'The best laid schemes of mice and men often go awry.' — Robert Burns",
    date: "2026-08-21"
  }
];

// --- Database functions ---

function getAllBooks() {
  return books;
}

function getBookById(id) {
  return books.find(b => b.id === id) || null;
}

function getNotesForBook(bookId) {
  return notes.filter(n => n.bookId === bookId);
}

function addNote(bookId, text) {
  const newNote = {
    id: notes.length + 1,
    bookId: bookId,
    text: text,
    date: new Date().toISOString().slice(0, 10)
  };
  notes.push(newNote);
  return newNote;
}

function addBook(title, author) {
  const newBook = {
    id: books.length + 1,
    title: title,
    author: author,
    status: "to-read",
    notes: "",
    dateRead: null
  };
  books.push(newBook);
  return newBook;
}

function updateBookStatus(id, status) {
  const book = getBookById(id);
  if (book) {
    book.status = status;
    if (status === "read") {
      book.dateRead = new Date().toISOString().slice(0, 10);
    }
  }
  return book;
}

// Export so server.js can use this
module.exports = {
  getAllBooks,
  getBookById,
  getNotesForBook,
  addNote,
  addBook,
  updateBookStatus
};
