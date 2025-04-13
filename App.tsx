// App.tsx
import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import HomeScreen from './src/screens/homescreen'; // Arquivo com h minúsculo, mas componente com H maiúsculo

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <HomeScreen /> {/* Precisa ser com H maiúsculo */}
    </SafeAreaView>
  );
};

export default App;
