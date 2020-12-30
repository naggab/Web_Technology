import { GameDetails, GameIdType, PlayerIdType, PlayerInGameI, Position } from "./types";

export enum CommandOps {
  HELLO = "HELLO",
  LIST_GAMES = "LIST_GAMES",
  CREATE_GAME = "CREATE_GAME",
  JOIN_GAME = "JOIN_GAME",
  MOVE = "MOVE",
  START_GAME = "START_GAME",
  ABORT_GAME = "ABORT_GAME",
  DECLARE_WIN = "DECLARE_WIN",
}

export type CommandOp = typeof CommandOps[keyof typeof CommandOps];

export type CommandRequest =
  | Request<CommandOps.HELLO, { name: string }>
  | Request<CommandOps.LIST_GAMES>
  | Request<CommandOps.CREATE_GAME, { name: string }>
  | Request<CommandOps.JOIN_GAME, { id: GameIdType }>
  | Request<CommandOps.MOVE, { position: Position }>
  | Request<CommandOps.START_GAME>
  | Request<CommandOps.ABORT_GAME>
  | Request<CommandOps.DECLARE_WIN>;

export type CommandResponse =
  | SuccessResponseBody<CommandOps.HELLO, { id: string }>
  | SuccessResponseBody<CommandOps.LIST_GAMES, { games: GameDetails[] }>
  | SuccessResponseBody<CommandOps.CREATE_GAME, { game: GameDetails; player: PlayerInGameI }>
  | SuccessResponseBody<CommandOps.JOIN_GAME, { player: PlayerInGameI }>
  | SuccessResponseBody<CommandOps.MOVE>
  | SuccessResponseBody<CommandOps.START_GAME>
  | SuccessResponseBody<CommandOps.ABORT_GAME>
  | SuccessResponseBody<CommandOps.DECLARE_WIN>;

export interface Respondable {
  /** Matches response with request it replies to. */
  id: string;
}

export interface RequestBody<Op extends CommandOps, Data extends {} = {}> {
  op: Op;
  params: Data;
}

export interface Request<Op extends CommandOps, Data extends {} = {}> extends RequestBody<Op, Data>, Respondable {}

export interface SuccessResponseBody<Op extends CommandOps, Data extends {} = {}> {
  op: Op;
  result: Data;
}

export interface ErrorResponseBody {
  error: string;
}

export interface SuccessResponse<Op extends CommandOps, Data extends {} = {}>
  extends SuccessResponseBody<Op, Data>,
    Respondable {}

export interface ErrorResponse extends ErrorResponseBody, Respondable {}
