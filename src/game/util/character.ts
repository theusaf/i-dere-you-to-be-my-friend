import { chance } from "./chance";
import { ActiveStatusEffect, StatusEffect } from "./effects";
import { getMovesets, getRandomMoveIds } from "./moves";
import { getRandomName } from "./random";
import { Saveable } from "./saves";
import { DereType } from "./types";

export interface CharacterStats {
  /**
   * Base speed to determine action order.
   */
  speed: number;
  /**
   * The character constitution.
   *
   * Affects health gain and resistances.
   */
  constitution: number;
  /**
   * The character's ability to dodge attacks.
   */
  agility: number;
  maxHealth: number;
  strength: number;
}

export enum Gender {
  she = "she",
  they = "they",
  he = "he",
  none = "none",
}

interface GenderedStringOpts {
  gender: Gender;
  type: "possesive" | "objectself" | "object" | "pronoun";
  name: string;
}

export function getGenderedString({
  gender,
  type,
  name,
}: GenderedStringOpts): string {
  switch (gender) {
    case Gender.she:
      return type === "possesive"
        ? "her"
        : type === "object"
          ? "her"
          : type === "objectself"
            ? "herself"
            : "she";
    case Gender.they:
      return type === "possesive"
        ? "their"
        : type === "object"
          ? "them"
          : type === "objectself"
            ? "themself"
            : "they";
    case Gender.he:
      return type === "possesive"
        ? "his"
        : type === "object"
          ? "him"
          : type === "objectself"
            ? "himself"
            : "he";
    case Gender.none:
      return type === "possesive"
        ? `${name}'s`
        : type === "object"
          ? name
          : type === "objectself"
            ? `${name}, themself`
            : name;
  }
}

export interface CharacterInfo {
  id?: string;
  hp: number;
  name: string;
  types: DereType[];
  isDead: boolean;
  xPower: number;
  love: number;
  stats: CharacterStats;
  statusEffects: { effect: StatusEffect; duration: number }[];
  gender: Gender;
  knownMoves: string[];
  moveUses: Record<string, number>;
  isActive: boolean;
}

export class Character implements CharacterInfo, Saveable<CharacterInfo> {
  id?: string;
  hp: number;
  name: string;
  types: DereType[];
  isDead: boolean;
  /**
   * The character's love for their friend
   *
   * Basically the character's level
   * This can be decreased...
   */
  love: number;
  /**
   * The character's experience points
   */
  xPower: number;
  stats: CharacterStats;
  gender: Gender;
  knownMoves: string[];
  moveUses: Record<string, number>;
  statusEffects: ActiveStatusEffect[];
  isActive: boolean;

  constructor({
    id,
    hp,
    name,
    types,
    isDead,
    xPower,
    love,
    stats,
    gender,
    knownMoves,
    moveUses,
    statusEffects,
    isActive,
  }: Partial<CharacterInfo> = {}) {
    this.id = id;
    this.isActive = false;
    this.hp = hp ?? 1;
    this.name = name ?? "Unnamed";
    this.types = types ?? [];
    this.isDead = isDead ?? false;
    this.xPower = xPower ?? 0;
    this.love = love ?? 1;
    this.stats = stats ?? {
      speed: 1,
      constitution: 1,
      maxHealth: 10,
      agility: 1,
      strength: 1,
    };
    this.gender = gender ?? Gender.they;
    this.knownMoves = knownMoves ?? [];
    this.moveUses = moveUses ?? {};
    this.statusEffects = statusEffects ?? [];
    this.isActive = isActive ?? false;
  }

  clone(): Character {
    return new Character(JSON.parse(JSON.stringify(this.toMap())));
  }

  toYAML(): string {
    return JSON.stringify(this.toMap());
  }

  toMap(): CharacterInfo {
    return {
      id: this.id,
      hp: this.hp,
      name: this.name,
      types: this.types,
      isDead: this.isDead,
      xPower: this.xPower,
      love: this.love,
      stats: this.stats,
      statusEffects: this.statusEffects,
      gender: this.gender,
      knownMoves: this.knownMoves,
      moveUses: this.moveUses,
      isActive: this.isActive,
    };
  }

  removeXP(xp: number): void {
    this.xPower -= xp;
    while (true) {
      if (this.xPower < 0) {
        this.loveDown();
      } else {
        break;
      }
      if (this.love === 1) {
        break;
      }
    }
  }

  addXP(xp: number): void {
    this.xPower += xp;
    while (true) {
      const required = this.getRequiredXP();
      if (this.xPower >= required) {
        this.loveUp();
        this.xPower -= required;
      } else {
        break;
      }
    }
  }

  getRequiredXP(): number {
    return Math.ceil(this.love * 1.4) ** 2;
  }

  calculateGainedXP(opponentLove: number, otherMultiplier: number = 1): number {
    // TODO: verify if the numbers here are good
    let xp = chance.floating({ min: 25, max: 55 });
    const loveDifference = opponentLove - this.love;
    if (loveDifference > 0) {
      xp *= Math.sqrt(loveDifference) + 1;
    } else {
      xp /= Math.abs(loveDifference) + 1;
    }
    xp *= Math.min(1, Math.sqrt(this.love));
    xp *= otherMultiplier;
    return Math.ceil(xp);
  }

  loveUp(): (keyof CharacterStats)[] {
    this.love++;
    this.stats.maxHealth += this.stats.constitution;
    const statKeys = Object.keys(this.stats) as (keyof CharacterStats)[];
    const upgradeStats = chance.pickset(
      statKeys,
      chance.integer({ min: 1, max: statKeys.length }),
    );
    for (const stat of upgradeStats) {
      this.stats[stat]++;
    }
    return upgradeStats;
  }

  loveDown(): (keyof CharacterStats)[] {
    this.love--;
    this.stats.maxHealth -= this.stats.constitution;
    const statKeys = (
      Object.keys(this.stats) as (keyof CharacterStats)[]
    ).filter((stat) => this.stats[stat] > 1);
    const upgradeStats = chance.pickset(
      statKeys,
      chance.integer({ min: 1, max: statKeys.length }),
    );
    for (const stat of upgradeStats) {
      this.stats[stat]++;
    }
    return upgradeStats;
  }

  static fromMap(map: CharacterInfo): Character {
    return new Character(map);
  }

  static createRandomCharacter(love: number = 1): Character {
    const name = getRandomName();
    const types = chance.pickset(
      Object.values(DereType),
      chance.integer({ min: 1, max: 2 }),
    );
    let minMovesByLove = Math.floor(love / 2);
    if (minMovesByLove < 2) minMovesByLove = 2;
    if (minMovesByLove > 6) minMovesByLove = 6;
    const numMoves = chance.integer({ min: minMovesByLove, max: 6 });
    const moves = getRandomMoveIds(types, numMoves);
    const moveUses: Record<string, number> = {};
    const movesets = getMovesets();
    for (const move of moves) {
      moveUses[move] = movesets[move].max_uses;
    }
    const character = new Character({
      love: 1,
      name,
      types,
      stats: {
        speed: chance.integer({ min: 1, max: 3 }),
        constitution: chance.integer({ min: 1, max: 3 }),
        maxHealth: chance.integer({ min: 10, max: 13 }),
        agility: chance.integer({ min: 1, max: 3 }),
        strength: chance.integer({ min: 1, max: 3 }),
      },
      knownMoves: moves,
      moveUses: moveUses,
    });
    for (let i = 1; i < love; i++) {
      character.loveUp();
    }
    character.hp = character.stats.maxHealth;
    return character;
  }
}
