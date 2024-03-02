import { mapTileStrings } from "./map";

export interface MapSpecialBoxBase {
  from: [number, number];
  to: [number, number];
  type: string;
  interact_dialog?: string;
}

export interface MapSpecialBuildingBox extends MapSpecialBoxBase {
  type: "building"
  image: string;
  background_tile?: string;
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
  npc?: {
    id: string | true;
    in_range?: number;
  }
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
  against: string;
}

export interface MapSpecialData {
  boxes: (MapSpecialActionBox | MapSpecialBuildingBox)[];
  npcs: [] // not implemented yet
}