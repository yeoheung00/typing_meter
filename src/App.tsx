import { useState, useEffect, useMemo } from "react";
import { TYPING_SENTENCES } from "./data/sentences";
import {
  convertSentenceToKeyArray,
  convertKeyArrayToSentence,
} from "./util/util";
import { format } from "./util/format";
import "./App.css";

function App() {
  const [index, setIndex] = useState(0);
  const [userKeys, setUserKeys] = useState<string[]>([]);

  const currentSentence = TYPING_SENTENCES[index];
  const targetKeys = useMemo(
    () => convertSentenceToKeyArray(currentSentence),
    [currentSentence],
  );
  const currentSentenceFormat = useMemo(
    () => format(currentSentence),
    [currentSentence],
  );

  // 💡 내가 지금까지 입력한 자판 배열을 실제 한글 문장 문자열로 변환합니다.
  const currentUserSentence = convertKeyArrayToSentence(userKeys);
  const currentUserSentenceFormat = format(currentUserSentence);

  const handleNextSentence = () => {
    setIndex((p) => (p + 1) % TYPING_SENTENCES.length);
    setUserKeys([]);
  };

  // 전역 keydown 이벤트 로직 (기존과 동일)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key.length > 1 && e.key !== "Backspace" && e.key !== "Spacebar")
        return;

      if (e.key === "Backspace") {
        e.preventDefault();
        setUserKeys((prev) => prev.slice(0, -1));
        return;
      }

      let pressedKey = "";
      if (e.code === "Space") pressedKey = " ";
      else if (e.code.startsWith("Key")) {
        const char = e.code.replace("Key", "");
        pressedKey = e.shiftKey ? char.toUpperCase() : char.toLowerCase();
      } else pressedKey = e.key.toLowerCase();

      if (!pressedKey) return;

      setUserKeys((prev) => {
        const nextKeys = [...prev, pressedKey];
        return nextKeys;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [targetKeys]);

  return (
    // 짚신/한지 느낌의 부드러운 베이지색 배경톤(bg-stone-100)
    <div className="w-full h-full bg-stone-100 flex items-center justify-center font-serif select-none text-stone-800">
      <div className="w-fit relative">
        <h1 className="text-center text-lg font-bold tracking-widest text-emerald-800 mb-12 border-b-2 border-emerald-800">
          綠 陰 方 草 (녹음방초) : 원고지 타자연습
        </h1>

        <div className="grid grid-cols-20 gap-y-4 gap-x-0 border-x-2 border-emerald-600/30">
          {currentSentenceFormat.map((targetChar, charIndex) => {
            // 현재 칸에 유저가 입력한 글자가 있는지 확인
            const userChar = currentUserSentenceFormat[charIndex];
            const isFilled = userChar !== undefined;

            // 현재 유저가 타이핑 중인 '가장 마지막 글자(커서 위치)'인지 확인
            const isCurrentCursor =
              charIndex === currentUserSentenceFormat.length - 1;

            return (
              <div
                key={charIndex}
                // 💡 w-12 h-12로 완벽한 1:1 정방형 격자를 형성하고, 전통 원고지 특유의 청록색/벽돌색 선(border)을 긋습니다.
                className={`w-12 h-12 ${charIndex % 20 === 0 ? "border-r-1" : charIndex % 20 === 19 ? "border-l-1" : "border-x-1"} border-y-2 border-emerald-600/30 relative flex items-center justify-center text-xl font-medium`}
              >
                <span className="absolute text-stone-300 font-light pointer-events-none select-none">
                  {targetChar === " " ? "" : targetChar}
                </span>

                {isFilled && (
                  <span
                    className={`absolute font-bold z-10 animate-[fadeIn_0.15s_ease-out]
                    ${userChar === targetChar ? "text-stone-900" : "text-rose-600 bg-rose-50/50 w-full h-full flex items-center justify-center"}
                  `}
                  >
                    {userChar === " " ? " " : userChar}
                  </span>
                )}

                {isCurrentCursor && (
                  <span className="absolute bottom-1 right-1 w-0.5 h-10 bg-emerald-600 animate-[blink_1s_infinite]" />
                )}
              </div>
            );
          })}
          {new Array(20 - (currentSentenceFormat.length % 20))
            .fill("")
            .map((_value, index) => (
              <div
                key={index}
                className={`w-12 h-12 ${index + 1 === 20 - (currentSentenceFormat.length % 20) ? "border-l-1" : "border-x-1"} border-y-2 border-emerald-600/30 relative flex items-center justify-center text-xl font-medium`}
              ></div>
            ))}
        </div>

        <div className="flex justify-between items-center border-t border-stone-200 mt-12 pt-6 text-xs text-stone-500 font-sans">
          <div>
            원고지 사용량:{" "}
            <span className="text-emerald-700 font-bold">
              {currentUserSentence.length}
            </span>{" "}
            / {currentSentence.length} 자
          </div>
          <button
            onClick={handleNextSentence}
            className="px-4 py-2 bg-stone-800 text-stone-100 hover:bg-stone-700 rounded text-xs transition-all font-serif"
          >
            다음 문장 넘기기 ➡️
          </button>
        </div>
      </div>
    </div>
  );
}

/*
function App() {
  const [index, setIndex] = useState(0);
  const [userKeys, setUserKeys] = useState<string[]>([]); // 유저가 누른 키 저장소

  const currentSentence = TYPING_SENTENCES[index];
  const targetKeys = convertSentenceToKeyArray(currentSentence);

  const handleNextSentence = () => {
    setIndex((p) => (p + 1) % TYPING_SENTENCES.length);
    setUserKeys([]); // 다음 문장으로 갈 때 버퍼 비우기
  };

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
          handleNextSentence();
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

        <div className="text-2xl font-medium tracking-wide leading-relaxed mb-8 text-left bg-slate-950 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 select-none">
            {TYPING_SENTENCES[index]}
          </p>
        </div>

        <div className="text-2xl font-menium tracking-wide leading-relaxed mb-8 text-left bg-slate-950 p-6 rounded-xl border border-slate-800">
          <p className="text-slate-400 select-none">
            {convertKeyArrayToSentence(userKeys)}
          </p>
        </div>

        <div className="w-full min-h-20 bg-slate-950 px-6 py-4 rounded-xl border border-slate-800 text-left font-mono overflow-x-auto mb-8 flex flex-wrap items-center gap-1">
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
                className={`min-w-7 h-9 border rounded flex flex-col items-center justify-center text-xs px-1 font-mono transition-all ${boxClass}`}
              >
                <span className="opacity-40 scale-75 uppercase">
                  {targetKey === " " ? "␣" : targetKey}
                </span>
              </div>
            );
          })}

          <span className="w-0.5 h-5 bg-blue-400 ml-1 animate-pulse" />
        </div>

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
*/

export default App;
