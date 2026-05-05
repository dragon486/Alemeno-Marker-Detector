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

export type CornerPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

export interface DetectionResult {
  image: string; // base64 of rectified & oriented image
  hash: string;
  bounds: { x: number; y: number; width: number; height: number };
}

/**
 * Main detection function for snapshot images.
 */
export const detectMarker = async (base64: string): Promise<DetectionResult | null> => {
  const mat = OpenCV.toMat(base64);
  const result = analyzeFrame(mat);
  
  if (result) {
    const oriented = correctOrientation(result.mat, result.orientationCorner);
    const finalBase64 = OpenCV.toBase64(oriented);
    
    // Simple hash based on corners
    const hash = `h_${Math.floor(result.confidence * 1000)}`;

    return {
      image: finalBase64,
      hash,
      bounds: result.bounds
    };
  }
  
  return null;
};

const analyzeFrame = (mat: Mat) => {
  const gray = OpenCV.createObject(ObjectType.Mat);
  OpenCV.invoke('cvtColor', mat, gray, ColorConversionCodes.COLOR_RGBA2GRAY);

  const thresh = OpenCV.createObject(ObjectType.Mat);
  OpenCV.invoke(
    'adaptiveThreshold',
    gray,
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
  let result: { bounds: any, orientationCorner: CornerPosition, confidence: number, mat: Mat } | null = null;

  for (let i = 0; i < contoursJS.array.length; i++) {
    const contour = OpenCV.copyObjectFromVector(contours, i);
    const area = OpenCV.invoke('contourArea', contour) as number;
    
    if (area < 5000) continue;

    const peri = OpenCV.invoke('arcLength', contour, true) as number;
    const approx = OpenCV.createObject(ObjectType.PointVector);
    OpenCV.invoke('approxPolyDP', contour, approx, 0.02 * peri, true);

    const approxJS = OpenCV.toJSValue(approx);
    if (approxJS.array.length === 4) {
      const points = approxJS.array;
      const width = Math.max(Math.abs(points[1].x - points[0].x), Math.abs(points[2].x - points[3].x));
      const height = Math.max(Math.abs(points[3].y - points[0].y), Math.abs(points[2].y - points[1].y));
      const ar = width / height;
      if (ar < 0.8 || ar > 1.2) continue;

      const rectified = rectify(mat, approx);
      if (!rectified) continue;

      if (!isSolidBorder(rectified)) continue;

      const corner = findOrientationAnchor(rectified);
      if (corner) {
        result = {
          bounds: { x: points[0].x, y: points[0].y, width, height },
          orientationCorner: corner,
          confidence: 0.95,
          mat: rectified
        };
        break;
      }
    }
  }

  return result;
};

const correctOrientation = (mat: Mat, corner: CornerPosition): Mat => {
  const dest = OpenCV.createObject(ObjectType.Mat);
  if (corner === 'topLeft') return mat;
  
  let rotation;
  if (corner === 'topRight') rotation = 0; // ROTATE_90_CLOCKWISE
  else if (corner === 'bottomRight') rotation = 1; // ROTATE_180
  else rotation = 2; // ROTATE_90_COUNTERCLOCKWISE
  
  OpenCV.invoke('rotate', mat, dest, rotation);
  return dest;
};

const isSolidBorder = (rectified: Mat): boolean => {
  const samples = 20;
  const edges = ['top', 'bottom', 'left', 'right'];
  
  for (const edge of edges) {
    let darkCount = 0;
    for (let i = 0; i < samples; i++) {
      let x, y;
      const step = 300 / samples;
      if (edge === 'top') { x = i * step; y = 5; }
      else if (edge === 'bottom') { x = i * step; y = 295; }
      else if (edge === 'left') { x = 5; y = i * step; }
      else { x = 295; y = i * step; }
      
      const pixel = OpenCV.invoke('at', rectified, Math.floor(y), Math.floor(x)) as { r: number; g: number; b: number; a: number };
      const brightness = (pixel.r + pixel.g + pixel.b) / 3;
      if (brightness < 128) darkCount++;
    }
    if (darkCount / samples < 0.8) return false;
  }
  return true;
};

const findOrientationAnchor = (rectified: Mat): CornerPosition | null => {
  const corners: { pos: CornerPosition; x: number; y: number }[] = [
    { pos: 'topLeft', x: 40, y: 40 },
    { pos: 'topRight', x: 260, y: 40 },
    { pos: 'bottomLeft', x: 40, y: 260 },
    { pos: 'bottomRight', x: 260, y: 260 }
  ];

  let found: CornerPosition | null = null;
  let foundCount = 0;

  for (const corner of corners) {
    const pixel = OpenCV.invoke('at', rectified, Math.floor(corner.y), Math.floor(corner.x)) as { r: number; g: number; b: number; a: number };
    const brightness = (pixel.r + pixel.g + pixel.b) / 3;
    if (brightness < 100) {
      found = corner.pos;
      foundCount++;
    }
  }
  return foundCount === 1 ? found : null;
};

const rectify = (src: Mat, approx: PointVector): Mat | null => {
  const points = OpenCV.toJSValue(approx).array;
  points.sort((a, b) => (a.x + a.y) - (b.x + b.y));
  const tl = points[0];
  const br = points[3];
  const remaining = [points[1], points[2]];
  remaining.sort((a, b) => (a.x - a.y) - (b.x - b.y));
  const tr = remaining[1];
  const bl = remaining[0];

  const srcPointVector = OpenCV.createObject(ObjectType.Point2fVector, [tl, tr, br, bl].map(p => OpenCV.createObject(ObjectType.Point2f, p.x, p.y)));
  const dstPointVector = OpenCV.createObject(ObjectType.Point2fVector, [
    { x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 300 }, { x: 0, y: 300 }
  ].map(p => OpenCV.createObject(ObjectType.Point2f, p.x, p.y)));

  const matrix = OpenCV.invoke('getPerspectiveTransform', srcPointVector, dstPointVector) as Mat;
  const dest = OpenCV.createObject(ObjectType.Mat, 300, 300, DataTypes.CV_8UC4);
  OpenCV.invoke('warpPerspective', src, dest, matrix, OpenCV.createObject(ObjectType.Size, 300, 300));

  return dest;
};
