import { Circle, intersectsWithCircle, Point } from "../src/tasks/fill-shape-task/helper";

describe("fill-shape-task helper tests", () => {
  it("can detect a point inside a circle", () => {
    const mousePos: Point = {
      x: 2,
      y: 2,
    };
    const circle: Circle = {
      x: 0,
      y: 0,
      radius: 5,
    };
    const result = intersectsWithCircle(mousePos, circle);
    expect(result).toBeTruthy();
  });
  it("can detect a point outside a circle", () => {
    const mousePos: Point = {
      x: 5,
      y: 5,
    };
    const circle: Circle = {
      x: 0,
      y: 0,
      radius: 5,
    };
    const result = intersectsWithCircle(mousePos, circle);
    expect(result).toBeFalsy();
  });
});
