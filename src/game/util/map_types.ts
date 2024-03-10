import { CharacterStats, Gender } from "./character";
import { mapTileStrings } from "./map";
import { DereType } from "./types";

export interface MapSpecialBoxBase {
  from: [number, number] | null;
  to: [number, number] | null;
  type: string;
  interact_dialog?: string;
}

export interface MapSpecialBuildingBox extends MapSpecialBoxBase {
  type: "building";
  image: string;
  background_tile?: keyof typeof mapTileStrings;
  entry?: [number, number, number, number];
  inside?: [number, number, number, number];
  building_id?: string;
}

export interface MapSpecialActionBox extends MapSpecialBoxBase {
  type: "walk_action" | "interact_action";
  action: MapSpecialActionBattle;
  /**
   * The conditions that must be met for this action to be performed.
   */
  if: MapSpecialConditions;
  /**
   * The conditions that if met, prevents this action from being performed.
   */
  unless: MapSpecialConditions;
}

export interface MapSpecialConditions {
  new_tile?: keyof typeof mapTileStrings;
  current_tile?: keyof typeof mapTileStrings;
  chance?: number;
  npc?: {
    id: string | true;
    in_range?: number;
  };
}

export interface MapSpecialActionBase {
  /**
   * The type of action to perform.
   */
  type: string;
}

export interface MapSpecialActionBattle extends MapSpecialActionBase {
  type: "enter_battle";
  /**
   * 'random' or the id of an npc.
   */
  against: string | "random";
  /**
   * The table to use for rewards.
   *
   * If `null`, no rewards are given.
   */
  reward_table: string | null;
  /**
   * The amount of NPCs to fight.
   *
   * Only applies if `against` is "random".
   */
  size: number | number[];
  /**
   * The level of the NPCs to fight.
   *
   * If `null`, level is based off the player's level.
   */
  level: number | number[] | null;
  /**
   * The popup UI to show before the battle starts.
   */
  popup?: string;
}

export enum CutsceneActionType {
  blankScreen = "blank_screen",
  animate = "animate",
  dialog = "text",
  battle = "enter_battle",
  contract = "contract",
}

type BlankScreenCutsceneAction = [CutsceneActionType.blankScreen, boolean];
export interface CutsceneActionAnimate {
  id: string;
  start: [number, number];
  end: [number, number];
  time: number;
}
type AnimateCutsceneAction = [
  CutsceneActionType.animate,
  CutsceneActionAnimate,
];
type DialogCutsceneAction = [CutsceneActionType.dialog, string];
type BattleCutsceneAction = [CutsceneActionType.battle, MapSpecialActionBattle];
type ContractCutsceneAction = [CutsceneActionType.contract, string];

export type CutsceneAction =
  | BlankScreenCutsceneAction
  | AnimateCutsceneAction
  | DialogCutsceneAction
  | BattleCutsceneAction
  | ContractCutsceneAction;

export interface NPCData {
  position: [number, number];
  type: "random" | "special";
  love: number | number[];
  hp?: number | number[];
  name?: string;
  types?: DereType[];
  gender?: Gender;
  knownMoves?: string[];
  stats?: Partial<CharacterStats>;
  colors?: {
    head: number;
    body: number;
    legs: number;
    skin: number;
  };
  styles?: {
    head: number;
    body: number;
    legs: number;
  };
}

export interface Cutscene {
  actions: CutsceneAction[];
  conditions: [];
}

export interface MapSpecialData {
  boxes?: (MapSpecialActionBox | MapSpecialBuildingBox)[];
  npcs?: Record<string, NPCData>;
  cutscenes?: Record<string, Cutscene>;
}

export interface BuildingSpecialData extends MapSpecialData {
  /**
   * The entry coordinates for the building,
   * located using local coordinates to the building's origin.
   */
  entry: [number, number, number, number];
  /**
   * The coordinates for the inside entry of the building,
   * located using local coordinates to the building's origin.
   */
  inside: [number, number, number, number];
}
