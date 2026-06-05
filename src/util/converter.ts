export const HANGUL_BASE = 0xac00;
export const HANGUL_END = 0xd7a3;

export const CHOSUNG_LIST = [
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
export const JOUNGSONG_LIST = [
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
export const JONGSONG_LIST = [
  "",
  "ㄱ",
  "ㄲ",
  "ㄳ",
  "ㄴ",
  "ㄴㅈ",
  "ㄴㅎ",
  "ㄷ",
  "ㄹ",
  "ㄹㄱ",
  "ㄹㅁ",
  "ㄹㅂ",
  "ㄹㅅ",
  "ㄹㅌ",
  "ㄹㅍ",
  "ㄹㅎ",
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

export const KO_TO_EN_MAP: { [key: string]: string[] } = {
  ㄱ: ["r"],
  ㄲ: ["R"],
  ㄴ: ["s"],
  ㄷ: ["e"],
  ㄸ: ["E"],
  ㄹ: ["f"],
  ㅁ: ["a"],
  ㅂ: ["q"],
  ㅃ: ["Q"],
  ㅅ: ["t"],
  ㅆ: ["T"],
  ㅇ: ["d"],
  ㅈ: ["w"],
  ㅉ: ["W"],
  ㅊ: ["c"],
  ㅋ: ["z"],
  ㅌ: ["x"],
  ㅍ: ["v"],
  ㅎ: ["g"],
  ㅏ: ["k"],
  ㅐ: ["o"],
  ㅑ: ["i"],
  ㅒ: ["O"],
  ㅓ: ["j"],
  ㅔ: ["p"],
  ㅕ: ["u"],
  ㅖ: ["P"],
  ㅗ: ["h"],
  ㅛ: ["y"],
  ㅜ: ["n"],
  ㅠ: ["b"],
  ㅡ: ["m"],
  ㅣ: ["l"],
  ㅘ: ["h", "k"],
  ㅙ: ["h", "o"],
  ㅚ: ["h", "l"],
  ㅝ: ["n", "j"],
  ㅞ: ["n", "p"],
  ㅟ: ["n", "l"],
  ㅢ: ["m", "l"],
  ㄳ: ["r", "t"],
  ㄵ: ["s", "w"],
  ㄶ: ["s", "g"],
  ㄺ: ["f", "r"],
  ㄻ: ["f", "a"],
  ㄼ: ["f", "q"],
  ㄽ: ["f", "t"],
  ㄾ: ["f", "x"],
  ㄿ: ["f", "v"],
  ㅀ: ["f", "g"],
  ㅄ: ["q", "t"],
};

export const EN_TO_KO_MAP: { [key: string]: string } = {
  r: "ㄱ",
  R: "ㄲ",
  s: "ㄴ",
  S: "ㄴ",
  e: "ㄷ",
  E: "ㄸ",
  f: "ㄹ",
  F: "ㄹ",
  a: "ㅁ",
  A: "ㅁ",
  q: "ㅂ",
  Q: "ㅃ",
  t: "ㅅ",
  T: "ㅆ",
  d: "ㅇ",
  D: "ㅇ",
  w: "ㅈ",
  W: "ㅉ",
  c: "ㅊ",
  C: "ㅊ",
  z: "ㅋ",
  Z: "ㅋ",
  x: "ㅌ",
  X: "ㅌ",
  v: "ㅍ",
  V: "ㅍ",
  g: "ㅎ",
  G: "ㅎ",
  k: "ㅏ",
  K: "ㅏ",
  o: "ㅐ",
  i: "ㅑ",
  I: "ㅑ",
  O: "ㅒ",
  j: "ㅓ",
  J: "ㅓ",
  p: "ㅔ",
  u: "ㅕ",
  U: "ㅕ",
  P: "ㅖ",
  h: "ㅗ",
  H: "ㅗ",
  y: "ㅛ",
  Y: "ㅛ",
  n: "ㅜ",
  N: "ㅜ",
  b: "ㅠ",
  B: "ㅠ",
  m: "ㅡ",
  M: "ㅡ",
  l: "ㅣ",
  L: "ㅣ",
};

const COMPLEX_JUNG: { [key: string]: string } = {
  hl: "ㅚ",
  hk: "ㅘ",
  ho: "ㅙ",
  nl: "ㅟ",
  nj: "ㅝ",
  np: "ㅞ",
  ml: "ㅢ",
};
const COMPLEX_JONG: { [key: string]: string } = {
  rt: "ㄳ",
  sw: "ㄵ",
  sg: "ㄶ",
  fr: "ㄺ",
  fa: "ㄻ",
  fq: "ㄼ",
  ft: "ㄽ",
  fx: "ㄾ",
  fv: "ㄿ",
  fg: "ㅀ",
  qt: "ㅄ",
};

// 💡 외부(App, format)에서 공통으로 수혈받아 사용할 실시간 한글 자소 분리 유틸
export function disassembleHangul(char: string): string {
  if (!char) return "";
  const code = char.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_END) return char;

  const hangulIndex = code - HANGUL_BASE;
  const cho = Math.floor(hangulIndex / 588);
  const jung = Math.floor((hangulIndex % 588) / 28);
  const jong = hangulIndex % 28;

  return (
    CHOSUNG_LIST[cho] +
    JOUNGSONG_LIST[jung] +
    (JONGSONG_LIST[jong] ? JONGSONG_LIST[jong] : "")
  );
}

// 유니코드 상의 한글 자모 낱자 영역 상수 정의
const HANGUL_JAMO_BASE = 12593; // 'ㄱ' (0x3131)
const HANGUL_JAMO_END = 12686; // 'ㅣ' (0x318E)

export const convertSentenceToKeyArray = (sentence: string): string[] => {
  const result: string[] = [];

  for (let i = 0; i < sentence.length; i++) {
    const char = sentence[i];
    const code = char.charCodeAt(0);

    // 💡 [교정 1] 완성형도 아니고, 단독 자모 영역도 아니라면 (순수 영문, 숫자, 문장부호 등)
    if (
      (code < HANGUL_BASE || code > HANGUL_END) &&
      (code < HANGUL_JAMO_BASE || code > HANGUL_JAMO_END)
    ) {
      result.push(char.toLowerCase());
      continue;
    }

    // 💡 [교정 2] 만약 단독 자모 영역(ㄱ, ㄴ, ㄷ 등)에 해당한다면 바로 영문 매핑 후 패스
    if (code >= HANGUL_JAMO_BASE && code <= HANGUL_JAMO_END) {
      if (KO_TO_EN_MAP[char]) {
        result.push(...KO_TO_EN_MAP[char]);
      } else {
        result.push(char.toLowerCase());
      }
      continue;
    }

    // 3. 정상적인 완성형 한글('가'~ '힣') 분해 로직 (기존 코드 유지)
    const hangulIndex = code - HANGUL_BASE;
    const cho = Math.floor(hangulIndex / 588);
    const jung = Math.floor((hangulIndex % 588) / 28);
    const jong = hangulIndex % 28;

    const choChar = CHOSUNG_LIST[cho];
    if (KO_TO_EN_MAP[choChar]) result.push(...KO_TO_EN_MAP[choChar]);

    const jungChar = JOUNGSONG_LIST[jung];
    if (KO_TO_EN_MAP[jungChar]) result.push(...KO_TO_EN_MAP[jungChar]);

    if (jong > 0) {
      const jongChar = JONGSONG_LIST[jong];
      if (KO_TO_EN_MAP[jongChar]) result.push(...KO_TO_EN_MAP[jongChar]);
    }
  }
  return result;
};

const makeHangulCharacter = (
  cho: string,
  jung: string,
  jong: string = "",
): string => {
  const choIdx = CHOSUNG_LIST.indexOf(cho);
  const jungIdx = JOUNGSONG_LIST.indexOf(jung);
  const jongIdx = JONGSONG_LIST.indexOf(jong);

  if (choIdx === -1 || jungIdx === -1) return cho + jung + jong;

  const code =
    HANGUL_BASE + choIdx * 588 + jungIdx * 28 + (jongIdx === -1 ? 0 : jongIdx);
  return String.fromCharCode(code);
};

export const convertKeyArrayToSentence = (keyArray: string[]): string => {
  let result = "";
  let cho = "";
  let jung = "";
  let jong = "";

  for (let i = 0; i < keyArray.length; i++) {
    const prevKey = i > 0 ? keyArray[i - 1] : "";
    const key = keyArray[i];
    const ko = EN_TO_KO_MAP[key] || key;

    if (!(key in EN_TO_KO_MAP)) {
      if (cho) {
        result += jung ? makeHangulCharacter(cho, jung, jong) : cho + jong;
        cho = "";
        jung = "";
        jong = "";
      }
      result += key;
      continue;
    }

    const isJaum = CHOSUNG_LIST.includes(ko) || JONGSONG_LIST.includes(ko);
    const isMoum = JOUNGSONG_LIST.includes(ko);

    if (isJaum) {
      if (!cho) {
        cho = ko;
      } else if (!jung) {
        result += cho;
        cho = ko;
      } else if (!jong) {
        jong = ko;
      } else {
        const combinedJong = COMPLEX_JONG[prevKey + key];
        if (combinedJong) {
          jong = combinedJong;
        } else {
          result += makeHangulCharacter(cho, jung, jong);
          cho = ko;
          jung = "";
          jong = "";
        }
      }
    } else if (isMoum) {
      if (!cho) {
        result += ko;
      } else if (!jung) {
        jung = ko;
      } else {
        const combinedJung = COMPLEX_JUNG[prevKey + key];

        if (combinedJung && !jong) {
          jung = combinedJung;
        } else if (!jong) {
          // 💡 [교정]: '가' + 'ㅏ' 처럼 복합 모음이 안 되는 상황 처리
          // 1. 기존의 '가'를 완벽한 글자로 만들어 결합합니다.
          result += makeHangulCharacter(cho, jung);

          // 2. 새로 들어온 모음은 다음 칸에 단독으로 놓여야 합니다.
          // 오토마타 구조상 초성 없이 모음만 단독으로 오는 글자이므로,
          // 상태값을 모두 비우고 result에 즉시 누적하는 것이 가장 안전합니다.
          result += ko;
          cho = "";
          jung = "";
          jong = "";
        } else {
          // 받침(jong)이 있는 상태에서 모음이 들어와 분리되는 상황 (기존 로직 유지)
          let prevJong = "";
          let nextCho = jong;
          const foundCombined = Object.entries(COMPLEX_JONG).find(
            ([, v]) => v === jong,
          );
          if (foundCombined) {
            prevJong = EN_TO_KO_MAP[foundCombined[0][0]];
            nextCho = EN_TO_KO_MAP[foundCombined[0][1]];
          }

          result += makeHangulCharacter(cho, jung, prevJong);
          cho = nextCho;
          jung = ko;
          jong = "";
        }
      }
    }
  }

  if (cho) {
    result += jung ? makeHangulCharacter(cho, jung, jong) : cho + jong;
  }
  return result;
};
