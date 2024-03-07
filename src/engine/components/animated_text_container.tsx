import { useEffect, useState } from "react";

export interface AnimatedTextControllerProps {
  className?: string;
  children: string;
  speaker?: string;
  onComplete?: () => void;
  onCompleteAction?: () => void;
  key: any;
}

/**
 * A component that displays text one character at a time.
 *
 * @param children The text to display.
 * @param className The class name to apply to the component.
 * @param onComplete A callback for when the text is fully displayed.
 * @param onCompleteAction A callback for when the text is fully displayed and the user clicks on the container.
 */
export function AnimatedTextController({
  children: finalText,
  speaker,
  className,
  onComplete,
  onCompleteAction,
}: AnimatedTextControllerProps): JSX.Element {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (index < finalText.length) {
        setIndex(index + 1);
      } else {
        onComplete?.();
      }
    }, 25);
    return () => clearInterval(timeout);
  }, [index, onComplete, finalText.length]);
  return (
    <div
      className={`text-left h-full relative ${className}`}
      onClick={() => {
        if (index === finalText.length) {
          onCompleteAction?.();
        }
        if (index < finalText.length) {
          setIndex(finalText.length);
        }
      }}
    >
      {speaker && <div className="p-2">{speaker}</div>}
      <div>{finalText.substring(0, index)}</div>
    </div>
  );
}
