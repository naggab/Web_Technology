import { PlayerInGame, PlayerInLobby } from "./types";
import { PlayerIdType, Coordinate, GameDetails, GameState, GameIdType } from "@apirush/common";

export interface GameI {
  readonly id: GameIdType;
  readonly state: GameState;
  readonly details: GameDetails;

  start(): void;

  finish(winner: PlayerIdType): void;

  abort(): void;

  hasPlayer(id: PlayerIdType): boolean;

  getPlayer(id: PlayerIdType): PlayerInGame;

  hasNoPlayers(): boolean;

  addPlayer(details: PlayerInLobby): PlayerInGame;

  removePlayer(id: PlayerIdType): void;

  movePlayer(id: PlayerIdType, p: Coordinate): void;

  forEachPlayer(cb: (player: PlayerInGame) => void): void;
}
