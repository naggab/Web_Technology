import { Finger, FingerCurl, FingerDirection } from "fingerpose";
import { GestureDescription } from "fingerpose";

// describe gesture 🤘
const hornsDescription = new GestureDescription("horns");

// thumb:
hornsDescription.addCurl(Finger.Thumb, FingerCurl.HalfCurl, 0.5);
hornsDescription.addCurl(Finger.Thumb, FingerCurl.FullCurl, 1.0);

// index:
hornsDescription.addCurl(Finger.Index, FingerCurl.NoCurl, 1.0);
hornsDescription.addDirection(Finger.Index, FingerDirection.VerticalUp, 0.75);
hornsDescription.addDirection(Finger.Index, FingerDirection.DiagonalUpLeft, 1.0);

// middle:
hornsDescription.addCurl(Finger.Middle, FingerCurl.FullCurl, 1.0);
hornsDescription.addDirection(Finger.Middle, FingerDirection.VerticalUp, 0.2);
hornsDescription.addDirection(Finger.Middle, FingerDirection.DiagonalUpLeft, 1.0);
hornsDescription.addDirection(Finger.Middle, FingerDirection.HorizontalLeft, 0.2);

// ring:
hornsDescription.addCurl(Finger.Ring, FingerCurl.FullCurl, 1.0);
hornsDescription.addDirection(Finger.Ring, FingerDirection.VerticalUp, 0.2);
hornsDescription.addDirection(Finger.Ring, FingerDirection.DiagonalUpLeft, 1.0);
hornsDescription.addDirection(Finger.Ring, FingerDirection.HorizontalLeft, 0.2);

// pinky:
hornsDescription.addCurl(Finger.Pinky, FingerCurl.NoCurl, 1.0);
hornsDescription.addDirection(Finger.Pinky, FingerDirection.VerticalUp, 0.75);

hornsDescription.setWeight(Finger.Index, 2);
hornsDescription.setWeight(Finger.Pinky, 2);

export default hornsDescription;
