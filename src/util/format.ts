export function format(sentence: string): string[] {
  const chars = sentence.split("");
  const result: string[] = [];
  let numBuffer = "";
  chars.forEach((char, index) => {
    if (char === " " || isNaN(Number(char))) {
      result.push(char);
    } else {
      numBuffer += char;
      if (numBuffer.length === 2) {
        result.push(numBuffer);
        numBuffer = "";
      } else if (
        index === chars.length - 1 ||
        !isNaN(Number(chars[index + 1]))
      ) {
        result.push(numBuffer);
        numBuffer = "";
      }
    }
  });
  return result;
}

// 📝 원고지 한 칸이 가질 데이터 구조
export interface WongoziCell {
  targetText: string; // 화면에 보여줄 글자 (예: "한", "20", ".”")
  targetKeys: string; // 이 칸을 완성하기 위해 입력되어야 하는 영문 자판 조인값 (예: "gks", "20", ".’")
  type: "normal" | "number" | "open-quote" | "close-quote" | "combined";
}

import { convertSentenceToKeyArray } from "./util"; // 기존에 만들어둔 자판 분해 함수

export function formatToWongoziCells(sentence: string): WongoziCell[] {
  const chars = sentence.split("");
  const cells: WongoziCell[] = [];
  let i = 0;

  const isOpenQuote = (c: string) =>
    c === "‘" || c === "“" || c === '"' || c === "'";
  const isCloseQuote = (c: string) =>
    c === "’" || c === "”" || c === '"' || c === "'";
  const isDotOrComma = (c: string) => c === "." || c === ",";

  while (i < chars.length) {
    const char = chars[i];
    const nextChar = chars[i + 1];

    // -----------------------------------------------------------------
    // 💡 [새 규칙 2] 줄의 맨 앞(20의 배수 자리)이 띄어쓰기일 경우 생략
    // -----------------------------------------------------------------
    // 현재까지 쌓인 cells의 개수가 20의 배수(0, 20, 40...)를 이룰 때
    // 현재 검사 중인 문자가 공백(' ')이라면, 원고지 칸을 만들지 않고 그냥 패스합니다.
    if (char === " " && cells.length % 20 === 0) {
      i += 1;
      continue;
    }

    if (isDotOrComma(char) && nextChar && isCloseQuote(nextChar)) {
      const combinedText = char + nextChar; // 예: '."' 또는 '.’'
      const combinedKeys =
        convertSentenceToKeyArray(char).join("") +
        convertSentenceToKeyArray(nextChar).join("");

      cells.push({
        targetText: combinedText,
        targetKeys: combinedKeys,
        type: "combined", // 💡 여기에 'normal' 대신 'combined'가 확실하게 들어가야 합니다!
      });

      i += 2; // 2글자 소비

      // [새 규칙 1-A] 결합 부호(".”") 바로 뒤에 또 공백이 오면 건너뛰기
      if (chars[i] === " ") {
        i += 1;
      }
      continue;
    }

    // 🌟 조건 1: 온점/반점 + 닫는 따옴표 결합 (한 칸 동거)
    if (isDotOrComma(char) && nextChar && isCloseQuote(nextChar)) {
      const combinedText = char + nextChar;
      const combinedKeys =
        convertSentenceToKeyArray(char).join("") +
        convertSentenceToKeyArray(nextChar).join("");

      cells.push({
        targetText: combinedText,
        targetKeys: combinedKeys,
        type: "combined",
      });

      i += 2; // 2글자 소비

      // -----------------------------------------------------------------
      // 💡 [새 규칙 1-A] 결합 부호(".”") 바로 뒤에 또 공백이 오면 건너뛰기
      // -----------------------------------------------------------------
      if (chars[i] === " ") {
        i += 1;
      }
      continue;
    }

    // 단독 온점이나 반점일 때 처리
    if (isDotOrComma(char)) {
      cells.push({
        targetText: char,
        targetKeys: convertSentenceToKeyArray(char).join(""),
        type: "comma-dot",
      });

      i += 1;

      // -----------------------------------------------------------------
      // 💡 [새 규칙 1-B] 단독 온점/반점 바로 뒤에 공백이 오면 건너뛰기
      // -----------------------------------------------------------------
      if (chars[i] === " ") {
        i += 1;
      }
      continue;
    }

    // 🌟 조건 2: 숫자 연속 처리 (최대 두 자리 묶음)
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

    // 🌟 조건 3-1: 여는 따옴표 (오른쪽 상단 배치)
    if (isOpenQuote(char) && (i === 0 || chars[i - 1] === " ")) {
      cells.push({
        targetText: char,
        targetKeys: convertSentenceToKeyArray(char).join(""),
        type: "open-quote",
      });
      i += 1;
      continue;
    }

    // 🌟 조건 3-2: 닫는 따옴표 (왼쪽 상단 배치)
    if (isCloseQuote(char)) {
      cells.push({
        targetText: char,
        targetKeys: convertSentenceToKeyArray(char).join(""),
        type: "close-quote",
      });
      i += 1;
      continue;
    }

    // 🌟 조건 4: 일반 글자 및 규칙에 걸리지 않은 공백 처리
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
