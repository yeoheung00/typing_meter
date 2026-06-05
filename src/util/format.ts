import { convertSentenceToKeyArray } from "./converter";

// 💡 단일 아키텍처 관리를 위해 absoluteIndex와 오타 관련 옵션들을 온전하게 가공 탑재함
export interface WongoziCell {
  targetText: string;
  targetKeys: string;
  type:
    | "normal"
    | "number"
    | "open-quote"
    | "close-quote"
    | "combined"
    | "comma-dot"
    | "margin";
  originalType?:
    | "normal"
    | "number"
    | "open-quote"
    | "close-quote"
    | "combined"
    | "comma-dot";
}
export function preprocessSentence(sentence: string): string {
  return (
    sentence
      // 1. 문장부호 뒤에 오는 공백들 제거
      .replace(/([.,?!'’"”])\s+/g, "$1")
      // 2. 문장부호 앞에 오는 공백들 제거
      .replace(/\s+([.,?!'’"”])/g, "$1")
      // 💡 [추가] 2개 이상 연속된 모든 공백(스페이스, 탭 등)을 단 하나의 공백(" ")으로 축소
      .replace(/\s+/g, " ")
      // (선택사항) 문장 앞뒤에 불필요하게 남은 공백이 있다면 깔끔하게 제거
      .trim()
  );
}

export function formatToWongoziCells(sentence: string): WongoziCell[] {
  const chars = sentence.split("");
  const cells: WongoziCell[] = [];
  let i = 0;

  const isOpenQuote = (c: string) => c === "‘" || c === "“";
  const isCloseQuote = (c: string) => c === "’" || c === "”";
  const isBigQuote = (c: string) => c === '"';
  const isSmallQuote = (c: string) => c === "'";
  const isDotOrComma = (c: string) => c === "." || c === ",";

  const bigQuoteIndexs = sentence.split("").reduce((acc, el, idx) => {
    if (el === '"') acc.push(idx);
    return acc;
  }, [] as number[]);
  const smallQuoteIndexs = sentence.split("").reduce((acc, el, idx) => {
    if (el === "'") acc.push(idx);
    return acc;
  }, [] as number[]);

  while (i < chars.length) {
    const char = chars[i];
    const nextChar = chars[i + 1];

    const isNextAnyQuote =
      isCloseQuote(nextChar) ||
      isOpenQuote(nextChar) ||
      isBigQuote(nextChar) ||
      isSmallQuote(nextChar);

    if (isDotOrComma(char) && nextChar && isNextAnyQuote) {
      const combinedText = char + nextChar;
      const combinedKeys =
        convertSentenceToKeyArray(char).join("") +
        convertSentenceToKeyArray(nextChar).join("");

      cells.push({
        targetText: combinedText,
        targetKeys: combinedKeys,
        type: "combined",
      });
      i += 2;
      continue;
    }

    if (isDotOrComma(char)) {
      cells.push({
        targetText: char,
        targetKeys: convertSentenceToKeyArray(char).join(""),
        type: "comma-dot",
      });
      i += 1;
      continue;
    }

    if (char !== " " && !isNaN(Number(char))) {
      let numBuffer = char;
      if (nextChar && !isNaN(Number(nextChar))) {
        numBuffer += nextChar;
        cells.push({
          targetText: numBuffer,
          targetKeys: numBuffer,
          type: "number",
        });
        i += 2;
      } else {
        cells.push({
          targetText: numBuffer,
          targetKeys: numBuffer,
          type: "number",
        });
        i += 1;
      }
      continue;
    }

    if (
      isOpenQuote(char) ||
      (isBigQuote(char) && bigQuoteIndexs.indexOf(i) % 2 === 0) ||
      (isSmallQuote(char) && smallQuoteIndexs.indexOf(i) % 2 === 0)
    ) {
      cells.push({
        targetText: char,
        targetKeys: convertSentenceToKeyArray(char).join(""),
        type: "open-quote",
      });
      i += 1;
      continue;
    }

    if (
      isCloseQuote(char) ||
      (isBigQuote(char) && bigQuoteIndexs.indexOf(i) % 2 === 1) ||
      (isSmallQuote(char) && smallQuoteIndexs.indexOf(i) % 2 === 1)
    ) {
      cells.push({
        targetText: char,
        targetKeys: convertSentenceToKeyArray(char).join(""),
        type: "close-quote",
      });
      i += 1;
      continue;
    }

    cells.push({
      targetText: char,
      targetKeys: convertSentenceToKeyArray(char).join(""),
      type: "normal",
    });
    i += 1;
  }

  return cells;
}

export function getCellStyle(type: WongoziCell["type"]): string {
  switch (type) {
    case "open-quote":
      return "absolute right-1 top-0.5 text-3xl flex items-start justify-end w-full h-full p-1";
    case "close-quote":
      return "absolute left-1 top-0.5 text-3xl flex items-start justify-start w-full h-full p-1";
    case "number":
      return "absolute text-2xl tracking-tighter flex items-center justify-center w-full h-full";
    case "comma-dot":
      return "absolute left-1 -bottom-3 text-3xl flex items-start justify-start w-full h-full p-1";
    case "combined":
      return "";
    case "normal":
    default:
      return "absolute text-2xl flex items-center justify-center w-full h-full";
  }
}
