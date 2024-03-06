import { useRef, useState } from "react";
import { Character, CharacterInfo, Gender } from "../../../util/character";
import { RawGameDataContent } from "../../../util/game_data";
import { Unselectable } from "../../../../engine/components/unselectable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  IconDefinition,
  faCircle,
  faCircleDot,
  faDice,
  faPalette,
  faPerson,
  faSquareCheck,
} from "@fortawesome/free-solid-svg-icons";
import { getRandomName } from "../../../util/random";
import { chance } from "../../../util/chance";
import { TextActionButton } from "../../../../engine/components/action_button";
import { MainMenuScreen } from "../../main_menu_screen";
import {
  BaseSprite,
  getNextAvailablePartIndex,
  getPreviousAvailablePartIndex,
} from "../../../util/sprite";
import { MutableRefObject } from "react";

export enum CreateMainColors {
  red = 0xdc2626,
  blue = 0x2563eb,
  green = 0x16a34a,
  orange = 0xf97316,
  pink = 0xdb2777,
  brown = 0x854d0e,
  white = 0xffffff,
  dark = 0x334155,
}

export enum CreateSkinColors {
  dark = 0x431407,
  redBrown = 0x9a3412,
  amber = 0x92400e,
  golden = 0x854d0e,
  tan = 0xfdba74,
  light = 0xfed7aa,
}

enum CreatePartSelection {
  head,
  body,
  legs,
}

export function CreateSavePage({
  onSaveCreated,
  screen,
}: {
  onSaveCreated: (save: RawGameDataContent) => void;
  screen: MainMenuScreen;
}): JSX.Element {
  const [creationState, setCreationState] = useState<boolean>(false);
  const [currentName, setCurrentName] = useState<string>("");
  const [currentGender, setCurrentGender] = useState<Gender>(Gender.none);
  const [currentPartSelection, setCurrentPartSelection] =
    useState<CreatePartSelection>(CreatePartSelection.head);
  const [currentMainColor, setCurrentMainColor] = useState<CreateMainColors>(
    CreateMainColors.red,
  );
  const [currentSkinColor, setCurrentSkinColor] = useState<CreateSkinColors>(
    CreateSkinColors.dark,
  );
  const headId = useRef<number>(1);
  const bodyId = useRef<number>(1);
  const legsId = useRef<number>(1);
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
  const sprite = screen.sprite!;

  if (sprite) {
    switch (currentPartSelection) {
      case CreatePartSelection.head:
        if (currentMainColor !== sprite.headColor) {
          sprite.updateHeadTexture(`${headId.current}`, currentMainColor);
        }
        break;
      case CreatePartSelection.body:
        if (currentMainColor !== sprite.bodyColor) {
          sprite.updateBodyTexture(`${bodyId.current}`, currentMainColor);
        }
        break;
      case CreatePartSelection.legs:
        if (currentMainColor !== sprite.legColor) {
          sprite.updateLegTexture(`${legsId.current}`, currentMainColor);
        }
        break;
    }
  }

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
            <PartSwitcher
              id={headId}
              testPart="frontHead"
              updater={(id) => {
                sprite?.updateHeadTexture(id, sprite.headColor);
              }}
              className="row-start-2"
              isSelected={currentPartSelection === CreatePartSelection.head}
              onSelected={() => {
                setCurrentMainColor(sprite.headColor);
                setCurrentPartSelection(CreatePartSelection.head);
              }}
            />
            <PartSwitcher
              id={bodyId}
              testPart="frontBody"
              updater={(id) => {
                sprite?.updateBodyTexture(id, sprite.bodyColor);
              }}
              className="row-start-3"
              isSelected={currentPartSelection === CreatePartSelection.body}
              onSelected={() => {
                setCurrentMainColor(sprite.bodyColor);
                setCurrentPartSelection(CreatePartSelection.body);
              }}
            />
            <PartSwitcher
              id={legsId}
              testPart="frontLeftLeg"
              updater={(id) => {
                sprite?.updateLegTexture(id, sprite.legColor);
              }}
              className="row-start-4"
              isSelected={currentPartSelection === CreatePartSelection.legs}
              onSelected={() => {
                setCurrentMainColor(sprite.legColor);
                setCurrentPartSelection(CreatePartSelection.legs);
              }}
            />
          </div>
          <div className="flex flex-col overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-2">
                <span
                  className="h-12"
                  title="Choose the color for the selected item"
                >
                  <FontAwesomeIcon icon={faPalette} className="w-full h-full" />
                </span>
                <ColorPicker
                  className="bg-red-600"
                  isSelected={currentMainColor === CreateMainColors.red}
                  onSelect={() => setCurrentMainColor(CreateMainColors.red)}
                />
                <ColorPicker
                  className="bg-blue-600"
                  isSelected={currentMainColor === CreateMainColors.blue}
                  onSelect={() => setCurrentMainColor(CreateMainColors.blue)}
                />
                <ColorPicker
                  className="bg-green-600"
                  isSelected={currentMainColor === CreateMainColors.green}
                  onSelect={() => setCurrentMainColor(CreateMainColors.green)}
                />
                <ColorPicker
                  className="bg-orange-600"
                  isSelected={currentMainColor === CreateMainColors.orange}
                  onSelect={() => setCurrentMainColor(CreateMainColors.orange)}
                />
                <ColorPicker
                  className="bg-pink-600"
                  isSelected={currentMainColor === CreateMainColors.pink}
                  onSelect={() => setCurrentMainColor(CreateMainColors.pink)}
                />
                <ColorPicker
                  className="bg-yellow-800"
                  isSelected={currentMainColor === CreateMainColors.brown}
                  onSelect={() => setCurrentMainColor(CreateMainColors.brown)}
                />
                <ColorPicker
                  className="bg-white"
                  isSelected={currentMainColor === CreateMainColors.white}
                  onSelect={() => setCurrentMainColor(CreateMainColors.white)}
                />
                <ColorPicker
                  className="bg-slate-700"
                  isSelected={currentMainColor === CreateMainColors.dark}
                  onSelect={() => setCurrentMainColor(CreateMainColors.dark)}
                />
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

function ColorPicker({
  className,
  isSelected,
  onSelect,
}: {
  isSelected: boolean;
  className: string;
  onSelect: () => void;
}) {
  return (
    <span
      onClick={onSelect}
      className={`h-12 border-4 cursor-pointer ${isSelected ? "border-white" : "border-black"} ${className}`}
    ></span>
  );
}

function PartSwitcher({
  id,
  testPart,
  isSelected,
  onSelected,
  updater,
  className,
}: {
  id: MutableRefObject<number>;
  testPart: keyof BaseSprite;
  isSelected: boolean;
  onSelected: () => void;
  updater?: (id: string) => void;
  className: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="p-2 cursor-pointer">
        <span
          onClick={() => {
            id.current = getPreviousAvailablePartIndex(id.current, testPart);
            updater?.(`${id.current}`);
          }}
        >
          <Unselectable className="inline">
            <span className="p-2">&lt;</span>
          </Unselectable>
        </span>
      </span>
      <span className="p-2 cursor-pointer">
        <span>
          <FontAwesomeIcon
            onClick={onSelected}
            icon={isSelected ? faCircleDot : faCircle}
            color={isSelected ? "blue" : ""}
            className="w-8 h-8 cursor-pointer"
          />
        </span>
        <span
          className="cursor-pointer"
          onClick={() => {
            console.log(id.current);
            id.current = getNextAvailablePartIndex(id.current, testPart);
            console.log(id.current);
            updater?.(`${id.current}`);
          }}
        >
          <Unselectable className="inline">
            <span className="p-2">&gt;</span>
          </Unselectable>
        </span>
      </span>
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
    <div className="flex flex-col gap-2 overflow-y-auto">
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
