import { convertSentenceToKeyArray } from "./converter";

interface WongoziCell {
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
  originalType?: WongoziCell["type"];
}

export interface FinalWongozi extends WongoziCell {
  isErr?: boolean;
  cursor?: boolean;
}

// 1. 유틸리티 가드 함수들을 가독성 좋게 단일 객체나 순수 함수로 정리
const isPunctuationCell = (c: WongoziCell | undefined): boolean => {
  if (!c?.targetText) return false;
  if (["combined", "open-quote", "close-quote"].includes(c.type)) return true;

  // 특수문자 검사 (한글, 영문, 숫자, 공백 제외)
  return /[^가-힣ㄱ-ㅣa-zA-Z0-9\s]/.test(c.targetText);
};

const QUOTE_MAP = {
  open: new Set(["‘", "“"]),
  close: new Set(["’", "”"]),
  rawBig: '"',
  rawSmall: "'",
};

export function preprocessSentence(sentence: string): string {
  return sentence
    .replace(/([.,?!'’"”])\s+/g, "$1")
    .replace(/\s+([.,?!'’"”])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatToWongoziCells(sentence: string): WongoziCell[] {
  const chars = sentence.split("");
  const cells: WongoziCell[] = [];
  let i = 0;

  // 💡 성능 최적화: 매 문자마다 split().reduce()를 돌리던 무거운 로직을
  // 단 한 번의 단방향 스캔으로 열고 닫는 상태(토글 flag)를 관리하도록 개선
  let isBigQuoteOpen = false;
  let isSmallQuoteOpen = false;

  const getKeys = (char: string) => convertSentenceToKeyArray(char).join("");

  while (i < chars.length) {
    const char = chars[i];
    const nextChar = chars[i + 1];

    // A. 마침표/쉼표 + 따옴표 결합 세포 처리 (`combined`)
    const isNextQuote =
      QUOTE_MAP.open.has(nextChar) ||
      QUOTE_MAP.close.has(nextChar) ||
      nextChar === QUOTE_MAP.rawBig ||
      nextChar === QUOTE_MAP.rawSmall;

    if ((char === "." || char === ",") && nextChar && isNextQuote) {
      cells.push({
        targetText: char + nextChar,
        targetKeys: getKeys(char) + getKeys(nextChar),
        type: "combined",
      });

      // 결합하면서 따옴표 상태 동기화 토글
      if (nextChar === QUOTE_MAP.rawBig) isBigQuoteOpen = !isBigQuoteOpen;
      if (nextChar === QUOTE_MAP.rawSmall) isSmallQuoteOpen = !isSmallQuoteOpen;

      i += 2;
      continue;
    }

    // B. 단독 마침표/쉼표 처리 (`comma-dot`)
    if (char === "." || char === ",") {
      cells.push({
        targetText: char,
        targetKeys: getKeys(char),
        type: "comma-dot",
      });
      i += 1;
      continue;
    }

    // C. 연속된 숫자 처리 (`number`) - 최대 2자리 묶음 규칙 유지
    if (char !== " " && !isNaN(Number(char))) {
      const hasNextNum =
        nextChar && nextChar !== " " && !isNaN(Number(nextChar));
      const numBuffer = hasNextNum ? char + nextChar : char;

      cells.push({
        targetText: numBuffer,
        targetKeys: numBuffer, // 숫자는 자판 치는 변환 없이 그대로 키값 사용
        type: "number",
      });
      i += hasNextNum ? 2 : 1;
      continue;
    }

    // D. 열린 따옴표 판정 (`open-quote`)
    const isOpenQuoteCondition =
      QUOTE_MAP.open.has(char) ||
      (char === QUOTE_MAP.rawBig && !isBigQuoteOpen) ||
      (char === QUOTE_MAP.rawSmall && !isSmallQuoteOpen);

    if (isOpenQuoteCondition) {
      if (char === QUOTE_MAP.rawBig) isBigQuoteOpen = true;
      if (char === QUOTE_MAP.rawSmall) isSmallQuoteOpen = true;

      cells.push({
        targetText: char,
        targetKeys: getKeys(char),
        type: "open-quote",
      });
      i += 1;
      continue;
    }

    // E. 닫힌 따옴표 판정 (`close-quote`)
    const isCloseQuoteCondition =
      QUOTE_MAP.close.has(char) ||
      (char === QUOTE_MAP.rawBig && isBigQuoteOpen) ||
      (char === QUOTE_MAP.rawSmall && isSmallQuoteOpen);

    if (isCloseQuoteCondition) {
      if (char === QUOTE_MAP.rawBig) isBigQuoteOpen = false;
      if (char === QUOTE_MAP.rawSmall) isSmallQuoteOpen = false;

      cells.push({
        targetText: char,
        targetKeys: getKeys(char),
        type: "close-quote",
      });
      i += 1;
      continue;
    }

    // F. 일반 문자 처리 (`normal`)
    cells.push({
      targetText: char,
      targetKeys: getKeys(char),
      type: "normal",
    });
    i += 1;
  }

  return cells;
}

export function buildWongoziMatrix(
  formatCells: WongoziCell[],
): WongoziCell[][] {
  const matrix: WongoziCell[][] = [];
  let currentRow: WongoziCell[] = [];

  for (let i = 0; i < formatCells.length; i++) {
    currentRow.push(formatCells[i]);

    // 20칸이 채워졌고 다음 요소가 남아있을 때 행 분리 알고리즘 검사
    if (currentRow.length === 20 && i < formatCells.length - 1) {
      // 원고지 작성 규칙: 다음 칸이 문장부호(점, 따옴표 등)면 줄 바꿈을 하지 않고 현재 행 끝에 미리 당겨 붙임
      if (isPunctuationCell(formatCells[i + 1])) {
        currentRow.push(formatCells[++i]);
      }
      if (isPunctuationCell(formatCells[i + 1])) {
        currentRow.push(formatCells[++i]);
      }
      matrix.push(currentRow);
      currentRow = [];
    }
    // 문장의 완전한 마지막 셀 도달 시 행 마감
    else if (i === formatCells.length - 1) {
      matrix.push(currentRow);
    }
  }
  return matrix;
}

// 💡 매핑 가독성 향상: 런타임 분기가 불필요한 고정 스타일링은 레코드(객체) 상수로 처리하여 탐색 효율 극대화
const CELL_STYLE_MAP: Record<WongoziCell["type"], string> = {
  "open-quote":
    "absolute right-1 top-0.5 text-3xl flex items-start justify-end w-full h-full p-1 z-10",
  "close-quote":
    "absolute left-1 top-0.5 text-3xl flex items-start justify-start w-full h-full p-1 z-10",
  number:
    "absolute text-2xl tracking-tighter flex items-center justify-center w-full h-full z-10",
  "comma-dot":
    "absolute left-1 -bottom-3 text-3xl flex items-start justify-start w-full h-full p-1 z-10",
  combined: "",
  normal:
    "absolute text-2xl flex items-center justify-center w-full h-full z-10",
  margin:
    "absolute text-2xl flex items-center justify-center w-full h-full z-10", // 수동 마진 타입 안전하게 방어 추가
};

export function getCellStyle(type: WongoziCell["type"]): string {
  return CELL_STYLE_MAP[type] ?? CELL_STYLE_MAP["normal"];
}
