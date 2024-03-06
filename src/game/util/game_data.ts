import { Battle } from "./battle";
import { Character, CharacterInfo } from "./character";
import { Saveable, save } from "./saves";
import { stringify } from "yaml";
import data from "../../../package.json";
import { chance } from "./chance";

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
}

export interface RawGameDataContent {
  friends: CharacterInfo[];
  you: CharacterInfo;
  worldMapData: WorldMapData;
  version?: string;
  mainNPC: CharacterInfo;
  saveId?: string;
  gold?: number;
}

const maxFriends = 8;

export class GameData implements Saveable<RawGameDataContent>, GameDataContent {
  worldMapData: WorldMapData;
  friends: Character[];
  you: Character;
  mainNPC: Character;
  gold: number;

  get activeFriends(): Character[] {
    return this.friends.filter((friend) => friend.isActive);
  }

  battle?: Battle;
  saveId: string;

  constructor({
    worldMapData,
    friends,
    you,
    mainNPC,
    saveId,
    gold,
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
  }

  toMap(): RawGameDataContent {
    return {
      worldMapData: this.worldMapData,
      friends: this.friends.map((friend) => friend.toMap()),
      you: this.you,
      mainNPC: this.mainNPC,
      version,
      saveId: this.saveId,
      gold: this.gold,
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

  addCharacter(character: Character): void {
    if (this.activeFriends.length < maxFriends) {
      this.activeFriends.push(character);
    }
    this.friends.push(character);
  }

  static fromMap(map: RawGameDataContent): GameData {
    return new GameData({
      worldMapData: map.worldMapData,
      friends: map.friends.map((friend) => new Character(friend)),
      you: new Character(map.you),
      mainNPC: new Character(map.mainNPC),
      saveId: map.saveId,
      gold: map.gold,
    });
  }
}
