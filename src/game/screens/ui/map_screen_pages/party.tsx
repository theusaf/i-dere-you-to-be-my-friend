import {
  faArrowLeft,
  faArrowRight,
  faCircleCheck,
  faCircleXmark,
  faSkull,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClosableView } from "./util";
import { useEffect, useReducer, useState } from "react";
import { GameData } from "../../../util/game_data";
import { NumberSpan } from "../../../../engine/components/numer_span";
import { Character } from "../../../util/character";
import { GameManager } from "../../../../engine/game_manager";
import { CharacterSprite } from "../../../../engine/character_sprite";

export function PartyPagePhone(): JSX.Element {
  return (
    <div className="flex items-center flex-col h-full">
      <FontAwesomeIcon icon={faArrowRight} className="w-20 h-20 my-auto" />
    </div>
  );
}

function partyHasExcess(party: Character[]) {
  return party.filter((friend) => !friend.isDead && friend.hp > 0).length > 1;
}

export function PartyPageLarge({
  gameData,
  gameManager,
}: {
  gameData: GameData;
  gameManager: GameManager;
}): JSX.Element {
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const { friends, activeFriends } = gameData;

  const onDeselect = (friend: Character) => {
    if (activeFriends.length <= 1) return;
    if (!partyHasExcess(activeFriends)) return;
    friend.isActive = false;
    forceUpdate();
  };
  const onSelect = (friend: Character) => {
    if (activeFriends.length >= 8) return;
    if (friend.isDead) return;
    friend.isActive = true;
    forceUpdate();
  };
  const onLeft = (friend: Character) => {
    const friendIndex = friends.indexOf(friend);
    if (friendIndex === 0) return;
    let switchIndex;
    if (friend.isActive) {
      const activeIndex = activeFriends.indexOf(friend);
      if (activeIndex === 0) return;
      const previousFriend = activeFriends[activeIndex - 1];
      switchIndex = friends.indexOf(previousFriend);
    } else {
      const inactiveFriends = friends.filter((friend) => !friend.isActive);
      const inactiveIndex = inactiveFriends.indexOf(friend);
      if (inactiveIndex === 0) return;
      const previousFriend = inactiveFriends[inactiveIndex - 1];
      switchIndex = friends.indexOf(previousFriend);
    }
    const tmp = friends[friendIndex];
    friends[friendIndex] = friends[switchIndex];
    friends[switchIndex] = tmp;
    forceUpdate();
  };
  const onRight = (friend: Character) => {
    const friendIndex = friends.indexOf(friend);
    if (friendIndex === friends.length - 1) return;
    let switchIndex;
    if (friend.isActive) {
      const activeIndex = activeFriends.indexOf(friend);
      if (activeIndex === activeFriends.length - 1) return;
      const nextFriend = activeFriends[activeIndex + 1];
      switchIndex = friends.indexOf(nextFriend);
    } else {
      const inactiveFriends = friends.filter((friend) => !friend.isActive);
      const inactiveIndex = inactiveFriends.indexOf(friend);
      if (inactiveIndex === inactiveFriends.length - 1) return;
      const nextFriend = inactiveFriends[inactiveIndex + 1];
      switchIndex = friends.indexOf(nextFriend);
    }
    const tmp = friends[friendIndex];
    friends[friendIndex] = friends[switchIndex];
    friends[switchIndex] = tmp;
    forceUpdate();
  };

  return (
    <ClosableView>
      <div className="w-full h-full grid grid-rows-2 gap-2 text-white">
        <div className="flex flex-col overflow-x-auto">
          <h3 className="text-xl">Active Friends</h3>
          <div className="p-2 rounded gap-2 flex bg-orange-400 flex-1 overflow-x-auto">
            {activeFriends.map((friend, i) => {
              return (
                <PartyMember
                  key={`${i}-${friend.name}`}
                  forceUpdate={forceUpdate}
                  friend={friend}
                  gameManager={gameManager}
                  isActive={true}
                  onSwitch={() => {
                    onDeselect(friend);
                  }}
                  onLeft={() => {
                    onLeft(friend);
                  }}
                  onRight={() => {
                    onRight(friend);
                  }}
                />
              );
            })}
          </div>
        </div>
        <div className="flex flex-col overflow-x-auto">
          <h3 className="text-xl">Inactive Friends</h3>
          <div className="p-2 rounded gap-2 flex overflow-x-auto flex-1 bg-orange-700">
            {friends
              .filter((friend) => !activeFriends.includes(friend))
              .map((friend, i) => {
                return (
                  <PartyMember
                    key={`${i}-${friend.name}`}
                    forceUpdate={forceUpdate}
                    friend={friend}
                    gameManager={gameManager}
                    isActive={false}
                    onSwitch={() => {
                      onSelect(friend);
                    }}
                    onLeft={() => {
                      onLeft(friend);
                    }}
                    onRight={() => {
                      onRight(friend);
                    }}
                  />
                );
              })}
          </div>
        </div>
      </div>
    </ClosableView>
  );
}

function PartyMember({
  forceUpdate,
  onSwitch,
  onLeft,
  onRight,
  friend,
  gameManager,
  isActive,
}: {
  forceUpdate: () => void;
  onSwitch?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  friend: Character;
  gameManager: GameManager;
  isActive: boolean;
}) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    if (!image) return;
    return () => URL.revokeObjectURL(image);
  }, [image]);
  if (!image) {
    const { colors, styles } = friend;
    const character = new CharacterSprite({
      skinColor: colors.skin,
      headColor: colors.head,
      bodyColor: colors.body,
      legColor: colors.legs,
      headId: `${styles.head}`,
      bodyId: `${styles.body}`,
      legId: `${styles.legs}`,
    });
    character
      .initSprite()
      .then(() => {
        return gameManager.convertSpriteToImage(character.headSprite);
      })
      .then((image) => {
        setImage(URL.createObjectURL(image));
        character.getView().destroy({ children: true });
      });
  }
  return (
    <div
      className="p-2 rounded grid grid-rows-3 items-center text-center bg-slate-700 w-32 min-w-32 shadow-md shadow-slate-900"
      onClick={() => {
        forceUpdate();
      }}
    >
      <div>
        {!isActive && (
          <div>
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="cursor-pointer"
              onClick={onSwitch}
            />
          </div>
        )}
        {friend.isDead && <FontAwesomeIcon icon={faSkull} className="mr-1" />}
        {friend.name}
      </div>
      <div className="flex w-full items-center">
        <FontAwesomeIcon
          icon={faArrowLeft}
          className="cursor-pointer"
          onClick={onLeft}
        />
        <div className="flex-1">
          {image ? <img src={image} /> : <FontAwesomeIcon icon={faUser} />}
        </div>
        <FontAwesomeIcon
          icon={faArrowRight}
          className="cursor-pointer"
          onClick={onRight}
        />
      </div>
      <div>
        <div>
          Lov. <NumberSpan>{friend.love}</NumberSpan>
        </div>
        {isActive && (
          <FontAwesomeIcon
            icon={faCircleXmark}
            className="cursor-pointer"
            onClick={onSwitch}
          />
        )}
      </div>
    </div>
  );
}
