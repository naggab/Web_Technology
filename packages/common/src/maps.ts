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

var m2w = 40;
var m2h = 40;
const map2: MapI = {
  id: "map2",
  width: m2w,
  height: m2h,
  walls: [
    [cord(m2w / 2 - 10, m2h / 2 - 10), cord(m2w / 2 - 5, m2h / 2 - 10)],
    [cord(m2w / 2 + 5, m2h / 2 - 10), cord(m2w / 2 + 10, m2h / 2 - 10)],
    [cord(m2w / 2 - 10, m2h / 2 - 10), cord(m2w / 2 - 10, m2h / 2 - 5)],
    [cord(m2w / 2 - 10, m2h / 2 + 5), cord(m2w / 2 - 10, m2h / 2 + 10)],
    [cord(m2w / 2 - 10, m2h / 2 + 10), cord(m2w / 2 - 5, m2h / 2 + 10)],
    [cord(m2w / 2 + 5, m2h / 2 + 10), cord(m2w / 2 + 10, m2h / 2 + 10)],
    [cord(m2w / 2 + 10, m2h / 2 - 10), cord(m2w / 2 + 10, m2h / 2 - 5)],
    [cord(m2w / 2 + 10, m2h / 2 + 5), cord(m2w / 2 + 10, m2h / 2 + 10)],
    [cord(15, 9), cord(15, 6)],
    [cord(15, 2), cord(15, 1)],
    [cord(25, 9), cord(25, 6)],
    [cord(25, 2), cord(25, 1)],
    [cord(16, 6), cord(18, 6)],
    [cord(22, 6), cord(24, 6)],
    [cord(22, 2), cord(24, 2)],
    [cord(16, 2), cord(18, 2)],
    [cord(15, 31), cord(15, 34), cord(18, 34)],
    [cord(22, 34), cord(25, 34), cord(25, 31)],
    [cord(15, 38), cord(15, 37), cord(18, 37)],
    [cord(22, 37), cord(25, 37), cord(25, 38)],
    [cord(18, 35), cord(18, 36)],
    [cord(22, 35), cord(22, 36)],
    [cord(31, 15), cord(38, 15)],
    [cord(31, 25), cord(35, 25)],
    [cord(9, 15), cord(1, 15)],
    [cord(9, 25), cord(4, 25)],
  ],
  spawns: [
    cord(m2w / 2, m2h / 2 - 3),
    cord(m2w / 2, m2h / 2 + 3),
    cord(m2w / 2 + 7, m2h / 2 + 7),
    cord(m2w / 2 - 7, m2h / 2 - 7),
    cord(m2w / 2 + 7, m2h / 2 - 7),
    cord(m2w / 2 - 7, m2h / 2 + 7),
  ],
  taskPositions: {
    "1": cord(m2w / 2, 2),
    "2": cord(m2w / 2, m2h - 3),
    "3": cord(2, m2h / 2),
    "4": cord(m2w - 3, m2h / 2),
    "5": cord(2, 2),
    "6": cord(m2w - 3, 2),
    "7": cord(m2w - 3, m2h - 3),
    "8": cord(2, m2h - 3),
  },
};

m2w = 70;
m2h = 60;
const map3: MapI = {
  id: "map3",
  width: m2w,
  height: m2h,
  walls: [
    [cord(m2w / 2 - 10, m2h / 2 - 10), cord(m2w / 2 - 5, m2h / 2 - 10)],
    [cord(m2w / 2 + 5, m2h / 2 - 10), cord(m2w / 2 + 10, m2h / 2 - 10)],
    [cord(m2w / 2 - 10, m2h / 2 - 10), cord(m2w / 2 - 10, m2h / 2 - 5)],
    [cord(m2w / 2 - 10, m2h / 2 + 5), cord(m2w / 2 - 10, m2h / 2 + 10)],
    [cord(m2w / 2 - 10, m2h / 2 + 10), cord(m2w / 2 - 5, m2h / 2 + 10)],
    [cord(m2w / 2 + 5, m2h / 2 + 10), cord(m2w / 2 + 10, m2h / 2 + 10)],
    [cord(m2w / 2 + 10, m2h / 2 - 10), cord(m2w / 2 + 10, m2h / 2 - 5)],
    [cord(m2w / 2 + 10, m2h / 2 + 5), cord(m2w / 2 + 10, m2h / 2 + 10)],
  ],
  spawns: [
    cord(m2w / 2, m2h / 2 - 3),
    cord(m2w / 2, m2h / 2 + 3),
    cord(m2w / 2 + 7, m2h / 2 + 7),
    cord(m2w / 2 - 7, m2h / 2 - 7),
    cord(m2w / 2 + 7, m2h / 2 - 7),
    cord(m2w / 2 - 7, m2h / 2 + 7),
  ],
  taskPositions: {
    "1": cord(m2w / 2, 2),
    "2": cord(m2w / 2, m2h - 3),
    "3": cord(2, m2h / 2),
    "4": cord(m2w - 3, m2h / 2),
    "5": cord(2, 2),
    "6": cord(m2w - 3, 2),
    "7": cord(m2w - 3, m2h - 3),
    "8": cord(2, m2h - 3),
  },
};

export const MapStorage = {
  map1,
  map2,
  map3,
};
