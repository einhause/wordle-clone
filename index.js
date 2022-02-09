// 5 letter words accepted by the application
import dictionary from './dictionary.json' assert { type: 'json' };
// Daily 5 letter words for the application
import targetWords from './targetWords.json' assert { type: 'json' };

/* 
========================
  GAME CONFIG
=======================
*/

// constants used throughout application
const WORD_LENGTH = 5;
const FLIP_ANIMATION_DURATION = 500;
const DANCE_ANIMATION_DURATION = 500;

// query selectors
const guessGrid = document.querySelector('[data-guess-grid]');
const alertContainer = document.querySelector('[data-alert-container]');
const keyboard = document.querySelector('[data-keyboard]');

// counts of the letters
let dailyWordLetterCount = {};
let guessWordLetterCount;

// set of tracked words already guessed
const alreadyGuessedWords = new Set();

// the daily word to solve, from Wordle json file
const dailyWord = getDailyWord();
getLetterCounts(dailyWord, dailyWordLetterCount);

// get daily word from targetWords array
function getDailyWord() {
  // first day of production, will start from top of targetWords
  const offsetFromDate = new Date(2022, 1, 9);
  const msOffset = Date.now() - offsetFromDate;
  const dayOffset = msOffset / 1000 / 60 / 60 / 24;

  return targetWords[Math.floor(dayOffset)];
}

/* 
========================
  Checking if mobile device
=======================
*/

const isMobile =
  'ontouchstart' in document.documentElement &&
  navigator.userAgent.match(/Mobi/);

/* 
========================
  GAME STATE EVENT LISTENERS
=======================
*/

function startInteraction() {
  // clearing the correct letters set amd the guess letter count after each turn
  guessWordLetterCount = {};

  document.addEventListener(
    isMobile ? 'touchstart' : 'click',
    handleMouseClick
  );
  if (!isMobile) {
    document.addEventListener('keydown', handleKeyPress);
  }
}

function stopInteraction() {
  document.removeEventListener(
    isMobile ? 'touchstart' : 'click',
    handleMouseClick
  );
  if (!isMobile) {
    document.removeEventListener('keydown', handleKeyPress);
  }
}

/* 
========================
  KEY PRESS LOGIC
=======================
*/

// handles the mouse clicking down on our virtual keyboard in our application
function handleMouseClick(e) {
  if (e.target.matches('[data-key]')) {
    // key that is not enter or backspace
    pressKey(e.target.dataset.key.toLowerCase());
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
  if (e.key.match(/^[a-z]$/i)) {
    pressKey(e.key.toLowerCase());
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
  nextTile.dataset.letter = key;
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

function getActiveTiles() {
  // returns all blocks in guess grid with active state (user typed letters)
  return guessGrid.querySelectorAll('[data-state="active"]');
}

/* 
========================
  WORD GUESSING LOGIC
=======================
*/

function submitGuess() {
  // convert querySelectorAll obj to an array
  const activeTiles = [...getActiveTiles()];

  // word is not long enough
  if (activeTiles.length !== WORD_LENGTH) {
    showAlert('Not enough letters');
    shakeTiles(activeTiles);
    return;
  }

  // reduce tile blocks to a single string of the word
  const guess = activeTiles.reduce(
    (word, tile) => word + tile.dataset.letter,
    ''
  );

  // get letter counts of the guess
  getLetterCounts(guess, guessWordLetterCount);

  // checks if the guess is a valid word in the dictionary
  if (!dictionary.includes(guess.toLowerCase())) {
    showAlert('Not in word list');
    shakeTiles(activeTiles);
    return;
  }

  if (alreadyGuessedWords.has(guess)) {
    showAlert('This word was already guessed!');
    shakeTiles(activeTiles);
    return;
  }

  // stop any user input
  stopInteraction();

  // flip tiles
  activeTiles.forEach((...params) => flipTiles(...params, guess));

  // add word to already guessed words
  alreadyGuessedWords.add(guess);
}

function flipTiles(tile, index, array, guess) {
  // letter from the tile
  const letter = tile.dataset.letter;
  // key on the keyboard
  const key = keyboard.querySelector(`[data-key="${letter}"i]`);

  // 1st half of animation, flips 90deg up
  setTimeout(() => {
    tile.classList.add('flip');
  }, (index * FLIP_ANIMATION_DURATION) / 2);

  // at the end of the transition, remove the flip class from tile and change color accordingly
  tile.addEventListener(
    'transitionend',
    () => {
      tile.classList.remove('flip');
      if (dailyWord[index] === letter) {
        //correct letter and position
        tile.dataset.state = 'correct';
        key.classList.add('correct');
      } else if (
        dailyWord.includes(letter) &&
        guessWordLetterCount[letter] <= dailyWordLetterCount[letter]
      ) {
        // correct letter, wrong location
        tile.dataset.state = 'wrong-location';
        key.classList.add('wrong-location');
      } else {
        // wrong letter and location
        tile.dataset.state = 'wrong';
        key.classList.add('wrong');
      }

      // all tiles are filled in row, stop user input and check a win or loss
      if (index === array.length - 1) {
        tile.addEventListener(
          'transitionend',
          () => {
            startInteraction();
            checkWinOrLose(guess, array);
          },
          { once: true }
        );
      }
    },
    { once: true }
  );
}

function checkWinOrLose(guess, tiles) {
  // word guessed correctly, end the game
  if (guess === dailyWord) {
    showAlert('Great Work!', 5000);
    danceTiles(tiles);
    stopInteraction();
    return;
  }

  const remainingTiles = guessGrid.querySelectorAll(':not([data-letter])');

  // if every tile is filled with a letter, the game will end
  if (remainingTiles.length === 0) {
    showAlert(`Nice try! The word was: ${dailyWord.toUpperCase()}`, null);
    stopInteraction();
    return;
  }
}

/* 
========================
  ALERT LOGIC
=======================
*/

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

/* 
========================
  ANIMATIONS
=======================
*/

function shakeTiles(tiles) {
  tiles.forEach((tile) => {
    // idea : adding to classlist, on animation end, removing shake, common practice for css animations
    tile.classList.add('shake');
    tile.addEventListener(
      'animationend',
      () => {
        tile.classList.remove('shake');
      },
      { once: true }
    );
  });
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add('dance');
      tile.addEventListener(
        'animationend',
        () => {
          tile.classList.remove('dance');
        },
        { once: true }
      );
    }, (index * DANCE_ANIMATION_DURATION) / 5);
  });
}

/* 
========================
  LETTER COUNT UTIL FUNCTION
=======================
*/

function getLetterCounts(word, countObj) {
  for (let char of word) {
    countObj[char] = countObj.hasOwnProperty(char) ? ++countObj[char] : 1;
  }
}

/* 
========================
  INIT GAME
=======================
*/

startInteraction();
