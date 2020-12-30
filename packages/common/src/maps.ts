import { Coordinate } from "@apirush/common";

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
  walls: [[cord(5, 17), cord(10, 17), cord(10, 22), cord(30, 22)]],
  spawns: [cord(6, 6), cord(43, 5), cord(43, 26), cord(6, 26), cord(25, 15)],
  taskPositions: {
    "1": cord(1, 2),
    "2": cord(46, 2),
    "3": cord(47, 25),
    "4": cord(11, 24),
  },
};

export const MapStorage = {
  map1,
};
