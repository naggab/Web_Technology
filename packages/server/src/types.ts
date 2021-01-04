import { GameIdType, PlayerIdType, PlayerInGameI, PlayerInLobbyI } from "@apirush/common/src/types";
import { Event, EventOp } from "@apirush/common";
import { Game } from "./game";

export type PlayersInGameMap = Map<PlayerIdType, PlayerInGame>;
export type PlayersMap = Map<PlayerIdType, PlayerInLobby>;
export type GamesMap = Map<GameIdType, Game>;

export type ServerEventNotifyCb = <T extends EventOp>(evt: Event<T>) => void;

export type PlayerInGame = PlayerInGameI & {
  notify: ServerEventNotifyCb;
};

export type PlayerInLobby = PlayerInLobbyI & {
  notify: ServerEventNotifyCb;
};
