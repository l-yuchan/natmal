export type DefinitionEntry = readonly [definition: string, category: string];
export type Definitions = Record<string, DefinitionEntry>;

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`load failed: ${url} (${res.status})`);
  return res.json();
}

let wordList: Promise<readonly string[]> | undefined;
let wordDict: Promise<Definitions> | undefined;

export async function getWordList(): Promise<readonly string[]> {
  return (wordList ??= loadWordList());
}

async function loadWordList(): Promise<readonly string[]> {
  let data;
  try {
      data = await fetchJson("words.json");
    } catch (e) {
      wordList = undefined;
      throw e;
    }
  
    if (!Array.isArray(data) || !data.every((x): x is string => typeof x === "string")) {
      throw new TypeError(`Unexpected JSON shape from words.json`);
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
  
    if (typeof data !== "object" || data === null || !Object.values(data).every((x): x is DefinitionEntry => Array.isArray(x) && x.length === 2)) {
      throw new TypeError(`Unexpected JSON shape from definitions.json`);
    }
    return data as unknown as Definitions;
}
