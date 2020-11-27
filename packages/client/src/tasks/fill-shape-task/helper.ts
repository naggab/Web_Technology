export interface Point {
  x: number;
  y: number;
}

export type Circle = {
  radius: number;
} & Point;

export function intersectsWithCircle(point: Point, circle: Circle) {
  return Math.sqrt((point.x - circle.x) ** 2 + (point.y - circle.y) ** 2) < circle.radius;
}
