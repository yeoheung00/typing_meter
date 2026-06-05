import { useState, useEffect, useMemo } from "react";
import { TYPING_SAMPLES } from "./data/sentences";
import { convertKeyArrayToSentence } from "./util/converter";
import {
  formatToWongoziCells,
  getCellStyle,
  preprocessSentence,
  type WongoziCell,
} from "./util/format";
import "./App.css";

function App() {
  const [index, setIndex] = useState(0);
  const [userKeys, setUserKeys] = useState<string[]>([]);
  const currentSentence = useMemo(
    () => preprocessSentence(TYPING_SAMPLES[index].sentence),
    [index],
  );

  const convertedUserSentence = useMemo(
    () => convertKeyArrayToSentence(userKeys),
    [userKeys],
  );

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
      if (e.code === "Space") {
        pressedKey = " ";
      } else if (e.code.startsWith("Key")) {
        const char = e.code.replace("Key", "");
        pressedKey = e.shiftKey ? char.toUpperCase() : char.toLowerCase();
      } else {
        pressedKey = e.key.toLowerCase();
      }

      if (!pressedKey) return;

      // 💡 [실시간 입력 제어 엔진 주입]
      setUserKeys((prev) => {
        // 오토마타를 통해 현재 상태까지 완성된 한글 문장을 실시간 복원하여 분석
        // (기존에 구현해두신 convertKeyArrayToSentence 함수를 사용합니다)
        const currentSentence = convertKeyArrayToSentence(prev);
        const lastCharOfSentence = currentSentence.slice(-1); // 직전 최종 글자
        const lastKeyOfArray = prev[prev.length - 1]; // 직전에 입력된 순수 영문/기호 키

        // 문장부호 판별용 정규식
        const isPunctuation = /[.,?!'’"”]/.test(pressedKey);
        const isLastCharPunctuation = /[.,?!'’"”]/.test(lastCharOfSentence);

        // 규칙 1: 바로 이전 완성 문자가 문장부호인데, 지금 스페이스를 입력한 경우 무시
        if (pressedKey === " " && isLastCharPunctuation) {
          return prev; // 기존 배열 상태 그대로 유지 (입력 무시)
        }

        // 규칙 2: 현재 입력이 [문장부호] 혹은 [스페이스]인 상황에서
        if (pressedKey === " " || isPunctuation) {
          // 직전 한글 문장의 끝이 공백이거나, 키 배열의 마지막 값이 공백 키(" ")인 경우
          if (lastCharOfSentence === " " || lastKeyOfArray === " ") {
            // 기존 배열에서 마지막 공백 키를 제거한 뒤, 현재 누른 키를 추가하여 리턴
            // (연속된 공백 키 배열을 완벽하게 추적하기 위해 slice로 마지막 1칸을 쳐냅니다)
            const poppedPrev =
              lastKeyOfArray === " " ? prev.slice(0, -1) : prev;
            return [...poppedPrev, pressedKey];
          }
        }

        // 규칙에 걸리지 않는 일반적인 입력(자음, 모음, 영문, 숫자 등)은 그대로 누적
        return [...prev, pressedKey];
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNextSentence = () => {
    setIndex((p) => (p + 1) % TYPING_SAMPLES.length);
    setUserKeys([]);
  };

  /**
   * [💡 제안 반영 2, 3] 하이브리드 결합 엔진 리팩토링
   * 행렬 좌표 기반 비교 및 종성 버그 방지를 위한 2글자 결합 오타 판정 도입
   */
  const finalMatrix = useMemo(() => {
    interface FinalWongozi extends WongoziCell {
      isErr?: boolean;
      cursor?: boolean;
    }

    const isPunctuationCell = (c: WongoziCell | undefined) => {
      if (!c || !c.targetText) return false;
      if (
        c.type === "combined" ||
        c.type === "open-quote" ||
        c.type === "close-quote"
      ) {
        return true;
      }
      const isSpecialChar = /[^가-힣ㄱ-ㅣa-zA-Z0-9]/.test(c.targetText);
      return isSpecialChar;
    };

    const userWongoziFormat = formatToWongoziCells(convertedUserSentence);
    const targetWongoziFormat = formatToWongoziCells(currentSentence);

    // 💡 [교정 ①]: index 조작을 위해 forEach 대신 일반 for 루프로 전환 (중복 진입 방지)
    const buildWongoziMatrix = (
      formatCells: WongoziCell[],
    ): WongoziCell[][] => {
      const matrix: WongoziCell[][] = [];
      let currentRow: WongoziCell[] = [];
      let cellCounter = 0;

      for (let i = 0; i < formatCells.length; i++) {
        const cell = formatCells[i];
        currentRow.push(cell);
        cellCounter++;

        // 마지막 원소 예외 처리
        if (i === formatCells.length - 1) {
          matrix.push(currentRow);
          break;
        }

        // 20칸이 찼을 때 행 끝 탈출 처리
        if (cellCounter === 20) {
          cellCounter = 0;

          // 다음 칸이 문장부호면 당겨옴
          if (isPunctuationCell(formatCells[i + 1])) {
            currentRow.push(formatCells[i + 1]);
            i++; // 💡 index를 실제로 증가시켜 다음 루프에서 중복 처리 방지
          }
          // 그 다음 칸도 문장부호면 연속 당겨옴
          if (isPunctuationCell(formatCells[i + 1])) {
            currentRow.push(formatCells[i + 1]);
            i++; // 💡 index를 한 번 더 증가시킴
          }

          matrix.push(currentRow);
          currentRow = [];
        }
      }
      return matrix;
    };

    const userWongoziMatrix = buildWongoziMatrix(userWongoziFormat);
    const targetWongoziMatrix = buildWongoziMatrix(targetWongoziFormat);

    const finalWongoziMatrix: FinalWongozi[][] = [];
    let finalWongoziRow: FinalWongozi[] = [];

    const maxRow = Math.max(
      targetWongoziMatrix.length,
      userWongoziMatrix.length,
    );

    for (let r = 0; r < maxRow; r++) {
      const userRow: WongoziCell[] = userWongoziMatrix[r] ?? [];
      const targetRow: WongoziCell[] = targetWongoziMatrix[r] ?? [];
      const maxCell = Math.max(userRow.length, targetRow.length);

      for (let c = 0; c < maxCell; c++) {
        const isCompleteLine = userWongoziMatrix.length - 1 > r;
        const userCell: WongoziCell | undefined = userRow[c];
        const userNextCell: WongoziCell | undefined = userRow[c + 1];
        const targetCell: WongoziCell | undefined = targetRow[c];
        const targetNextCell: WongoziCell | undefined = targetRow[c + 1];

        // 💡 [교정 ②]: 가상 패딩 객체 안전장치 선언 (targetCell이 undefined일 때 대응)
        const safeTargetCell: FinalWongozi = targetCell ?? {
          targetText: " ",
          targetKeys: " ",
          type: "normal",
          cursor: false,
        };

        if (isCompleteLine) {
          const userText = userCell.targetText;
          const targetText = targetCell?.targetText ?? ""; // 💡 targetCell 안전 조회
          finalWongoziRow.push({
            ...userCell,
            isErr: userText !== targetText,
            cursor: false,
          });
        } else if (!userCell) {
          // 유저가 아직 입력하지 않은 미래 영역
          if (c > 19 && userWongoziMatrix[r + 1]) {
            finalWongoziRow.push({ ...safeTargetCell, isErr: true });
          } else {
            finalWongoziRow.push(safeTargetCell);
          }
        } else {
          // 유저 입력이 존재하는 영역
          const userText = userCell.targetText;
          const targetText = targetCell?.targetText ?? ""; // 💡 targetCell 안전 조회

          if (userNextCell) {
            // 이미 완벽하게 치고 지나간 정상 칸
            finalWongoziRow.push({
              ...userCell,
              isErr: userText !== targetText,
              cursor: false,
            });
          } else {
            // 💡 [교정 ③]: 현재 타이핑 중인 끝자락 커서 칸 오타 판정 (안전 참조 교정)
            const currentTargetKeys = targetCell?.targetKeys ?? "";
            const nextTargetKeys = targetNextCell?.targetKeys ?? "";
            const combinedTargetKeys = currentTargetKeys + nextTargetKeys;

            if (
              userText === " " &&
              (targetText === '"' || targetText === "'")
            ) {
              finalWongoziRow.push({ ...safeTargetCell, cursor: true });
              continue;
            }

            // 유저가 정답 범위를 초과해서 막 쳤을 경우를 대비한 가드
            const isErr = !combinedTargetKeys.startsWith(userCell.targetKeys);

            finalWongoziRow.push({ ...userCell, isErr: isErr, cursor: true });
          }
        }
      }
      finalWongoziMatrix.push(finalWongoziRow);
      finalWongoziRow = [];
    }

    return finalWongoziMatrix;

    // 💡 의존성 배열 명시 교정 (내부에서 사용 중인 실시간 데이터 기준 정렬)
  }, [convertedUserSentence, currentSentence]);

  const borderColor = "border-red-500";
  const borderWidth = (cell: number): string => {
    switch (cell) {
      case 0:
        return `${borderColor} border-l-2 border-t-2 border-r-1 border-b-2`;
      case 19:
        return `${borderColor} border-l-1 border-t-2 border-r-2 border-b-2`;
      case 20:
      case 21:
        return "";
      default:
        return `${borderColor} border-l-1 border-t-2 border-r-1 border-b-2`;
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center font-serif">
      <section>
        <span className="text-3xl">
          {TYPING_SAMPLES[index].author} - {TYPING_SAMPLES[index].title}
        </span>
      </section>
      <section>
        {finalMatrix.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-col items-center">
            {rowIndex > 0 ? (
              <div
                className={`${borderColor} border-l-2 border-r-2 w-280 h-4`}
              ></div>
            ) : (
              <></>
            )}
            <div key={rowIndex} className="flex flex-row">
              <span className="w-28 h-14"></span>
              {row.map((cell, cellIndex) => (
                <div
                  key={cellIndex}
                  className={`relative ${cell.isErr === undefined ? "text-gray-300 bg-transparent" : cell.isErr ? "text-red-400 bg-red-100" : "text-black"} w-14 h-14 ${borderWidth(cellIndex)}`}
                >
                  {cell.type === "combined" ||
                  cell.originalType === "combined" ? (
                    <div className={getCellStyle("normal")}>
                      <span className={getCellStyle("comma-dot")}>
                        {cell.targetText[0]}
                      </span>
                      <span className={getCellStyle("open-quote")}>
                        {cell.targetText[1]}
                      </span>
                    </div>
                  ) : (
                    <span
                      className={getCellStyle(
                        cell.originalType ? cell.originalType : cell.type,
                      )}
                    >
                      {cell.targetText}
                    </span>
                  )}

                  {cell.cursor ? (
                    <div className="absolute w-10 h-0.5 left-1/2 bottom-1 -translate-x-1/2 bg-black animate-blink"></div>
                  ) : (
                    <></>
                  )}
                </div>
              ))}
              {row.length < 22 ? (
                new Array(22 - row.length)
                  .fill("")
                  .map((_, i) => (
                    <span
                      key={i}
                      className={`${borderWidth(row.length + i)} w-14 h-14`}
                    ></span>
                  ))
              ) : (
                <></>
              )}
            </div>
          </div>
        ))}
      </section>

      <div
        style={{
          borderTop: "1px solid #e2e8f0",
          paddingTop: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
          유저 실시간 복원 데이터:{" "}
          <span
            style={{
              fontFamily: "monospace",
              background: "#f1f5f9",
              padding: "4px 8px",
              borderRadius: "4px",
            }}
          >
            {convertedUserSentence || "(입력 대기)"}
          </span>
        </div>
        <button
          onClick={handleNextSentence}
          style={{
            padding: "10px 20px",
            backgroundColor: "#334155",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          다음 문장 테스트 ➡️
        </button>
      </div>
    </div>
  );
}

export default App;
