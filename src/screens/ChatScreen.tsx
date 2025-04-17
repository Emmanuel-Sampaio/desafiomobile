import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  Home: undefined;
  Chat: { device: { name: string; address: string } };
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
};

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const { device } = route.params;
  const [mensagem, setMensagem] = useState('');
  const [historico, setHistorico] = useState<Mensagem[]>([]);
  const storageKey = `chatHistory_${device.address}`;

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

  const enviarMensagem = async () => {
    if (mensagem.trim() === '') return;

    const novaMensagem: Mensagem = {
      id: Date.now().toString(),
      texto: mensagem,
      deviceId: device.address,
      timestamp: Date.now(),
      isSent: true,
    };

    setHistorico([...historico, novaMensagem]);
    setMensagem('');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMensagem = ({ item }: { item: Mensagem }) => (
    <View style={[
      styles.messageContainer,
      item.isSent ? styles.sentMessage : styles.receivedMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.isSent ? styles.sentBubble : styles.receivedBubble
      ]}>
        <Text style={styles.messageText}>{item.texto}</Text>
        <Text style={[
          styles.timestamp,
          item.isSent ? styles.sentTimestamp : styles.receivedTimestamp
        ]}>
          {formatDate(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{device.name}</Text>
      
      <FlatList
        data={historico.sort((a, b) => a.timestamp - b.timestamp)}
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
          <Image 
            source={require('../../assets/send.png')} 
            style={styles.sendIcon} 
          />
        </TouchableOpacity>
        
      </View>
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
    backgroundColor: '#fff',
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
    marginRight: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    
  },
  sendIcon: {
    width: 35,
    height: 35,
   
  },
});

export default ChatScreen;