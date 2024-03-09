import { Character } from "../../game/util/character";
import { MoveData } from "../../game/util/moves";
import { TextActionButton } from "./action_button";
import { NumberSpan } from "./numer_span";
import { TypeIcon } from "./type_icon";

export function MoveButton({
  className,
  disabled,
  onMouseOver,
  onMouseOut,
  onClick,
  moveData,
  move,
  user,
}: {
  className?: string;
  disabled?: boolean;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
  onClick?: () => void;
  moveData: MoveData;
  move: string;
  user: Character;
}) {
  return (
    <TextActionButton
      className={className}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex flex-col align-middle h-full">
        <div>{moveData.name}</div>
        <div className="text-sm">
          <TypeIcon type={moveData.type} />
        </div>
        <div>
          <NumberSpan>
            {user.moveUses[move]}/{moveData.max_uses}
          </NumberSpan>
        </div>
      </div>
    </TextActionButton>
  );
}
