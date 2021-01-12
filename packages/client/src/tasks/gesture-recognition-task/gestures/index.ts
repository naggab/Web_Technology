import { GestureDescription } from "fingerpose";
import thumbsUpDescription from "./thumbsUp";
import indexUpDescription from "./indexUp";
import victoryDescription from "./victory";
import hornsDescription from "./horns";
import raisedHandDescription from "./raisedHand";
import raisedFistDescription from "./raisedFist";
import { Gesture } from "./constants";
export * from "./constants";

export interface GestureDetails {
  emoji: string;
  description: typeof GestureDescription;
}

const Gestures: { [key in Gesture]: GestureDetails } = {
  [Gesture.ThumbsUp]: {
    description: thumbsUpDescription,
    emoji: "👍",
  },
  [Gesture.IndexUp]: {
    description: indexUpDescription,
    emoji: "☝",
  },
  [Gesture.Victory]: {
    description: victoryDescription,
    emoji: "✌🏻",
  },
  [Gesture.Horns]: {
    description: hornsDescription,
    emoji: "🤘",
  },
  [Gesture.RaisedHand]: {
    description: raisedHandDescription,
    emoji: "✋",
  },
  [Gesture.RaisedFist]: {
    description: raisedFistDescription,
    emoji: "✊",
  },
};

export default Gestures;
