import { useEffect, useState } from "react";
import { ActionButtonProps, TextActionButton } from "./action_button";

export function ConfirmationButton({
  className,
  onClick,
  onMouseOver,
  children,
}: ActionButtonProps) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setConfirming(false);
    }, 5000);
    return () => {
      clearTimeout(timeout);
    };
  }, [confirming]);
  return (
    <TextActionButton
      onMouseOver={onMouseOver}
      className={className}
      onClick={(event) => {
        event.stopPropagation();
        if (confirming) {
          onClick?.(event);
        } else {
          setConfirming(true);
        }
      }}
    >
      {confirming ? "Are you sure?" : children}
    </TextActionButton>
  );
}
