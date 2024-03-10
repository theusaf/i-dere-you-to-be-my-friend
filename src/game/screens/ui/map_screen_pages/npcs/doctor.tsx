import { useEffect, useRef, useState } from "react";
import { TextActionButton } from "../../../../../engine/components/action_button";
import { Character } from "../../../../util/character";
import { MapScreen, MapScreenEvents } from "../../../map_screen";
import { AnimatedTextController } from "../../../../../engine/components/animated_text_container";
import { ConfirmationButton } from "../../../../../engine/components/confirmation_button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { MapSpecialActionBattle } from "../../../../util/map_types";
import { NumberSpan } from "../../../../../engine/components/numer_span";

enum DoctorDialogState {
  index = "index",
  talk = "talk",
  rizz = "rizz",
  heal = "heal",
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
  const onDialogFinishCallback = useRef<(() => void) | null>(null);
  const { gameManager } = screen;
  const { gameData } = gameManager;
  console.log(dialog, state);
  useEffect(() => {
    if (dialog.length) {
    } else if (onDialogFinishCallback) {
      onDialogFinishCallback.current?.();
      onDialogFinishCallback.current = null;
    }
  }, [dialog.length, onDialogFinishCallback.current]);
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
                const costs = gameData.calculateMedicalCosts();
                if (costs === 0) {
                  setDialog([
                    "Sure thing! One second...",
                    "It looks like your friends are all healthy!",
                  ]);
                } else {
                  setDialog([
                    "Sure thing! One second...",
                    `That's going to cost ${costs} gold. Is that alright?`,
                  ]);
                  setState(DoctorDialogState.heal);
                }
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
          <div className="grid grid-cols-3 gap-4 flex-1 text-center">
            <div className="text-left">
              <p>
                Cost:{" "}
                <NumberSpan>{gameData.calculateMedicalCosts()}</NumberSpan>
              </p>
              <p>
                Balance: <NumberSpan>{gameData.gold}</NumberSpan>
              </p>
            </div>
            <TextActionButton
              className={className}
              onClick={() => {
                gameData.healActiveFriends();
                setDialog([
                  "Alright, I'll check on your friends.",
                  "...",
                  "All done!",
                  "<Your friends health and energy have been restored!>",
                ]);
                setState(DoctorDialogState.index);
              }}
            >
              Yes
            </TextActionButton>
            <TextActionButton className={className}>No</TextActionButton>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center flex-1">
            <TextActionButton
              className={className}
              onClick={() => {
                setDialog(["Hello! How may I help you?"]);
                setState(DoctorDialogState.index);
                onDialogFinishCallback.current = () => {
                  setState(DoctorDialogState.talk);
                };
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
                onDialogFinishCallback.current = () => {
                  const data: MapSpecialActionBattle = {
                    against: "doctor",
                    level: [8, 12],
                    reward_table: "default",
                    size: 8,
                    type: "enter_battle",
                  };
                  screen.eventNotifier.dispatchEvent(
                    new CustomEvent(MapScreenEvents.battleStart, {
                      detail: data,
                    }),
                  );
                };
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
