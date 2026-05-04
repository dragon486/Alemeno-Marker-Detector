/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, StatusBar } from 'react-native';
import { useCameraPermission } from 'react-native-vision-camera';
import CameraScreen from './src/screens/CameraScreen';
import ResultsScreen from './src/screens/ResultsScreen';

const App = () => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [markers, setMarkers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const handleMarkersCollected = useCallback((paths: string[]) => {
    setMarkers(paths);
    setShowResults(true);
  }, []);

  const handleReset = useCallback(() => {
    setMarkers([]);
    setShowResults(false);
  }, []);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Text style={styles.text}>No Camera Permission. Please enable it in settings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {!showResults ? (
        <CameraScreen onMarkersCollected={handleMarkersCollected} />
      ) : (
        <ResultsScreen markers={markers} onReset={handleReset} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  text: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    padding: 40,
  },
});

export default App;
