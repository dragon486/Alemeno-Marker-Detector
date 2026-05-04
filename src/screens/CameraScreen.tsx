import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, useCameraFormat } from 'react-native-vision-camera';
import { useMarkerFrameProcessor } from '../detection/frameProcessor';
import ViewfinderOverlay from '../components/ViewfinderOverlay';
import MarkerHighlight from '../components/MarkerHighlight';
import RNFS from 'react-native-fs';

interface Props {
  navigation: any;
}

const CameraScreen: React.FC<Props> = ({ navigation }) => {
  const device = useCameraDevice('back');
  const [markers, setMarkers] = useState<{ path: string; hash: string }[]>([]);
  const [highlight, setHighlight] = useState<any>(null);
  const [startTime] = useState(Date.now());
  const [isDetected, setIsDetected] = useState(false);

  const format = useCameraFormat(device, [
    { videoResolution: { width: 2160, height: 2160 } },
    { fps: 30 }
  ]);

  const onMarkerDetected = useCallback((base64: string, hash: string, bounds: any) => {
    setIsDetected(true);
    setHighlight(bounds);
    
    // Clear highlight after 500ms
    setTimeout(() => {
      setIsDetected(false);
      setHighlight(null);
    }, 500);

    const fileName = `marker_${Date.now()}.jpg`;
    const path = `${RNFS.CachesDirectoryPath}/${fileName}`;
    
    RNFS.writeFile(path, base64, 'base64').then(() => {
      setMarkers((prev) => {
        if (prev.length >= 20) return prev;
        const next = [...prev, { path, hash }];
        if (next.length === 20) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          navigation.navigate('Results', { markers: next.map(m => m.path), duration });
        }
        return next;
      });
    });
  }, [navigation, startTime]);

  const frameProcessor = useMarkerFrameProcessor(onMarkerDetected, markers.map(m => m.hash));

  if (!device) return <ActivityIndicator size="large" style={styles.loader} />;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        format={format}
        frameProcessor={frameProcessor}
        frameProcessorFps={15}
      />
      
      <ViewfinderOverlay />
      <MarkerHighlight bounds={highlight} />

      <View style={styles.topBar}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>
            {isDetected ? 'Detected! ✓' : 'Scanning…'} {markers.length}/20
          </Text>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: `${(markers.length / 20) * 100}%` }]} />
        </View>
        <Text style={styles.hint}>Auto-capturing unique markers</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loader: {
    flex: 1,
    backgroundColor: 'black',
  },
  topBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  pillText: {
    color: '#00FFCC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00FFCC',
  },
  hint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});

export default CameraScreen;
