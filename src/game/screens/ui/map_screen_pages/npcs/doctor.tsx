import { TextActionButton } from "../../../../../engine/components/action_button";
import { Character } from "../../../../util/character";
import { MapScreen } from "../../../map_screen";

export function DoctorDialog({
  screen,
}: {
  screen: MapScreen;
  setNpcDialog: (npc: Character | null) => void;
}): JSX.Element {
  const { gameManager } = screen;
  console.log("DoctorDialog", gameManager);
  const className = "grid items-center text-2xl";
  return (
    <div className="absolute bottom-0 left-0 h-1/4 bg-slate-700 text-white w-full p-2 pointer-events-auto border-t-4 border-slate-500">
      <div className="grid grid-cols-3 h-full gap-4 text-center">
        <TextActionButton className={className}>Talk</TextActionButton>
        <TextActionButton className={className}>Rizz</TextActionButton>
        <TextActionButton className={className}>Fight</TextActionButton>
      </div>
    </div>
  );
}
