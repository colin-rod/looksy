import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { AppMain } from './src/components/AppMain';

export default function App() {
  return (
    <View style={styles.container}>
      <AppMain />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
