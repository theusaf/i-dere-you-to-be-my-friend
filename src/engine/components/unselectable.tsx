export interface UnselectableProps {
  children: React.ReactNode;
  className?: string;
}

export function Unselectable({ children, className }: UnselectableProps) {
  return (
    <div
      style={{
        userSelect: "none",
        pointerEvents: "none",
      }}
      className={className}
    >
      {children}
    </div>
  );
}
