import { GameDetails, GameIdType, PlayerIdType, PlayerInGameI, Coordinate } from "./types";

export enum CommandOp {
  HELLO = "HELLO",
  LIST_GAMES = "LIST_GAMES",
  CREATE_GAME = "CREATE_GAME",
  JOIN_GAME = "JOIN_GAME",

  LIST_PLAYERS = "LIST_PLAYERS",
  MOVE = "MOVE",
  START_GAME = "START_GAME",
  ABORT_GAME = "ABORT_GAME",
  DECLARE_WIN = "DECLARE_WIN",
}

export interface CommandOpParamsMap {
  [CommandOp.HELLO]: { name: string };
  [CommandOp.LIST_GAMES]: {};
  [CommandOp.CREATE_GAME]: { name: string };
  [CommandOp.JOIN_GAME]: { id: GameIdType };

  [CommandOp.LIST_PLAYERS]: {};
  [CommandOp.MOVE]: { position: Coordinate };
  [CommandOp.START_GAME]: {};
  [CommandOp.ABORT_GAME]: {};
  [CommandOp.DECLARE_WIN]: {};
}

export interface CommandOpResultMap {
  [CommandOp.HELLO]: { id: number };
  [CommandOp.LIST_GAMES]: { games: GameDetails[] };
  [CommandOp.CREATE_GAME]: { game: GameDetails; player: PlayerInGameI };
  [CommandOp.JOIN_GAME]: { game: GameDetails; player: PlayerInGameI };

  [CommandOp.LIST_PLAYERS]: { players: PlayerInGameI[] };
  [CommandOp.MOVE]: {};
  [CommandOp.START_GAME]: {};
  [CommandOp.ABORT_GAME]: {};
  [CommandOp.DECLARE_WIN]: {};
}

export interface Respondable {
  /** Matches response with request it replies to. */
  id: string;
}

export interface RequestBody<Op extends CommandOp, Data = CommandOpParamsMap[Op]> {
  op: Op;
  params: Data;
}

export interface Request<Op extends CommandOp> extends RequestBody<Op>, Respondable {}

export interface SuccessResponseBody<
  Op extends CommandOp,
  Data extends CommandOpResultMap[Op] = CommandOpResultMap[Op]
> {
  op: Op;
  result: Data;
}

export interface ErrorResponseBody {
  error: string;
}

export interface SuccessResponse<Op extends CommandOp> extends SuccessResponseBody<Op>, Respondable {}

export interface ErrorResponse extends ErrorResponseBody, Respondable {}
