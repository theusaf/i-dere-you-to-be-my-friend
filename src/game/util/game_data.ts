import { Battle } from "./battle";
import { Character, CharacterInfo } from "./character";
import { Saveable } from "./saves";
import { stringify } from "yaml";
import data from "../../../package.json";

const version = data.version;

export interface WorldMapData {
  playerX: number;
  playerY: number;
}

export interface GameDataContent {
  friends: Character[];
  activeFriends: Character[];
  you: Character;
  worldMapData: WorldMapData;
}

export interface RawGameDataContent {
  friends: CharacterInfo[];
  activeFriends: CharacterInfo[];
  you: CharacterInfo;
  worldMapData: WorldMapData;
  version?: string;
}

export class GameData implements Saveable<RawGameDataContent>, GameDataContent {
  worldMapData: WorldMapData;
  friends: Character[];
  activeFriends: Character[];
  you: Character;

  battleData?: Battle;

  constructor({
    worldMapData,
    friends,
    activeFriends,
    you,
  }: Partial<GameDataContent> = {}) {
    this.worldMapData = worldMapData ?? {
      playerX: 64,
      playerY: 64,
    };
    this.friends = friends ?? [];
    this.activeFriends = activeFriends ?? [];
    this.you = you || new Character();
  }

  toMap(): RawGameDataContent {
    return {
      worldMapData: this.worldMapData,
      friends: this.friends.map((friend) => friend.toMap()),
      activeFriends: this.activeFriends.map((friend) => friend.toMap()),
      you: this.you,
      version,
    };
  }

  toYAML(): string {
    return stringify(this.toMap());
  }

  isNPCinFriendGroup(id: string): boolean {
    return this.friends.some((friend) => friend.id === id);
  }

  static fromMap(map: RawGameDataContent): GameData {
    return new GameData({
      worldMapData: map.worldMapData,
      friends: map.friends.map((friend) => new Character(friend)),
      activeFriends: map.activeFriends.map((friend) => new Character(friend)),
      you: new Character(map.you),
    });
  }
}
