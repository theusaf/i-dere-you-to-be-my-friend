import { useRef, useState } from "react";
import { Character, CharacterInfo, Gender } from "../../../util/character";
import { RawGameDataContent } from "../../../util/game_data";
import { Unselectable } from "../../../../engine/components/unselectable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  IconDefinition,
  faDice,
  faPaintBrush,
  faPaintRoller,
  faPalette,
  faPallet,
  faPerson,
  faShirt,
  faSquareCheck,
} from "@fortawesome/free-solid-svg-icons";
import { getRandomName } from "../../../util/random";
import { chance } from "../../../util/chance";
import { TextActionButton } from "../../../../engine/components/action_button";

export function CreateSavePage({
  onSaveCreated,
}: {
  onSaveCreated: (save: RawGameDataContent) => void;
}): JSX.Element {
  const [creationState, setCreationState] = useState<boolean>(false);
  const [currentName, setCurrentName] = useState<string>("");
  const [currentGender, setCurrentGender] = useState<Gender>(Gender.none);
  const myCharacter = useRef<CharacterInfo>(new Character().toMap()),
    myFriend = useRef<CharacterInfo>(new Character().toMap());
  const genderMap: Partial<Record<Gender, "male" | "female" | undefined>> = {
    [Gender.he]: "male",
    [Gender.she]: "female",
  };

  const randomize = () => {
    const gender = chance.pickone([
      Gender.he,
      Gender.she,
      Gender.they,
      Gender.none,
    ]);
    setCurrentGender(gender);
    setCurrentName(
      getRandomName({
        gender: genderMap[gender],
      }),
    );
  };

  const onSubmit = () => {
    const character: CharacterInfo = (creationState ? myFriend : myCharacter)
      .current;
    character.name = currentName;
    character.gender = currentGender;
    if (creationState) {
      myFriend.current.id = "ura_bosu";
      const gameData: RawGameDataContent = {
        friends: [],
        you: myCharacter.current,
        worldMapData: {
          playerX: 72,
          playerY: 64,
        },
        mainNPC: myFriend.current,
      };
      onSaveCreated(gameData);
    } else {
      setCurrentGender(Gender.none);
      setCurrentName("");
      setCreationState(true);
    }
  };

  return (
    <div className="col-span-3 row-span-5 row-start-1 col-start-2 grid grid-rows-8">
      <Unselectable>
        <h2 className="text-center text-4xl mt-4">
          {!creationState ? "Create Your Character" : "Create a Friend"}
        </h2>
      </Unselectable>
      <div className="row-span-7 shadow-2xl shadow-black grid grid-rows-7 p-2">
        <div className="row-span-6 grid grid-cols-5">
          <GenderSelector
            currentGender={currentGender}
            setCurrentGender={setCurrentGender}
            currentName={currentName}
          />
          <div className="col-span-3 mx-2 p-2 rounded grid grid-rows-5 text-4xl">
            <div className="row-start-2 flex items-center justify-between">
              <span className="p-2 cursor-pointer">&lt;</span>
              <span className="p-2 cursor-pointer">&gt;</span>
            </div>
            <div className="row-start-3 flex items-center justify-between">
              <span className="p-2 cursor-pointer">&lt;</span>
              <span className="p-2 cursor-pointer">&gt;</span>
            </div>
            <div className="row-start-4 flex items-center justify-between">
              <span className="p-2 cursor-pointer">&lt;</span>
              <span className="p-2 cursor-pointer">&gt;</span>
            </div>
          </div>
          <div className="flex flex-col overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <span className="h-12" title="Choose the color for the selected item">
                  <FontAwesomeIcon icon={faPalette} className="w-full h-full" />
                </span>
                <span className="h-12 bg-red-600 border-4 border-black"></span>
                <span className="h-12 bg-blue-600 border-4 border-black"></span>
                <span className="h-12 bg-green-600 border-4 border-black"></span>
                <span className="h-12 bg-orange-500 border-4 border-black"></span>
                <span className="h-12 bg-pink-600 border-4 border-black"></span>
                <span className="h-12 bg-white border-4 border-black"></span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="h-12" title="Choose the skin color">
                  <FontAwesomeIcon icon={faPerson} className="w-full h-full" />
                </span>
                <span className="h-12 bg-orange-950 border-4 border-black"></span>
                <span className="h-12 bg-orange-800 border-4 border-black"></span>
                <span className="h-12 bg-amber-800 border-4 border-black"></span>
                <span className="h-12 bg-yellow-800 border-4 border-black"></span>
                <span className="h-12 bg-orange-300 border-4 border-black"></span>
                <span className="h-12 bg-orange-200 border-4 border-black"></span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex row-start-7 h-full">
          <CenteredIcon icon={faDice} onClick={randomize} />
          <div
            style={{
              flex: 4,
            }}
          >
            <div className="h-full flex">
              <div className="h-10 my-auto flex-1">
                <input
                  className="h-full w-full outline-none bg-transparent text-xl text-center border-b-white border-b-2"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                />
              </div>
            </div>
          </div>
          <CenteredIcon icon={faSquareCheck} onClick={onSubmit} />
        </div>
      </div>
    </div>
  );
}

function GenderSelector({
  currentGender,
  setCurrentGender,
  currentName,
}: {
  currentGender: Gender;
  setCurrentGender: (gender: Gender) => void;
  currentName: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <GenderSelectorButton
        currentGender={currentGender}
        testGender={Gender.she}
        setCurrentGender={setCurrentGender}
      >
        She/Her
      </GenderSelectorButton>
      <GenderSelectorButton
        currentGender={currentGender}
        testGender={Gender.they}
        setCurrentGender={setCurrentGender}
      >
        They/Them
      </GenderSelectorButton>
      <GenderSelectorButton
        currentGender={currentGender}
        testGender={Gender.he}
        setCurrentGender={setCurrentGender}
      >
        He/Him
      </GenderSelectorButton>
      <GenderSelectorButton
        currentGender={currentGender}
        testGender={Gender.none}
        setCurrentGender={setCurrentGender}
      >
        {currentName}
      </GenderSelectorButton>
    </div>
  );
}

function GenderSelectorButton({
  testGender,
  currentGender,
  setCurrentGender,
  children,
}: {
  currentGender: Gender;
  testGender: Gender;
  setCurrentGender: (gender: Gender) => void;
  children: string;
}) {
  return (
    <TextActionButton
      className={`cursor-pointer ${currentGender === testGender ? "bg-slate-300 text-black" : ""}`}
      onClick={() => setCurrentGender(testGender)}
    >
      {children}
    </TextActionButton>
  );
}

function CenteredIcon({
  icon,
  onClick,
}: {
  icon: IconDefinition;
  onClick?: () => void;
}) {
  return (
    <div className="flex-1 flex flex-row items-center">
      <div className="flex-1 flex flex-col items-center">
        <FontAwesomeIcon
          icon={icon}
          className="w-16 h-16 cursor-pointer"
          onClick={onClick}
        />
      </div>
    </div>
  );
}
