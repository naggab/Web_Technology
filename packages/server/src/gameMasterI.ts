import { GameIdType, PlayerIdType } from "@apirush/common";
import { GameI } from "./gameI";
import { PlayerInGame, PlayerInLobby, ServerEventNotifyCb } from "./types";

export interface GameMasterI {
  getGameList(): any;

  getGame(id: GameIdType): GameI;

  createGameAndJoin(name: string, creator: PlayerInLobby): { game: GameI; player: PlayerInGame };

  createPlayer(name: string, notifyCb: ServerEventNotifyCb): PlayerInLobby;

  removePlayer(id: PlayerIdType): void;

  addPlayerToGame(gameId: GameIdType, playerId: PlayerIdType): PlayerInGame;

  removePlayerFromGame(gameId: GameIdType, playerId: PlayerIdType): void;

  closeAll(): void;
}
