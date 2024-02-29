import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { BattleScreen, BattleScreenState } from "../battle_screen";
import { HealthBar } from "../../../engine/components/health_bar";
import { TextActionButton } from "../../../engine/components/action_button";
import { AnimatedTextController } from "../../../engine/components/animated_text_container";

export interface BattleScreenContentProps {
  state: BattleScreen;
}

export function BattleScreenContent({
  state,
}: BattleScreenContentProps): JSX.Element {
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.state == BattleScreenState.battle) {
      } else {
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-rows-5 h-full text-white">
      <EnemyView />
      <UserView />
    </div>
  );
}

function EnemyView() {
  return (
    <div className="grid grid-cols-7">
      <div className="col-span-3 m-4 bg-slate-500 outline outline-4 outline-neutral-400 overflow-y-auto p-2 pointer-events-auto">
        <span>
          <h3 className="text-xl">INSERT ENEMY NAME</h3>
          <span>{/* type icons here */}</span>
        </span>
        <div className="grid grid-cols-5">
          <HealthBar className="col-span-4 m-auto" percentage={44 / 50} />
          <p className="text-center">44/50</p>
        </div>
        <div>{/* other icons here */}</div>
      </div>
    </div>
  );
}

function UserView(): JSX.Element {
  return (
    <div className="row-start-4 row-span-2 border-t-4 border-neutral-400 bg-slate-600 bg-opacity-80 p-2">
      <div className="flex w-full h-full">
        <UserStatsView />
        <UserViewButtonController />
      </div>
    </div>
  );
}

enum UserViewControllerState {
  index,
  fight,
  friends,
  actions,
  run,
}

function UserViewButtonController(): JSX.Element {
  const [state, setState] = useState(UserViewControllerState.index);
  const className = "align-middle flex flex-col place-content-center";

  let buttons: JSX.Element;
  let message: string;
  switch (state) {
    case UserViewControllerState.index:
      buttons = <FightButtons className={className} setState={setState} />;
      message = "What do you want to do?";
      break;
    case UserViewControllerState.fight:
      buttons = <div>Fight</div>;
      message = "Fight";
      break;
    case UserViewControllerState.friends:
      buttons = <div>Friends</div>;
      message = "Friends";
      break;
    case UserViewControllerState.actions:
      buttons = <div>Actions</div>;
      message = "Actions";
      break;
    case UserViewControllerState.run:
      message = "";
      buttons = (
        <AnimatedTextController
          className="w-full"
          onCompleteAction={() => {
            // TODO: Navigate to the correct place
            setState(UserViewControllerState.index);
          }}
        >
          Your power of friendship is too weak.
        </AnimatedTextController>
      );
      break;
  }

  return (
    <div
      className="pl-2 flex flex-col h-full pointer-events-auto text-2xl"
      style={{
        flex: 4,
      }}
    >
      <span>
        {![UserViewControllerState.index, UserViewControllerState.run].includes(
          state
        ) && (
          <>
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="mr-2 cursor-pointer"
              onClick={() => setState(UserViewControllerState.index)}
            />
          </>
        )}
        {state !== UserViewControllerState.run && (
          <span className="text-xl">{message}</span>
        )}
      </span>
      {buttons}
    </div>
  );
}

interface UserViewButtonProps {
  className: string;
  setState: React.Dispatch<React.SetStateAction<UserViewControllerState>>;
}

function FightButtons({ className, setState }: UserViewButtonProps) {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-2 text-center h-full">
      <TextActionButton
        className={className}
        onClick={() => setState(UserViewControllerState.fight)}
      >
        Fight
      </TextActionButton>
      <TextActionButton
        className={className}
        onClick={() => setState(UserViewControllerState.friends)}
      >
        Friends
      </TextActionButton>
      <TextActionButton
        className={className}
        onClick={() => setState(UserViewControllerState.actions)}
      >
        Actions & Items
      </TextActionButton>
      <TextActionButton
        className={className}
        onClick={() => setState(UserViewControllerState.run)}
      >
        Run
      </TextActionButton>
    </div>
  );
}

function UserStatsView({
  style,
}: {
  style?: React.CSSProperties;
}): JSX.Element {
  return (
    <div
      className="border-r-4 pr-2 flex flex-col transition-transform duration-300"
      style={{
        ...style,
        flex: 2,
      }}
    >
      <h3 className="text-2xl pointer-events-auto">INSERT CHARACTER NAME</h3>
      <HealthBar percentage={44 / 50} />
      <p className="font-numerals pointer-events-auto">
        <span>44/50</span>
        <span>{/* effect icons here */}</span>
      </p>
      <div className="overflow-y-auto pointer-events-auto w-full flex flex-col-reverse">
        <p>Example Log 1</p>
        <p>Example Log 2</p>
      </div>
    </div>
  );
}
