import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  PermissionsAndroid,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import BluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';


const HomeScreen = ({navigation}: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BluetoothDevice | null>(null);
  const [pairedModalVisible, setPairedModalVisible] = useState(false);
  const [pairedDevices, setPairedDevices] = useState<BluetoothDevice[]>([]);
 

  


  // Verifica se o Bluetooth está ativado
  const checkBluetoothState = async () => {
    try {
      // Verifica se o Bluetooth está disponível no dispositivo
      const isAvailable = await BluetoothClassic.isBluetoothAvailable();
      if (!isAvailable) {
        Alert.alert(
          'Bluetooth não disponível',
          'Este dispositivo não suporta Bluetooth'
        );
        return false;
      }
  
      // Verifica se o Bluetooth está ativado
      const isEnabled = await BluetoothClassic.isBluetoothEnabled();
      if (!isEnabled) {
        const enableResult = await new Promise((resolve) => {
          Alert.alert(
            'Bluetooth desativado',
            'Deseja ativar o Bluetooth?',
            [
              {
                text: 'Cancelar',
                onPress: () => resolve(false),
                style: 'cancel',
              },
              {
                text: 'Ativar',
                onPress: async () => {
                  try {
                    const result = await BluetoothClassic.requestBluetoothEnabled();
                    resolve(result);
                  } catch (error) {
                    console.error('Erro ao ativar Bluetooth:', error);
                    resolve(false);
                  }
                },
              },
            ],
            { cancelable: false }
          );
        });
        
        return enableResult;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar estado do Bluetooth:', error);
      Alert.alert(
        'Erro',
        `Ocorreu um erro ao verificar o Bluetooth: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
      return false;
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        // Para Android 11 (API 30) e abaixo
        if (Platform.Version < 31) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Permissão de Localização',
              message: 'O aplicativo precisa da permissão de localização para buscar dispositivos Bluetooth',
              buttonNeutral: 'Perguntar depois',
              buttonNegative: 'Cancelar',
              buttonPositive: 'OK',
            }
          );
          
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        // Para Android 12 (API 31) e acima
        else {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
          
          return (
            granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
          );
        }
      } catch (err) {
        console.warn('Erro ao solicitar permissões:', err);
        return false;
      }
    }
    return true;
  };
  

  const scanDevices = async () => {
    try {
      const bluetoothOk = await checkBluetoothState();
      if (!bluetoothOk) return;
  
      const permissionOk = await requestPermissions();
      if (!permissionOk) {
        Alert.alert('Permissões necessárias', 'Permissões Bluetooth negadas.');
        return;
      }
  
      setIsScanning(true);
      setDevices([]);
      setModalVisible(true);
  
      try {
        const discovered = await BluetoothClassic.startDiscovery();
        setDevices(discovered);
      } catch (error) {
        console.error('Erro na descoberta de dispositivos:', error);
        Alert.alert(
          'Erro',
          `Falha ao buscar dispositivos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        );
      }
    } catch (error) {
      console.error('Erro geral no scan:', error);
      Alert.alert(
        'Erro',
        `Ocorreu um erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleDeviceSelect = (device: BluetoothDevice) => {
    setSelectedDevice(device);
    Alert.alert(
      `Conectar a ${device.name || 'Dispositivo'}`,
      `Deseja conectar ao dispositivo ${device.address}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Conectar',
          onPress: () => connectToDevice(device),
         
        },
      ],
    );
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      const isConnected = await BluetoothClassic.connectToDevice(device.address);
      if (isConnected) {
        Alert.alert('Sucesso', `Conectado a ${device.name || device.address}`);
        setModalVisible(false);
        navigation.navigate('Chat', { device });
      }
    } catch (error) {
      Alert.alert('Erro', `Falha ao conectar a ${device.name || device.address}`);
      console.error('Erro de conexão:', error);
    }
  };

  const showPairedDevices = async () => {
    try {
      const bluetoothOk = await checkBluetoothState();
      if (!bluetoothOk) return;
  
      const permissionOk = await requestPermissions();
      if (!permissionOk) {
        Alert.alert('Permissões necessárias', 'Permissões Bluetooth negadas.');
        return;
      }
  
      const bonded = await BluetoothClassic.getBondedDevices();
      setPairedDevices(bonded);
      setPairedModalVisible(true);
    } catch (error) {
      console.error('Erro ao buscar dispositivos emparelhados:', error);
      Alert.alert('Erro', 'Não foi possível buscar os dispositivos emparelhados.');
    }
  };
  

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/295680.png')}
        style={styles.icon}
      />
      <Text style={styles.title}>Conexão Bluetooth</Text>

      <TouchableOpacity style={styles.button} onPress={scanDevices}>
        <Text style={styles.buttonText}>Procurar dispositivos via Bluetooth </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={showPairedDevices}
      >
        <Text style={styles.buttonText}>Dispositivos emparelhados</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Dispositivos Bluetooth</Text>
            
            {isScanning ? (
              <View style={styles.scanningContainer}>
                <ActivityIndicator size="large" color="#004AAD" />
                <Text style={styles.scanningText}>Procurando dispositivos...</Text>
              </View>
            ) : devices.length === 0 ? (
              <Text style={styles.noDevicesText}>Nenhum dispositivo encontrado</Text>
            ) : (
              <FlatList
                data={devices}
                keyExtractor={(item) => item.address}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={[
                      styles.deviceItem,
                      selectedDevice?.address === item.address && styles.selectedDevice
                    ]} 
                    onPress={() => handleDeviceSelect(item)}
                  >
                    <Text style={styles.deviceText}>
                      {item.name || 'Dispositivo desconhecido'}
                    </Text>
                    <Text style={styles.deviceTextSmall}>{item.address}</Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContainer}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.scanButton]}
                onPress={scanDevices}
                disabled={isScanning}
              >
                <Text style={styles.modalButtonText}>Buscar novamente</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.closeButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
  visible={pairedModalVisible}
  transparent
  animationType="fade"
  onRequestClose={() => setPairedModalVisible(false)}
>
  
  <View style={styles.modalContainer}>
    <View style={styles.modalBox}>
      <Text style={styles.modalTitle}>Dispositivos Emparelhados</Text>

      {pairedDevices.length === 0 ? (
        <Text style={styles.noDevicesText}>Nenhum dispositivo emparelhado encontrado</Text>
      ) : (
        <FlatList
          data={pairedDevices}
          keyExtractor={(item) => item.address}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.deviceItem,
                selectedDevice?.address === item.address && styles.selectedDevice,
              ]}
              onPress={() => handleDeviceSelect(item)}
            >
              <Text style={styles.deviceText}>{item.name || 'Dispositivo desconhecido'}</Text>
              <Text style={styles.deviceTextSmall}>{item.address}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={[styles.modalButton, styles.closeButton]}
          onPress={() => setPairedModalVisible(false)}
        >
          <Text style={styles.modalButtonText}>Fechar</Text>
        </TouchableOpacity>

        
      </View>
    </View>
  </View>
</Modal>
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
    width: 80,
    height: 80,
    marginBottom: 20,
    resizeMode: 'contain',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#004AAD',
  },
  listContainer: {
    paddingBottom: 10,
  },
  deviceItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedDevice: {
    backgroundColor: '#e6f0ff',
  },
  deviceText: {
    fontSize: 16,
    color: '#333',
  },
  deviceTextSmall: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  scanningContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  scanningText: {
    marginTop: 10,
    color: '#666',
  },
  noDevicesText: {
    textAlign: 'center',
    paddingVertical: 30,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#004AAD',
    marginRight: 10,
  },
  closeButton: {
    backgroundColor: '#ccc',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen;