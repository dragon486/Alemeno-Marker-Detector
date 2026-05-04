import React from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Rect, Paint } from '@shopify/react-native-skia';

interface Props {
  bounds: { x: number; y: number; width: number; height: number } | null;
}

const MarkerHighlight: React.FC<Props> = ({ bounds }) => {
  if (!bounds) return null;

  // Map coordinates from 1024x1024 to screen size
  // Assuming 1:1 aspect ratio for the camera feed in this demo
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.width}
        height={bounds.height}
        mode="stroke"
      >
        <Paint color="#00FFCC" strokeWidth={4} style="stroke" />
      </Rect>
    </Canvas>
  );
};

export default MarkerHighlight;
