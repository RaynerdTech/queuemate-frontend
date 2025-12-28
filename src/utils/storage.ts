// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setToken = async (token: string) => {
  await AsyncStorage.setItem('token', token);
};

export const getToken = async () => {
  return AsyncStorage.getItem('token');
};

export const removeToken = async () => {
  await AsyncStorage.removeItem('token');
};

export const setUser = async (userJson: string) => {
  await AsyncStorage.setItem('user', userJson);
};

export const getUser = async () => {
  return AsyncStorage.getItem('user');
};

export const clearAll = async () => {
  await AsyncStorage.clear();
};
