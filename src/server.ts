import express, { Express, Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app: Express = express();
const PORT = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Load words from CSV file
function loadWords(): Set<string> {
  const csvPath = path.join(__dirname, "../wordsListData/words.csv");
  const fileContent = fs.readFileSync(csvPath, "utf-8");
  // Parse CSV (simple comma-separated values on a single line)
  const words = fileContent.trim().split(",").map((word) => word.trim());
  return new Set(words.map((word) => word.toLowerCase()));
}

const validWords: Set<string> = loadWords();

// Convert to array for easier filtering
const wordArray: string[] = Array.from(validWords);

interface LetterConstraint {
  position: number;
  letter: string;
  status: "green" | "yellow"; // green = correct position, yellow = wrong position
}

// API endpoint to get suggested words based on constraints
app.post("/api/suggestions", (req: Request, res: Response) => {
  const { constraints, excludedLetters } = req.body;

  if (!constraints || !Array.isArray(constraints)) {
    res.status(400).json({ error: "Constraints array is required" });
    return;
  }

  const excluded = (excludedLetters || []) as string[];
  const excludedSet = new Set(excluded.map((l: string) => l.toLowerCase()));

  console.log("\n=== SUGGESTION REQUEST ===");
  console.log("Constraints received:", JSON.stringify(constraints, null, 2));
  console.log("Excluded letters:", Array.from(excludedSet));

  // Filter words based on constraints
  let matchedWords: string[] = [];
  
  for (const word of wordArray) {
    let matches = true;
    let rejectionReason = "";

    // First check: word should NOT contain any excluded letters
    for (const excludedLetter of excludedSet) {
      if (word.toLowerCase().includes(excludedLetter)) {
        matches = false;
        rejectionReason = `EXCLUDED: contains excluded letter '${excludedLetter}'`;
        break;
      }
    }

    if (!matches) {
      continue;
    }

    // Second check: word must match all constraints (green and yellow)
    for (const constraint of constraints) {
      const { position, letter, status } = constraint;
      // Normalize to lowercase for comparison
      const normalizedLetter = letter.toLowerCase();
      const wordAtPosition = word[position].toLowerCase();

      if (status === "green") {
        // Green: letter must be at this EXACT position
        if (wordAtPosition !== normalizedLetter) {
          matches = false;
          rejectionReason = `GREEN: position ${position} should be '${normalizedLetter}' but got '${wordAtPosition}'`;
          break;
        }
      } else if (status === "yellow") {
        // Yellow: letter must exist in the word but NOT at this position
        if (!word.toLowerCase().includes(normalizedLetter)) {
          matches = false;
          rejectionReason = `YELLOW: word must contain '${normalizedLetter}' but doesn't`;
          break;
        }
        if (wordAtPosition === normalizedLetter) {
          matches = false;
          rejectionReason = `YELLOW: '${normalizedLetter}' at position ${position} should NOT be there`;
          break;
        }
      }
    }

    if (matches) {
      matchedWords.push(word);
      console.log(`✓ MATCH: ${word}`);
    }
  }

  console.log(`\nMatched ${matchedWords.length} words from ${wordArray.length} total`);
  console.log("Matched words:", matchedWords);

  // Return top suggestions (limit to 10)
  const suggestions = matchedWords.slice(0, 10);

  res.json({
    suggestions: suggestions,
    count: suggestions.length,
    debug: {
      totalWords: wordArray.length,
      matchedWords: matchedWords.length,
      constraintsReceived: constraints,
      excludedLetters: Array.from(excludedSet),
    },
  });
});

// API endpoint to validate a word
app.post("/api/validate", (req: Request, res: Response) => {
  const { word } = req.body;

  if (!word) {
    res.status(400).json({ error: "Word is required" });
    return;
  }

  const normalizedWord = word.trim().toLowerCase();

  // Validate it's a 5-letter word
  if (normalizedWord.length !== 5) {
    res.status(400).json({ error: "Word must be exactly 5 letters" });
    return;
  }

  const isValid = validWords.has(normalizedWord);

  res.json({
    word: normalizedWord,
    isValid: isValid,
    message: isValid ? "Valid word!" : "Word not found in word list",
  });
});

// Serve frontend
app.use(express.static("public"));

// Start server
app.listen(PORT, () => {
  console.log(`Wordle Hints app running on http://localhost:${PORT}`);
  console.log(`Loaded ${validWords.size} words from word list`);
});

