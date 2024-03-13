import { useEffect, useRef, useState } from "react";
import { Character } from "../../../../util/character";
import { MapScreen, MapScreenEvents } from "../../../map_screen";
import { ConfirmationButton } from "../../../../../engine/components/confirmation_button";
import { MapSpecialActionBattle } from "../../../../util/map_types";
import { TextActionButton } from "../../../../../engine/components/action_button";
import { AnimatedTextController } from "../../../../../engine/components/animated_text_container";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

enum HiddenBossState {
  index = "index",
  talk = "talk",
  rizz = "rizz",
}

export function HiddenBossDialog({
  screen,
  setNpcDialog,
}: {
  screen: MapScreen;
  setNpcDialog: (npc: Character | null) => void;
}): JSX.Element {
  const [state, setState] = useState(HiddenBossState.index);
  const [dialog, setDialog] = useState<string[]>([]);
  const onDialogFinishCallback = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!dialog.length && onDialogFinishCallback) {
      onDialogFinishCallback.current?.();
      onDialogFinishCallback.current = null;
    }
  }, [dialog.length]);
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
        {state !== HiddenBossState.index && (
          <span
            onClick={() => setState(HiddenBossState.index)}
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
        ) : state === HiddenBossState.talk ? (
          <div className="grid grid-cols-3 gap-4 text-center flex-1">
            <TextActionButton
              className={className}
              onClick={() => {
                setDialog([
                  "...",
                  "I was walking home one day, and I saw a person I knew lying on the ground.",
                  "I ran over to help, but there was a sudden flash of light.",
                  "The next thing I knew, I was here.",
                  "It's been a while. This whole 'friendship' thing makes no sense.",
                  "Friendship isn't something you need contracts for!",
                  "Anways, I just miss my real friends.",
                ]);
                setState(HiddenBossState.index);
              }}
            >
              What happened to you?
            </TextActionButton>
            <TextActionButton
              className={className}
              onClick={() => {
                setDialog(["...", "No, I don't remember you."]);
                setState(HiddenBossState.index);
              }}
            >
              Do you remember me?
            </TextActionButton>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center flex-1">
            <TextActionButton
              className={className}
              onClick={() => {
                setDialog(["What do you want?"]);
                setState(HiddenBossState.index);
                onDialogFinishCallback.current = () => {
                  setState(HiddenBossState.talk);
                };
              }}
            >
              Talk
            </TextActionButton>
            <TextActionButton
              className={className}
              onClick={() => {
                setDialog(["Will you be my friend?", "..."]);
              }}
            >
              Rizz
            </TextActionButton>
            <ConfirmationButton
              className={className}
              onClick={() => {
                setDialog(["I knew it.", "Well, bring it on then..."]);
                setState(HiddenBossState.index);
                onDialogFinishCallback.current = () => {
                  const data: MapSpecialActionBattle = {
                    against: "ura_bosu",
                    level: [14, 20],
                    reward_table: null,
                    size: 20,
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
