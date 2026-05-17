import { useState, ChangeEvent, useRef, useEffect } from "react";
import { TYPING_SENTENCES } from "./data/sentences"; // 앞서 만든 50대 문학 글귀
import { convertSentenceToKeyArray } from "./util/util";
import "./App.css";

const KO_TO_EN_MAP: { [key: string]: string[] } = {
  // 초성/종성 자음
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
  // 복합 모음 타이핑 분리
  ㅘ: ["h", "k"],
  ㅙ: ["h", "o"],
  ㅚ: ["h", "l"],
  ㅝ: ["n", "j"],
  ㅞ: ["n", "p"],
  ㅟ: ["n", "l"],
  ㅢ: ["m", "l"],
  // 복합 종성 자음 타이핑 분리
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

function App() {
  const [index, setIndex] = useState(0);
  const [targetKeys, setTargetKeys] = useState<string[]>([]); // 현재 문장의 정답 키 배열
  const [userKeys, setUserKeys] = useState<string[]>([]); // 유저가 누른 키 저장소

  const currentSentence = TYPING_SENTENCES[index];

  // 문장이 바뀔 때마다 정답 배열을 추출하고 입력 버퍼를 비웁니다.
  useEffect(() => {
    const keys = convertSentenceToKeyArray(currentSentence);
    setTargetKeys(keys);
    setUserKeys([]);
  }, [index, currentSentence]);

  // 키보드 하드웨어 입력 전역 감지
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 시스템 단축키 무시 (Ctrl, Alt, Command, F5 등)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // 글자 입력과 상관없는 기능키 무시 (단, Backspace와 Space는 허용)
      if (e.key.length > 1 && e.key !== "Backspace" && e.key !== "Spacebar") {
        return;
      }

      // 1. 지우기(Backspace) 처리
      if (e.key === "Backspace") {
        e.preventDefault();
        setUserKeys((prev) => prev.slice(0, -1));
        return;
      }

      // 2. 입력 키 추출
      // 한글 입력 상태라 하더라도, 대다수 모던 브라우저의 keydown 이벤트에서
      // 영문 자판 위치 값을 가장 확실하게 가져오는 방법은 e.code를 소문자화 하거나 변환하는 것입니다.
      // e.code는 'KeyQ', 'KeyA', 'Space' 형태로 들어오므로 앞의 'Key'를 떼어내 쿼티 값을 확보합니다.
      let pressedKey = "";
      if (e.code.startsWith("Key")) {
        // Shift 여부에 따라 대소문자 구분 (ㅃ, ㄸ, ㅉ, ㄲ, ㅆ 처리용)
        const char = e.code.replace("Key", "");
        pressedKey = e.shiftKey ? char.toUpperCase() : char.toLowerCase();
      } else if (e.code === "Space") {
        pressedKey = " ";
      } else {
        // 기호 나 숫자 등은 e.key 그대로 차용
        pressedKey = e.key.toLowerCase();
      }

      if (!pressedKey) return;

      // 3. 입력 상태 업데이트 및 문장 완료 판정
      setUserKeys((prev) => {
        const nextKeys = [...prev, pressedKey];

        // 정답 자판 시퀀스를 오타 없이 완벽히 끝까지 다 쳤다면 즉시 다음 문장으로!
        if (
          nextKeys.length === targetKeys.length &&
          nextKeys.join("") === targetKeys.join("")
        ) {
          setIndex((p) => (p + 1) % TYPING_SENTENCES.length);
          return [];
        }

        return nextKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [targetKeys]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 font-sans select-none text-white">
      <div className="max-w-3xl w-full bg-slate-800 rounded-2xl shadow-2xl p-10 border border-slate-700/50">
        <h1 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-10 text-center">
          ⌨️ 로우 레벨 자판 배열 타자 엔진 v1.0
        </h1>

        {/* 1️⃣ 원본 가이드 문장 표시 */}
        <div className="text-2xl font-medium tracking-wide leading-relaxed mb-8 text-left bg-slate-950 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 select-none">{currentSentence}</p>
        </div>

        {/* 2️⃣ 💡 자판 입력 배열 실시간 디버깅/스트림 영역 */}
        <div className="w-full min-h-[80px] bg-slate-950 px-6 py-4 rounded-xl border border-slate-800 text-left font-mono overflow-x-auto mb-8 flex flex-wrap items-center gap-1">
          {targetKeys.map((targetKey, kIndex) => {
            let boxClass = "border-slate-800 text-slate-600 bg-slate-900/50"; // 아직 입력 안 함

            if (kIndex < userKeys.length) {
              if (userKeys[kIndex] === targetKey) {
                boxClass =
                  "bg-emerald-950/40 text-emerald-400 border-emerald-800/60 font-bold"; // 정확한 타이핑
              } else {
                boxClass =
                  "bg-rose-950/40 text-rose-400 border-rose-800/60 font-bold animate-shake"; // 오타 자판 발생
              }
            }

            return (
              <div
                key={kIndex}
                className={`min-w-[28px] h-9 border rounded flex flex-col items-center justify-center text-xs px-1 font-mono transition-all ${boxClass}`}
              >
                {/* 상단엔 타겟 영문 자판, 아래엔 현재 상태 */}
                <span className="opacity-40 scale-75 uppercase">
                  {targetKey === " " ? "␣" : targetKey}
                </span>
              </div>
            );
          })}

          {/* 가상 커서 */}
          <span className="w-[2px] h-5 bg-blue-400 ml-1 animate-pulse" />
        </div>

        {/* 하단 컨트롤 바 */}
        <div className="flex justify-between items-center border-t border-slate-800 pt-6">
          <span className="text-xs text-slate-500 font-medium font-mono">
            STREAM BUFFER COUNT: {userKeys.length} / {targetKeys.length}
          </span>
          <button
            onClick={() => setIndex((p) => (p + 1) % TYPING_SENTENCES.length)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg active:scale-95 transition-all shadow-md border border-slate-600"
          >
            SKIP ➡️
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
