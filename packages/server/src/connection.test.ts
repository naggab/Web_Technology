import { GameMaster } from "./gameMaster";
import { PlayerInLobby } from "./types";
import { Game } from "./game";
import { Connection, WebSocketI } from "./connection";
import { CommandOp } from "@apirush/common/src";
import WebSocket from "ws";
import { ERR_PLAYER_ALREADY_GREETED } from "./constants";

jest.mock("./gameMaster");
jest.mock("./game");
jest.mock("ws");

const DummyLobbyPlayer: PlayerInLobby = {
  id: 1,
  name: "DummyPlayer 1",
  notify: jest.fn(),
};

const mockCreatePlayer = jest.fn();
GameMaster.prototype.createPlayer = mockCreatePlayer;

const mockGameList = jest.fn();
GameMaster.prototype.getGameList = mockGameList;

const gm = new GameMaster();

const Game1: Game = new Game("1", "Game1", gm);
const Game2: Game = new Game("2", "Game2", gm);
mockGameList.mockReturnValue([Game1, Game2]);
mockCreatePlayer.mockReturnValue(DummyLobbyPlayer);

const wsMock = new WebSocket("");

describe("Connection", () => {
  const conn = new Connection(wsMock, gm);

  it("can handle Request", () => {
    const respondWithMock = jest.fn();
    conn.respondWith = respondWithMock;

    conn.onMessage(
      JSON.stringify({
        id: "1",
        op: CommandOp.HELLO,
        params: { name: DummyLobbyPlayer.name },
      }),
    );

    expect(respondWithMock).toHaveBeenCalledWith({
      id: "1",
      op: CommandOp.HELLO,
      result: { id: DummyLobbyPlayer.id },
    });
  });

  it("can handle HELLO twice", () => {
    expect(() => {
      const response = conn.executeRPC(CommandOp.HELLO, { name: DummyLobbyPlayer.name });
    }).toThrow(ERR_PLAYER_ALREADY_GREETED());
  });

  it("can handle LIST_GAMES", () => {
    const response = conn.executeRPC(CommandOp.LIST_GAMES, {});

    expect(response).toBeDefined();
    expect(response.games).toEqual([Game1, Game2]);
  });
});
