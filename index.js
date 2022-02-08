// 5 letter words accepted by the application
import dictionary from './dictionary.json' assert { type: 'json' };
// Daily 5 letter words for the application
import targetWords from './targetWords.json' assert { type: 'json' };

const WORD_LENGTH = 5;

const guessGrid = document.querySelector('[data-guess-grid]');
const alertContainer = document.querySelector('[data-alert-container]');

const dailyWord = getDailyWord();

function startInteraction() {
  document.addEventListener('click', handleMouseClick);
  document.addEventListener('keydown', handleKeyPress);
}

function stopInteraction() {
  document.removeEventListener('click', handleMouseClick);
  document.removeEventListener('keydown', handleKeyPress);
}

function getDailyWord() {
  const offsetFromDate = new Date(2022, 0, 1);
  const msOffset = Date.now() - offsetFromDate;
  const dayOffset = msOffset / 1000 / 60 / 60 / 24;
  return targetWords[Math.floor(dayOffset)];
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
  // key press handler for a letter
  const activeTiles = getActiveTiles();
  // word can only be 5 letters, cannot exceed it
  if (activeTiles.length >= WORD_LENGTH) return;
  //selects next tile that does not have an user inputted letter
  const nextTile = guessGrid.querySelector(':not([data-letter])');

  // adds it to data object
  nextTile.dataset.letter = key.toLowerCase();
  nextTile.dataset.state = 'active';
  nextTile.textContent = key;
}

function deleteKey() {
  // delete key press handler
  const activeTiles = getActiveTiles();
  const lastTile = activeTiles[activeTiles.length - 1];
  // empty user input
  if (lastTile == null) return;

  // resetting text content and removing state and letter form data object
  lastTile.textContent = '';
  delete lastTile.dataset.state;
  delete lastTile.dataset.letter;
}

function submitGuess() {
  // convert querySelectorAll obj to an array
  const activeTiles = [...getActiveTiles()];
  // word is not long enough
  if (activeTiles.length !== WORD_LENGTH) {
    showAlert('Not enough letters');
    shakeTiles(activeTiles);
    return;
  }
}

function showAlert(message, duration = 1000) {
  const alert = document.createElement('div');
  alert.textContent = message;
  alert.classList.add('alert');
  alertContainer.prepend(alert);

  if (duration == null) return;

  setTimeout(() => {
    alert.classList.add('hide');
    alert.addEventListener('transitionend', () => {
      alert.remove();
    });
  }, duration);
}

function getActiveTiles() {
  // returns all blocks in guess grid with active state (user typed letters)
  return guessGrid.querySelectorAll('[data-state="active"]');
}

startInteraction();
