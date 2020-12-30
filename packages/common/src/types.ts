export type PlayerIdType = number;

export type Position = {
  x: number;
  y: number;
};

export type PlayerInGameI = {
  id: PlayerIdType;
  name: string;
  color: string;
  position: Position;
};

export type PlayerInLobbyI = Omit<PlayerInGameI, "color" | "position">;

export type GameIdType = string;

export type GameState = "pre-game" | "in-game" | "post-game";

export type GameDetails = {
  id: GameIdType;
  name: string;
  state: GameState;
  playersCount: number;
  maxPlayersCount: number;
  seed: number;
};
