import { jamoToCompat, composeJamo, assembleJamo } from "./jamoutil";

/**
 * letter나 key 등이 모두 공유
 */
export enum CellState {
  Unchecked,
  Absent,
  Malposition,
  Correct,
}

/**
 * 논리적 게임 클래스
 *
 * HTML 관련 작업 X
 */
export class NatmalGame {
  private guessCount: number;
  private guessLimit: number;
  private correctAnswer: string;
  private answerBuffer: string[];
  private answerLength: number;
  private wordList: readonly string[];

  constructor(
    answer: string,
    wordList: readonly string[],
    guessLimit: number = 5,
    answerLength: number = 6,
  ) {
    this.correctAnswer = answer;
    this.guessCount = 0;
    this.answerBuffer = [];
    this.wordList = wordList;
    this.guessLimit = guessLimit;
    this.answerLength = answerLength;
  }

  public getAnswerBuffer(): readonly string[] {
    return this.answerBuffer;
  }

  public getGuessCount(): number {
    return this.guessCount;
  }

  public getGuessLimit(): number {
    return this.guessLimit;
  }

  public getCorrectAnswer(): string {
    return this.correctAnswer;
  }

  /**
   * compose: answerBuffer 마지막 자모와 합성 허용. `answerBuffer` 꽉 찬 상태에서도 오류나지 않음
   * 
   * @param jamo Compatibility Jamo
   * @param compose 
   * @returns 에러 혹은 append 성공 여부
   */
  public appendAnswer(jamo: string, compose: boolean = false): "InputLengthError" | "AnswerLengthError" | boolean {
    if (jamo.length !== 1) return "InputLengthError";
    if (compose) {
      const composedJamo = composeJamo(this.answerBuffer[-1] ?? "" + jamo);
      if (composedJamo.length == 1) {
        this.answerBuffer[this.answerBuffer.length - 1] = composedJamo;
      } else if (this.answerBuffer.length < this.answerLength) {
        this.answerBuffer.push(jamo);
      } else {
        return "AnswerLengthError";
      }
    } else {
      if (this.answerBuffer.length < this.answerLength) {
        this.answerBuffer.push(jamo);
      } else {
        return "AnswerLengthError";
      }
    }

    return true;
  }

  public backspaceAnswer(): boolean {
    return this.answerBuffer.pop() !== undefined;
  }

  public clearAnswer(): void {
    this.answerBuffer.length = 0;
  }
  
  public guess():
    "AnswerLengthError" | "GuessLimitError" | "InvalidWordError" | CellState[] {
    if (this.answerBuffer.length !== this.answerLength) {
      return "AnswerLengthError";
    }
    if (this.guessCount >= this.guessLimit) {
      return "GuessLimitError";
    }
    const guessedAnswer = assembleJamo(this.answerBuffer.join(""));
    if (!this.wordList.includes(guessedAnswer)) {
      return "InvalidWordError";
    }
    const decomposedCorrect = jamoToCompat(this.correctAnswer.normalize("NFD"));

    this.guessCount++;

    const result: CellState[] = [];
    const malpositionAvailable: { [key: string]: number } = {};
    // malposition은 정답에서 나오는 개수가 최대
    for (let i = 0; i < this.answerLength; i++) {
      const char = decomposedCorrect[i]!;
      malpositionAvailable[char] = (malpositionAvailable[char] ?? 0) + 1;
    }
    // correct 개수만큼 malposition 기회 감소
    for (let i = 0; i < this.answerLength; i++) {
      if (this.answerBuffer[i] === decomposedCorrect[i]) {
        malpositionAvailable[this.answerBuffer[i]!] =
          (malpositionAvailable[this.answerBuffer[i]!] ?? 0) - 1;
      }
    }

    for (let i = 0; i < this.answerLength; i++) {
      if (this.answerBuffer[i] === decomposedCorrect[i]) {
        result.push(CellState.Correct);
      } else if (malpositionAvailable[this.answerBuffer[i]!]! > 0) {
        result.push(CellState.Malposition);
        malpositionAvailable[this.answerBuffer[i]!]!--;
      } else {
        result.push(CellState.Absent);
      }
    }

    return result;
  }
}
