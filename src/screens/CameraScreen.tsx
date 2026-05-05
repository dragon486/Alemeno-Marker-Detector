import React, { useState, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import MarkerHighlight from '../components/MarkerHighlight';
import ViewfinderOverlay from '../components/ViewfinderOverlay';
import { detectMarker } from '../detection/markerDetector';
import { isDuplicate } from '../utils/deduplication';

const CameraScreen = () => {
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const navigation = useNavigation<any>();
  const camera = useRef<Camera>(null);

  const [markers, setMarkers] = useState<{path: string, hash: string}[]>([]);
  const [isDetected, setIsDetected] = useState(false);
  const [highlight, setHighlight] = useState<any>(null);
  const [startTime] = useState(Date.now());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // Detection Loop (Snapshot-based)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const runDetection = async () => {
      if (!camera.current || isProcessing || markers.length >= 20) return;
      
      try {
        setIsProcessing(true);
        const photo = await camera.current.takeSnapshot({
          flash: 'off',
          qualityPrioritization: 'speed',
        });

        // Read image and process
        const base64 = await RNFS.readFile(photo.path, 'base64');
        const result = await detectMarker(base64);

        if (result && !isDuplicate(result.hash, markers.map(m => m.hash))) {
          setIsDetected(true);
          setHighlight(result.bounds);
          
          const fileName = `marker_${Date.now()}.jpg`;
          const path = `${RNFS.CachesDirectoryPath}/${fileName}`;
          await RNFS.writeFile(path, result.image, 'base64');

          setMarkers((prev) => {
            const next = [...prev, { path, hash: result.hash }];
            if (next.length === 20) {
              const duration = ((Date.now() - startTime) / 1000).toFixed(1);
              navigation.navigate('Results', { markers: next.map(m => m.path), duration });
            }
            return next;
          });

          setTimeout(() => {
            setIsDetected(false);
            setHighlight(null);
          }, 500);
        }
      } catch (e) {
        console.error("Detection error:", e);
      } finally {
        setIsProcessing(false);
      }
    };

    interval = setInterval(runDetection, 300); // 3 samples per second
    return () => clearInterval(interval);
  }, [markers.length, isProcessing, navigation, startTime]);

  if (!hasPermission) return <View style={styles.container}><Text>No Camera Permission</Text></View>;
  if (!device) return <View style={styles.container}><Text>No Camera Device</Text></View>;

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
      
      <ViewfinderOverlay />
      
      <MarkerHighlight bounds={highlight} />

      <View style={styles.stats}>
        <Text style={styles.statsText}>Collected: {markers.length}/20</Text>
      </View>

      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  stats: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 24,
  }
});

export default CameraScreen;
