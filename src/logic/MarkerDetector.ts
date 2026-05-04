import {
  OpenCV,
  ObjectType,
  ColorConversionCodes,
  AdaptiveThresholdTypes,
  ThresholdTypes,
  RetrievalModes,
  ContourApproximationModes,
  DataTypes,
} from 'react-native-fast-opencv';
import type { Mat, PointVector } from 'react-native-fast-opencv';

/**
 * Detects and extracts a custom marker from an image Mat.
 * Returns a 300x300 rectified Mat if a valid marker is found, otherwise null.
 */
export const processFrame = (mat: Mat): Mat | null => {
  'worklet';
  
  const gray = OpenCV.createObject(ObjectType.Mat);
  OpenCV.invoke('cvtColor', mat, gray, ColorConversionCodes.COLOR_RGBA2GRAY);

  const blurred = OpenCV.createObject(ObjectType.Mat);
  OpenCV.invoke('GaussianBlur', gray, blurred, OpenCV.createObject(ObjectType.Size, 5, 5), 0);

  const thresh = OpenCV.createObject(ObjectType.Mat);
  OpenCV.invoke(
    'adaptiveThreshold',
    blurred,
    thresh,
    255,
    AdaptiveThresholdTypes.ADAPTIVE_THRESH_GAUSSIAN_C,
    ThresholdTypes.THRESH_BINARY_INV,
    11,
    2
  );

  const contours = OpenCV.createObject(ObjectType.MatVector);
  OpenCV.invoke('findContours', thresh, contours, RetrievalModes.RETR_EXTERNAL, ContourApproximationModes.CHAIN_APPROX_SIMPLE);

  const contoursJS = OpenCV.toJSValue(contours);
  let bestMarker: Mat | null = null;

  for (let i = 0; i < contoursJS.array.length; i++) {
    const contour = OpenCV.copyObjectFromVector(contours, i);
    const area = OpenCV.invoke('contourArea', contour) as number;
    
    if (area < 10000) continue;

    const peri = OpenCV.invoke('arcLength', contour, true) as number;
    const approx = OpenCV.createObject(ObjectType.PointVector);
    OpenCV.invoke('approxPolyDP', contour, approx, 0.02 * peri, true);

    const approxJS = OpenCV.toJSValue(approx);
    if (approxJS.array.length === 4) {
      const rectified = rectify(mat, approx);
      if (rectified) {
        const oriented = validateAndRotate(rectified);
        if (oriented) {
          bestMarker = oriented;
          break;
        }
      }
    }
  }

  OpenCV.clearBuffers([mat.id]); 
  return bestMarker;
};

const rectify = (src: Mat, approx: PointVector): Mat | null => {
  'worklet';
  const points = OpenCV.toJSValue(approx).array;

  points.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const tl = points[0];
  const br = points[3];
  
  const remaining = [points[1], points[2]];
  remaining.sort((a, b) => (a.x - a.y) - (b.x - b.y));
  const tr = remaining[1];
  const bl = remaining[0];

  const srcPoints = [tl, tr, br, bl];
  const dstPoints = [{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 300 }, { x: 0, y: 300 }];

  const srcPointVector = OpenCV.createObject(ObjectType.Point2fVector, srcPoints.map(p => OpenCV.createObject(ObjectType.Point2f, p.x, p.y)));
  const dstPointVector = OpenCV.createObject(ObjectType.Point2fVector, dstPoints.map(p => OpenCV.createObject(ObjectType.Point2f, p.x, p.y)));

  const matrix = OpenCV.invoke('getPerspectiveTransform', srcPointVector, dstPointVector) as Mat;
  const dest = OpenCV.createObject(ObjectType.Mat, 300, 300, DataTypes.CV_8UC4);
  OpenCV.invoke('warpPerspective', src, dest, matrix, OpenCV.createObject(ObjectType.Size, 300, 300));

  return dest;
};

const validateAndRotate = (mat: Mat): Mat | null => {
  'worklet';
  
  // Corners to check for Red X: Top-Left, Top-Right, Bottom-Right, Bottom-Left
  const corners = [
    { x: 50, y: 50 },    // TL
    { x: 250, y: 50 },   // TR
    { x: 250, y: 250 },  // BR
    { x: 50, y: 250 }    // BL
  ];

  let redCornerIndex = -1;
  
  for (let i = 0; i < 4; i++) {
    const color = OpenCV.invoke('at', mat, corners[i].y, corners[i].x) as { r: number; g: number; b: number; a: number };
    // Check for "reddish" color
    if (color.r > color.g + 40 && color.r > color.b + 40) {
      redCornerIndex = i;
      break;
    }
  }

  if (redCornerIndex === -1) return null; // No red X found, maybe not our marker

  // Target: red X at Bottom-Right (index 2)
  const rotationsNeeded = (2 - redCornerIndex + 4) % 4;
  
  let result = mat;
  for (let r = 0; r < rotationsNeeded; r++) {
    const rotated = OpenCV.createObject(ObjectType.Mat);
    OpenCV.invoke('rotate', result, rotated, 0); // 0 = 90 degrees clockwise
    result = rotated;
  }

  return result;
};
