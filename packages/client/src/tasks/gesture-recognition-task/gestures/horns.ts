import { Finger, FingerCurl, FingerDirection } from "fingerpose";
import { GestureDescription } from "fingerpose";
import { Gesture } from "./constants";

// 🤘
const hornsDescription = new GestureDescription(Gesture.Horns);

// thumb:
hornsDescription.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.5);
hornsDescription.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);

// index:
hornsDescription.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
hornsDescription.addCurl(Finger.Index, FingerCurl.HalfCurl, 0.5);
hornsDescription.addCurl(Finger.Index, FingerCurl.FullCurl, -2.0);
hornsDescription.addDirection(Finger.Index, FingerDirection.VerticalUp, 0.75);

// middle:
hornsDescription.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
hornsDescription.addCurl(Finger.Middle, FingerCurl.NoCurl, -1.0);

// ring:
hornsDescription.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
hornsDescription.addCurl(Finger.Ring, FingerCurl.NoCurl, -1.0);

// pinky:
hornsDescription.addCurl(Finger.Pinky, FingerCurl.HalfCurl, 0.5);
hornsDescription.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
hornsDescription.addCurl(Finger.Pinky, FingerCurl.FullCurl, -2.0);
hornsDescription.addDirection(Finger.Pinky, FingerDirection.VerticalUp, 0.75);

hornsDescription.setWeight(Finger.Index, 2);
hornsDescription.setWeight(Finger.Pinky, 2);

export default hornsDescription;
