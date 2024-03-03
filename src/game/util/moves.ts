import { Assets } from "pixi.js";
import { DereType } from "./types";

export enum TraitKind {
  strengthen = "strengthen",
  reflect = "reflect",
  toughen = "toughen",
  weaken = "weaken",
  heal = "heal",
  vulnerable = "vulnerable",
  critical_up = "critical_up",
  critical = "critical",
  loading = "loading",
  poison = "poison",
  confuse = "confuse",
  bleed = "bleed",
  elation = "elation",
  multi_hit = "multi_hit",
  stun = "stun",
}

export interface TraitData {
  chance?: number;
  duration?: number | [number, number];
  amount?: number | [number, number];
  name: TraitKind;
}

export interface MoveData {
  name: string;
  description: string;
  type: DereType;
  max_uses: number;
  might: number;
  speed: number;
  targets: "self" | "enemy";
  traits: (TraitData | TraitKind)[];
}

export const movesets = Assets.get<Record<string, MoveData>>("game/moves");
