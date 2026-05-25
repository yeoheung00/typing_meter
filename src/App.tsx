import { useState, useEffect, useMemo } from "react";
import { TYPING_SENTENCES } from "./data/sentences";
import {
  convertSentenceToKeyArray,
  convertKeyArrayToSentence,
} from "./util/util";
import { format, formatToWongoziCells, getCellStyle } from "./util/format";
import "./App.css";

function App() {
  const [index, setIndex] = useState(0);
  const [userKeys, setUserKeys] = useState<string[]>([]);

  const currentSentence = TYPING_SENTENCES[index];
  const targetKeys = useMemo(
    () => convertSentenceToKeyArray(currentSentence),
    [currentSentence],
  );

  // 💡 내가 지금까지 입력한 자판 배열을 실제 한글 문장 문자열로 변환합니다.
  const currentUserSentence = convertKeyArrayToSentence(userKeys);
  const wongoziUserCells = formatToWongoziCells(currentUserSentence);

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
    // 짚신/한지 느낌의 부드러운 베이지색 배경톤
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-6 font-serif select-none text-stone-800">
      <div className="w-fit bg-[#fcfbf7] rounded-xl shadow-xl p-12 border border-stone-200/60 relative">
        {/* 타이틀 바 */}
        <h1 className="text-center text-lg font-bold tracking-widest text-emerald-800 mb-12 border-b-2 border-emerald-800 pb-4">
          綠 陰 方 草 (녹음방초) : 원고지 타자연습
        </h1>

        {/* 📝 💡 원고지 컨테이너 (좌우 보더 1px, 상단 지붕선 2px) */}
        <div className="grid grid-cols-20 rounded-lg border-x border-t-2 border-emerald-600/30 overflow-hidden">
          {(() => {
            // 1. [가-3] 정답 문장을 원고지 셀 배열로 변환
            const wongoziCells = formatToWongoziCells(currentSentence);
            console.log(wongoziCells);
            // 2. [가-4] 20의 배수(한 줄)를 맞추기 위해 부족한 공실(Dummy) 개수 계산
            const remainder = wongoziCells.length % 20;
            const missingCount = remainder === 0 ? 0 : 20 - remainder;
            console.log(missingCount);

            // 3. 정답 셀 뒤에 공란 셀 패딩하여 최종 원고지 격자 데이터 완성
            const finalCells = [
              ...wongoziCells,
              ...Array(missingCount)
                .fill(null)
                .map(() => ({
                  targetText: " ",
                  targetKeys: " ",
                  type: "normal" as const,
                })),
            ];

            // 4. [나] 실시간 스트림 파싱을 위한 포인터(인덱스) 바구니 준비
            // userKeys: 영문 자판 스트림 (예: ["g", "k", "s", "d"])
            let keyStreamPointer = 0;
            let isCursorPlaced = false; // 커서를 한 번만 그리기 위한 플래그

            // 5. [가-5] 가공된 finalCells를 기반으로 대망의 격자 렌더링 시작
            return finalCells.map((cell, charIndex) => {
              const isDummyCell = charIndex >= wongoziCells.length;

              // --- [나-4] 현재 칸에 해당하는 유저 입력 키 조각 잘라오기 ---
              // 정답 칸이 요구하는 자판 개수만큼 유저 전체 스트림에서 슬라이스
              const requiredKeyLength = cell.targetKeys.length;
              const userKeySlice = userKeys.slice(
                keyStreamPointer,
                keyStreamPointer + requiredKeyLength,
              );

              // 사용한 만큼 전체 스트림 포인터를 밀어줍니다 (자연스러운 오타 전이)
              keyStreamPointer += requiredKeyLength;

              // 잘라온 영문 키 배열을 합쳐서 문자열로 변환 (예: ["g", "k"] -> "gk")
              const userKeysString = userKeySlice.join("");
              const targetKeysString = cell.targetKeys;

              // 잘라온 키를 한글 문장으로 복원 (완료된 칸 비교용)
              const userCellText = convertKeyArrayToSentence(userKeySlice);
              const targetCellText = cell.targetText;

              // --- 실시간 상태 조건 조율 ---
              // 유저가 이 칸에 키를 하나라도 입력했는가?
              const hasInput = userKeySlice.length > 0;
              // 이 칸의 요구 자판 수가 꽉 찼는가? (완료되었는가)
              const isFilled = userKeySlice.length === requiredKeyLength;

              // 💡 [커서 판단] 아직 커서가 안 놓였고, 유저 스트림이 다 안 찬 칸이 바로 현재 입력 중인 칸!
              const isCurrentCursor =
                !isDummyCell && !isCursorPlaced && !isFilled;
              if (isCurrentCursor) {
                isCursorPlaced = true; // 커서 중복 방지
              }

              // 💡 [유저님이 구상하신 소름 돋는 컬러 판정 알고리즘]
              let isError = false;
              if (!isDummyCell && hasInput) {
                if (isCurrentCursor) {
                  // 현재 입력 중인 칸 ➡️ startsWith 로우레벨 자판 스트림 실시간 비교!
                  isError = !targetKeysString.startsWith(userKeysString);
                } else {
                  // 이미 지나간 완료된 칸 ➡️ 최종 복원된 텍스트 1:1 엄격 비교! ("2" vs "20" 오타 처리)
                  isError = userCellText !== targetCellText;
                }
              }

              return (
                <div
                  key={charIndex}
                  // 가로선 2px, 세로선 1px 스펙 유지
                  className={`w-12 h-12 border-b-2 border-r border-emerald-600/30 relative flex items-center justify-center font-medium transition-all
                    ${isCurrentCursor ? "bg-emerald-50/70 ring-2 ring-emerald-500/50 z-10" : ""}
                    ${isDummyCell ? "bg-stone-50/20" : ""}
                  `}
                >
                  {/* 1. 배정된 정답 가이드 글자 레이어 (가짜 빈칸이나 유저가 입력 완료한 칸은 숨김) */}
                  {!isDummyCell && !isFilled && (
                    <div className="absolute inset-0 w-full h-full text-stone-500 pointer-events-none select-none">
                      {cell.type === "combined" ? (
                        <>
                          <span className="absolute left-1.5 bottom-3.5">
                            {targetCellText[0]}
                          </span>
                          <span className="absolute right-1.5 bottom-3">
                            {targetCellText[1]}
                          </span>
                        </>
                      ) : (
                        <span
                          className={`absolute ${getCellStyle(cell.type)} flex items-center justify-center text-center w-full h-full`}
                        >
                          {targetCellText === " " ? "" : targetCellText}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 2. 유저 입력 실시간 글자 레이어 (오타면 붉은색, 정상이면 검정색) */}
                  {!isDummyCell && hasInput && (
                    <div className="absolute inset-0 w-full h-full z-10 animate-[fadeIn_0.15s_ease-out]">
                      {cell.type === "combined" ? (
                        <div
                          className={`w-full h-full relative ${isError ? "text-rose-600 bg-rose-50/50" : "text-stone-900"}`}
                        >
                          <span className="absolute left-1.5 bottom-3.5 text-2xl font-bold">
                            {userCellText[0] || ""}
                          </span>
                          <span className="absolute right-1.5 bottom-3 text-2xl font-bold">
                            {userCellText[1] || ""}
                          </span>
                        </div>
                      ) : (
                        <span
                          className={`absolute ${getCellStyle(cell.type)} font-bold flex items-center justify-center w-full h-full
                          ${isError ? "text-rose-600 bg-rose-50/50" : "text-stone-900"}
                        `}
                        >
                          {userCellText === " " ? " " : userCellText}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 3. 현재 입력 중인 칸 하단에 깜빡이는 원고지 커서 효과 */}
                  {isCurrentCursor && (
                    <span className="absolute bottom-1 w-8 h-[3px] bg-emerald-600 animate-[blink_1s_infinite]" />
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* 하단 정보 바 및 조작 버튼 */}
        <div className="flex justify-between items-center border-t border-stone-200 mt-12 pt-6 text-xs text-stone-500 font-sans">
          <div>
            원고지 자판 진행도:{" "}
            <span className="text-emerald-700 font-bold">
              {userKeys.length}
            </span>{" "}
            타점 누적
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
