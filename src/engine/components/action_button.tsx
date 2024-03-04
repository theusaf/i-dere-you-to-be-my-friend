import { Unselectable } from "./unselectable";

export interface ActionButtonProps {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
  onMouseOver?: React.MouseEventHandler<HTMLSpanElement>;
  onMouseOut?: React.MouseEventHandler<HTMLSpanElement>;
  children: React.ReactNode;
  disabled?: boolean;
}

export function TextActionButton({
  className,
  onClick,
  onMouseOver,
  onMouseOut,
  children,
  disabled,
}: ActionButtonProps): JSX.Element {
  return (
    <span
      className={`outline-neutral-600 active:outline-neutral-400 text-white outline outline-4 p-2 m-1 ${disabled ? "bg-neutral-500 text-neutral-300 cursor-not-allowed" : "bg-neutral-400 active:bg-neutral-600"} ${className ?? ""}`}
      onClick={!disabled ? onClick : undefined}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    >
      <Unselectable>{children}</Unselectable>
    </span>
  );
}
