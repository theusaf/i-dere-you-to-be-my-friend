import { useEffect, useReducer, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { BattleScreen, BattleScreenState } from "../battle_screen";
import { HealthBar } from "../../../engine/components/health_bar";
import { TextActionButton } from "../../../engine/components/action_button";
import { AnimatedTextController } from "../../../engine/components/animated_text_container";
import { GameManager } from "../../../engine/game_manager";
import { MapScreen } from "../map_screen";
import { ConfirmationButton } from "../../../engine/components/confirmation_button";
import { Character } from "../../util/character";
import { Battle, BattleEvents } from "../../util/battle";
import { MoveData, getMovesets } from "../../util/moves";
import { RichTextSpan } from "../../../engine/components/rich_text_span";
import { TypeIcon } from "../../../engine/components/type_icon";
import { NumberSpan } from "../../../engine/components/numer_span";

export interface BattleScreenContentProps {
  state: BattleScreen;
}

export function BattleScreenContent({
  state,
}: BattleScreenContentProps): JSX.Element {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [logIndex, setLogIndex] = useState(0);
  const { gameManager } = state;
  const battle = gameManager.gameData.battle!;
  const afterLogRenderCallbacks = useRef<Set<() => void>>(new Set());
  const registerAfterLogRenderCallback = (cb: () => void) => {
    afterLogRenderCallbacks.current.add(cb);
  };

  // handle other updates dependent on log timing
  if (logIndex >= battle.logs.length) {
    const callbacks = [...afterLogRenderCallbacks.current];
    callbacks.forEach((cb) => {
      afterLogRenderCallbacks.current.delete(cb);
      cb();
    });
  }

  useEffect(() => {
    registerAfterLogRenderCallback(() => {
      if (battle.activeOpponent) return;
      battle.updateNextOpponent();
      battle.triggerChange();
      registerAfterLogRenderCallback(() => {
        // if no player active
        if (battle.activePlayer) return;
        battle.updateNextPlayer();
        battle.triggerChange();
      });
    });
    const listener = () => {
      forceUpdate();
    };
    battle.addEventListener(BattleEvents.change, listener);
    return () => {
      battle.removeEventListener(BattleEvents.change, listener);
    };
  }, []);

  const showUI = state.state === BattleScreenState.battle;

  return (
    <div className="grid grid-rows-5 h-full text-white">
      <EnemyView show={showUI} activeEnemy={battle.activeOpponent} />
      <UserView
        gameManager={gameManager}
        show={showUI}
        logIndex={logIndex}
        onLogsRendered={() => {
          setLogIndex(battle.logs.length);
        }}
        callbackRegister={registerAfterLogRenderCallback}
      />
    </div>
  );
}

interface ToggleableUIProps {
  show?: boolean;
}

interface EnemyViewProps extends ToggleableUIProps {
  activeEnemy: Character | null;
}

function EnemyView({ show, activeEnemy }: EnemyViewProps) {
  return (
    <div
      className="grid grid-cols-7 transition-transform duration-300"
      style={{
        transform: show && activeEnemy ? "translateX(0)" : "translateY(-100%)",
      }}
    >
      <div className="col-span-3 m-4 bg-slate-500 outline outline-4 outline-neutral-400 overflow-y-auto p-2 pointer-events-auto">
        {activeEnemy && (
          <>
            <span>
              <h3 className="text-xl">{activeEnemy.name}</h3>
            </span>
            <div className="grid grid-cols-5">
              <HealthBar
                className="col-span-4 m-auto"
                percentage={activeEnemy.hp / activeEnemy.stats.maxHealth}
              />
              <p className="text-center">
                Lov. <span className="font-numerals">{activeEnemy.love}</span>
              </p>
            </div>
            <div>{/* other icons here */}</div>
          </>
        )}
      </div>
    </div>
  );
}

interface UserViewProps extends ToggleableUIProps {
  gameManager: GameManager;
  logIndex: number;
  onLogsRendered: () => void;
  callbackRegister: (cb: () => void) => void;
}

function UserView({
  gameManager,
  show,
  logIndex,
  onLogsRendered,
  callbackRegister,
}: UserViewProps): JSX.Element {
  return (
    <div
      className="row-start-4 row-span-2 border-t-4 border-neutral-400 bg-slate-600 bg-opacity-80 p-2 transition-transform duration-300"
      style={{
        transform: show ? "translateX(0)" : "translateY(100%)",
      }}
    >
      <div className="flex w-full h-full">
        <UserStatsView
          activeCharacter={gameManager.gameData.battle!.activePlayer}
          battle={gameManager.gameData.battle!}
        />
        <UserViewButtonController
          key={logIndex}
          gameManager={gameManager}
          show={show}
          logIndex={logIndex}
          onLogsRendered={onLogsRendered}
          callbackRegister={callbackRegister}
        />
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
  logs,
  wait,
}

function UserViewButtonController({
  gameManager,
  show,
  logIndex,
  onLogsRendered,
  callbackRegister,
}: UserViewProps): JSX.Element {
  const [localLogIndex, setLocalLogIndex] = useState(logIndex);
  const [state, setState] = useState(UserViewControllerState.index);
  const className =
    "align-middle flex flex-col place-content-center cursor-pointer";
  const battle = gameManager.gameData.battle!;
  const logs = battle.logs;
  useEffect(() => {
    if (logs.length > localLogIndex) {
      setState(UserViewControllerState.logs);
    }
  }, [logs.length, localLogIndex]);
  const onMoveSelected = (move: MoveData) => {
    const playback = battle.simulateTurn(move);
    const currentOpponent = battle.activeOpponent!;
    const currentPlayer = battle.activePlayer!;
    let playbackIndex = 0;
    const callback = () => {
      if (playbackIndex < playback.length) {
        const [log, applyAction] = playback[playbackIndex];
        applyAction();
        battle.triggerChange();
        if (log) {
          battle.addLog(log);
        }
        playbackIndex++;
        callbackRegister(callback);
      } else {
        let isEndOfBattle = false;
        // end of turn, check for ko/win/loss
        if (!battle.activeOpponent) {
          battle.getExperience(currentOpponent, currentPlayer);
          const nextOpponent = battle.getNextOpponent();
          if (nextOpponent) {
            battle.updateNextOpponent();
          } else {
            // TODO: if rewards apply, allow player to potentially capture opponent leader
            battle.getRewards();
            isEndOfBattle = true;
          }
        }
        if (!battle.activePlayer) {
          const nextPlayer = battle.getNextPlayer();
          if (nextPlayer) {
            battle.updateNextPlayer();
          } else {
            isEndOfBattle = true;
            // TODO: move player to hospital
            const hasLivingFriends =
              gameManager.gameData.hasAnyLivingActiveFriends();
            if (currentPlayer.isDead && !hasLivingFriends) {
              currentPlayer.isDead = false;
              battle.addLog(
                `Wait? What's this? It turns out that in your fear of being alone, you missed that ${currentPlayer.name} is still breathing!`,
              );
            }
            battle.addLog("You and your friends escape to the hospital...");
            // TODO: heal all friends and subtract money properly
            for (const friend of gameManager.gameData.activeFriends) {
              if (friend.isDead) continue;
              friend.hp = friend.stats.maxHealth;
            }
            gameManager.gameData.worldMapData.playerX = 26.5;
            gameManager.gameData.worldMapData.playerY = -99.5;
          }
        }
        if (isEndOfBattle) {
          callbackRegister(() => {
            gameManager.gameData.save().finally(() => {
              gameManager.changeScreen(new MapScreen());
            });
          });
        }
        battle.triggerChange();
      }
    };
    callback();
  };

  let buttons: JSX.Element;
  let message: string;
  switch (state) {
    case UserViewControllerState.index:
      buttons = <IndexButtons className={className} setState={setState} />;
      if (battle.activePlayer === null) {
        message = "What do you want to do?";
      } else {
        message = `What should ${battle!.activePlayer.name} do?`;
      }
      break;
    case UserViewControllerState.fight:
      buttons = (
        <FightButtons
          character={battle.activePlayer!}
          moves={battle.activePlayer?.knownMoves ?? []}
          onMoveSelected={onMoveSelected}
        />
      );
      message = "Fight";
      break;
    case UserViewControllerState.friends:
      buttons = <FriendsButtons />;
      message = "Friends";
      break;
    case UserViewControllerState.actions:
      buttons = (
        <ActionsButton
          battle={battle}
          onItemUse={() => {}}
          onPass={() => {
            onMoveSelected(getMovesets()["_pass"]);
          }}
          onRizz={() => {}}
        />
      );
      message = "Actions";
      break;
    case UserViewControllerState.run:
      message = "";
      buttons = (
        <AnimatedTextController
          key="run"
          className="w-full"
          onCompleteAction={() => {
            gameManager.changeScreen(new MapScreen());
          }}
        >
          Your power of friendship is too weak.
        </AnimatedTextController>
      );
      break;
    case UserViewControllerState.wait:
      message = "...";
      buttons = <></>;
      break;
    case UserViewControllerState.logs:
      message = "";
      const log = logs[localLogIndex];
      buttons = show ? (
        <AnimatedTextController
          key={localLogIndex}
          onComplete={() => {
            setTimeout(() => {
              if (localLogIndex < logs.length - 1) {
                setLocalLogIndex(localLogIndex + 1);
              } else {
                onLogsRendered();
              }
            }, 1000);
          }}
        >
          {log}
        </AnimatedTextController>
      ) : (
        <></>
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
        {![
          UserViewControllerState.index,
          UserViewControllerState.run,
          UserViewControllerState.wait,
          UserViewControllerState.logs,
        ].includes(state) && (
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

function UserStatsView({
  style,
  activeCharacter,
  battle,
}: {
  style?: React.CSSProperties;
  activeCharacter: Character | null;
  battle: Battle;
}): JSX.Element {
  return (
    <div
      className="border-r-4 pr-2 flex flex-col transition-transform duration-300"
      style={{
        ...style,
        flex: 2,
      }}
    >
      <h3 className="text-2xl pointer-events-auto mb-2">
        {activeCharacter?.name}
        <span className="inline-flex gap-2 text-sm ml-2">
          {activeCharacter?.types.map((type) => (
            <TypeIcon type={type} key={type} />
          ))}
        </span>
      </h3>
      {activeCharacter && (
        <HealthBar
          percentage={activeCharacter.hp / activeCharacter.stats.maxHealth}
        />
      )}
      {activeCharacter && (
        <p className="pointer-events-auto">
          <span>
            Lov. <span className="font-numerals">{activeCharacter.love}</span> —{" "}
            <span className="font-numerals">{activeCharacter.hp}</span>/
            <span className="font-numerals">
              {activeCharacter.stats.maxHealth}
            </span>
          </span>
          <span>{/* effect icons here */}</span>
        </p>
      )}
      <div className="overflow-y-auto pointer-events-auto w-full flex flex-col-reverse bg-slate-800 p-2 rounded mt-2">
        {battle.logs.map((log, i) => {
          return (
            <p key={i} className="text-sm">
              {log}
            </p>
          );
        })}
      </div>
    </div>
  );
}

interface UserViewButtonProps {
  className: string;
  setState: React.Dispatch<React.SetStateAction<UserViewControllerState>>;
}

function IndexButtons({ className, setState }: UserViewButtonProps) {
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
      <ConfirmationButton
        className={className}
        onClick={() => setState(UserViewControllerState.run)}
      >
        Run
      </ConfirmationButton>
    </div>
  );
}

function FriendsButtons() {
  const className = "w-32";
  return (
    <div className="h-full overflow-x-auto grid grid-cols-1">
      <div className="gap-2 text-center h-full grid grid-flow-col grid-rows-1">
        <TextActionButton className={className}>
          Selected Friend
        </TextActionButton>
        <TextActionButton className={className}>Friend 2</TextActionButton>
        <TextActionButton className={className}>Friend 3</TextActionButton>
        <TextActionButton className={className}>Friend 4</TextActionButton>
        <TextActionButton className={className}>Friend 5</TextActionButton>
        <TextActionButton className={className}>Friend 6</TextActionButton>
        <TextActionButton className={className}>Friend 7</TextActionButton>
        <TextActionButton className={className}>Friend 8</TextActionButton>
      </div>
    </div>
  );
}

function ActionsButton({
  onPass,
  onRizz,
  battle,
}: {
  onItemUse: () => void;
  onPass: () => void;
  onRizz: () => void;
  battle: Battle;
}): JSX.Element {
  return (
    <div className="text-center h-full overflow-y-auto">
      <h4 className="text-left">Actions</h4>
      <div className="flex gap-2">
        <TextActionButton
          disabled={battle.rewardTable === null}
          className="min-w-24 cursor-pointer"
          onClick={() => onRizz()}
        >
          Rizz
        </TextActionButton>
        <TextActionButton
          className="min-w-24 cursor-pointer"
          onClick={() => onPass()}
        >
          Pass
        </TextActionButton>
      </div>
      <h4 className="text-left">Items</h4>
      <div className="grid grid-cols-4 gap-2">
        THIS CONTENT IS NOT YET IMPLEMENTED
      </div>
    </div>
  );
}

function FightButtons({
  moves,
  character,
  onMoveSelected,
}: {
  moves: string[];
  character: Character;
  onMoveSelected: (move: MoveData) => void;
}): JSX.Element {
  const [hoverTip, setHoverTip] = useState<MoveData | null>(null);
  const movesets = getMovesets();
  const className = "min-h-14 cursor-pointer overflow-y-auto";
  const onHover = (move: MoveData) => {
    setHoverTip(move);
  };
  const onUnhover = () => setHoverTip(null);
  return (
    <div className="grid grid-cols-3 gap-2 text-center h-full relative overflow-y-auto">
      {hoverTip && (
        <div
          className="absolute right-4 bg-slate-600 outline outline-2 outline-slate-900 w-96"
          style={{
            bottom: "calc(100% + 3rem)",
          }}
        >
          <RichTextSpan text={hoverTip.description} />
        </div>
      )}
      {moves.map((move, i) => {
        const moveData = movesets[move];
        return (
          <TextActionButton
            key={i}
            className={className}
            onMouseOver={() => onHover(moveData)}
            onMouseOut={onUnhover}
            onClick={() => onMoveSelected(moveData)}
            disabled={character.moveUses[move] <= 0}
          >
            <div className="flex flex-col align-middle h-full">
              <div>{moveData.name}</div>
              <div className="text-sm">
                <TypeIcon type={moveData.type} />
              </div>
              <div>
                <NumberSpan>
                  {character.moveUses[move]}/{moveData.max_uses}
                </NumberSpan>
              </div>
            </div>
          </TextActionButton>
        );
      })}
    </div>
  );
}
