import { useState, useEffect, useMemo } from "react";
import { TYPING_SENTENCES } from "./data/sentences";
import { convertKeyArrayToSentence } from "./util/converter";
import { formatToWongoziCells, getCellStyle } from "./util/format";
import "./App.css";

interface WongoziCell {
  targetText: string;
  targetKeys?: string;
  type:
    | "normal"
    | "combined"
    | "number"
    | "open-quote"
    | "close-quote"
    | "margin";
  originalType?: string;
  absoluteIndex?: number; // 💡 버그 해결을 위한 절대 인덱스 식별자 추가
}

// 한글 자소 분리 헬퍼 함수
function disassembleHangul(char: string): string {
  if (!char) return "";
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return char;

  const hangulIndex = code - 0xac00;
  const cho = Math.floor(hangulIndex / 588);
  const jung = Math.floor((hangulIndex % 588) / 28);
  const jong = hangulIndex % 28;

  const CHOSUNG = [
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
  const JUNGSUNG = [
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
  const JONGSUNG = [
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

  return CHOSUNG[cho] + JUNGSUNG[jung] + (JONGSUNG[jong] ? JONGSUNG[jong] : "");
}

function App() {
  const [index, setIndex] = useState(0);
  const [userKeys, setUserKeys] = useState<string[]>([]);

  const currentSentence = TYPING_SENTENCES[index];

  // 💡 1차원 원본 셀 배열을 추출한 뒤, 필터링 및 공백 생략 전 '순수 본문 절대 인덱스'를 마킹합니다.
  const wongoziCells = useMemo(() => {
    const rawCells = formatToWongoziCells(currentSentence) as WongoziCell[];
    return rawCells.map((cell, idx) => ({ ...cell, absoluteIndex: idx }));
  }, [currentSentence]);

  const convertedUserSentence = useMemo(
    () => convertKeyArrayToSentence(userKeys),
    [userKeys],
  );

  const userWongoziCells = useMemo(() => {
    const rawCells = formatToWongoziCells(
      convertedUserSentence,
    ) as WongoziCell[];
    return rawCells.map((cell, idx) => ({ ...cell, absoluteIndex: idx }));
  }, [convertedUserSentence]);

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

      // 스페이스바 입력 제어 가드 (다음에 올 문자가 따옴표 계열이면 차단)
      if (e.key === " " || e.code === "Space") {
        const nextInputCellIndex = userWongoziCells.length;
        const targetCellForNextInput = wongoziCells[nextInputCellIndex];

        if (targetCellForNextInput) {
          const nextTargetText = targetCellForNextInput.targetText;
          if (
            /['"“”‘’]/.test(nextTargetText) ||
            targetCellForNextInput.type === "open-quote" ||
            targetCellForNextInput.type === "close-quote"
          ) {
            e.preventDefault();
            return;
          }
        }

        const lastUserCell = userWongoziCells[userWongoziCells.length - 1];
        if (lastUserCell) {
          const lastChar = lastUserCell.targetText.slice(-1);
          const isPunctuation = /[.,?!'"“”指標‘’]/.test(lastChar);
          const isSpace = lastChar === " ";
          if (isPunctuation || isSpace) {
            e.preventDefault();
            return;
          }
        }
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
      setUserKeys((prev) => [...prev, pressedKey]);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [userWongoziCells, wongoziCells]);

  const handleNextSentence = () => {
    setIndex((p) => (p + 1) % TYPING_SENTENCES.length);
    setUserKeys([]);
  };

  // 💡 매트릭스 빌더 내에서 여백으로 밀려나도 absoluteIndex가 안전하게 유실되지 않도록 전파합니다.
  const buildWongoziMatrix = (cells: WongoziCell[]) => {
    const matrix: WongoziCell[][] = [];
    let currentRow: WongoziCell[] = [];
    let currentRowCount = 0;

    const startNewRow = () => {
      currentRow = [
        { targetText: "", type: "margin" },
        { targetText: "", type: "margin" },
      ];
      currentRowCount = 0;
    };

    const endCurrentRow = (cell1?: WongoziCell, cell2?: WongoziCell) => {
      currentRow.push(
        cell1
          ? { ...cell1, type: "margin" as const, originalType: cell1.type }
          : { targetText: "", type: "margin" },
      );
      currentRow.push(
        cell2
          ? { ...cell2, type: "margin" as const, originalType: cell2.type }
          : { targetText: "", type: "margin" },
      );
      matrix.push(currentRow);
      currentRow = [];
    };

    const isPunctuationCell = (c: WongoziCell | undefined) => {
      if (!c) return false;
      return (
        c.type === "combined" ||
        c.type === "open-quote" ||
        c.type === "close-quote" ||
        /[.,?!'"指标‘’]/.test(c.targetText)
      );
    };

    startNewRow();

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];

      if (currentRowCount === 0 && cell.targetText === " ") {
        continue;
      }

      if (currentRowCount === 19) {
        const nextCell = cells[i + 1];
        const nextNextCell = cells[i + 2];

        if (isPunctuationCell(nextCell) && isPunctuationCell(nextNextCell)) {
          currentRow.push(cell);
          endCurrentRow(nextCell, nextNextCell);
          i += 2;
          startNewRow();
          continue;
        }

        if (isPunctuationCell(nextCell)) {
          currentRow.push(cell);
          endCurrentRow(nextCell, undefined);
          i++;
          startNewRow();
          continue;
        }
      }

      currentRow.push(cell);
      currentRowCount++;

      if (currentRowCount === 20) {
        endCurrentRow(undefined, undefined);
        startNewRow();
      }
    }

    if (currentRowCount > 0) {
      while (currentRowCount < 20) {
        currentRow.push({ targetText: " ", type: "normal" });
        currentRowCount++;
      }
      endCurrentRow(undefined, undefined);
    }

    if (matrix.length === 0) {
      matrix.push([
        { targetText: "", type: "margin" },
        { targetText: "", type: "margin" },
        ...Array(20)
          .fill(null)
          .map(() => ({ targetText: " ", type: "normal" })),
        { targetText: "", type: "margin" },
        { targetText: "", type: "margin" },
      ]);
    }

    return matrix;
  };

  const targetMatrix = useMemo(
    () => buildWongoziMatrix(wongoziCells),
    [wongoziCells],
  );
  const userMatrix = useMemo(
    () => buildWongoziMatrix(userWongoziCells),
    [userWongoziCells],
  );

  // 💡 [버그 완치판 하이브리드 결합 엔진] 고유 절대 식별자(absoluteIndex) 비교 체계 구축
  const finalHybridMatrix = useMemo(() => {
    let totalUserCellsCount = userWongoziCells.length;

    return targetMatrix.map((targetRow) => {
      return targetRow.map((targetCell) => {
        // 1. 만약 정답 매트릭스의 해당 셀에 인덱스가 없는 무의미한 기본 빈 여백 마진 칸이라면 가이드로 처리
        if (targetCell.absoluteIndex === undefined) {
          return {
            ...targetCell,
            source: "target" as const,
            isError: false,
            isCurrent: false,
            displayTarget: true,
          };
        }

        const currentCellIdx = targetCell.absoluteIndex;

        // 2. 유저가 입력한 매트릭스 전역에서 동일한 absoluteIndex를 가진 유저 세포를 다이렉트로 추적 검색
        let userCell: WongoziCell | null = null;
        for (const row of userMatrix) {
          const found = row.find((c) => c.absoluteIndex === currentCellIdx);
          if (found) {
            userCell = found;
            break;
          }
        }

        // 3. 유저가 타이핑을 거쳐간 고유 영역인지 절대 인덱스로 명확히 판정
        const hasBeenVisited = currentCellIdx < totalUserCellsCount;
        const isCurrentActiveCell =
          currentCellIdx === totalUserCellsCount - 1 && totalUserCellsCount > 0;

        if (hasBeenVisited && userCell) {
          // 규칙 3: 글자 자리인데 유저가 스페이스바로 넘겼을 때 (공백 오타)
          if (userCell.targetText === " " && targetCell.targetText !== " ") {
            return {
              ...userCell,
              source: "user" as const,
              isError: true,
              isCurrent: false,
              displayTarget: false,
            };
          }

          if (isCurrentActiveCell) {
            // 규칙 2: 현재 실시간 타이핑 중인 최전선 칸 (자소 진행 검사)
            const targetDecom = disassembleHangul(targetCell.targetText);
            const userDecom = disassembleHangul(userCell.targetText);
            const isCorrectProgress = targetDecom.startsWith(userDecom);

            return {
              ...userCell,
              source: "user" as const,
              isError: !isCorrectProgress,
              isCurrent: true,
              displayTarget: false,
            };
          } else {
            // 규칙 1: 이미 타이핑하고 지나간 과거의 칸 (1:1 완벽 대조)
            const isError = userCell.targetText !== targetCell.targetText;
            return {
              ...userCell,
              source: "user" as const,
              isError,
              isCurrent: false,
              displayTarget: false,
            };
          }
        } else {
          // 🛡️ 아직 타이핑이 도달하지 않은 미래의 칸은 오타 판정 절대 차단 (가이드 회색 유지)
          return {
            ...targetCell,
            source: "target" as const,
            isError: false,
            isCurrent: false,
            displayTarget: true,
          };
        }
      });
    });
  }, [targetMatrix, userMatrix, userWongoziCells]);

  // 검증용 기본 격자 스타일 제어기
  const getCellGridStyle = (
    cellType: string,
    isTarget: boolean,
    columnIndex: number,
  ) => {
    const baseStyle: React.CSSProperties = {
      aspectRatio: "1/1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.25rem",
      position: "relative",
    };

    if (cellType === "margin") {
      return {
        ...baseStyle,
        border: "none",
        backgroundColor: "transparent",
        color: isTarget ? "#cbd5e1" : "#2563eb",
        fontWeight: isTarget ? "normal" : "bold",
      };
    }

    const themeColor = isTarget ? "#0d9488" : "#2563eb";
    return {
      ...baseStyle,
      borderRight: "1px solid #cbd5e1",
      borderBottom: `2px solid ${themeColor}`,
      borderLeft: columnIndex === 2 ? "1px solid #cbd5e1" : undefined,
      backgroundColor: isTarget ? "#fff" : "#eff6ff",
      color: isTarget ? "#94a3b8" : "#1e3a8a",
      fontWeight: isTarget ? "normal" : "bold",
    };
  };

  // 🏆 하이브리드 최종 결과창 전용 스타일 제어기
  const getHybridCellStyle = (cell: any, columnIndex: number) => {
    const baseStyle: React.CSSProperties = {
      aspectRatio: "1/1",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.25rem",
      position: "relative",
      fontWeight: cell.source === "user" ? "bold" : "normal",
    };

    if (cell.type === "margin") {
      return {
        ...baseStyle,
        border: "none",
        backgroundColor: "transparent",
        color: cell.isError
          ? "#dc2626"
          : cell.source === "user"
            ? "#111"
            : "#94a3b8",
      };
    }

    let borderTheme = "#059669";
    let bgTheme = "#fff";
    let textTheme = "#94a3b8";

    if (cell.source === "user") {
      if (cell.isError) {
        bgTheme = "#fee2e2";
        textTheme = "#dc2626";
      } else {
        bgTheme = "#fff";
        textTheme = "#111";
      }
    }

    return {
      ...baseStyle,
      borderRight: "1px solid #cbd5e1",
      borderBottom: `2px solid ${borderTheme}`,
      borderLeft: columnIndex === 2 ? "1px solid #cbd5e1" : undefined,
      backgroundColor: bgTheme,
      color: textTheme,
    };
  };

  return (
    <div
      style={{
        padding: "40px",
        backgroundColor: "#f5f5f3",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          backgroundColor: "#fff",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#115e59",
            marginBottom: "40px",
            letterSpacing: "2px",
          }}
        >
          綠 陰 方 草 (녹음방초) : 고유 인덱스 싱크 교정 스크린
        </h1>

        {/* 🟢 AREA 1: 정답 가이드 원고지 덤프 */}
        <section style={{ marginBottom: "25px" }}>
          <h3 style={{ color: "#0d9488", marginBottom: "12px" }}>
            [🟢 정답 문장 조판 결과 (모든 엘리먼트 유지 1)]
          </h3>
          <div
            style={{
              borderTop: "2px solid #0d9488",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {targetMatrix.map((row, rowIndex) => (
              <div
                key={`target-row-${rowIndex}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(24, 1fr)",
                }}
              >
                {row.map((cell: any, colIndex) => (
                  <div
                    key={`target-c-${rowIndex}-${colIndex}`}
                    style={getCellGridStyle(cell.type, true, colIndex)}
                  >
                    <span
                      className={getCellStyle(cell.originalType || cell.type)}
                    >
                      {cell.targetText}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* 🔵 AREA 2: 유저 실시간 입력 원고지 덤프 */}
        <section style={{ marginBottom: "50px" }}>
          <h3 style={{ color: "#2563eb", marginBottom: "12px" }}>
            [🔵 유저 입력 조판 결과 (모든 엘리먼트 유지 2)]
          </h3>
          <div
            style={{
              borderTop: "2px solid #2563eb",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {userMatrix.map((row, rowIndex) => (
              <div
                key={`user-row-${rowIndex}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(24, 1fr)",
                }}
              >
                {row.map((cell: any, colIndex) => (
                  <div
                    key={`user-c-${rowIndex}-${colIndex}`}
                    style={getCellGridStyle(cell.type, false, colIndex)}
                  >
                    <span
                      className={getCellStyle(cell.originalType || cell.type)}
                    >
                      {cell.targetText}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* 🏆 AREA 3: 실시간 오타 교정 하이브리드 결합 원고지 */}
        <section
          style={{
            marginBottom: "40px",
            borderTop: "3px double #059669",
            paddingTop: "30px",
          }}
        >
          <h3
            style={{
              color: "#059669",
              marginBottom: "16px",
              fontWeight: "bold",
              fontSize: "1.1rem",
            }}
          >
            [🏆 완성판 템플릿: 실시간 오타 판정 하이브리드 원고지 스크린]
          </h3>
          <div
            style={{
              borderTop: "2px solid #059669",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#fcfbf7",
            }}
          >
            {finalHybridMatrix.map((row, rowIndex) => (
              <div
                key={`hybrid-row-${rowIndex}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(24, 1fr)",
                }}
              >
                {row.map((cell: any, colIndex) => (
                  <div
                    key={`hybrid-c-${rowIndex}-${colIndex}`}
                    style={getHybridCellStyle(cell, colIndex)}
                  >
                    <span
                      className={getCellStyle(cell.originalType || cell.type)}
                    >
                      {cell.displayTarget ||
                      (cell.source === "user" && cell.targetText !== " ")
                        ? cell.targetText
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* 하단 대시보드 */}
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
            유저 키 데이터 복원:{" "}
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
    </div>
  );
}

export default App;
