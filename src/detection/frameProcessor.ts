import { useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import { useResizePlugin } from 'vision-camera-resize-plugin';
import { OpenCV } from 'react-native-fast-opencv';
import { analyzeFrame } from './markerDetector';
import { correctOrientation } from './orientationCorrector';
import { computeHash, isUnique } from '../utils/deduplication';

export const useMarkerFrameProcessor = (
  onMarkerDetected: (base64: string, hash: string, bounds: any) => void,
  previousHashes: string[]
) => {
  const { resize } = useResizePlugin();

  return useFrameProcessor((frame) => {
    'worklet';
    
    // Throttle to ~15fps (every 2-3 frames depending on camera FPS)
    // For simplicity, we can use a timestamp check
    const now = Date.now();
    if (global.lastFrameTime && now - global.lastFrameTime < 60) return;
    global.lastFrameTime = now;

    try {
      // 1. Resize for performance (1024x1024 is enough for detection)
      const resized = resize(frame, {
        scale: { width: 1024, height: 1024 },
        pixelFormat: 'rgb',
        dataType: 'uint8',
      });

      const mat = OpenCV.frameBufferToMat(1024, 1024, 3, resized);
      
      // 2. Analyze
      const result = analyzeFrame(mat);
      
      if (result) {
        // 3. Correct Orientation
        const orientedMat = correctOrientation(result.mat, result.orientationCorner);
        
        // 4. Compute Hash
        const hash = computeHash(orientedMat);
        
        // 5. Check Uniqueness
        if (isUnique(hash, previousHashes)) {
          const jsValue = OpenCV.toJSValue(orientedMat, 'jpeg');
          runOnJS(onMarkerDetected)(jsValue.base64, hash, result.bounds);
        }
      }
      
      OpenCV.clearBuffers();
    } catch (e) {
      console.log('Frame Processor Error:', e);
    }
  }, [resize, onMarkerDetected, previousHashes]);
};
