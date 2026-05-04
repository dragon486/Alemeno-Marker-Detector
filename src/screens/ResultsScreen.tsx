import React from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 60) / 2;

interface Props {
  route: any;
  navigation: any;
}

const ResultsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { markers, duration } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Complete</Text>
        <Text style={styles.subtitle}>Captured in {duration}s</Text>
      </View>

      <FlatList
        data={markers}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={styles.itemContainer}>
            <View style={styles.imageWrapper}>
              <Image 
                source={{ uri: `file://${item}` }} 
                style={styles.image} 
                resizeMode="contain"
              />
            </View>
            <Text style={styles.label}>Frame #{index + 1}</Text>
          </View>
        )}
      />

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.buttonText}>SCAN AGAIN</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    color: '#00FFCC',
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#AAA',
    fontSize: 18,
    marginTop: 5,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  itemContainer: {
    flex: 1,
    margin: 10,
    alignItems: 'center',
  },
  imageWrapper: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 300, // Logical size for internal reference
    height: 300,
    maxWidth: '100%',
    maxHeight: '100%',
  },
  label: {
    color: '#777',
    fontSize: 14,
    marginTop: 8,
  },
  button: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    backgroundColor: '#00FFCC',
    padding: 20,
    borderRadius: 35,
    alignItems: 'center',
    elevation: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});

export default ResultsScreen;
