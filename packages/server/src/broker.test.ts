import { GameMasterI } from "./gameMasterI";
import { PlayerInGame, PlayerInLobby, ServerEventNotifyCb } from "./types";
import { GameI } from "./gameI";

class GameMasterMock implements GameMasterI {
  addPlayerToGame(gameId, playerId): any {}

  closeAll(): void {}

  createGameAndJoin(name: string, creator: PlayerInLobby): { game: GameI; player: PlayerInGame } {
    return { game: undefined, player: undefined };
  }

  createPlayer(name: string, notifyCb: ServerEventNotifyCb): PlayerInLobby {
    return undefined;
  }

  getGame(id): GameI {
    return undefined;
  }

  getGameList(): any {}

  removePlayer(id): void {}

  removePlayerFromGame(gameId, playerId): void {}
}
