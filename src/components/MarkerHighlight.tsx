import React from 'react';
import { StyleSheet, View } from 'react-native';

interface Props {
  bounds: { x: number; y: number; width: number; height: number } | null;
}

const MarkerHighlight: React.FC<Props> = ({ bounds }) => {
  if (!bounds) return null;

  return (
    <View 
      style={[
        styles.box, 
        { 
          left: bounds.x, 
          top: bounds.y, 
          width: bounds.width, 
          height: bounds.height 
        }
      ]} 
      pointerEvents="none" 
    />
  );
};

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#00FFCC',
    borderRadius: 4,
  },
});

export default MarkerHighlight;
