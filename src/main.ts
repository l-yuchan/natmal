import "./style.css";
import {
  jamoToCompat,
  alphabetToJamo,
} from "./jamoutil";
import { getWordList, getWordDict } from "./dict";
import endingMessage from "./assets/endingMessage.json";
import { NatmalGame, CellState } from "./natmal";

let nextFocus = false; // if true, do not allow composing(ㄹ+ㅁ -> ㄻ)
let focusTimeoutId: number | undefined;

let game: NatmalGame | undefined = new NatmalGame(
  await getDailyAnswer(Date.now() + 9 * 60 * 60 * 1000),
  await getWordList(),
);

window.addEventListener("keydown", async (event: KeyboardEvent) => {
  if (
    event.isComposing ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    game === undefined
  )
    return;

  const target = event.target as HTMLElement | null;
  if (
    target instanceof HTMLTextAreaElement ||
    target?.isContentEditable
  ) {
    return;
  }

  // 공포의 겹겹이 지옥! ㅗ+ㅐ=ㅙ 저한테 이러시는 건데요 아아악

  if (event.key === "Backspace") {
    event.preventDefault();
    tryBackspace();
    return;
  } else if (event.key === " ") {
    nextFocus = true;
    event.preventDefault();
    return;
  } else if (/^[a-zA-Z]$/.test(event.key)) {
    tryKey(event.key);
    event.preventDefault();
  } else if (event.key === "Enter") {
    await tryGuess();
    return;
  }
});

function tryBackspace() {
  if (game == undefined) return;
  
  game.backspaceAnswer();
  updateRowText(game.getGuessCount(), game.getAnswerBuffer());
  nextFocus = false;
  updateFocusTimeout();
}

function tryKey(key: string) {
  if (game === undefined) return;
  const jamo = jamoToCompat(alphabetToJamo(key));
  game.appendAnswer(jamo, !nextFocus);

  nextFocus = false;
  updateFocusTimeout();
  updateRowText(game.getGuessCount(), game.getAnswerBuffer());
}

async function tryGuess() {
  if (game === undefined) return;
  
  const result = game.guess();
  if (result === "AnswerLengthError") return;
  if (result === "GuessLimitError") return;
  if (result === "InvalidWordError") {
    const message = document.getElementById("any-message")!;
    message.textContent = "단어를 찾을 수 없습니다.";
    return;
  }

  const inputBuffer = game.getAnswerBuffer();
  const guessCount = game.getGuessCount();

  nextFocus = false;
  updateFocusTimeout();

  updateRowCellState(guessCount - 1, result); // first guess -> row index 0
  const keyboardState = new Map<string, CellState>();
  for (let i = 0; i < result.length; i++) {
    if ((keyboardState.get(inputBuffer[i]!) ?? 0) > result[i]!) {
      continue;
    }
    keyboardState.set(inputBuffer[i]!, result[i]!);
  }
  updateKeyboard(keyboardState);
  game.clearAnswer();

  if (result.every((v) => v === CellState.Correct)) {
    // win

    const any_message = document.getElementById("any-message")!;
    const correct_answer_message = document.getElementById("correct-answer")!;
    const answer_meaning_message = document.getElementById("answer-meaning")!;

    const wordDict = await getWordDict();

    const messages = endingMessage.slice(guessCount - 1, 5).flat();
    any_message.textContent =
      messages[Math.floor(Math.random() * messages.length)] ?? "";
    correct_answer_message.textContent = `${game.getCorrectAnswer()}`;
    answer_meaning_message.textContent = `${wordDict[game.getCorrectAnswer()]}`;

    game = undefined;
    nextGameButton.hidden = false;
  } else if (guessCount >= game.getGuessLimit()) {
    // lose

    const any_message = document.getElementById("any-message")!;
    const correct_answer_message = document.getElementById("correct-answer")!;
    const answer_meaning_message = document.getElementById("answer-meaning")!;

    const wordDict = await getWordDict();

    const messages = endingMessage[5]!;
    any_message.textContent =
      messages[Math.floor(Math.random() * messages.length)] ?? "";
    correct_answer_message.textContent = `${game.getCorrectAnswer()}`;
    answer_meaning_message.textContent = `${wordDict[game.getCorrectAnswer()]}`;

    game = undefined;
    nextGameButton.hidden = false;
  } else {
    // next guess
    const any_message = document.getElementById("any-message")!;
    any_message.textContent = "";
  }
}

const nextGameButton = document.getElementById("next-game") as HTMLButtonElement;
nextGameButton.addEventListener("click", async () => {
  nextGameButton.disabled = true;

  try {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0]!;
    const [answer, wordList] = await Promise.all([
      getAnswer(seed),
      getWordList(),
    ]);

    resetGameUi();
    game = new NatmalGame(answer, wordList);
    nextGameButton.hidden = true;
  } finally {
    nextGameButton.disabled = false;
  }
});

const useConciseKeyboard = document.getElementById("concise-keyboard") as HTMLInputElement;
const mobileThreshold = 768;
if (window.innerWidth <= mobileThreshold) {
  useConciseKeyboard.checked = true;
}

const keys = document.getElementsByClassName("keyboard-key-input");
for (let i = 0; i < keys.length; i++) {
  keys[i]!.addEventListener("mousedown", () => {
    const key = keys[i]!;
    const keyValue = key.getAttribute("key");
    if (keyValue === null) return;
    if (keyValue === "Enter") {
      tryGuess();
    } else if (keyValue === "Backspace") {
      tryBackspace();
    } else {
      tryKey(keyValue);
    }
  });
}

/**
 * 지정된 row에 문자열 업데이트
 *
 * @param rowId 업데이트할 row 번호
 * @param inputBuffer
 */
function updateRowText(rowId: number, inputBuffer: readonly string[]) {
  const row = document.getElementById(`row-${rowId}`)!;
  for (let i = 0; i < 6; i++) {
    const cell = row.children[i] as HTMLTableCellElement;
    cell.getElementsByClassName("letter-text")[0]!.textContent =
      inputBuffer[i] ?? "";

    if (i == inputBuffer.length - 1) {
      // last cell with text
      cell.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.1)" },
            { transform: "scale(1)" }
          ],
          {
            duration: 200,
            easing: "ease"
          }
        );
      
    }
  }
}

/**
 * inputBuffer와 정답 비교해 지정된 row에 반영
 *
 * @param rowId 수정할 row 번호(start 1)
 * @param inputBuffer
 * @param answer
 * @returns
 */
function updateRowCellState(rowId: number, state: CellState[]) {
  const row = document.getElementById(`row-${rowId}`)!;
  for (let i = 0; i < 6; i++) {
    const cell = row.children[i] as HTMLTableCellElement;
    cell.classList.remove("unchecked");

    cell.classList.add(CellState[state[i]!].toLowerCase());
  }
  return state;
}

function updateKeyboard(stateAppend: Map<string, CellState>) {
  for (const [key, value] of stateAppend.entries()) {
    const cell = document.getElementById(`key-${key}`);

    if (!cell) {
      continue;
    }

    cell.classList.remove("unchecked");
    if (cell.classList.contains("correct")) {
      continue;
    } else if (
      cell.classList.contains("malposition") &&
      value !== CellState.Correct
    ) {
      continue;
    }
    cell.classList.add(CellState[value].toLowerCase());
  }
}

function updateFocusTimeout() {
  if (focusTimeoutId) clearTimeout(focusTimeoutId);
  focusTimeoutId = setTimeout(() => {
    nextFocus = true;
  }, 500);
}

function resetGameUi() {
  document.querySelectorAll<HTMLElement>(".letter-text").forEach((element) => {
    element.textContent = "";
  });

  document
    .querySelectorAll<HTMLElement>(".letter, .keyboard-key-input")
    .forEach((element) => {
      element.classList.remove("correct", "malposition", "absent");
      element.classList.add("unchecked");
    });

  for (const id of ["any-message", "correct-answer", "answer-meaning"]) {
    document.getElementById(id)!.textContent = "";
  }

  if (focusTimeoutId !== undefined) {
    clearTimeout(focusTimeoutId);
    focusTimeoutId = undefined;
  }
  nextFocus = false;
}

async function getDailyAnswer(date: number): Promise<string> {
  const day = Math.floor(date / 1000 / 60 / 60 / 24);
  return getAnswer(day);
}

async function getAnswer(seed: number): Promise<string> {
  const wordList = await getWordList();

  let x = seed;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  x ^= x >>> 15;

  // unsigned 32-bit integer -> [0, 1)
  const random = (x >>> 0) / 2 ** 32;

  const answer = wordList[Math.floor(random * wordList.length)]!;
  return answer;
}
