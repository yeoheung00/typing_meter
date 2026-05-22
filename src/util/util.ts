const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;

const CHOSUNG_LIST = [
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
const JOUNGSONG_LIST = [
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
const JONGSONG_LIST = [
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

const KO_TO_EN_MAP: { [key: string]: string[] } = {
  // 초성 및 종성 자음
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
  // 중성 모음
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
  // 복합 모음 분해 (예: 'ㅘ'를 치려면 'ㅗ(h)'와 'ㅏ(k)'를 순서대로 눌러야 함)
  ㅘ: ["h", "k"],
  ㅙ: ["h", "o"],
  ㅚ: ["h", "l"],
  ㅝ: ["n", "j"],
  ㅞ: ["n", "p"],
  ㅟ: ["n", "l"],
  ㅢ: ["m", "l"],
  // 복합 받침 분해 (예: 'ㄳ'은 'ㄱ(r)'과 'ㅅ(t)'의 연속 입력)
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
const EN_TO_KO_MAP: { [key: string]: string } = {
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

export const convertSentenceToKeyArray = (sentence: string): string[] => {
  const result: string[] = [];

  for (let i = 0; i < sentence.length; i++) {
    const char = sentence[i];
    const code = char.charCodeAt(0);

    if (code < HANGUL_BASE || code > HANGUL_END) {
      result.push(char.toLowerCase());
      continue;
    }

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
    0xac00 + choIdx * 588 + jungIdx * 28 + (jongIdx === -1 ? 0 : jongIdx);
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
          result += makeHangulCharacter(cho, jung);
          cho = "";
          jung = ko;
        } else {
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
