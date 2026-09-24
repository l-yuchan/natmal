export type Definitions = Record<string, string>;

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`load failed: ${url} (${res.status})`);
  return res.json();
}

let validWordList: Promise<readonly string[]> | undefined;
let answerWordList: Promise<readonly string[]> | undefined;
let wordDict: Promise<Definitions> | undefined;

export async function getValidWordList(): Promise<readonly string[]> {
  return (validWordList ??= loadValidWordList());
}

export async function getAnswerWordList(): Promise<readonly string[]> {
  return (answerWordList ??= loadAnswerWordList());
}

async function loadValidWordList(): Promise<readonly string[]> {
  let data;
  try {
      data = await fetchJson("valid_words.json");
    } catch (e) {
      validWordList = undefined;
      throw e;
    }
  
    if (!Array.isArray(data) || !data.every((x): x is string => typeof x === "string")) {
      throw new TypeError(`Unexpected JSON shape from words.json`);
    }
    return data;
}

async function loadAnswerWordList(): Promise<readonly string[]> {
  let data;
  try {
      data = await fetchJson("answer_words.json");
    } catch (e) {
      answerWordList = undefined;
      throw e;
    }
  
    if (!Array.isArray(data) || !data.every((x): x is string => typeof x === "string")) {
      throw new TypeError(`Unexpected JSON shape from answer_words.json`);
    }
    return data;
}

export async function getWordDict(): Promise<Definitions> {
  return (wordDict ??= loadWordDict());
}

async function loadWordDict(): Promise<Definitions> {
  let data;
  try {
      data = await fetchJson("definitions.json");
    } catch (e) {
      wordDict = undefined;
      throw e;
    }
  
    if (typeof data !== "object" || data === null || !Object.values(data).every((x) => typeof x === "string")) {
      throw new TypeError(`Unexpected JSON shape from definitions.json`);
    }
    return data as unknown as Definitions;
}
