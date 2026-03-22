// Game state
const TOTAL_ROWS = 6;
const LETTERS_PER_ROW = 5;
let currentRowIndex = 0;
let gameState = []; // Array of rows with letter states

// Initialize game state
for (let i = 0; i < TOTAL_ROWS; i++) {
  const row = [];
  for (let j = 0; j < LETTERS_PER_ROW; j++) {
    row.push({ letter: "", status: "empty" });
  }
  gameState.push(row);
}

const guessesContainer = document.getElementById("guessesContainer");
const suggestionsDiv = document.getElementById("suggestions");
const suggestionsList = document.getElementById("suggestionsList");
const resetBtn = document.getElementById("resetBtn");

// Status cycle: empty -> gray -> green -> yellow -> empty
const statusCycle = ["empty", "gray", "green", "yellow"];

// Create all the guess rows and tiles
function initializeBoard() {
  guessesContainer.innerHTML = "";

  for (let rowIdx = 0; rowIdx < TOTAL_ROWS; rowIdx++) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "guess-row";
    rowDiv.dataset.row = rowIdx;

    // Create a container for tiles
    const tilesContainer = document.createElement("div");
    tilesContainer.className = "tiles-container";

    for (let colIdx = 0; colIdx < LETTERS_PER_ROW; colIdx++) {
      const tile = document.createElement("div");
      tile.className = "letter-tile empty";
      tile.dataset.row = rowIdx;
      tile.dataset.col = colIdx;
      tile.tabIndex = 0;

      tile.addEventListener("click", () => {
        tile.focus();
        handleTileClick(rowIdx, colIdx);
      });
      tile.addEventListener("keydown", (e) => handleKeyDown(e, rowIdx, colIdx));

      tilesContainer.appendChild(tile);
    }

    // Create submit button
    const submitBtn = document.createElement("button");
    submitBtn.className = "submit-btn";
    submitBtn.dataset.row = rowIdx;
    submitBtn.disabled = true;
    submitBtn.title = "Submit guess";
    submitBtn.innerHTML = "→";
    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Submit button clicked for row:", rowIdx, "currentRowIndex:", currentRowIndex);
      if (rowIdx === currentRowIndex) {
        submitGuess();
      }
    });

    rowDiv.appendChild(tilesContainer);
    rowDiv.appendChild(submitBtn);

    guessesContainer.appendChild(rowDiv);
  }

  // Focus the first tile
  document.querySelector('[data-row="0"][data-col="0"]').focus();
}

// Handle tile click to cycle through states
function handleTileClick(rowIdx, colIdx) {
  if (rowIdx !== currentRowIndex) return; // Only allow editing current row

  const tile = document.querySelector(`[data-row="${rowIdx}"][data-col="${colIdx}"]`);
  const currentStatus = tile.classList.contains("empty")
    ? "empty"
    : tile.classList.contains("gray")
    ? "gray"
    : tile.classList.contains("green")
    ? "green"
    : "yellow";

  const currentIndex = statusCycle.indexOf(currentStatus);
  const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

  // Update tile appearance
  tile.classList.remove("empty", "gray", "green", "yellow");
  tile.classList.add(nextStatus);

  // Update game state
  const row = gameState[rowIdx];
  row[colIdx] = {
    letter: tile.textContent,
    status: nextStatus,
  };

  // If no letter, reset to empty state only
  if (!tile.textContent) {
    tile.classList.remove("gray", "green", "yellow");
    tile.classList.add("empty");
  }

  updateSubmitButtonState();
}

// Update submit button enabled/disabled state
function updateSubmitButtonState() {
  const currentRow = gameState[currentRowIndex];
  const word = currentRow.map((cell) => cell.letter).join("");
  
  // Try to find the submit button for the current row
  const allSubmitBtns = document.querySelectorAll(".submit-btn");
  const submitBtn = allSubmitBtns[currentRowIndex];
  
  if (submitBtn) {
    submitBtn.disabled = word.length !== LETTERS_PER_ROW;
    console.log(`Row ${currentRowIndex}: word length = ${word.length}, button disabled = ${submitBtn.disabled}`);
  } else {
    console.log(`Could not find submit button for row ${currentRowIndex}`);
  }
}

// Handle keyboard input
function handleKeyDown(e, rowIdx, colIdx) {
  if (rowIdx !== currentRowIndex) return; // Only allow editing current row

  const tile = document.querySelector(`[data-row="${rowIdx}"][data-col="${colIdx}"]`);

  if (/^[a-z]$/i.test(e.key)) {
    e.preventDefault();
    tile.textContent = e.key.toUpperCase();
    tile.classList.remove("empty");
    tile.classList.add("gray");

    const row = gameState[rowIdx];
    row[colIdx] = {
      letter: e.key.toLowerCase(),
      status: "gray",
    };

    updateSubmitButtonState();

    // Move to next tile
    if (colIdx < LETTERS_PER_ROW - 1) {
      document
        .querySelector(`[data-row="${rowIdx}"][data-col="${colIdx + 1}"]`)
        .focus();
    }
  } else if (e.key === "Backspace") {
    e.preventDefault();
    tile.textContent = "";
    tile.classList.remove("gray", "green", "yellow");
    tile.classList.add("empty");

    const row = gameState[rowIdx];
    row[colIdx] = {
      letter: "",
      status: "empty",
    };

    updateSubmitButtonState();

    // Move to previous tile
    if (colIdx > 0) {
      document
        .querySelector(`[data-row="${rowIdx}"][data-col="${colIdx - 1}"]`)
        .focus();
    }
  }
}

// Submit current guess and get suggestions
async function submitGuess() {
  const currentRow = gameState[currentRowIndex];
  const word = currentRow.map((cell) => cell.letter).join("");

  // Validate word is complete
  if (word.length !== LETTERS_PER_ROW) {
    // Trigger shake animation
    const rowDiv = document.querySelector(`[data-row="${currentRowIndex}"]`);
    rowDiv.classList.add("shake");
    
    // Remove shake animation class after animation completes
    setTimeout(() => {
      rowDiv.classList.remove("shake");
    }, 500);
    return;
  }

  // Build constraints from ALL rows (cumulative from all previous guesses + current)
  const constraints = [];
  const markedLetters = new Set(); // Track letters that were marked green/yellow in ANY row
  const grayLetters = new Set(); // Track letters that should NOT be in the word
  
  // FIRST PASS: Collect all marked letters (green/yellow) from all rows
  for (let rowIdx = 0; rowIdx <= currentRowIndex; rowIdx++) {
    const row = gameState[rowIdx];
    row.forEach((cell) => {
      if (cell.status === "green" || cell.status === "yellow") {
        markedLetters.add(cell.letter.toLowerCase());
      }
    });
  }
  
  // SECOND PASS: Build constraints and collect excluded letters
  for (let rowIdx = 0; rowIdx <= currentRowIndex; rowIdx++) {
    const row = gameState[rowIdx];
    row.forEach((cell, colIdx) => {
      if (cell.status === "green" || cell.status === "yellow") {
        // Add green and yellow constraints
        constraints.push({
          position: colIdx,
          letter: cell.letter,
          status: cell.status,
        });
      } else if (cell.status === "gray" && cell.letter) {
        // Only add to excluded if this letter was NOT marked in ANY row
        const lowerLetter = cell.letter.toLowerCase();
        if (!markedLetters.has(lowerLetter)) {
          grayLetters.add(lowerLetter);
        }
      }
    });
  }

  // Convert gray letters set to array for sending
  const excludedLetters = Array.from(grayLetters);

  console.log("Current row state:", currentRow);
  console.log("All marked letters:", Array.from(markedLetters));
  console.log("Cumulative constraints from all rows:", constraints);
  console.log("Letters to exclude (gray):", excludedLetters);

  // Get suggestions from backend
  try {
    const response = await fetch("/api/suggestions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ constraints, excludedLetters }),
    });

    const data = await response.json();
    console.log("Response from backend:", data);

    if (data.suggestions && data.suggestions.length > 0) {
      displaySuggestions(data.suggestions);
    } else {
      suggestionsDiv.classList.add("hidden");
    }

    // Move to next row if available
    if (currentRowIndex < TOTAL_ROWS - 1) {
      currentRowIndex++;
      updateSubmitButtonState();
      document
        .querySelector(`[data-row="${currentRowIndex}"][data-col="0"]`)
        .focus();
    }
  } catch (error) {
    console.error("Error getting suggestions:", error);
    alert("Error getting suggestions");
  }
}

// Display suggested words
function displaySuggestions(suggestions) {
  suggestionsList.innerHTML = "";
  suggestionsDiv.classList.remove("hidden");

  suggestions.forEach((word) => {
    const wordBtn = document.createElement("button");
    wordBtn.className = "suggestion-word";
    wordBtn.textContent = word.toUpperCase();
    wordBtn.addEventListener("click", () => selectSuggestedWord(word));
    suggestionsList.appendChild(wordBtn);
  });
}

// Auto-fill suggested word into next row
function selectSuggestedWord(word) {
  if (currentRowIndex >= TOTAL_ROWS) {
    alert("No more guesses available");
    return;
  }

  const wordLetters = word.toLowerCase().split("");

  for (let colIdx = 0; colIdx < LETTERS_PER_ROW; colIdx++) {
    const tile = document.querySelector(
      `[data-row="${currentRowIndex}"][data-col="${colIdx}"]`
    );
    tile.textContent = wordLetters[colIdx].toUpperCase();
    tile.classList.remove("empty");
    tile.classList.add("gray");

    gameState[currentRowIndex][colIdx] = {
      letter: wordLetters[colIdx],
      status: "gray",
    };
  }

  // Update submit button state now that the row is filled
  updateSubmitButtonState();
  
  // Focus first tile of the row so user can interact with it
  document.querySelector(`[data-row="${currentRowIndex}"][data-col="0"]`).focus();
}

// Reset game
resetBtn.addEventListener("click", () => {
  currentRowIndex = 0;
  gameState = [];
  for (let i = 0; i < TOTAL_ROWS; i++) {
    const row = [];
    for (let j = 0; j < LETTERS_PER_ROW; j++) {
      row.push({ letter: "", status: "empty" });
    }
    gameState.push(row);
  }
  suggestionsDiv.classList.add("hidden");
  suggestionsList.innerHTML = "";
  initializeBoard();
});

// Global Enter key listener for submitting guess
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submitGuess();
  }
});

// Initialize on load
window.addEventListener("load", () => {
  initializeBoard();
});

