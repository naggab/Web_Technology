export const CLEANUP_SCHEDULE = 5000; // 5 seconds

export const ERR_GAME_NOT_EXISTENT = () => new Error(`Game does not exist`);
export const ERR_PLAYER_NOT_EXISTENT = () => new Error(`Player does not exist`);
export const ERR_PLAYER_ALREADY_EXISTS = () => new Error(`Player already exists`);
export const ERR_PLAYER_ALREADY_GREETED = () => new Error(`Player already sent HELLO`);
export const ERR_PLAYER_DID_NOT_GREET = () => new Error(`Player did not send HELLO`);
export const ERR_PLAYER_DID_NOT_JOIN_GAME = () => new Error(`Player did not join game yet`);

export const PLAYER_COLORS = [
  "#efefef",
  "#de1010",
  "#3ffc00",
  "#805c00",
  "#001eff",
  "#e500ff",
  "#ffe500",
  "#1a1a1a",
  "#00ffe2",
  "#ff8800",
];
