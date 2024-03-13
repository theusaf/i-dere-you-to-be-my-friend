import {
  ReactNode,
  forwardRef,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUser } from "@fortawesome/free-solid-svg-icons";
import { BattleScreen, BattleScreenState } from "../battle_screen";
import { HealthBar } from "../../../engine/components/health_bar";
import { TextActionButton } from "../../../engine/components/action_button";
import { AnimatedTextController } from "../../../engine/components/animated_text_container";
import { GameManager } from "../../../engine/game_manager";
import { MapScreen } from "../map_screen";
import { ConfirmationButton } from "../../../engine/components/confirmation_button";
import { Character, getGenderedString } from "../../util/character";
import { Battle, BattleEvents } from "../../util/battle";
import { MoveData, getMovesets } from "../../util/moves";
import { RichTextSpan } from "../../../engine/components/rich_text_span";
import { TypeIcon } from "../../../engine/components/type_icon";
import { NumberSpan } from "../../../engine/components/numer_span";
import { chance } from "../../util/chance";
import { FriendContract } from "../../../engine/components/contract";
import { MoveButton } from "../../../engine/components/move_button";
import { GameData } from "../../util/game_data";

export interface BattleScreenContentProps {
  state: BattleScreen;
}

export function BattleScreenContent({
  state,
}: BattleScreenContentProps): JSX.Element {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [logIndex, setLogIndex] = useState(0);
  const popupRef = useRef<string | null>(null);
  const [popup, setPopup] = useState(state.gameManager.gameData.battle?.popup);
  const { gameManager } = state;
  const battle = gameManager.gameData.battle!;
  const afterLogRenderCallbacks = useRef<Set<() => void>>(new Set());
  const registerAfterLogRenderCallback = (cb: () => void) => {
    afterLogRenderCallbacks.current.add(cb);
  };
  const onBattleEnd = () => {
    gameManager.changeScreen(new MapScreen());
    gameManager.gameData.battle = null;
    if (gameManager.cutsceneData.length) {
      setTimeout(() => {
        gameManager.cutsceneIndex++;
      }, 250);
    }
  };

  if (battle === null) return <></>;
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
  }, [battle]);
  useEffect(() => {
    // very cursed method
    if (popupRef.current !== popup && popupRef.current !== null) {
      setPopup(popupRef.current);
      setTimeout(() => {
        popupRef.current = null;
      }, 250);
    }
  }, [popupRef.current, popup]);

  const showUI = state.state === BattleScreenState.battle;

  return (
    <>
      {showUI && popup && (
        <Popup
          popup={popup}
          onDone={() => setPopup("")}
          registerCallback={registerAfterLogRenderCallback}
          gameData={gameManager.gameData}
          onBattleEnd={onBattleEnd}
        />
      )}
      <div className="grid grid-rows-5 h-full text-white">
        <EnemyView
          show={showUI}
          activeEnemy={battle.activeOpponent}
          battle={battle}
        />
        <UserView
          gameManager={gameManager}
          show={showUI}
          logIndex={logIndex}
          onLogsRendered={() => {
            setLogIndex(battle.logs.length);
          }}
          callbackRegister={registerAfterLogRenderCallback}
          onBattleEnd={onBattleEnd}
          onBossWin={() => {
            registerAfterLogRenderCallback(() => {
              popupRef.current = "end";
            });
          }}
        />
      </div>
    </>
  );
}

function Popup({
  onDone,
  popup,
  registerCallback,
  gameData,
  onBattleEnd,
}: {
  popup: string;
  onDone: () => void;
  registerCallback: (cb: () => void) => void;
  gameData: GameData;
  onBattleEnd: () => void;
}): JSX.Element {
  const [contract, setContract] = useState(false);
  // TODO: Currently hardcoded to specific content. If more popups are added, this should be changed
  if (popup === "end") {
    return (
      <>
        {contract && (
          <FriendContract
            initialName={gameData.specialNPCs.ura_bosu.name}
            contractee={gameData.you.name}
            onContractSigned={(name) => {
              const opponent = gameData.specialNPCs.ura_bosu;
              const newFriend = opponent.clone();
              newFriend.name = name;
              gameData.addCharacter(newFriend);
              gameData.battle?.playerTeam.push(newFriend);
              gameData.battle?.addLog(
                `${newFriend.name} has become your friend!`,
              );
              gameData.battle?.addLog(
                "I guess the real friends were the treasures we made along the way.",
              );
              setContract(false);
              registerCallback(() => {
                onBattleEnd();
              });
              gameData.battle?.triggerChange();
            }}
          />
        )}
        {!contract && (
          <div className="fixed top-0 left-0 w-full h-full z-30 bg-black bg-opacity-60">
            <div className="max-w-5xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-600 p-4 rounded text-white max-h-full overflow-y-auto pointer-events-auto">
              <h3 className="text-xl">
                You have become the champion! What do you say?
              </h3>
              <div className="flex gap-2">
                <ConfirmationButton
                  onClick={() => setContract(true)}
                  className="cursor-pointer"
                >
                  I Dare You to be My Friend!
                </ConfirmationButton>
                <ConfirmationButton
                  className="cursor-pointer"
                  onClick={() => {
                    gameData.battle?.addLog("...");
                    gameData.battle?.addLog("Really?");
                    gameData.battle?.addLog(
                      "<Your new friend looks at you with a smile>",
                    );
                    gameData.battle?.addLog(
                      "<Congrats on winning! Unfortunately, this version of the game doesn't reward you for making the friendly choice... Here's 1000 gold in compensation, although that's mostly useless.>",
                    );
                    registerCallback(() => {
                      gameData.gold += 1000;
                      gameData.specialNPCs.ura_bosu.isDead = true;
                      onBattleEnd();
                    });
                    gameData.battle?.triggerChange();
                  }}
                >
                  I just want to be real friends.
                </ConfirmationButton>
              </div>
            </div>
          </div>
        )}
      </>
    );
  } else {
    return (
      <div className="fixed top-0 left-0 w-full h-full z-30 bg-black bg-opacity-60">
        <div className="max-w-5xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-600 p-4 rounded text-white max-h-full overflow-y-auto pointer-events-auto">
          <h2 className="text-2xl">Tutorial</h2>
          <p>
            Hi! Welcome to I Dere You to be My Friend! This tutorial will go
            over some of the sections on this screen and about this game.
          </p>
          <h3 className="text-xl mt-2">Fight</h3>
          <p>
            In the fight section, you will see various moves that your friend
            can carry out. These have limited use until you refresh them or
            lose, so be careful!
          </p>
          <p>
            Each character and move has various personality traits, which affect
            how much damage is dealt by moves. The weaknesses and resistances
            are a bit convoluted, and even I don't memorize them. Just choose
            what you think works best!
          </p>
          <h3 className="text-xl mt-2">Friends</h3>
          <p>
            This section lists all of your current <strong>active</strong>{" "}
            friends. You can have up to 8 at a time. To change out your active
            friends, use the party application on your phone in the map.
          </p>
          <p>
            You can use this section to switch out your current friend with
            another one. However, this will give the opponent an opportunity to
            attack!
          </p>
          <h3 className="text-xl mt-2">Actions & Items</h3>
          <p>This section lists two actions and items (when implemented).</p>
          <p>
            The <strong>rizz</strong> action is the main way you gain new
            friends. During combat, you instead daringly ask the opponent to be
            your friend. Generally, the higher the level and the higher the
            health, the lower the chance of success. Some battles may not allow
            you to rizz.
          </p>
          <h3 className="text-xl mt-2">Conclusion</h3>
          <p>
            That's about it for the basics! There are some other secrets that
            you may encounter, but otherwise, have fun!
          </p>
          <div className="flex flex-col items-center text-center">
            <TextActionButton className="w-36" onClick={onDone}>
              Got it!
            </TextActionButton>
          </div>
        </div>
      </div>
    );
  }
}

interface ToggleableUIProps {
  show?: boolean;
}

interface EnemyViewProps extends ToggleableUIProps {
  activeEnemy: Character | null;
  battle: Battle;
}

function EnemyView({ show, activeEnemy, battle }: EnemyViewProps) {
  return (
    <div
      className="grid grid-cols-7 transition-transform duration-300"
      style={{
        transform: show && activeEnemy ? "translateX(0)" : "translateY(-100%)",
      }}
    >
      {show && (
        <div
          className="absolute bottom-0 left-4 p-2 bg-slate-900"
          style={{
            transform: "translateY(100%)",
          }}
        >
          <FontAwesomeIcon icon={faUser} className="mr-2" />
          <NumberSpan>
            {
              battle.opponentTeam.filter((character) => {
                return character.hp > 0 && !character.isDead;
              }).length
            }
            /{battle.opponentTeam.length}
          </NumberSpan>
        </div>
      )}
      <div className="col-span-3 m-4 bg-slate-500 outline outline-4 outline-neutral-400 overflow-y-auto p-2 pointer-events-auto">
        {activeEnemy && (
          <>
            <span>
              <h3 className="text-xl">{activeEnemy.name}</h3>
            </span>
            <div className="grid grid-cols-5">
              <HealthBar
                className="col-span-4 m-auto !list-disc"
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
  onBattleEnd: () => void;
}

function UserView({
  gameManager,
  show,
  logIndex,
  onLogsRendered,
  callbackRegister,
  onBattleEnd,
  onBossWin,
}: UserViewProps & {
  onBossWin: () => void;
}): JSX.Element {
  const [displayContract, setDisplayContract] = useState(false);
  const battle = gameManager.gameData.battle!;
  const checkForBattleEnd = (
    currentOpponent: Character,
    currentPlayer: Character,
  ) => {
    currentOpponent ??= battle.activeOpponent!;
    currentPlayer ??= battle.activePlayer!;
    let isEndOfBattle = false;
    // end of turn, check for ko/win/loss
    if (!battle.activeOpponent) {
      battle.getExperience(currentOpponent, currentPlayer);
      const nextOpponent = battle.getNextOpponent();
      if (nextOpponent) {
        battle.updateNextOpponent();
      } else {
        // TODO: if rewards apply, allow player to potentially capture opponent leader
        // Note: currently decided against this
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
        const hasLivingFriends =
          gameManager.gameData.hasAnyLivingActiveFriends();
        if (currentPlayer.isDead && !hasLivingFriends) {
          currentPlayer.isDead = false;
          battle.addLog(
            `Wait? What's this? It turns out that in your fear of being alone, you missed that ${currentPlayer.name} is still breathing!`,
          );
        }
        battle.addLog("You and your friends escape to the hospital...");
        gameManager.gameData.healActiveFriends();
        gameManager.gameData.worldMapData.playerX = 26.5;
        gameManager.gameData.worldMapData.playerY = -99.5;
      }
    }
    if (isEndOfBattle) {
      // TODO: use a custom battle reward table
      const { opponentLeader } = battle;
      if (opponentLeader.id === "ura_bosu") {
        if (opponentLeader.isDead) {
          battle.addLog(".....");
          battle.addLog("Uh, I guess, congrats! You beat the game?");
          callbackRegister(() => {
            gameManager.gameData.save().finally(onBattleEnd);
          });
        } else {
          battle.addLog(".....");
          battle.addLog(`<You approach ${opponentLeader.name}...>`);
          battle.addLog(
            `<${getGenderedString({
              gender: opponentLeader.gender,
              name: opponentLeader.name,
              type: "pronoun",
            })} looks at you with fear in ${getGenderedString({
              gender: opponentLeader.gender,
              name: opponentLeader.name,
              type: "possesive",
            })} eyes>`,
          );
          battle.addLog("<What do you say?>");
          onBossWin();
        }
      } else {
        callbackRegister(() => {
          gameManager.gameData.save().finally(onBattleEnd);
        });
      }
    }
    battle.triggerChange();
  };
  return (
    <>
      <div
        className="row-start-4 row-span-2 border-t-4 border-neutral-400 bg-slate-600 bg-opacity-80 p-2 transition-transform duration-300"
        style={{
          transform: show ? "translateX(0)" : "translateY(100%)",
        }}
      >
        {show && (
          <div
            className="absolute top-0 left-0 p-2 bg-slate-900"
            style={{
              transform: "translate(0.25rem, calc(-100% - 0.5rem))",
            }}
          >
            <FontAwesomeIcon icon={faUser} className="mr-2" />
            <NumberSpan>
              {
                battle.playerTeam.filter((character) => {
                  return character.hp > 0;
                }).length
              }
              /{battle.playerTeam.length}
            </NumberSpan>
          </div>
        )}
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
            displayContract={() => setDisplayContract(true)}
            checkForBattleEnd={checkForBattleEnd}
            onBattleEnd={onBattleEnd}
          />
        </div>
      </div>
      {displayContract && (
        <FriendContract
          initialName={battle.activeOpponent!.name}
          contractee={gameManager.gameData.you.name}
          onContractSigned={(name) => {
            const opponent = battle.activeOpponent!;
            const newFriend = opponent.clone();
            newFriend.name = name;
            battle.addLog(`${newFriend.name} has become your friend!`);
            battle.activeOpponent = null;
            battle.opponentTeam.splice(
              battle.opponentTeam.indexOf(opponent),
              1,
            );
            const isActive = gameManager.gameData.addCharacter(newFriend);
            if (isActive) {
              battle.playerTeam.push(newFriend);
            }
            callbackRegister(() => {
              checkForBattleEnd(opponent, gameManager.gameData.you);
            });
            setDisplayContract(false);
            battle.triggerChange();
          }}
        />
      )}
    </>
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
  rizz,
}

function UserViewButtonController({
  gameManager,
  show,
  logIndex,
  onLogsRendered,
  callbackRegister,
  displayContract,
  checkForBattleEnd,
  onBattleEnd,
}: UserViewProps & {
  displayContract: () => void;
  checkForBattleEnd: (
    currentOpponent: Character,
    currentPlayer: Character,
  ) => void;
}): JSX.Element {
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
        checkForBattleEnd(currentOpponent, currentPlayer);
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
      buttons = (
        <FriendsButtons
          onFriendSelected={(friend) => {
            battle.addLog(`${battle.activePlayer!.name}, come back!`);
            battle.activePlayer = null;
            callbackRegister(() => {
              battle.activePlayer = friend;
              battle.triggerChange();
              battle.addLog(`${friend.name}, you're up!`);
              callbackRegister(() => {
                onMoveSelected(getMovesets()["_pass"]);
              });
            });
            battle.triggerChange();
          }}
          friends={battle.playerTeam}
          activeFriend={battle.activePlayer}
        />
      );
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
          onRizz={() => {
            setState(UserViewControllerState.rizz);
          }}
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
            gameManager.gameData.save().finally(onBattleEnd);
          }}
        >
          Your power of friendship is too weak for this! You run away.
        </AnimatedTextController>
      );
      break;
    case UserViewControllerState.wait:
      message = "...";
      buttons = <></>;
      break;
    case UserViewControllerState.logs: {
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
    case UserViewControllerState.rizz:
      message = "What do you say?";
      buttons = (
        <RizzButtons
          onSelect={(message) => {
            battle.addLog(message);
            battle.addLog("..........");
            const activeEnemy = battle.activeOpponent!;
            const diceRoll = chance.d20();
            let baseDifficulty =
              18 * (activeEnemy.hp / activeEnemy.stats.maxHealth);
            baseDifficulty += activeEnemy.love / 2;
            if (diceRoll === 20 || diceRoll > baseDifficulty) {
              battle.addLog("Okay.");
              callbackRegister(() => {
                setTimeout(() => displayContract());
              });
            } else {
              battle.addLog("No thank you.");
              callbackRegister(() => {
                onMoveSelected(getMovesets()["_pass"]);
              });
            }
            battle.triggerChange();
          }}
        />
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
  const logRenderer = useRef<HTMLDivElement>(null);
  if (logRenderer.current) {
    logRenderer.current.scrollTop = -logRenderer.current.scrollHeight;
    setTimeout(() => {
      logRenderer.current?.scrollBy(0, -200);
    }, 50);
  }
  return (
    <div
      className="border-r-4 pr-2 flex flex-col transition-transform duration-300"
      style={{ ...style, flex: 2 }}
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
          className="list-item !list-disc"
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
      <LogRenderer ref={logRenderer}>
        {battle.logs.map((log, i) => {
          return (
            <p key={i} className="text-sm">
              {log}
            </p>
          );
        })}
      </LogRenderer>
    </div>
  );
}

const LogRenderer = forwardRef<HTMLDivElement, { children: ReactNode }>(
  function (props, ref) {
    return (
      <div
        ref={ref}
        className="overflow-y-auto pointer-events-auto w-full flex flex-col-reverse bg-slate-800 p-2 rounded mt-2"
        {...props}
      />
    );
  },
);

interface UserViewButtonProps {
  className: string;
  setState: React.Dispatch<React.SetStateAction<UserViewControllerState>>;
}

// really just for flavor
const rizzMessages = [
  "Will you be my friend?",
  "I dare you to be my friend!",
  "You're lookin' mighty fine!",
  "I would be a better friend",
  "I would like it if you were my friend",
  "Wanna hang out with me?",
  "We should go on an adventure, together.",
  "I won't hurt you if you become my friend",
  "It was like at first sight!",
];

function RizzButtons({
  onSelect,
}: {
  onSelect: (message: string) => void;
}): JSX.Element {
  const messages = chance.pickset(rizzMessages, 4);
  return (
    <div className="grid grid-cols-2 gap-2 w-full h-full overflow-y-auto">
      {messages.map((message, i) => {
        return (
          <TextActionButton
            key={i}
            onClick={() => {
              onSelect(message);
            }}
          >
            {message}
          </TextActionButton>
        );
      })}
    </div>
  );
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

function FriendsButtons({
  onFriendSelected,
  friends,
  activeFriend,
}: {
  onFriendSelected: (friend: Character) => void;
  friends: Character[];
  activeFriend: Character | null;
}) {
  const className = "w-32";
  return (
    <div className="h-full overflow-x-auto grid grid-cols-1">
      <div className="gap-2 text-center h-full flex overflow-x-auto">
        {friends.map((friend, i) => {
          return (
            <TextActionButton
              disabled={friend.hp <= 0 || friend === activeFriend}
              key={i}
              className={`break-all w-32 min-w-32 ${
                friend.hp <= 0
                  ? "cursor-not-allowed opacity-75"
                  : friend === activeFriend
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
              } ${className ?? ""} ${friend === activeFriend ? "bg-slate-700 outline-green-700" : ""}`}
              onClick={() => onFriendSelected(friend)}
            >
              <div>{friend.name}</div>
              <div>
                <NumberSpan>
                  {friend.hp}/{friend.stats.maxHealth}
                </NumberSpan>
              </div>
            </TextActionButton>
          );
        })}
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
          disabled={battle.rewardTable === null} // TODO: Disable on other condition
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
          className="fixed right-4 bg-slate-600 outline outline-2 outline-slate-900 w-96"
          style={{
            bottom: "calc(100% + 1rem)",
          }}
        >
          <RichTextSpan text={hoverTip.description} />
        </div>
      )}
      {moves.map((move, i) => {
        const moveData = movesets[move];
        return (
          <MoveButton
            key={i}
            disabled={character.moveUses[move] <= 0}
            onMouseOver={() => onHover(moveData)}
            onMouseOut={onUnhover}
            onClick={() => onMoveSelected(moveData)}
            moveData={moveData}
            className={className}
            move={move}
            user={character}
          />
        );
      })}
    </div>
  );
}
