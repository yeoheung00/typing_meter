import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { TYPING_SAMPLES } from "./data/sentences";
import { convertKeyArrayToSentence } from "./util/converter";
import {
  formatToWongoziCells,
  getCellStyle,
  preprocessSentence,
  buildWongoziMatrix,
  type FinalWongozi,
} from "./util/format";
import BlankIcon from "./components/BlankIcon";
import "./App.css";

const THEME_COLORS = {
  text: "text-red-400",
  line: "bg-red-400",
  border: "border-red-400",
  bg: "bg-blue-100",
  shadow: "shadow-blue-100",
};

const getBorderWidthClass = (cellIndex: number): string => {
  const borderColor = THEME_COLORS.border;
  switch (cellIndex) {
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

function App() {
  // ==========================================
  // 1. 상태 및 참조 선언 (State & Refs)
  // ==========================================
  const [index, setIndex] = useState<number>(() =>
    Math.floor(Math.random() * TYPING_SAMPLES.length),
  );
  const [userKeys, setUserKeys] = useState<string[]>([]);
  const [cpmBreak, setCpmBreak] = useState<boolean>(false);
  const [animationState, setAnimationState] = useState<
    "initial" | "expanded" | "collapsed"
  >("initial");
  const [cpm, setCpm] = useState<number>(0);

  const history = useRef<number[]>([]);
  const startTime = useRef<number>(0);
  const refreshTime = useRef<number>(0);

  // 키다운 이벤트 리스너용 최신 상태 미러링 Refs
  const userKeysLengthRef = useRef<number>(0);
  const statusRef = useRef({ isEnd: false, cpmBreak: false });

  // ==========================================
  // 2. 파생 데이터 연산 (useMemo)
  // ==========================================
  const currentSentence = useMemo<string>(
    () => preprocessSentence(TYPING_SAMPLES[index].sentence),
    [index],
  );

  const convertedUserSentence = convertKeyArrayToSentence(userKeys);
  const userWongoziFormat = formatToWongoziCells(convertedUserSentence);
  const targetWongoziFormat = formatToWongoziCells(currentSentence);

  const isTyping = userKeys.length > 0;
  const isEnd = userWongoziFormat.length >= targetWongoziFormat.length;

  // 💡 리액트 렌더링 원칙 준수: 렌더 파이프라인 진행 중에 Ref를 조작하지 않고 이펙트로 위임
  useEffect(() => {
    userKeysLengthRef.current = userKeys.length;
  }, [userKeys.length]);

  useEffect(() => {
    statusRef.current = { isEnd, cpmBreak };
  }, [isEnd, cpmBreak]);

  // 원고지 매트릭스 계산 로직
  const { finalMatrix, accuracy } = useMemo(() => {
    const userWongoziMatrix = buildWongoziMatrix(userWongoziFormat);
    const targetWongoziMatrix = buildWongoziMatrix(targetWongoziFormat);
    const calculatedMatrix: FinalWongozi[][] = [];
    let errCount = 0;

    const maxRow = Math.max(
      targetWongoziMatrix.length,
      userWongoziMatrix.length,
    );

    for (let r = 0; r < maxRow; r++) {
      const userRow = userWongoziMatrix[r] ?? [];
      const targetRow = targetWongoziMatrix[r] ?? [];
      const maxCell = Math.max(userRow.length, targetRow.length);
      const finalWongoziRow: FinalWongozi[] = [];
      const isCompleteLine = userWongoziMatrix.length - 1 > r;

      for (let c = 0; c < maxCell; c++) {
        const userCell = userRow[c];
        const userNextCell = userRow[c + 1];
        const targetCell = targetRow[c];
        const targetNextCell = targetRow[c + 1];

        const safeTargetCell: FinalWongozi = targetCell ?? {
          targetText: " ",
          targetKeys: " ",
          type: "normal",
          cursor: false,
        };

        if (isCompleteLine || cpmBreak) {
          const userText = userCell?.targetText ?? "";
          const targetText = targetCell?.targetText ?? "";
          const isErr = userText !== targetText;
          finalWongoziRow.push({ ...userCell, isErr, cursor: false });
          if (isErr) errCount++;
        } else if (!userCell) {
          const isOverflowErr = c > 19 && userWongoziMatrix[r + 1];
          finalWongoziRow.push(
            isOverflowErr ? { ...safeTargetCell, isErr: true } : safeTargetCell,
          );
          if (isOverflowErr) errCount++;
        } else {
          const userText = userCell.targetText;
          const targetText = targetCell?.targetText ?? "";

          if (userNextCell) {
            const isErr = userText !== targetText;
            finalWongoziRow.push({ ...userCell, isErr, cursor: false });
            if (isErr) errCount++;
          } else {
            const currentTargetKeys = targetCell?.targetKeys ?? "";
            const nextTargetKeys =
              targetNextCell?.targetKeys ??
              targetWongoziMatrix[r + 1]?.[0]?.targetKeys ??
              "";
            const combinedTargetKeys = currentTargetKeys + nextTargetKeys;

            if (userText === " " && ['"', "'"].includes(targetText)) {
              finalWongoziRow.push({ ...safeTargetCell, cursor: true });
              continue;
            }

            const isErr = !combinedTargetKeys.startsWith(userCell.targetKeys);
            finalWongoziRow.push({ ...userCell, isErr, cursor: true });
            if (isErr) errCount++;
          }
        }
      }
      calculatedMatrix.push(finalWongoziRow);
    }

    const typedLength = userWongoziFormat.length;
    const calculatedAccuracy =
      typedLength > 0
        ? Math.max(
            0,
            Math.floor(((typedLength - errCount) / typedLength) * 100),
          )
        : 0;

    return { finalMatrix: calculatedMatrix, accuracy: calculatedAccuracy };
  }, [targetWongoziFormat, userWongoziFormat, cpmBreak]);

  // ==========================================
  // 3. 비즈니스 핸들러 (Callback)
  // ==========================================
  const handleNextSentence = useCallback((): void => {
    startTime.current = 0;
    refreshTime.current = 0;

    while (true) {
      if (history.current.length === TYPING_SAMPLES.length) {
        history.current = [];
      }
      const nextIndex = Math.floor(Math.random() * TYPING_SAMPLES.length);
      if (!history.current.includes(nextIndex)) {
        setIndex(nextIndex);
        history.current.push(nextIndex);
        break;
      }
    }
    setUserKeys([]);
    setCpmBreak(false);
    setAnimationState("collapsed");
    setCpm(0);
  }, []);

  // ==========================================
  // 4. 사이드 이펙트 (Lifecycles & Effects)
  // ==========================================
  useEffect(() => {
    if (isTyping) startTime.current = Date.now();
  }, [isTyping]);

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
      const { cpmBreak: currentCpmBreak, isEnd: currentIsEnd } =
        statusRef.current;
      if (currentCpmBreak) {
        handleNextSentence();
        return;
      }
      if (currentIsEnd && !currentCpmBreak) {
        setCpmBreak(true);
        setAnimationState("expanded");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (
        e.key.length > 1 &&
        !["Enter", "Backspace", "Spacebar"].includes(e.key)
      )
        return;

      if (e.key === "Enter") {
        finish();
        return;
      }

      const { cpmBreak: currentCpmBreak, isEnd: currentIsEnd } =
        statusRef.current;
      if (currentCpmBreak) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        setUserKeys((prev) => prev.slice(0, -1));
        if (userKeysLengthRef.current === 1) setCpm(0);
        return;
      }

      let pressedKey = "";
      if (e.code === "Space") {
        if (currentIsEnd) {
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
        const currentSentenceStr = convertKeyArrayToSentence(prev);
        const lastCharOfSentence = currentSentenceStr.slice(-1);
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
  }, [handleNextSentence]);

  // ==========================================
  // 5. 뷰 렌더링 영역 (JSX)
  // ==========================================
  return (
    <div className="w-full h-full flex items-center justify-center font-serif">
      <main className="flex flex-col gap-4 items-center">
        <section className="relative w-full flex flex-col gap-2 items-center">
          <h1 className="text-3xl font-bold">{TYPING_SAMPLES[index].title}</h1>
          <p className="text-xl">{TYPING_SAMPLES[index].author}</p>

          <div className="absolute right-28 bottom-0 flex flex-row items-end">
            <span className={`${THEME_COLORS.text} text-md font-bold`}>
              CPM.
            </span>
            <div className="flex flex-col items-center">
              <span className="text-md font-bold">{cpm}</span>
              <div className={`w-16 h-0.5 ${THEME_COLORS.line}`}></div>
            </div>
            <span className={`${THEME_COLORS.text} text-md font-bold`}>
              ACC.
            </span>
            <div className="flex flex-col items-center">
              <span className="text-md font-bold">{accuracy}</span>
              <div className={`w-16 h-0.5 ${THEME_COLORS.line}`}></div>
            </div>
          </div>
        </section>

        <section>
          {finalMatrix.map((row, rowIndex) => (
            <div key={rowIndex} className="flex flex-col items-center">
              {rowIndex > 0 && (
                <div
                  className={`${THEME_COLORS.border} border-l-2 border-r-2 w-280 h-4`}
                />
              )}

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
                    } w-14 h-14 ${getBorderWidthClass(cellIndex)}`}
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
                    ) : cell.targetText === " " && cellIndex > 19 ? (
                      <BlankIcon
                        className={
                          cell.isErr === undefined
                            ? "text-gray-300"
                            : cell.isErr
                              ? "text-red-400"
                              : "opacity-0"
                        }
                      />
                    ) : (
                      <span
                        className={getCellStyle(cell.originalType ?? cell.type)}
                      >
                        {cell.targetText}
                      </span>
                    )}

                    {!cpmBreak &&
                      (cell.cursor ||
                        (userKeys.length === 0 &&
                          rowIndex === 0 &&
                          cellIndex === 0)) && (
                        <div className="absolute w-10 h-0.5 left-1/2 bottom-1 -translate-x-1/2 bg-black animate-blink" />
                      )}

                    {cpmBreak && (
                      <div
                        className={`h-13 animate-complete ${THEME_COLORS.bg} z-1`}
                      />
                    )}
                  </div>
                ))}

                {row.length < 22 &&
                  Array.from({ length: 22 - row.length }).map((_, i) => (
                    <span
                      key={i}
                      className={`${getBorderWidthClass(row.length + i)} w-14 h-14`}
                    />
                  ))}
              </div>
            </div>
          ))}
        </section>

        <div className="w-full pr-28 flex justify-end">
          <button
            className={`${THEME_COLORS.bg} h-10 py-1 pl-2 cursor-pointer rounded-full flex flex-row items-center overflow-hidden`}
            onClick={(e) => {
              e.currentTarget.blur();
              handleNextSentence();
            }}
          >
            <span
              key={cpmBreak ? "expanded" : "collapsed"}
              className={`w-max whitespace-nowrap h-fit z-5 ${
                animationState === "initial"
                  ? "max-w-0 opacity-0"
                  : animationState === "collapsed"
                    ? "animate-transition1-r"
                    : "animate-transition1"
              }`}
            >
              Enter를 눌러&nbsp;
            </span>
            <span
              className={`w-fit h-fit pr-2 z-10 shadow-[-4px_0px_4px_0px_#dbeafe] ${THEME_COLORS.bg}`}
            >
              넘어가기
            </span>
          </button>
        </div>
      </main>
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 w-max max-w-4xl flex flex-col items-center gap-2 text-xs text-gray-400 opacity-40 hover:opacity-100 transition-opacity duration-300 pointer-events-auto font-sans">
        {/* 버전 정보 */}
        <h1 className="text-[10px] text-gray-400 font-sans tracking-widest uppercase mb-1">
          v1.2.0
        </h1>

        {/* 주요 링크 그룹 */}
        <div className="flex flex-row items-center gap-4 font-medium">
          <a
            href="https://github.com/yeoheung00/typing_meter"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors cursor-pointer"
          >
            GitHub
          </a>
          <span className="w-px h-2.5 bg-gray-200"></span>
          <a
            href="https://github.com/yeoheung00/typing_meter/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400/80 hover:text-red-500 font-bold transition-colors cursor-pointer"
          >
            ⚠ 오타 및 버그 제보
          </a>
          <span className="w-px h-2.5 bg-gray-200"></span>
          <a
            href="https://github.com/yeoheung00/typing_meter#credits"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-600 transition-colors cursor-pointer"
            title="도서명, 저자 등 원작자의 저작권을 존중합니다."
          >
            Credits
          </a>
          <span className="w-px h-2.5 bg-gray-200"></span>
          <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
            MIT License
          </span>
        </div>

        {/* 면책 성명서 */}
        <p className="text-center leading-relaxed max-w-2xl text-[11px] font-sans scale-95 origin-center">
          본 프로젝트는 비영리 교육 및 개인 기술 역량 향상을 목적으로 개발된
          오픈소스 타이핑 연습기입니다. 연습에 사용된 문학 작품 등 모든 샘플
          데이터는 저작권법 제35조의5(저작물의 공정 이용)를 준수하며, 저작권
          관련 권리 침해 의사나 영리적 활용 의도가 전혀 없습니다. 혹 저작권 수정
          및 삭제 요청이 있으실 경우{" "}
          <a
            href="https://github.com/yeoheung00/typing_meter/issues/new"
            className="text-blue-400/80 hover:underline"
          >
            GitHub Issue
          </a>{" "}
          혹은{" "}
          <a
            href="mailto:yeoheung27@gmail.com"
            className="text-blue-400/80 hover:underline"
          >
            메일
          </a>
          로 문의해 주시면 즉시 반영하겠습니다.
        </p>

        {/* 카피라이트 */}
        <span className="font-sans text-[10px] tracking-wider text-gray-400/80 mt-0.5">
          © 2026 MinK Studio. All rights reserved.
        </span>
      </footer>
    </div>
  );
}

export default App;
