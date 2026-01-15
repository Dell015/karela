import { Stack } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';

export default function Index() {
  const [fontsLoaded] = useFonts({
    'Excon-Thin': require('../assets/fonts/Excon-Thin.otf'),
    'Excon-Light': require('../assets/fonts/Excon-Light.otf'),
    'Excon-Regular': require('../assets/fonts/Excon-Regular.otf'),
    'Excon-Medium': require('../assets/fonts/Excon-Medium.otf'),
    'Excon-Bold': require('../assets/fonts/Excon-Bold.otf'),
    'Excon-Black': require('../assets/fonts/Excon-Black.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7CF205" />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Image source={require('../assets/images/karela_logo.png')} style={styles.logo}/>
      <Text style={[styles.title, { fontFamily: 'Excon-Bold' }]}>KARELA</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: 'contain',
    top: -50
  },
  title: {
    color: '#7CF205',
    fontSize: 40,
    fontWeight: 'bold'
  }
}); 

