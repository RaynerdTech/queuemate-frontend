// src/components/DrawerContent.tsx (Corrected)

import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { state, logout } = useContext(AuthContext)!;

  const handleLogout = () => {
    // ... (Logout logic remains the same)
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
    <View style={styles.container} className="bg-white dark:bg-gray-900 flex-1">
      <DrawerContentScrollView {...props}>
        {/* Header/User Info */}
        <View className="p-4 mb-4 border-b border-gray-200 dark:border-gray-700">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            Shop Owner Account
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-1 text-[16px]">
            {state.userEmail || 'Loading...'} {/* Display the email */}
          </Text>
        </View>

        {/* Default Drawer Items */}
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      
      {/* Logout Button */}
      <View className="p-4 border-t border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={handleLogout} className="flex-row items-center p-3 rounded-xl bg-red-50 dark:bg-red-900/40">
          <MaterialCommunityIcons name="logout" size={24} color="#ef4444" />
          <Text className="text-red-500 font-semibold ml-4 text-lg">
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