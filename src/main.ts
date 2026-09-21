import "./style.css";
import {
  jamoToCompat,
  alphabetToJamo,
  composeJamo,
  assembleJamo,
} from "./jamoutil";
import { getWordList, getWordDict } from "./dict";

type CellState = "unchecked" | "correct" | "malposition" | "absent";

let gameState: "playing" | "end" = "playing";
let nextFocus = false; // if true, do not allow composing(ㄹ+ㅁ -> ㄻ)
let focusTimeoutId: number | undefined;
let guessCount = 0;

// korean keyboard input -> buffer
const inputBuffer: string[] = [];

window.addEventListener("keydown", async (event: KeyboardEvent) => {
  if (
    event.isComposing ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    gameState === "end"
  )
    return;

  const target = event.target as HTMLElement | null;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target?.isContentEditable
  ) {
    return;
  }

  // 공포의 겹겹이 지옥! ㅗ+ㅐ=ㅙ 저한테 이러시는 건데요 아아악

  if (event.key === "Backspace") {
    inputBuffer.pop();
    updateRow(guessCount, inputBuffer);
    nextFocus = false;
    updateFocusTimeout();
    event.preventDefault();
    return;
  } else if (event.key === " ") {
    nextFocus = true;
    event.preventDefault();
    return;
  } else if (/^[a-zA-Z]$/.test(event.key)) {
    const input = jamoToCompat(alphabetToJamo(event.key));
    const composeCandidate = composeJamo(
      inputBuffer[inputBuffer.length - 1] + input,
    );
    if (!nextFocus && inputBuffer.length != 0 && composeCandidate.length == 1) {
      inputBuffer[inputBuffer.length - 1] = composeCandidate[0]!;
    } else if (inputBuffer.length < 6) {
      inputBuffer.push(input);
    }

    nextFocus = false;
    updateFocusTimeout();
    updateRow(guessCount, inputBuffer);
    event.preventDefault();
  } else if (event.key === "Enter") {
    if (inputBuffer.length != 6) return;
    const input = assembleJamo(inputBuffer.join(""));

    nextFocus = false;
    updateFocusTimeout();
    if ((await getWordList()).includes(input)) {
      completeRow(guessCount, inputBuffer, await getAnswer(Date.now()));
      inputBuffer.length = 0;
      const correct_answer = await getAnswer(Date.now());
      if (input === correct_answer || guessCount >= 5) {
        gameState = "end";
        const correct_answer_message =
          document.getElementById("correct-answer")!;
        const answer_meaning_message =
          document.getElementById("answer-meaning")!;
        const wordDict = await getWordDict();
        correct_answer_message.textContent = `${correct_answer}`;
        answer_meaning_message.textContent = `${wordDict[correct_answer]}`;
      } else {
        guessCount++;
      }
    } else {
      const message = document.getElementById("any-message")!;
      message.textContent = "단어를 찾을 수 없습니다.";
    }
  }
});

/**
 * 지정된 row에 문자열 업데이트
 *
 * @param rowId 업데이트할 row 번호
 * @param inputBuffer
 */
function updateRow(rowId: number, inputBuffer: string[]) {
  const inputString = inputBuffer.join("");
  const row = document.getElementById(`row-${rowId}`)!;
  for (let i = 0; i < 6; i++) {
    const cell = row.children[i] as HTMLTableCellElement;
    cell.getElementsByClassName("letter-text")[0]!.textContent =
      inputString[i] ?? "";
  }
}

/**
 * inputBuffer와 정답 비교해 지정된 row에 반영
 *
 * @param rowId 수정할 row 번호
 * @param inputBuffer
 * @param answer
 * @returns
 */
function completeRow(rowId: number, inputBuffer: string[], answer: string) {
  const inputString = inputBuffer.join("");
  const answerCompat = jamoToCompat(answer.normalize("NFD"));
  let state: CellState[] = [];
  const letterCounter = new Map<string, number>(); // malposition 표시 가능한 개수
  
  for (let i = 0; i < inputString.length; i++) {
    if (inputString[i] === answerCompat[i]) {
      state.push("correct");
    } else if (answerCompat.includes(inputString[i]!)) {
      state.push("malposition");
      letterCounter.set(
        answerCompat[i]!,
        (letterCounter.get(answerCompat[i]!) ?? 0) + 1,
      );
    } else {
      state.push("absent");
      letterCounter.set(
        answerCompat[i]!,
        (letterCounter.get(answerCompat[i]!) ?? 0) + 1,
      );
    }
  }

  const row = document.getElementById(`row-${rowId}`)!;
  for (let i = 0; i < 6; i++) {
    const cell = row.children[i] as HTMLTableCellElement;
    cell.classList.remove("unchecked");
    
    if (
      state[i] === "malposition" &&
      (letterCounter.get(inputString[i]!) ?? 0) <= 0
    ) {
      state[i] = "absent";
    } else {
      letterCounter.set(
        inputString[i]!,
        (letterCounter.get(inputString[i]!) ?? 0) - 1,
      );
    }
    
    cell.classList.add(state[i]!);
  }
  return state;
}

function updateFocusTimeout() {
  if (focusTimeoutId) clearTimeout(focusTimeoutId);
  focusTimeoutId = setTimeout(() => {
    nextFocus = true;
  }, 1000);
}

async function getAnswer(date: number): Promise<string> {
  const wordList = await getWordList();
  const dayFromUtcEpoch = Math.floor(date / 1000 / 60 / 60 / 24);

  let x = dayFromUtcEpoch;
  x = Math.imul(x ^ (x >>> 16), 0x21f0aaad);
  x = Math.imul(x ^ (x >>> 15), 0x735a2d97);
  x ^= x >>> 15;

  // unsigned 32-bit integer -> [0, 1)
  const random = (x >>> 0) / 2 ** 32;

  const answer = wordList[Math.floor(random * wordList.length)]!;
  return answer;
}
