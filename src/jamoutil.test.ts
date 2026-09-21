import { describe, test, expect } from "vitest";
import { jamoToCompat, composeJamo, assembleJamo } from "./jamoutil";
describe("jamoToCompat", () => {
  test("matched", () => {
    const result = jamoToCompat("\u110Bㅏㄴ녕".normalize("NFD"));
    expect(result).toStrictEqual("ㅇㅏㄴㄴㅕㅇ");
  });
});

describe("composeJamo", () => {
  test("matched", () => {
    const result = composeJamo("\u3142\u3145");
    expect(result).toStrictEqual("\u3144");
  });

  test("not matched", () => {
    const result = composeJamo("\u3142\u3147");
    expect(result).toStrictEqual("\u3142\u3147");
    const result2 = composeJamo("ㅁ");
    expect(result2).toStrictEqual("ㅁ");
  });

  test("long phrase compose order", () => {
    const result = composeJamo("\u3139\u3142\u3145");
    expect(result).toStrictEqual("\u3139\u3144");
  });
});

describe("assembleJamo", () => {
  test("matched", () => {
    const result = assembleJamo("ㄱㅗㄱ");
    expect(result).toStrictEqual("곡");
  });

  test("not matched", () => {
    const result = assembleJamo("ㅓㄴㄴ");
    expect(result).toStrictEqual("ㅓㄴㄴ");
  });

  test("겹자음 not made", () => {
    const result = assembleJamo("ㅇㅏㄴㅈㄷㅏ");
    expect(result).toStrictEqual("안ㅈ다");
  });
});