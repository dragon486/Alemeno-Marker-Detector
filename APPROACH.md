# Technical Approach: Marker Detection & Extraction

## 1. Marker Choice: Marker 2
We selected **Marker 2** for its robustness and simplicity in high-noise environments. 
- **Solid Border**: Provides a continuous contour that is easier to detect than dashed patterns.
- **Corner Anchor**: A single 20x20px filled square provides unambiguous orientation encoding.

## 2. Detection Pipeline
The detection logic runs as a **Vision Camera Frame Processor Worklet**, ensuring zero lag on the JavaScript thread.

### Stage 1: Pre-processing
- **Grayscale Conversion**: Reduces data dimensionality.
- **Adaptive Thresholding (Otsu)**: Binarizes the image while accounting for local shadows and lighting variations.

### Stage 2: Shape Identification
- **Contour Extraction**: Finds all closed polygons.
- **Polygonal Approximation**: Filters for 4-sided shapes (candidates).
- **Aspect Ratio Filter**: Rejects rectangles that deviate more than 20% from a perfect square.

### Stage 3: Feature Validation
- **Solid Border Check**: Samples 20 points along each edge. If pixel density falls below 80% dark, the candidate is rejected (detects Marker 1/dashed markers).
- **Interior Check**: Verifies the center is mostly white.
- **Anchor Search**: Samples the four inner corners. Exactly one must contain a dark region of the correct size ratio (10-30%).

## 3. Extraction & Normalization
- **Perspective Warp**: Uses a homography matrix to map the marker corners to a 300x300 plane, correcting for camera tilt.
- **Rotation**: Based on the detected anchor position (e.g., if anchor is at Bottom-Right, we rotate 180°).

## 4. Performance & Reliability
- **15 FPS Throttling**: Reduces CPU load and thermal throttling.
- **Image Hashing**: Generates an 8x8 average hash of every captured marker. Using Hamming distance, we reject frames that are too similar to existing captures, ensuring the 20-marker grid contains unique perspectives.
- **Skia Overlays**: Live bounding boxes are drawn using hardware-accelerated Skia for fluid UI feedback.

## 5. False Positive Prevention
- **Size Ratio**: Large interior black squares (like in Image 9) are rejected because the anchor-to-interior ratio exceeds 30%.
- **Positioning**: Centered squares (Image 11) are rejected as they do not fall into the corner sampling regions.
