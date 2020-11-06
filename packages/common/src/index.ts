export type PlayerInfo = {
  id: number;
  name: string;
  color: string;
  position?: {
    x: number;
    y: number;
  };
};

export enum GameEventOp {
  DEMO = "DEMO",

  GAME_START = "GAME_START",
  GAME_END = "GAME_END",
  SERVER_SHUTDOWN = "SERVER_SHUTDOWN",

  PLAYER_JOIN = "PLAYER_JOIN",
  PLAYER_LEAVE = "PLAYER_LEAVE",
  PLAYER_MOVE = "PLAYER_MOVE",
  PLAYER_TASK_START = "PLAYER_TASK_START",
  PLAYER_TASK_FINISH = "PLAYER_TASK_FINISH",
  PLAYER_TASK_FAIL = "PLAYER_TASK_FAIL",

  CURRENT_STATE = "CURRENT_STATE",
}

export type GameEventOpPayloadMap = {
  [GameEventOp.DEMO]: { msg: string };
  [GameEventOp.GAME_START]: {};
  [GameEventOp.GAME_END]: {};
  [GameEventOp.SERVER_SHUTDOWN]: {};
  [GameEventOp.PLAYER_JOIN]: PlayerInfo;
  [GameEventOp.PLAYER_LEAVE]: PlayerInfo;
  [GameEventOp.PLAYER_MOVE]: { playerId: number; x: number; y: number };
  [GameEventOp.PLAYER_TASK_START]: {};
  [GameEventOp.PLAYER_TASK_FINISH]: {};
  [GameEventOp.PLAYER_TASK_FAIL]: {};
  [GameEventOp.CURRENT_STATE]: {
    players: Array<PlayerInfo>;
    yourPlayerId: number;
  };
};

export type GameEvent<T extends GameEventOp = GameEventOp> = {
  op: T;
  payload: GameEventOpPayloadMap[T];
};
