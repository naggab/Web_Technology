import { PlayerInGame, PlayerInLobby } from "./types";
import { PlayerIdType, Coordinate, GameDetails, GameState, GameIdType } from "@apirush/common";
import { PlayerInGameI } from "@apirush/common/src";

export interface GameI {
  readonly id: GameIdType;
  readonly state: GameState;
  readonly details: GameDetails;

  start(): void;

  finish(winner: PlayerIdType): void;

  abort(): void;

  hasPlayer(id: PlayerIdType): boolean;

  getPlayer(id: PlayerIdType): PlayerInGame;

  getAllPlayers(): PlayerInGameI[];

  hasNoPlayers(): boolean;

  addPlayer(details: PlayerInLobby): PlayerInGame;

  removePlayer(id: PlayerIdType): void;

  movePlayer(id: PlayerIdType, p: Coordinate): void;

  forEachPlayer(cb: (player: PlayerInGame) => void): void;
}
