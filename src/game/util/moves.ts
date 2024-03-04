import { Assets } from "pixi.js";
import { DereType } from "./types";
import { chance } from "./chance";

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

export const getMovesets = () =>
  Assets.get<Record<string, MoveData>>("game/moves");

export function getRandomMoveIds(
  weightedTypes: DereType[],
  count = 0,
  ignoreMoves: string[] = [],
) {
  const movesets = getMovesets();
  const moveKeys = Object.keys(movesets);
  const matchingMoves = moveKeys.filter((move) => {
    return (
      (weightedTypes.includes(movesets[move].type) ||
        movesets[move].type === DereType.normal) &&
      !ignoreMoves.includes(move)
    );
  });
  const nonMatchingMoves = moveKeys.filter((move) => {
    return (
      !weightedTypes.includes(movesets[move].type) &&
      !ignoreMoves.includes(move)
    );
  });
  if (count === 0) count = chance.integer({ min: 2, max: 6 });
  let moves: string[] = [];
  for (let i = 0; i < count; i++) {
    const move = chance.weighted(
      [...matchingMoves, ...nonMatchingMoves],
      [...matchingMoves.map(() => 5), ...nonMatchingMoves.map(() => 1)],
    );
    if (!move) break;
    moves.push(move);
    const indexMatching = matchingMoves.indexOf(move),
      indexNonMatching = nonMatchingMoves.indexOf(move);
    if (indexMatching !== -1) matchingMoves.splice(indexMatching, 1);
    if (indexNonMatching !== -1) nonMatchingMoves.splice(indexNonMatching, 1);
  }
  return moves;
}

export function getRandomMoves(
  weightedTypes: DereType[],
  count = 0,
  ignoreMoves: string[] = [],
): MoveData[] {
  const ids = getRandomMoveIds(weightedTypes, count, ignoreMoves);
  const movesets = getMovesets();
  return ids.map((id) => movesets[id]);
}
