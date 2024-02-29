import { Unselectable } from "./unselectable";

export interface ActionButtonProps {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
  onMouseOver?: React.MouseEventHandler<HTMLSpanElement>;
  children: React.ReactNode;
}

export function TextActionButton({
  className,
  onClick,
  onMouseOver,
  children,
}: ActionButtonProps): JSX.Element {
  return (
    <span
      className={`${className ? `${className} ` : "bg-neutral-400 active:bg-neutral-600 outline-neutral-600 active:outline-neutral-400 text-white outline outline-4 p-2 m-1"}`}
      onClick={onClick}
      onMouseOver={onMouseOver}
    >
      <Unselectable>{children}</Unselectable>
    </span>
  );
}
