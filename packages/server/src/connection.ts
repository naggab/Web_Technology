import WebSocket from "ws";
import { GameMasterI } from "./gameMasterI";
import { PlayerInGame, PlayerInLobby } from "./types";
import { GameI } from "./gameI";
import { ERR_PLAYER_ALREADY_GREETED, ERR_PLAYER_DID_NOT_GREET, ERR_PLAYER_DID_NOT_JOIN_GAME } from "./constants";
import {
  Request,
  CommandOp,
  ErrorResponseBody,
  EventOp,
  Respondable,
  Event,
  CommandOpParamsMap,
} from "@apirush/common";
import { CommandOpResultMap } from "@apirush/common";
import { SuccessResponse } from "@apirush/common/src";

export interface WebSocketI {
  send(data: any, cb?: (err?: Error) => void): void;
  close();
}

export class Connection {
  readonly ws: WebSocketI;
  readonly gm: GameMasterI;
  ok: boolean;

  player: PlayerInLobby | PlayerInGame | null;
  game: GameI | null;

  constructor(ws: WebSocketI, gm: GameMasterI) {
    this.ws = ws;
    this.gm = gm;
    this.ok = true;
    this.player = null;
    this.game = null;
  }

  onMessage<T extends CommandOp>(msg: WebSocket.Data) {
    console.log(`broker: onMessage`);
    let req: Request<any>;
    try {
      req = JSON.parse(msg.toString());
    } catch (e) {
      console.error("unable to parse message, will be ignored");
      return;
    }
    let responseBody: CommandOpResultMap[T];
    try {
      responseBody = this.executeRPC<T>(req.op, req.params);
    } catch (e) {
      this.respondWith({
        id: req.id,
        error: e.toString(),
      });
      return;
    }
    this.respondWith({
      id: req.id,
      op: req.op,
      result: responseBody,
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
      throw ERR_PLAYER_DID_NOT_JOIN_GAME;
    }
  }

  executeRPC<Op extends CommandOp>(op: Op, untypedParams: CommandOpParamsMap[Op]): CommandOpResultMap[Op];
  executeRPC<Op extends CommandOp>(op: Op, untypedParams: any): any {
    switch (op) {
      case CommandOp.HELLO: {
        const params = untypedParams as CommandOpParamsMap[CommandOp.HELLO];
        if (this.hasGreeted) {
          throw ERR_PLAYER_ALREADY_GREETED;
        }
        this.player = this.gm.createPlayer(params.name, this.sendEvent.bind(this));
        return {
          id: this.player.id,
        };
      }
      case CommandOp.LIST_GAMES: {
        const games = this.gm.getGameList();
        return {
          games,
        };
      }
      case CommandOp.CREATE_GAME: {
        this.ensureGreeted();
        const params = untypedParams as CommandOpParamsMap[CommandOp.CREATE_GAME];

        const { game, player } = this.gm.createGameAndJoin(params.name, this.player);
        this.game = game;
        this.player = player;
        return {
          game: this.game.details,
          player: this.player,
        };
      }
      case CommandOp.JOIN_GAME: {
        this.ensureGreeted();
        const params = untypedParams as CommandOpParamsMap[CommandOp.JOIN_GAME];
        const { id } = params;
        this.player = this.gm.addPlayerToGame(id, this.player.id);
        return {
          player: this.player,
        };
      }
      case CommandOp.MOVE: {
        this.ensureGreeted();
        this.ensureJoinedGame();
        const params = untypedParams as CommandOpParamsMap[CommandOp.MOVE];

        this.game.movePlayer(this.player.id, params.position);
        return {};
      }
      case CommandOp.START_GAME: {
        this.ensureGreeted();
        this.ensureJoinedGame();
        this.game.start();
        return {};
      }
      case CommandOp.ABORT_GAME: {
        this.ensureGreeted();
        this.ensureJoinedGame();
        this.game.abort();
        return {};
      }
      case CommandOp.DECLARE_WIN: {
        this.ensureGreeted();
        this.ensureJoinedGame();
        this.game.finish(this.player.id);
        return {};
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

  respondWith(res: (SuccessResponse<any> | ErrorResponseBody) & Respondable) {
    const dataStr = JSON.stringify(res);
    this.ws.send(dataStr);
  }
}
