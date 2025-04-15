import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Chat: { device: { name: string, address: string } };
};

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

type Props = {
  route: ChatScreenRouteProp;
};

const ChatScreen: React.FC<Props> = ({ route }) => {
  const { device } = route.params;
  const [mensagem, setMensagem] = useState('');
  const [historico, setHistorico] = useState<{ id: string; texto: string }[]>([]);

  const enviarMensagem = () => {
    if (mensagem.trim() !== '') {
      setHistorico([...historico, { id: Date.now().toString(), texto: mensagem }]);
      setMensagem('');
      // Aqui você pode adicionar envio via Bluetooth
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Conectado a {device.name}</Text>
      <FlatList
        data={historico}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text style={styles.mensagem}>{item.texto}</Text>}
      />
      <TextInput
        style={styles.input}
        placeholder="Digite sua mensagem"
        value={mensagem}
        onChangeText={setMensagem}
      />
      <Button title="Enviar" onPress={enviarMensagem} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  titulo: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, padding: 8, marginVertical: 8 },
  mensagem: { padding: 8, backgroundColor: '#eee', marginVertical: 4 }
});

export default ChatScreen;
