import { Character } from "./character";

interface BattleData {
  opponentLeader: Character;
  opponentTeam?: Character[];
  playerTeam: Character[];
  rewardTable?: string;
}

export class Battle implements BattleData {
  opponentLeader: Character;
  opponentTeam: Character[];
  playerTeam: Character[];
  rewardTable?: string;

  constructor({
    opponentLeader,
    opponentTeam,
    playerTeam,
    rewardTable,
  }: BattleData) {
    this.opponentLeader = opponentLeader;
    this.opponentTeam = opponentTeam ?? [opponentLeader];
    this.playerTeam = playerTeam;
    this.rewardTable = rewardTable;
  }
}
