import { convertSentenceToKeyArray } from "./converter"; // 기존 자판 분해 함수 경로

export interface WongoziCell {
  targetText: string;
  targetKeys: string;
  type:
    | "normal"
    | "number"
    | "open-quote"
    | "close-quote"
    | "combined"
    | "comma-dot";
}

function preprocessSentence(sentence: string): string {
  return sentence
    .replace(/([.,?!'’"”])\s+/g, "$1")
    .replace(/\s+([.,?!'’"”])/g, "$1");
}

export function formatToWongoziCells(rawSentence: string): WongoziCell[] {
  // 1. 먼저 원고지 문장 부호 규칙에 맞게 띄어쓰기를 전처리(수정)합니다.
  const cleanedSentence = preprocessSentence(rawSentence);

  const chars = cleanedSentence.split("");
  const cells: WongoziCell[] = [];
  let i = 0;

  // 부호 판별 헬퍼
  const isOpenQuote = (c: string) => c === "‘" || c === "“";
  const isCloseQuote = (c: string) => c === "’" || c === "”";
  const isBigQuote = (c: string) => c === '"';
  const isSmallQuote = (c: string) => c === "'";
  const isDotOrComma = (c: string) => c === "." || c === ",";

  const bigQuoteIndexs = cleanedSentence.split("").reduce((acc, el, idx) => {
    if (el === '"') acc.push(idx);
    return acc;
  }, [] as number[]);
  const smallQuoteIndexs = cleanedSentence.split("").reduce((acc, el, idx) => {
    if (el === "'") acc.push(idx);
    return acc;
  }, [] as number[]);

  while (i < chars.length) {
    const char = chars[i];
    const nextChar = chars[i + 1];

    // -----------------------------------------------------------------
    // [규칙 B] 온점/반점 + 따옴표 결합 (여는 따옴표든 닫는 따옴표든 한 칸에 동거)
    // -----------------------------------------------------------------
    // 다음 글자(nextChar)가 어떤 형태의 따옴표(유니코드 따옴표 또는 일반 따옴표)든 무조건 참
    const isNextAnyQuote =
      isCloseQuote(nextChar) ||
      isOpenQuote(nextChar) ||
      isBigQuote(nextChar) ||
      isSmallQuote(nextChar);

    if (isDotOrComma(char) && nextChar && isNextAnyQuote) {
      const combinedText = char + nextChar; // 예: '."' 또는 '.,' 등
      const combinedKeys =
        convertSentenceToKeyArray(char).join("") +
        convertSentenceToKeyArray(nextChar).join("");

      cells.push({
        targetText: combinedText,
        targetKeys: combinedKeys,
        type: "combined", // UI단에서 쪼개서 그려줄 타입
      });

      i += 2; // 온점과 따옴표 두 글자를 한 번에 소비했으므로 2칸 전진
      continue;
    }

    // -----------------------------------------------------------------
    // [규칙 C] 단독 온점이나 반점 처리 (뒤에 따옴표가 없는 경우)
    // -----------------------------------------------------------------
    if (isDotOrComma(char)) {
      cells.push({
        targetText: char,
        targetKeys: convertSentenceToKeyArray(char).join(""),
        type: "comma-dot",
      });
      i += 1;
      continue;
    }

    // -----------------------------------------------------------------
    // [규칙 D] 숫자 연속 처리 (최대 두 자리 묶음)
    // -----------------------------------------------------------------
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

    // -----------------------------------------------------------------
    // [규칙 E-1] 여는 따옴표 (오른쪽 상단 배치)
    // -----------------------------------------------------------------
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

    // -----------------------------------------------------------------
    // [규칙 E-2] 닫는 따옴표 (왼쪽 상단 배치)
    // -----------------------------------------------------------------
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

    // -----------------------------------------------------------------
    // [규칙 F] 일반 글자 및 공백 처리
    // -----------------------------------------------------------------
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
      // 💡 첫 따옴표 (여는 따옴표): 칸의 [우측 상단]에 바짝 붙입니다.
      // text-3xl로 크기를 키워 시각적 존재감을 주고, 오른쪽 위로 밀어줍니다.
      return "right-1 top-0.5 text-3xl flex items-start justify-end w-full h-full p-1";

    case "close-quote":
      // 💡 마지막 따옴표 (닫는 따옴표): 칸의 [좌측 상단]에 바짝 붙입니다.
      return "left-1 top-0.5 text-3xl flex items-start justify-start w-full h-full p-1";

    case "number":
      // 💡 숫자의 경우: 두 글자가 한 칸에 옹기종기 들어가야 하므로,
      // 폰트 크기를 살짝 줄이고(text-base~lg) 자간을 좁혀서(tracking-tighter) 정중앙에 배치합니다.
      return "text-2xl tracking-tighter flex items-center justify-center w-full h-full";

    case "comma-dot":
      return "left-1 -bottom-3 text-2xl flex items-start justify-start w-full h-full p-1";

    case "combined":
      // 💡 온점+따옴표 결합: 이 타입은 App.tsx 내부 레이어에서
      // 직접 <span> 두 개로 쪼개어 개별 배정하므로 기본 빈 값을 반환합니다.
      return "";

    case "normal":
    default:
      // 💡 일반 한글/공백: 칸의 정확한 [정중앙]에 기본 크기로 배치합니다.
      return "text-2xl flex items-center justify-center w-full h-full";
  }
}
