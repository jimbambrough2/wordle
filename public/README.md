# Wordle Hints Helper

A TypeScript/Node.js app that helps verify if a guessed word is valid in Wordle by checking it against a curated word list.

## Project Structure

```
wordle/
├── src/
│   └── server.ts          # Backend Express server
├── public/
│   ├── index.html         # Frontend HTML
│   ├── styles.css         # Frontend styles
│   └── app.js             # Frontend JavaScript
├── wordsListData/
│   └── words.csv          # List of valid 5-letter words
├── package.json           # Node dependencies
└── tsconfig.json          # TypeScript configuration
```

## Features

- ✅ Enter a 5-letter word using one input box per letter
- ✅ Auto-focus to the next letter box as you type
- ✅ Support for pasting a complete word
- ✅ Real-time validation against the word list
- ✅ Clear button to reset inputs
- ✅ Enter key to submit the word

## Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build TypeScript:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000`

## Development

- Use `npm run watch` to continuously compile TypeScript as you make changes
- The server automatically loads `wordsListData/words.csv` on startup

## API Endpoints

### POST /api/validate

Validates if a word exists in the word list.

**Request:**
```json
{
  "word": "apple"
}
```

**Response:**
```json
{
  "word": "apple",
  "isValid": true,
  "message": "Valid word!"
}
```

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Data**: CSV file-based word list
