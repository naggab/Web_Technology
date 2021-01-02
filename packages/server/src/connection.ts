import WebSocket from "ws";
import { GameMasterI } from "./gameMasterI";
import { PlayerInGame, PlayerInLobby } from "./types";
import { GameI } from "./gameI";
import { ERR_PLAYER_ALREADY_GREETED, ERR_PLAYER_DID_NOT_GREET } from "./constants";
import {
  CommandOps,
  CommandRequest,
  CommandResponse,
  ErrorResponseBody,
  EventOp,
  Respondable,
  Event,
} from "@apirush/common";

export class Connection {
  readonly ws: WebSocket;
  readonly gm: GameMasterI;
  ok: boolean;

  player: PlayerInLobby | PlayerInGame | null;
  game: GameI | null;

  constructor(ws: WebSocket, gm: GameMasterI) {
    this.ws = ws;
    this.gm = gm;
    this.ok = true;
    this.player = null;
    this.game = null;
  }

  onMessage(msg: WebSocket.Data) {
    console.log(`broker: onMessage`);
    let req: CommandRequest;
    try {
      req = JSON.parse(msg.toString()) as CommandRequest;
    } catch (e) {
      console.error("unable to parse message, will be ignored");
      return;
    }
    let responseBody: Omit<CommandResponse, "id">;
    try {
      responseBody = this.executeRPC(req);
    } catch (e) {
      this.respondWith({
        id: req.id,
        error: e.toString(),
      });
      return;
    }
    this.respondWith({
      id: req.id,
      // @ts-ignore
      op: responseBody.op,
      result: responseBody.result,
    });
  }

  get hasGreeted() {
    return !!this.player;
  }

  ensureGreeted() {
    if (!this.hasGreeted) {
      throw ERR_PLAYER_DID_NOT_GREET;
    }
  }

  get hasJoinedGame() {
    return !!this.game;
  }

  ensureJoinedGame() {
    if (!this.hasJoinedGame) {
      throw ERR_PLAYER_DID_NOT_GREET;
    }
  }

  executeRPC(req: Exclude<CommandRequest, "id">) {
    switch (req.op) {
      case CommandOps.HELLO: {
        if (this.hasGreeted) {
          throw ERR_PLAYER_ALREADY_GREETED;
        }
        this.player = this.gm.createPlayer(req.params.name, this.sendEvent.bind(this));
        return {
          op: req.op,
          result: { id: this.player.id },
        };
      }
      case CommandOps.LIST_GAMES: {
        const games = this.gm.getGameList();
        return {
          op: req.op,
          result: { games },
        };
      }
      case CommandOps.CREATE_GAME: {
        this.ensureGreeted();
        const { game, player } = this.gm.createGameAndJoin(req.params.name, this.player);
        this.game = game;
        this.player = player;
        return {
          op: req.op,
          result: { game: this.game.details, player: this.player },
        };
      }
      case CommandOps.JOIN_GAME: {
        this.ensureGreeted();
        const { id } = req.params;
        this.player = this.gm.addPlayerToGame(id, this.player.id);
        return {
          op: req.op,
          result: { player: this.player },
        };
      }
      case CommandOps.MOVE: {
        this.ensureGreeted();
        this.ensureJoinedGame();
        this.game.movePlayer(this.player.id, req.params.position);
        return {
          op: req.op,
          result: {},
        };
      }
      case CommandOps.START_GAME: {
        this.ensureGreeted();
        this.ensureJoinedGame();
        this.game.start();
        return {
          op: req.op,
          result: {},
        };
      }
      case CommandOps.ABORT_GAME: {
        this.ensureGreeted();
        this.ensureJoinedGame();
        this.game.abort();
        return {
          op: req.op,
          result: {},
        };
      }
      case CommandOps.DECLARE_WIN: {
        this.ensureGreeted();
        this.ensureJoinedGame();
        this.game.finish(this.player.id);
        return {
          op: req.op,
          result: {},
        };
      }
    }
  }

  leave() {
    if (this.hasJoinedGame) {
      this.gm.removePlayerFromGame(this.game.id, this.player.id);
      this.game = null;
    }
    if (this.hasGreeted) {
      this.gm.removePlayer(this.player.id);
      this.player = null;
    }
  }

  sendEvent<T extends EventOp>(evt: Event<T>) {}

  respondWith(res: (CommandResponse | ErrorResponseBody) & Respondable) {
    const dataStr = JSON.stringify(res);
    this.ws.send(dataStr);
  }
}
