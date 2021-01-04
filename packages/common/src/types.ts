import { MapStorage } from "./maps";

export type PlayerIdType = number;

export type Coordinate = {
  x: number;
  y: number;
};

export type PlayerInGameI = {
  id: PlayerIdType;
  name: string;
  color: string;
  position: Coordinate;
  bibNumber: number;
};

export type PlayerInLobbyI = Omit<PlayerInGameI, "color" | "position" | "bibNumber">;

export type GameIdType = string;

export type GameState = "pre-game" | "in-game" | "post-game";

export type GameDetails = {
  id: GameIdType;
  name: string;
  state: GameState;
  playersCount: number;
  maxPlayersCount: number;
  seed: number;
  map: keyof typeof MapStorage;
};
