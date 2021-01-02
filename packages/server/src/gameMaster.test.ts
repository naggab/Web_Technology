import { seekUnusedNumericId } from "./utils";
import { GameMaster } from "./gameMaster";
import { PlayerInLobby } from "./types";
import { Event, EventOp, ServerEventOp, GameEventOp } from "@apirush/common";
import { PLAYER_COLORS } from "./constants";

function createMockNotifyFn(op: EventOp) {
  return jest.fn((evt: Event) => {
    expect(evt).toBeTruthy();
    expect(evt.op).toEqual(op);
  });
}

describe("GameMaster", () => {
  it("can create players", () => {
    const gm = new GameMaster();
    const notifyPlayer1 = jest.fn();
    const notifyPlayer2 = jest.fn();

    let player1 = gm.createPlayer("Player 1", notifyPlayer1);
    let player2 = gm.createPlayer("Player 2", notifyPlayer2);

    expect(player1).toBeDefined();
    expect(player2).toBeDefined();
    expect(player1.name).toBe("Player 1");
    expect(player2.name).toBe("Player 2");
    expect(player1.id).not.toEqual(player2.id);
    expect(notifyPlayer1).not.toHaveBeenCalled();
    expect(notifyPlayer2).not.toHaveBeenCalled();
  });

  it("can create games", () => {
    const gm = new GameMaster();
    const notifyPlayer1 = jest.fn();
    const notifyPlayer2 = jest.fn();

    let player1 = gm.createPlayer("Player 1", notifyPlayer1);
    let player2 = gm.createPlayer("Player 2", notifyPlayer2);

    const { game: game1, player: player2InGame } = gm.createGameAndJoin("Demo 1", player2);

    expect(player2InGame).toMatchObject(player2);
    expect(player2InGame.color).toEqual(PLAYER_COLORS[0]);

    expect(player1).toBeDefined();
    expect(player2).toBeDefined();
    expect(player1.id).not.toEqual(player2.id);
    expect(notifyPlayer1).toHaveBeenNthCalledWith(1, {
      op: ServerEventOp.GAME_ADDED,
      payload: { ...game1.details, playersCount: 0 },
    });
    expect(notifyPlayer1).toHaveBeenNthCalledWith(2, {
      op: ServerEventOp.GAME_STATE_UPDATED,
      payload: game1.details,
    });
    expect(notifyPlayer2).not.toHaveBeenCalled();
  });

  it("notifies of joins / leaves", () => {
    const gm = new GameMaster();
    const notifyPlayer1 = jest.fn();
    const notifyPlayer2 = jest.fn();

    let player1 = gm.createPlayer("Player 1", notifyPlayer1);
    let player2 = gm.createPlayer("Player 2", notifyPlayer2);

    const { game: game1, player: player1InGame } = gm.createGameAndJoin("Demo 1", player1);
    notifyPlayer1.mockClear();
    notifyPlayer2.mockClear();
    const player2InGame = gm.addPlayerToGame(game1.id, player2.id);

    expect(player1InGame).toMatchObject(player1);
    expect(player2InGame).toMatchObject(player2);

    expect(player1InGame.color).toEqual(PLAYER_COLORS[0]);
    expect(player2InGame.color).toEqual(PLAYER_COLORS[1]);

    expect(notifyPlayer1).toHaveBeenCalledTimes(1);
    expect(notifyPlayer1).toHaveBeenLastCalledWith({
      op: GameEventOp.PLAYER_JOINED,
      payload: player2InGame,
    });
    expect(notifyPlayer2).not.toHaveBeenCalled();
  });

  it("notifies of start, move", () => {
    const gm = new GameMaster();
    const notifyPlayer1 = jest.fn();
    const notifyPlayer2 = jest.fn();

    let player1 = gm.createPlayer("Player 1", notifyPlayer1);
    let player2 = gm.createPlayer("Player 2", notifyPlayer2);

    const { game: game1, player: player1InGame } = gm.createGameAndJoin("Demo 1", player1);
    const player2InGame = gm.addPlayerToGame(game1.id, player2.id);

    notifyPlayer1.mockClear();
    notifyPlayer2.mockClear();

    game1.start();

    expect(notifyPlayer1).toHaveBeenCalledTimes(1);
    expect(notifyPlayer2).toHaveBeenCalledTimes(1);
    expect(notifyPlayer1).toHaveBeenLastCalledWith({
      op: GameEventOp.GAME_STARTED,
      payload: {},
    });
    expect(notifyPlayer2).toHaveBeenLastCalledWith({
      op: GameEventOp.GAME_STARTED,
      payload: {},
    });

    notifyPlayer1.mockClear();
    notifyPlayer2.mockClear();

    game1.movePlayer(player1.id, { x: 1, y: 1 });

    expect(notifyPlayer1).not.toHaveBeenCalled();
    expect(notifyPlayer2).toHaveBeenCalledTimes(1);
    expect(notifyPlayer2).toHaveBeenLastCalledWith({
      op: GameEventOp.PLAYER_MOVED,
      payload: { id: player1.id, position: { x: 1, y: 1 } },
    });

    notifyPlayer1.mockClear();
    notifyPlayer2.mockClear();
  });

  it("notifies of leave", () => {
    const gm = new GameMaster();
    const notifyPlayer1 = jest.fn();
    const notifyPlayer2 = jest.fn();

    let player1 = gm.createPlayer("Player 1", notifyPlayer1);
    let player2 = gm.createPlayer("Player 2", notifyPlayer2);

    const { game: game1, player: player1InGame } = gm.createGameAndJoin("Demo 1", player1);
    const player2InGame = gm.addPlayerToGame(game1.id, player2.id);

    game1.start();

    notifyPlayer1.mockClear();
    notifyPlayer2.mockClear();

    gm.removePlayerFromGame(game1.id, player1InGame.id);

    expect(notifyPlayer1).not.toHaveBeenCalled();
    expect(notifyPlayer2).toHaveBeenCalledTimes(1);
    expect(notifyPlayer2).toHaveBeenLastCalledWith({
      op: GameEventOp.PLAYER_LEFT,
      payload: { id: player1InGame.id },
    });

    notifyPlayer1.mockClear();
    notifyPlayer2.mockClear();
  });
});
