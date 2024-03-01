export interface UnselectableProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function Unselectable({
  children,
  className,
  style,
}: UnselectableProps) {
  return (
    <div
      className={`${className ?? ""} select-none pointer-events-none`}
      style={style}
    >
      {children}
    </div>
  );
}
