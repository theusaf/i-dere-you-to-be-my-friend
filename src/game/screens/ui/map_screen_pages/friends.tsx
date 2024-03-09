import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NumberSpan } from "../../../../engine/components/numer_span";
import { Character, getGenderedString } from "../../../util/character";
import {
  faHeart,
  faHeartCrack,
  faHeartPulse,
  faSkull,
  faSmileWink,
} from "@fortawesome/free-solid-svg-icons";
import { ClosableView } from "./util";
import { TypeIcon } from "../../../../engine/components/type_icon";
import { useState } from "react";
import { HealthBar } from "../../../../engine/components/health_bar";
import { MoveButton } from "../../../../engine/components/move_button";
import { getMovesets } from "../../../util/moves";
import { RichTextSpan } from "../../../../engine/components/rich_text_span";

export function ContactPagePhone({
  friends,
  onSelect,
}: {
  friends: Character[];
  onSelect: (friend: Character) => void;
}): JSX.Element {
  const [selected, setSelected] = useState<Character | null>(null);
  friends = [...friends].sort((a, b) => {
    if (a.isDead) return Infinity;
    return a.name[0].charCodeAt(0) - b.name[0].charCodeAt(0);
  });
  return (
    <div className="flex items-center flex-col h-full overflow-y-auto">
      <h2 className="text-xl underline">Contacts</h2>
      <div className="w-full text-left">
        {friends.map((friend, i) => {
          return (
            <div
              key={i}
              className={`cursor-pointer p-2 ${selected === friend ? "bg-slate-400" : ""}`}
              onClick={() => {
                onSelect(friend);
                setSelected(friend);
              }}
            >
              <span className="mr-1">
                {friend.isDead ? (
                  <FontAwesomeIcon icon={faSkull} />
                ) : (
                  <FontAwesomeIcon icon={faSmileWink} />
                )}
              </span>
              <span>{friend.name}</span> -{" "}
              <FontAwesomeIcon icon={faHeart} className="mr-1" />
              <NumberSpan>{friend.love}</NumberSpan>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ContactPageLarge({
  friend,
}: {
  friend: Character;
}): JSX.Element {
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  if (!friend) return <></>;
  const { name, gender, types, xPower, hp, stats, isDead, knownMoves } = friend;
  const requiredXP = friend.getRequiredXP();
  const movesets = getMovesets();
  return (
    <ClosableView>
      <div className="text-white overflow-y-auto h-full">
        <h2 className="text-2xl">{name}</h2>
        <div>
          <em>
            {getGenderedString({
              gender,
              name,
              type: "pronoun",
            })}
            /
            {getGenderedString({
              gender,
              name,
              type: "object",
            })}
          </em>
        </div>
        <div className="flex gap-2">
          {types.map((type, i) => {
            return <TypeIcon key={i} type={type} />;
          })}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <div className="flex items-center">
              <FontAwesomeIcon
                icon={isDead ? faHeartCrack : faHeart}
                color="red"
                className="mr-1"
              />
              <NumberSpan>{friend.love}</NumberSpan>
              <span className="flex-1 mx-2">
                <HealthBar percentage={xPower / requiredXP} />
              </span>
              <NumberSpan>
                {xPower}/{requiredXP}
              </NumberSpan>
            </div>
          </div>
          <div>
            <div className="flex items-center">
              <FontAwesomeIcon
                icon={faHeartPulse}
                color="red"
                className="mr-1"
              />
              <NumberSpan>{friend.love}</NumberSpan>
              <span className="flex-1 mx-2">
                <HealthBar percentage={hp / stats.maxHealth} />
              </span>
              <NumberSpan>
                {hp}/{stats.maxHealth}
              </NumberSpan>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xl">Known Moves</h3>
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 grid grid-cols-3 gap-2 text-center">
              {knownMoves.map((move, i) => {
                return movesets[move] ? (
                  <MoveButton
                    key={i}
                    onClick={() => {
                      setSelectedMove(move);
                    }}
                    move={move}
                    user={friend}
                    moveData={movesets[move]}
                  />
                ) : (
                  ""
                );
              })}
            </div>
            <div className="rounded bg-slate-700 p-2 col-span-2">
              {selectedMove ? (
                <div>
                  <h3 className="text-xl">
                    <span className="mr-2">{movesets[selectedMove].name}</span>
                    <TypeIcon type={movesets[selectedMove].type} />
                  </h3>
                  <RichTextSpan text={movesets[selectedMove].description} />
                  <hr />
                  <p>
                    Mt: <NumberSpan>{movesets[selectedMove].might}</NumberSpan>
                  </p>
                  <p>
                    Spd: <NumberSpan>{movesets[selectedMove].speed}</NumberSpan>
                  </p>
                </div>
              ) : (
                <div>No move selected</div>
              )}
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xl">Stats</h3>
          <div className="grid grid-cols-3">
            <div>
              AGI: <NumberSpan>{stats.agility}</NumberSpan>
            </div>
            <div>
              CON: <NumberSpan>{stats.constitution}</NumberSpan>
            </div>
            <div>
              HP: <NumberSpan>{stats.maxHealth}</NumberSpan>
            </div>
            <div>
              SPD: <NumberSpan>{stats.speed}</NumberSpan>
            </div>
            <div>
              STR: <NumberSpan>{stats.strength}</NumberSpan>
            </div>
          </div>
        </div>
      </div>
    </ClosableView>
  );
}
