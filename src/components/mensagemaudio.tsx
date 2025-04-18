// components/MensagemComAudio.tsx

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Sound from 'react-native-sound';


interface MensagemComAudioProps {
  audioUri: string;
}

const MensagemComAudio: React.FC<MensagemComAudioProps> = ({ audioUri }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const playerRef = useRef<Sound | null>(null);

  const playAudio = () => {
    if (isPlaying) {
      playerRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (playerRef.current) {
        playerRef.current.play((success) => {
          if (success) {
            setIsPlaying(false);
          }
        });
        setIsPlaying(true);
      } else {
        const player = new Sound(audioUri, '', (error) => {
          if (error) {
            console.error('Erro ao carregar o áudio:', error);
            return;
          }
          setDuration(player.getDuration());
          player.play((success) => {
            if (success) {
              setIsPlaying(false);
            }
          });
          setIsPlaying(true);
          playerRef.current = player;
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.bubble} onPress={playAudio}>
        <Text style={styles.playText}>{isPlaying ? '⏸️ Pausar' : '▶️ Reproduzir Áudio'}</Text>
        {duration && <Text style={styles.duration}>{duration.toFixed(1)}s</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    alignItems: 'flex-start',
  },
  bubble: {
    backgroundColor: '#DCF8C6',
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  playText: {
    fontSize: 16,
    marginRight: 10,
  },
  duration: {
    fontSize: 14,
    color: '#555',
  },
});

export default MensagemComAudio;
