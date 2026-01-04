// src/components/DrawerContent.tsx

import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { state, logout } = useContext(AuthContext)!;

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: logout, 
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container} className="bg-white flex-1">
      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false}>
        {/* Header/User Info */}
        <View className="px-6 py-8 mb-2 bg-blue-600">
          <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
            <MaterialCommunityIcons name="account-circle" size={36} color="#ffffff" />
          </View>
          <Text className="text-3xl font-bold text-white mb-1">
            Shop Owner
          </Text>
          <Text className="text-blue-100 text-xl">
            {state.userEmail || 'Loading...'}
          </Text>
        </View>

        {/* Default Drawer Items */}
        <View className="px-2 py-4">
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>
      
      {/* Logout Button */}
      <View className="px-6 py-6 border-t border-gray-200">
        <TouchableOpacity 
          onPress={handleLogout} 
          className="flex-row items-center px-4 py-3.5 rounded-xl bg-red-50"
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={24} color="#ef4444" />
          <Text className="text-red-600 font-semibold ml-3 text-xl">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});