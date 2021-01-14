import { Coordinate } from "./types";

export interface MapI {
  id: string;
  width: number;
  height: number;

  walls: Coordinate[][];
  spawns: Coordinate[];

  taskPositions: { [id: string]: Coordinate };
}

/*
for Playground:
setOnTaskOpenCb(cb: (id: string) => void) {}
setTaskComplete(id: string) {}
*/

const cord = (x: number, y: number) => ({ x, y });

const map1: MapI = {
  id: "map1",
  width: 50,
  height: 30,
  walls: [
    [cord(5, 17), cord(10, 17), cord(10, 22), cord(30, 22)],
    [cord(33, 4), cord(33, 14), cord(40, 14), cord(40, 22)],
    [cord(19, 8), cord(32, 8)],
    [cord(10, 1), cord(10, 8), cord(8, 8)],
    [cord(1, 8), cord(4, 8)],
    [cord(30, 22), cord(30, 28)],
  ],
  spawns: [cord(6, 6), cord(43, 5), cord(43, 26), cord(6, 26), cord(25, 15), cord(18, 4)],
  taskPositions: {
    "1": cord(1, 2),
    "2": cord(46, 2),
    "3": cord(47, 25),
    "4": cord(11, 24),
    "5": cord(31, 10),
    "6": cord(31, 6),
  },
};

export const MapStorage = {
  map1,
};
