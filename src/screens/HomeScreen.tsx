import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const HomeScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/295680.png')}
        style={styles.icon}
      />
      <Text style={styles.title}>Conexão Bluetooth</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('ScanDevices')}
      >
        <Text style={styles.buttonText}>Procurar dispositivos via Bluetooth</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('PairedDevices')}
      >
        <Text style={styles.buttonText}>Dispositivos emparelhados</Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
      paddingHorizontal: 20,
    },
    icon: {
      width: 50,
      height: 50,
      marginBottom: 20,
      tintColor: '#004AAD',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 40,
      color: '#000',
    },
    button: {
      backgroundColor: '#004AAD',
      paddingVertical: 15,
      paddingHorizontal: 25,
      borderRadius: 10,
      marginVertical: 10,
      width: '100%',
    },
    buttonText: {
      color: '#fff',
      textAlign: 'center',
      fontSize: 16,
    },
  });
  

export default HomeScreen;
