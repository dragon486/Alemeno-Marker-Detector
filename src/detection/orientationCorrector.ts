import { OpenCV, ObjectType } from 'react-native-fast-opencv';
import type { Mat } from 'react-native-fast-opencv';
import type { CornerPosition } from './markerDetector';

/**
 * Corrects the orientation of a rectified marker Mat.
 * The goal is to rotate it so the anchor square is at the top-left.
 */
export const correctOrientation = (mat: Mat, corner: CornerPosition): Mat => {
  'worklet';

  // Target: Anchor at Top-Left
  // Current position -> Rotations needed (90deg CW)
  // topLeft -> 0
  // topRight -> 3 (or -1) -> 270 deg CW
  // bottomRight -> 2 -> 180 deg CW
  // bottomLeft -> 1 -> 90 deg CW

  let rotations = 0;
  if (corner === 'topRight') rotations = 3;
  else if (corner === 'bottomRight') rotations = 2;
  else if (corner === 'bottomLeft') rotations = 1;

  let result = mat;
  for (let i = 0; i < rotations; i++) {
    const rotated = OpenCV.createObject(ObjectType.Mat);
    OpenCV.invoke('rotate', result, rotated, 0); // 0 = 90 deg CW
    result = rotated;
  }

  return result;
};
