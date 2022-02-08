// 5 letter words accepted by the application
//import dictionary from './dictionary.json';
// Daily 5 letter words for the application
//import targetWords from './targetWords.json';
const WORD_LENGTH = 5;
const guessGrid = document.querySelector('[data-guess-grid]');

function startInteraction() {
  document.addEventListener('click', handleMouseClick);
  document.addEventListener('keydown', handleKeyPress);
}

function stopInteraction() {
  document.removeEventListener('click', handleMouseClick);
  document.removeEventListener('keydown', handleKeyPress);
}

// handles the mouse clicking down on our virtual keyboard in our application
function handleMouseClick(e) {
  // key that is not enter oefwr backspace
  if (e.target.matches('[data-key]')) {
    pressKey(e.target.dataset.key);
    return;
  }
  // enter key was pressed
  if (e.target.matches('[data-enter]')) {
    submitGuess();
    return;
  }
  // backspace/delete key
  if (e.target.matches('[data-delete]')) {
    deleteKey();
    return;
  }
}

// handles when we use a physical keyboard to input a letter, delete, or enter key
function handleKeyPress(e) {
  // enter key was pressed
  if (e.key === 'Enter') {
    submitGuess();
    return;
  }
  // key pressed is backspace or delete key
  if (e.key === 'Backspace' || e.key === 'Delete') {
    deleteKey();
    return;
  }

  // a letter key was pressed
  if (e.key.match(/^[a-z]$/)) {
    pressKey(e.key);
    return;
  }
}

function pressKey(key) {
  const activeTiles = getActiveTiles();
  if (activeTiles.length >= WORD_LENGTH) return;
  const nextTile = guessGrid.querySelector(':not([data-letter])');
  nextTile.dataset.letter = key.toLowerCase();
  nextTile.dataset.state = 'active';
  nextTile.textContent = key;
}

function deleteKey() {
  const activeTiles = getActiveTiles();
  const lastTile = activeTiles[activeTiles.length - 1];
  if (lastTile == null) return;

  lastTile.textContent = '';
  delete lastTile.dataset.state;
  delete lastTile.dataset.letter;
}

function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]');
}

startInteraction();
