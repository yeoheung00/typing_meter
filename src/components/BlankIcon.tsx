interface BlankIconProps {
  className?: string;
}

export default function BlankIcon({ className = "" }: BlankIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 56 56"
      // w-full h-full로 채우고, 외부에서 주입된 색상/스타일 클래스를 결합합니다.
      className={`absolute z-10 w-full h-full ${className}`}
    >
      {/* 1. 왼쪽 기둥 (2 * 6px, left: 12, bottom: 12)
           - X: 12, Y: 56 - 12 - 6 = 38
      */}
      <rect x="12" y="38" width="2" height="6" fill="currentColor" />

      {/* 2. 오른쪽 기둥 (2 * 6px, right: 12, bottom: 12)
           - X: 56 - 12 - 2 = 42, Y: 38
      */}
      <rect x="42" y="38" width="2" height="6" fill="currentColor" />

      {/* 3. 바닥 가로선 (32 * 2px, left: 12, bottom: 12)
           - X: 12, Y: 56 - 12 - 2 = 42
      */}
      <rect x="12" y="42" width="32" height="2" fill="currentColor" />
    </svg>
  );
}
