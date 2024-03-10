import { Battle } from "./battle";
import { Character, CharacterInfo } from "./character";
import { Saveable, save } from "./saves";
import { stringify } from "yaml";
import data from "../../../package.json";
import { chance } from "./chance";
import { getMovesets } from "./moves";

const version = data.version;

export interface WorldMapData {
  playerX: number;
  playerY: number;
}

export interface GameDataContent {
  friends: Character[];
  you: Character;
  worldMapData: WorldMapData;
  mainNPC: Character;
  saveId?: string;
  gold?: number;
  cutscenes?: Set<string>;
  specialNPCs?: Record<string, Character>;
}

export interface RawGameDataContent {
  friends: CharacterInfo[];
  you: CharacterInfo;
  worldMapData: WorldMapData;
  version?: string;
  mainNPC: CharacterInfo;
  saveId?: string;
  gold?: number;
  cutscenes?: string[];
  specialNPCs?: Record<string, CharacterInfo>;
}

const maxFriends = 8;

export class GameData implements Saveable<RawGameDataContent>, GameDataContent {
  worldMapData: WorldMapData;
  friends: Character[];
  you: Character;
  mainNPC: Character;
  gold: number;
  cutscenes: Set<string>;
  specialNPCs: Record<string, Character> = {};

  get activeFriends(): Character[] {
    return this.friends.filter((friend) => friend.isActive);
  }

  battle: Battle | null = null;
  saveId: string;

  constructor({
    worldMapData,
    friends,
    you,
    mainNPC,
    saveId,
    gold,
    cutscenes,
    specialNPCs,
  }: Partial<GameDataContent> = {}) {
    this.saveId = saveId ?? chance.guid();
    this.worldMapData = worldMapData ?? {
      playerX: 64,
      playerY: 64,
    };
    this.friends = friends ?? [];
    this.you = you ?? new Character();
    this.mainNPC = mainNPC ?? new Character();
    this.gold = gold ?? 0;
    this.cutscenes = cutscenes ?? new Set();
    this.specialNPCs = {};
    for (const [id, npc] of Object.entries(specialNPCs ?? {})) {
      this.specialNPCs[id] = new Character(npc);
    }
  }

  toMap(): RawGameDataContent {
    const specialNPCs: Record<string, CharacterInfo> = {};
    for (const [id, npc] of Object.entries(this.specialNPCs)) {
      specialNPCs[id] = npc.toMap();
    }
    return {
      worldMapData: this.worldMapData,
      friends: this.friends.map((friend) => friend.toMap()),
      you: this.you,
      mainNPC: this.mainNPC,
      version,
      saveId: this.saveId,
      gold: this.gold,
      cutscenes: Array.from(this.cutscenes),
      specialNPCs: specialNPCs,
    };
  }

  toYAML(): string {
    return stringify(this.toMap());
  }

  save(): Promise<void> {
    return save(this, this.saveId);
  }

  isNPCinFriendGroup(id: string): boolean {
    return this.friends.some((friend) => friend.id === id);
  }

  hasAnyLivingActiveFriends(): boolean {
    return this.activeFriends.some((friend) => !friend.isDead);
  }

  addCharacter(character: Character): boolean {
    let addedToActive = false;
    if (this.activeFriends.length < maxFriends) {
      character.isActive = true;
      addedToActive = true;
    }
    this.friends.push(character);
    return addedToActive;
  }

  calculateMedicalCosts(): number {
    let amount = 0;
    const costPerHP = 5;
    const costPerSkillRecovery = 2;
    const movesets = getMovesets();
    for (const friend of this.activeFriends) {
      if (friend.isDead) continue;
      amount += (friend.stats.maxHealth - friend.hp) * costPerHP;
      for (const key in friend.moveUses) {
        if (movesets[key]) {
          amount +=
            (movesets[key].max_uses - friend.moveUses[key]) *
            costPerSkillRecovery;
        }
      }
    }
    return amount;
  }

  healActiveFriends(free: boolean = false): void {
    const movesets = getMovesets();
    if (!free) this.gold -= this.calculateMedicalCosts();
    for (const friend of this.activeFriends) {
      if (friend.isDead) continue;
      friend.hp = friend.stats.maxHealth;
      for (const key in friend.moveUses) {
        friend.moveUses[key] = movesets[key]?.max_uses ?? 1;
      }
    }
  }

  static fromMap(map: RawGameDataContent): GameData {
    const specialNPCs: Record<string, Character> = {};
    for (const [id, npc] of Object.entries(map.specialNPCs ?? {})) {
      specialNPCs[id] = new Character(npc);
    }
    return new GameData({
      worldMapData: map.worldMapData,
      friends: map.friends.map((friend) => new Character(friend)),
      you: new Character(map.you),
      mainNPC: new Character(map.mainNPC),
      saveId: map.saveId,
      gold: map.gold,
      cutscenes: new Set(map.cutscenes),
      specialNPCs,
    });
  }
}
