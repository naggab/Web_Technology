import { GameDetails, GameIdType, PlayerIdType, PlayerInGameI, Coordinate } from "./types";
import { PlayerInGame } from "@apirush/server/src/types";

export enum ServerEventOp {
  GAME_ADDED = "GAME_ADDED",
  GAME_STATE_UPDATED = "GAME_STATE_UPDATE",
  GAME_REMOVED = "GAME_REMOVED",
  SERVER_SHUTDOWN = "SERVER_SHUTDOWN",
}

export enum GameEventOp {
  GAME_STARTED = "GAME_STARTED",
  GAME_ABORTED = "GAME_ABORTED",
  GAME_FINISHED = "GAME_FINISHED",

  PLAYER_JOINED = "PLAYER_JOINED",
  PLAYER_LEFT = "PLAYER_LEFT",
  PLAYER_MOVED = "PLAYER_MOVED",
}

export type EventOp = ServerEventOp | GameEventOp;

export type ServerEventOpPayloadMap = {
  [ServerEventOp.GAME_ADDED]: GameDetails;
  [ServerEventOp.GAME_STATE_UPDATED]: GameDetails;
  [ServerEventOp.GAME_REMOVED]: { id: GameIdType };
  [ServerEventOp.SERVER_SHUTDOWN]: {};
};

export type GameEventOpPayloadMap = {
  [GameEventOp.GAME_STARTED]: {};
  [GameEventOp.GAME_ABORTED]: {};
  [GameEventOp.GAME_FINISHED]: { winner: PlayerInGameI };

  [GameEventOp.PLAYER_JOINED]: PlayerInGameI;
  [GameEventOp.PLAYER_LEFT]: { id: PlayerIdType };
  [GameEventOp.PLAYER_MOVED]: { id: PlayerIdType; position: Coordinate };
};

export type EventOpPayloadMap = ServerEventOpPayloadMap & GameEventOpPayloadMap;

export type Event<T extends EventOp = EventOp> = {
  op: T;
  payload: EventOpPayloadMap[T];
};
