const CHOSEONG_BASE = 0x1100; // 현대 초성 19개: U+1100-U+1112
const JUNGSEONG_BASE = 0x1161; // 현대 중성 21개: U+1161-U+1175
const JONGSEONG_BASE = 0x11a7; // index 0 = 종성없음; 현대 종성 27개: U+11A8-U+11C2

// jamoToCompat start

// Choseong index -> Compatibility Jamo
const CHOSEONG_TO_COMPAT: readonly string[] = [
  "\u3131",
  "\u3132",
  "\u3134",
  "\u3137",
  "\u3138",
  "\u3139",
  "\u3141",
  "\u3142",
  "\u3143",
  "\u3145",
  "\u3146",
  "\u3147",
  "\u3148",
  "\u3149",
  "\u314A",
  "\u314B",
  "\u314C",
  "\u314D",
  "\u314E",
];

// Jongseong index -> Compatibility Jamo
const JONGSEONG_TO_COMPAT: readonly (string | null)[] = [
  null,
  "\u3131",
  "\u3132",
  "\u3133",
  "\u3134",
  "\u3135",
  "\u3136",
  "\u3137",
  "\u3139",
  "\u313A",
  "\u313B",
  "\u313C",
  "\u313D",
  "\u313E",
  "\u313F",
  "\u3140",
  "\u3141",
  "\u3142",
  "\u3144",
  "\u3145",
  "\u3146",
  "\u3147",
  "\u3148",
  "\u314A",
  "\u314B",
  "\u314C",
  "\u314D",
  "\u314E",
];

/**
 * Converts Jamo characters to their compatibility equivalents. | 자모 문자를 호환성 자모로 변환합니다.
 *
 * @input NFD normalized string | NFD 정규화된 자모 문자열
 */
export function jamoToCompat(input: string): string {
  return Array.from(input, (ch) => {
    const cp = ch.codePointAt(0)!;

    if (cp >= JUNGSEONG_BASE && cp < JUNGSEONG_BASE + 21) {
      return String.fromCodePoint(0x314f + (cp - JUNGSEONG_BASE));
    }
    if (cp >= CHOSEONG_BASE && cp < CHOSEONG_BASE + 19) {
      return CHOSEONG_TO_COMPAT[cp - CHOSEONG_BASE];
    }
    if (cp > JONGSEONG_BASE && cp <= JONGSEONG_BASE + 27) {
      return JONGSEONG_TO_COMPAT[cp - JONGSEONG_BASE] ?? ch;
    }
    return ch; // non-Jamo input, or archaic Jamo (U+1113+ etc.) with no compat equivalent
  }).join("");
}

// jamoToCompat end

// alphabetToJamo start

const alphabetJamoMap: Record<string, string> = {
  q: "\u3142",
  Q: "\u3143",
  w: "\u3148",
  W: "\u3149",
  e: "\u3137",
  E: "\u3138",
  r: "\u3131",
  R: "\u3132",
  t: "\u3145",
  T: "\u3146",
  y: "\u315B",
  u: "\u3155",
  i: "\u3151",
  o: "\u3150",
  O: "\u3152",
  p: "\u3154",
  P: "\u3156",
  a: "\u3141",
  s: "\u3134",
  d: "\u3147",
  f: "\u3139",
  g: "\u314E",
  h: "\u3157",
  j: "\u3153",
  k: "\u314F",
  l: "\u3163",
  z: "\u314B",
  x: "\u314C",
  c: "\u314A",
  v: "\u314D",
  b: "\u3160",
  n: "\u315C",
  m: "\u3161",
};

/**
 * QWERTY alphabet input into Jamo assuming Dubeolsik keyboard | QWERTY 알파벳 입력을 두벌식 한국어로 취급하여 자모로 변환합니다.
 */
export function alphabetToJamo(input: string): string {
  return input
    .split("")
    .map(
      (ch) =>
        alphabetJamoMap[ch] ?? alphabetJamoMap[ch.toLocaleLowerCase()] ?? ch,
    )
    .join("");
}

// alphabetToJamo end

// composeJamo start

const compositionMap: Record<string, string> = {
  "\u3131\u3145": "\u3133",
  "\u3134\u3148": "\u3135",
  "\u3134\u314E": "\u3136",
  "\u3139\u3131": "\u313A",
  "\u3139\u3141": "\u313B",
  "\u3139\u3142": "\u313C",
  "\u3139\u3145": "\u313D",
  "\u3139\u314C": "\u313E",
  "\u3139\u314D": "\u313F",
  "\u3139\u314E": "\u3140",
  "\u3142\u3145": "\u3144",
  "\u3157\u314F": "\u3158",
  "\u3157\u3150": "\u3159",
  "\u3157\u3163": "\u315A",
  "\u315C\u3153": "\u315D",
  "\u315C\u3154": "\u315E",
  "\u315C\u3163": "\u315F",
  "\u3161\u3163": "\u3162",
};

/**
 * Try to compose Jamo into compound letters, from back to front | 자모 문자들을 복합 글자로 합칩니다. 맨 뒤부터 시작합니다.
 *
 * # Example
 * ㄱㅅ -> ㄳ
 *
 * ㄹㅂㅅ -> ㄹㅄ
 *
 * ㅗㅐ -> ㅙ
 *
 * ㄱㅏ -> ㄱㅏ (Not combined into syllable | 음절로 합치지 않음)
 */
export function composeJamo(input: string): string {
  const result = [...input];

  for (let index = result.length - 2; index >= 0; index--) {
    const composed = compositionMap[result[index]! + result[index + 1]!];
    if (composed !== undefined) {
      result.splice(index, 2, composed);
    }
  }

  return result.join("");
}

// composeJamo end

// assembleJame start
const CHOSEONG = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const JUNGSEONG = [
  "ㅏ",
  "ㅐ",
  "ㅑ",
  "ㅒ",
  "ㅓ",
  "ㅔ",
  "ㅕ",
  "ㅖ",
  "ㅗ",
  "ㅘ",
  "ㅙ",
  "ㅚ",
  "ㅛ",
  "ㅜ",
  "ㅝ",
  "ㅞ",
  "ㅟ",
  "ㅠ",
  "ㅡ",
  "ㅢ",
  "ㅣ",
];

const JONGSEONG = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄵ",
  "ㄶ",
  "ㄷ",
  "ㄹ",
  "ㄺ",
  "ㄻ",
  "ㄼ",
  "ㄽ",
  "ㄾ",
  "ㄿ",
  "ㅀ",
  "ㅁ",
  "ㅂ",
  "ㅄ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const initialIndex = new Map(CHOSEONG.map((c, i) => [c, i]));
const medialIndex = new Map(JUNGSEONG.map((c, i) => [c, i]));
const finalIndex = new Map(JONGSEONG.map((c, i) => [c, i]));

function assembleSyllable(
  initial: string,
  medial: string,
  final?: string,
): string {
  const l = initialIndex.get(initial);
  const v = medialIndex.get(medial);
  const t = final ? finalIndex.get(final) : 0;

  if (l === undefined || v === undefined || t === undefined) {
    throw new Error("Invalid Hangul combination");
  }

  return String.fromCodePoint(0xac00 + (l * 21 + v) * 28 + t);
}

/**
 * Compatibility Jamo -> Syllable
 *
 * @param input Compatibility Jamo string
 * @returns
 */
export function assembleJamo(input: string): string {
  const chars = [...input];
  let out = "";

  for (let i = 0; i < chars.length;) {
    const initial = chars[i]!;
    const medial = chars[i + 1];

    if (
      medial === undefined ||
      !initialIndex.has(initial) ||
      !medialIndex.has(medial)
    ) {
      out += initial;
      i += 1;
      continue;
    }

    const candidateFinal = chars[i + 2];
    const afterFinal = chars[i + 3];

    if (
      candidateFinal !== undefined &&
      finalIndex.has(candidateFinal) &&
      (afterFinal === undefined || !medialIndex.has(afterFinal))
    ) {
      out += assembleSyllable(initial, medial, candidateFinal);
      i += 3;
    } else {
      out += assembleSyllable(initial, medial);
      i += 2;
    }
  }

  return out;
}

// assembleJamo end
