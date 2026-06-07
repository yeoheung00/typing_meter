import { useState, useEffect, useMemo, useRef } from "react";
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
  const convertedUserSentence = convertKeyArrayToSentence(userKeys);

  const userWongoziFormat = formatToWongoziCells(convertedUserSentence);
  const targetWongoziFormat = formatToWongoziCells(currentSentence);

  const isTyping = userKeys.length > 0;
  const isEnd = userWongoziFormat.length >= targetWongoziFormat.length;
  const [cpmBreak, setCpmBreak] = useState(false);
  const startTime = useRef(0);
  const refreshTime = useRef(0);
  const [cpm, setCpm] = useState(0);

  const handleNextSentence = () => {
    startTime.current = 0;
    refreshTime.current = 0;
    setIndex((p) => (p + 1) % TYPING_SAMPLES.length);
    setUserKeys([]);
    setCpmBreak(false);
    setCpm(0);
  };

  useEffect(() => {
    if (cpmBreak) return;

    if (userKeys.length === 0) {
      startTime.current = 0;
      refreshTime.current = 0;
    } else if (userKeys.length === 1 && startTime.current === 0) {
      startTime.current = Date.now();
      refreshTime.current = Date.now();
    } else if (userKeys.length > 1) {
      refreshTime.current = Date.now();
    }

    const timeDifference =
      (refreshTime.current - startTime.current) / 1000 / 60;
    if (timeDifference > 0) {
      setCpm(Math.floor(userKeys.length / timeDifference));
    }
  }, [userKeys, cpmBreak]);

  useEffect(() => {
    if (startTime.current === 0 || cpmBreak) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const timeDifference = (now - startTime.current) / 1000 / 60;

      if (timeDifference > 0) {
        setCpm(Math.round(userKeys.length / timeDifference));
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [userKeys, cpmBreak]);

  useEffect(() => {
    const finish = () => {
      if (cpmBreak) {
        handleNextSentence();
        return;
      }

      if (isEnd && !cpmBreak) {
        console.log("end");
        setCpmBreak(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (
        e.key.length > 1 &&
        e.key !== "Enter" &&
        e.key !== "Backspace" &&
        e.key !== "Spacebar"
      )
        return;

      if (e.key === "Enter") {
        finish();
        return;
      }

      if (cpmBreak) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        setUserKeys((prev) => prev.slice(0, -1));
        return;
      }

      let pressedKey = "";
      if (e.code === "Space") {
        if (isEnd) {
          finish();
          return;
        }
        pressedKey = " ";
      } else if (e.code.startsWith("Key")) {
        const char = e.code.replace("Key", "");
        pressedKey = e.shiftKey ? char.toUpperCase() : char.toLowerCase();
      } else {
        pressedKey = e.key.toLowerCase();
      }

      if (!pressedKey) return;

      setUserKeys((prev) => {
        const currentSentence = convertKeyArrayToSentence(prev);
        const lastCharOfSentence = currentSentence.slice(-1);
        const lastKeyOfArray = prev[prev.length - 1];
        const isPunctuation = /[.,?!'’"”]/.test(pressedKey);
        const isLastCharPunctuation = /[.,?!'’"”]/.test(lastCharOfSentence);
        if (pressedKey === " " && isLastCharPunctuation) {
          return prev;
        }
        if (pressedKey === " " || isPunctuation) {
          if (lastCharOfSentence === " " || lastKeyOfArray === " ") {
            const poppedPrev =
              lastKeyOfArray === " " ? prev.slice(0, -1) : prev;
            return [...poppedPrev, pressedKey];
          }
        }
        return [...prev, pressedKey];
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEnd, cpmBreak, userKeys]);

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

        if (i === formatCells.length - 1) {
          matrix.push(currentRow);
          break;
        }

        if (cellCounter === 20) {
          cellCounter = 0;
          if (isPunctuationCell(formatCells[i + 1])) {
            currentRow.push(formatCells[i + 1]);
            i++;
          }
          if (isPunctuationCell(formatCells[i + 1])) {
            currentRow.push(formatCells[i + 1]);
            i++;
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

        const safeTargetCell: FinalWongozi = targetCell ?? {
          targetText: " ",
          targetKeys: " ",
          type: "normal",
          cursor: false,
        };

        if (isCompleteLine || cpmBreak) {
          const userText = userCell?.targetText ?? "";
          const targetText = targetCell?.targetText ?? "";
          finalWongoziRow.push({
            ...userCell,
            isErr: userText !== targetText,
            cursor: false,
          });
        } else if (!userCell) {
          if (c > 19 && userWongoziMatrix[r + 1]) {
            finalWongoziRow.push({ ...safeTargetCell, isErr: true });
          } else {
            finalWongoziRow.push(safeTargetCell);
          }
        } else {
          const userText = userCell.targetText;
          const targetText = targetCell?.targetText ?? "";

          if (userNextCell) {
            finalWongoziRow.push({
              ...userCell,
              isErr: userText !== targetText,
              cursor: false,
            });
          } else {
            const currentTargetKeys = targetCell?.targetKeys ?? "";
            let nextTargetKeys = targetNextCell?.targetKeys ?? "";
            if (!nextTargetKeys && targetWongoziMatrix[r + 1]) {
              nextTargetKeys = targetWongoziMatrix[r + 1][0]?.targetKeys ?? "";
            }
            const combinedTargetKeys = currentTargetKeys + nextTargetKeys;

            if (
              userText === " " &&
              (targetText === '"' || targetText === "'")
            ) {
              finalWongoziRow.push({ ...safeTargetCell, cursor: true });
              continue;
            }

            const isErr = !combinedTargetKeys.startsWith(userCell.targetKeys);
            finalWongoziRow.push({ ...userCell, isErr: isErr, cursor: true });
          }
        }
      }
      finalWongoziMatrix.push(finalWongoziRow);
      finalWongoziRow = [];
    }

    return finalWongoziMatrix;
  }, [targetWongoziFormat, userWongoziFormat, cpmBreak]);

  const themeColors = {
    text: "text-red-400",
    line: "bg-red-400",
    border: "border-red-400",
    bg: "bg-blue-100",
  };

  const textColor = themeColors.text;
  const lineColor = themeColors.line;
  const borderColor = themeColors.border;
  const bgColor = themeColors.bg;

  const borderWidth = (cell: number): string => {
    const borderColor = themeColors.border;
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

  useEffect(() => {
    if (isTyping) startTime.current = Date.now();
  }, [isTyping]);

  return (
    <div className="w-full h-full flex items-center justify-center font-serif">
      <main className="flex flex-col gap-4 items-center">
        <section className="relative w-full flex flex-col gap-2 items-center">
          <span className="text-3xl font-bold">
            {TYPING_SAMPLES[index].title}
          </span>
          <span className="text-xl">{TYPING_SAMPLES[index].author}</span>
          <div className="absolute right-28 bottom-0 flex flex-row items-end">
            <span className={`${textColor} text-md font-bold`}>CPM.</span>
            <div className="flex flex-col items-center">
              <span className="text-md font-bold">{cpm}</span>
              <div className={`w-30 h-0.5 ${lineColor} `}></div>
            </div>
          </div>
        </section>
        <section>
          {finalMatrix.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-col items-center">
              {rowIndex > 0 ? (
                <div
                  className={`${borderColor} border-l-2 border-r-2 w-280 h-4`}
                ></div>
              ) : null}
              <div className="flex flex-row pl-28">
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className={`relative ${
                      cell.isErr === undefined
                        ? "text-gray-300 bg-transparent"
                        : (cell.isErr
                            ? "text-red-400 bg-red-100"
                            : "text-black") + " font-bold"
                    } w-14 h-14 ${borderWidth(cellIndex)}`}
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

                    {!cpmBreak &&
                    (cell.cursor ||
                      (userKeys.length === 0 &&
                        rowIndex === 0 &&
                        cellIndex === 0)) ? (
                      <div className="absolute w-10 h-0.5 left-1/2 bottom-1 -translate-x-1/2 bg-black animate-blink"></div>
                    ) : null}
                    {cpmBreak ? (
                      <div
                        className={`h-13 animate-complete ${bgColor} z-1`}
                      ></div>
                    ) : null}
                  </div>
                ))}
                {row.length < 22
                  ? new Array(22 - row.length)
                      .fill("")
                      .map((_, i) => (
                        <span
                          key={i}
                          className={`${borderWidth(row.length + i)} w-14 h-14`}
                        ></span>
                      ))
                  : null}
              </div>
            </div>
          ))}
        </section>

        <div className="w-full pr-28 flex justify-end">
          <button
            className={`${bgColor} h-10 py-1 px-2 cursor-pointer rounded-full flex flex-row items-center`}
            onClick={(e) => {
              e.currentTarget.blur();
              handleNextSentence();
            }}
          >
            <span
              className={` w-max whitespace-nowrap ${!cpmBreak ? "max-w-0" : "max-w-xs"} transition-all duration-500 ease-in-out h-fit overflow-hidden`}
            >
              Enter를 눌러&nbsp;
            </span>
            <span className="w-fit h-fit">넘어가기</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
