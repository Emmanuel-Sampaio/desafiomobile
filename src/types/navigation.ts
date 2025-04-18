import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Chat: { device: { name: string; address: string } };
};

export type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
export type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;