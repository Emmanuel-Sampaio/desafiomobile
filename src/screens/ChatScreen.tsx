import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image, PermissionsAndroid, Platform, Modal, Button } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AudioRecorderPlayer, { AudioSet, AVEncoderAudioQualityIOSType, AVEncodingOption } from 'react-native-audio-recorder-player';
import Sound from 'react-native-sound';
import {launchCamera} from 'react-native-image-picker';
import BluetoothSerial, {BluetoothDevice}  from 'react-native-bluetooth-classic';


export type RootStackParamList = {
  Home: undefined;
  // agora Chat recebe um BluetoothDevice real
  Chat: { device: BluetoothDevice };
  Camera: undefined;
};

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

type Props = {
  route: ChatScreenRouteProp;
  navigation: ChatScreenNavigationProp;
};

type Mensagem = {
  id: string;
  texto: string;
  deviceId: string;
  timestamp: number;
  isSent: boolean;
  audioPath?: string; 
  imageUri?: string;
};

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { device } = route.params;
  const [mensagem, setMensagem] = useState('');
  const [historico, setHistorico] = useState<Mensagem[]>([]);
  const storageKey = `chatHistory_${device.address}`;
  const audioRecorderPlayer = new AudioRecorderPlayer();
  const [gravando, setGravando] = useState(false);
  const [audioPath, setAudioPath] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const savedMessages = await AsyncStorage.getItem(storageKey);
        if (savedMessages) {
          setHistorico(JSON.parse(savedMessages));
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      }
    };

    loadMessages();
  }, [device.address]);

  useEffect(() => {
    const saveMessages = async () => {
      try {
        await AsyncStorage.setItem(storageKey, JSON.stringify(historico));
      } catch (error) {
        console.error('Erro ao salvar mensagens:', error);
      }
    };

    saveMessages();
  }, [historico]);


  useEffect(() => {
    let subscription: any;
  
    if (device) {
      const anyDevice = device as any;
  
      subscription = anyDevice.onDataReceived((event: { data: string }) => {
        try {
          const msg = JSON.parse(event.data);
  
          const novaMensagem: Mensagem = {
            id: Date.now().toString(),
            texto: msg.type === 'text' ? msg.content : '',
            deviceId: device.address,
            timestamp: msg.timestamp || Date.now(),
            isSent: false,
            ...(msg.type === 'audio' && { audioPath: msg.content }),
            ...(msg.type === 'image' && { imageUri: msg.content }),
          };
  
       
          setHistorico(prev => [...prev, novaMensagem]);
        } catch (error) {
          console.error('Erro ao processar dados recebidos via Bluetooth:', error);
        }
      });
    }
  
    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [device]);
  
  
  

  const enviarmensagembluetooth = async (text: string) => {
    if (!device || !device.write) {
      console.warn('Dispositivo Bluetooth não inicializado ou sem método write');
      return;
    }
    const payload = JSON.stringify({
      type: 'text',
      content: text,
      timestamp: Date.now(),
    });
  
    try {
      await device.write(payload);
      console.log('Texto enviado via Bluetooth:', payload);
    } catch (error) {
      console.error('Erro ao enviar texto via Bluetooth:', error);
    }
  };



const enviarMensagem = async () => {
  if (mensagem.trim() === '') return;

  const novaMensagem: Mensagem = {
    id: Date.now().toString(),
    texto: mensagem,
    deviceId: device.address,
    timestamp: Date.now(),
    isSent: true,
  };

  setHistorico(prev => [...prev, novaMensagem]);
  setMensagem('');

  
  try {
    await enviarmensagembluetooth(novaMensagem.texto);
    console.log('Mensagem enviada com sucesso via Bluetooth');
  } catch (error) {
    console.error('Erro ao enviar mensagem via Bluetooth:', error);
  }
};


  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatRelativeDate = (timestamp: number) => {
    const today = new Date();
    const messageDate = new Date(timestamp);

    today.setHours(0, 0, 0, 0);
    messageDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays === 2) return 'Anteontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return messageDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const solicitarPermissaoAudio = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const iniciarGravacao = async () => {
    const permissao = await solicitarPermissaoAudio();
    if (!permissao) return;

    const result = await audioRecorderPlayer.startRecorder();
    setAudioPath(result);
    setGravando(true);
    setModalVisible(true);
  };

  const pararGravacao = async () => {
    try {
      const result = await audioRecorderPlayer.pauseRecorder()
      console.log("Gravação parada:", result); // Verifique se o áudio parou
      setGravando(false);
      return result;
    } catch (error) {
      console.log("Erro ao parar gravação:", error);
    }
  };

  const cancelarEnvioAudio = async () => {
    try {
      if (gravando) {
        await pararGravacao();
      }
      setAudioPath('');
      setModalVisible(false);
    } catch (error) {
      console.log("Erro ao cancelar envio de áudio:", error);
    }
  };
  const enviarAudio = async (path: string) => {
    if (!device) return;
  
    const mensagem = {
      type: 'audio',
      content: path, // Caminho local do áudio no dispositivo
      timestamp: Date.now(),
    };
  
    try {
      const json = JSON.stringify(mensagem);
      await device.write(json);
  
      const novaMensagem: Mensagem = {
        id: Date.now().toString(),
        texto: '',
        deviceId: device.address,
        timestamp: mensagem.timestamp,
        isSent: true,
        audioPath: path,
      };
  
      setHistorico(prev => [...prev, novaMensagem]);
    } catch (error) {
      console.error('Erro ao enviar áudio:', error);
    }
  };
  
  
  
  const pedirPermissoesArmazenamento = async () => {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Permissão de leitura de armazenamento negada");
    }
  };


const reproduzirAudio = (path: string) => {
  const sound = new Sound(path, '', (error) => {
    if (error) {
      console.log('Erro ao carregar áudio', error);
      return;
    }
    sound.play((success) => {
      if (!success) {
        console.log('Erro na reprodução do áudio');
      }
    });
  });
};

  
  
  const renderMensagem = ({ item, index }: { item: Mensagem; index: number }) => {
    const showDate =
      index === 0 ||
      new Date(historico[index - 1].timestamp).getDate() !== new Date(item.timestamp).getDate();
  
    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{formatRelativeDate(item.timestamp)}</Text>
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            item.isSent ? styles.sentMessage : styles.receivedMessage,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              item.isSent ? styles.sentBubble : styles.receivedBubble,
            ]}
          >
            
            {item.imageUri ? (
              <Image 
                source={{ uri: item.imageUri }} 
                style={styles.imageMessage} 
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.messageText}>{item.texto}</Text>
            )}
  
            
            {item.audioPath && (
              <TouchableOpacity onPress={() => reproduzirAudio(item.audioPath || '')}>
                <Text style={styles.audioLink}>▶️ Ouvir Áudio</Text>
              </TouchableOpacity>
            )}
  
            
            <Text
              style={[
                styles.timestamp,
                item.isSent ? styles.sentTimestamp : styles.receivedTimestamp,
              ]}
            >
              {formatDate(item.timestamp)}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  const solicitarPermissaoCamera = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const enviarFoto = async (uri: string) => {
    if (!device) return;
  
    const mensagem = {
      type: 'image',
      content: uri, 
      timestamp: Date.now(),
    };
  
    try {
      const json = JSON.stringify(mensagem);
      await device.write(json);
  
      const novaMensagem: Mensagem = {
        id: Date.now().toString(),
        texto: '',
        deviceId: device.address,
        timestamp: mensagem.timestamp,
        isSent: true,
        imageUri: uri,
      };
  
      setHistorico(prev => [...prev, novaMensagem]);
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
    }
  };
  



  const abrirCamera = async () => {
    const permissao = await solicitarPermissaoCamera();
    if (!permissao) return;
  
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      saveToPhotos: false,
      cameraType: 'back' as const,
    };
  
    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('Usuário cancelou a câmera');
      } else if (response.errorMessage) {
        console.log('Erro na câmera: ', response.errorMessage);
      } else if (response.assets && response.assets[0]?.uri) {
        const fotoUri = response.assets[0].uri;
        if (fotoUri) {
          enviarFoto(fotoUri);
        } else {
          console.log('URI da foto é inválido');
        }
      }
    });
  };
  
  

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{device.name}</Text>

      <FlatList
        data={historico.sort((a, b) => a.timestamp - b.timestamp)}  // Ordena pelo timestamp
        keyExtractor={(item) => item.id}
        renderItem={renderMensagem}
        contentContainerStyle={styles.flatListContent}
        inverted={false}
/>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Digite sua mensagem"
          value={mensagem}
          onChangeText={setMensagem}
          onSubmitEditing={enviarMensagem}
        />
        <TouchableOpacity
          style={[styles.sendButton, !mensagem.trim() && styles.disabledButton]}
          onPress={enviarMensagem}
          disabled={!mensagem.trim()}
        >
          <Image source={require('../../assets/send.png')} style={styles.sendIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={abrirCamera}>
          <Image source={require('../../assets/camm.png')} style={styles.camButton} />
        </TouchableOpacity>
        <TouchableOpacity onPress={iniciarGravacao}>
          <Image source={require('../../assets/mic.png')} style={styles.micButton} />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Deseja enviar este áudio?</Text>
            <View style={styles.modalButtons}>
              <Button title="Cancelar" onPress={()=>{cancelarEnvioAudio}} color="red" />
              <Button title="Enviar" onPress={() => enviarAudio(audioPath)} color= "Green" />
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
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  flatListContent: {
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 8,
    maxWidth: '80%',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  sentBubble: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: '#ECECEC',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  sentTimestamp: {
    textAlign: 'right',
  },
  receivedTimestamp: {
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  sendIcon: {
    width: 30,
    height: 30,
  },
  camButton: {
    width: 30,
    height: 30,
    marginHorizontal: 5,
  },
  micButton: {
    width: 30,
    height: 30,
    marginHorizontal: 5,
  },
  audioLink: {
    color: 'blue',
    fontSize: 14,
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: 300,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dateSeparatorText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#888',
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginVertical: 5,
  },
});

export default ChatScreen;