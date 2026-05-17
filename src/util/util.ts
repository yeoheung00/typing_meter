// src/utils/hangul.ts (또는 App.tsx 상단)

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
  "burnt",
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

// 한글 자모음을 영문 쿼티 자판 입력 값(e.key 또는 e.code 대응용) 배열로 쪼개는 매핑 테이블
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
  "[][]": ["s", "w"],
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

/**
 * 일반 문장(예: "나는 개발자다.")을 순수 영문 쿼티 자판 입력 배열로 변환합니다.
 * 결과 예시: ['s', 'k', 's', 'm', 's', ' ', 'r', 'p', 'ㅂ', 'f', 'w', 'k', 'e', 'k']
 */
export const convertSentenceToKeyArray = (sentence: string): string[] => {
  const result: string[] = [];

  for (let i = 0; i < sentence.length; i++) {
    const char = sentence[i];
    const code = char.charCodeAt(0);

    // 공백 및 문장 부호 처리
    if (code < HANGUL_BASE || code > HANGUL_END) {
      result.push(char.toLowerCase()); // 영문이나 기호는 소문자로 통일하여 버퍼에 push
      continue;
    }

    // 한글 유니코드 기반 자소 분리
    const hangulIndex = code - HANGUL_BASE;
    const cho = Math.floor(hangulIndex / 588);
    const jung = Math.floor((hangulIndex % 588) / 28);
    const jong = hangulIndex % 28;

    // 1. 초성 매핑
    const choChar = CHOSUNG_LIST[cho];
    if (KO_TO_EN_MAP[choChar]) result.push(...KO_TO_EN_MAP[choChar]);

    // 2. 중성 매핑
    const jungChar = JOUNGSONG_LIST[jung];
    if (KO_TO_EN_MAP[jungChar]) result.push(...KO_TO_EN_MAP[jungChar]);

    // 3. 종성 매핑 (받침이 존재하는 경우에만)
    if (jong > 0) {
      const jongChar = JONGSONG_LIST[jong];
      if (KO_TO_EN_MAP[jongChar]) result.push(...KO_TO_EN_MAP[jongChar]);
    }
  }

  return result;
};
