export const Gesture = {
  ThumbsUp: "thumbsUp",
  IndexUp: "indexUp",
  Victory: "victory",
  Horns: "horns",
  RaisedHand: "raisedHand",
  RaisedFist: "raisedFist",
};

export type Gesture = typeof Gesture[keyof typeof Gesture];
