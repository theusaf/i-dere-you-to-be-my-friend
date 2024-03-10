import { useRef, useState } from "react";
import { TextActionButton } from "../../../../../engine/components/action_button";
import { Character } from "../../../../util/character";
import { MapScreen } from "../../../map_screen";
import { AnimatedTextController } from "../../../../../engine/components/animated_text_container";
import { ConfirmationButton } from "../../../../../engine/components/confirmation_button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { MapSpecialActionBattle } from "../../../../util/map_types";

enum DoctorDialogState {
  index,
  talk,
  rizz,
  heal,
}

export function DoctorDialog({
  screen,
  setNpcDialog,
}: {
  screen: MapScreen;
  setNpcDialog: (npc: Character | null) => void;
}): JSX.Element {
  const [state, setState] = useState(DoctorDialogState.index);
  const [dialog, setDialog] = useState<string[]>([]);
  const [onDialogFinishCallback, setOnDialogFinishCallback] = useState<
    (() => void) | null
  >(null);
  const { gameManager } = screen;
  const { gameData } = gameManager;
  if (dialog.length) {
  } else if (onDialogFinishCallback) {
    onDialogFinishCallback?.();
    setOnDialogFinishCallback(null);
  }
  if (state === DoctorDialogState.heal) {
  }
  const className = "grid items-center text-2xl";
  return (
    <div className="absolute top-0 left-0 h-full w-full">
      <div
        className="h-3/4 w-full pointer-events-auto"
        onClick={() => {
          setNpcDialog(null);
        }}
      ></div>
      <div className="absolute bottom-0 left-0 h-1/4 bg-slate-700 text-white w-full p-2 pointer-events-auto border-t-4 border-slate-500 flex flex-col">
        {state !== DoctorDialogState.index && (
          <span
            onClick={() => setState(DoctorDialogState.index)}
            className="cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span className="ml-2">Back</span>
          </span>
        )}
        {dialog.length ? (
          <AnimatedTextController
            className="text-xl"
            key={dialog.length}
            onCompleteAction={() => {
              setDialog(dialog.slice(1));
            }}
          >
            {dialog[0]}
          </AnimatedTextController>
        ) : state === DoctorDialogState.talk ? (
          <div className="grid grid-cols-3 gap-4 text-center flex-1">
            <TextActionButton
              className={className}
              onClick={() => {
                setDialog(["Sure thing! One second..."]);
                setState(DoctorDialogState.heal);
              }}
            >
              Heal Active Friends
            </TextActionButton>
            <TextActionButton
              className={className}
              onClick={() => {
                setDialog([
                  "Perhaps explore the area. There are often people playing in bushes or hanging around in the city or at the beach.",
                  "There are rumors of some treasure hidden somewhere. (note: not implemented yet)", // TODO: Implement treasure
                ]);
                setState(DoctorDialogState.index);
              }}
            >
              What should I do?
            </TextActionButton>
            <TextActionButton
              className={className}
              onClick={() => {
                setDialog([
                  "There are a lot of people fighting every day.",
                  "If it were free, we'd be out of business.",
                ]);
                setState(DoctorDialogState.index);
              }}
            >
              Why is healthcare so expensive?
            </TextActionButton>
          </div>
        ) : state === DoctorDialogState.heal ? (
          <></>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center flex-1">
            <TextActionButton
              className={className}
              onClick={() => {
                setDialog(["Hello! How may I help you?"]);
                setOnDialogFinishCallback(() => {
                  setState(DoctorDialogState.talk);
                });
              }}
            >
              Talk
            </TextActionButton>
            <TextActionButton
              className={className}
              onClick={() => {
                setDialog([
                  "Will you be my friend?",
                  "...",
                  "Uh, no thanks. I have a job to do.",
                ]);
              }}
            >
              Rizz
            </TextActionButton>
            <ConfirmationButton
              className={className}
              onClick={() => {
                setDialog(["Huh? What's this?", "...", "SECURITY!"]);
                setState(DoctorDialogState.index);
                setOnDialogFinishCallback(() => {
                  const data: MapSpecialActionBattle = {
                    against: "doctor",
                  };
                });
              }}
            >
              Fight
            </ConfirmationButton>
          </div>
        )}
      </div>
    </div>
  );
}
