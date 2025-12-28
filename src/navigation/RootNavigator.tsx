// src/navigation/RootNavigator.tsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import DrawerNavigator from './DrawerNavigator';
import ShopSetupScreen from '../screens/ShopSetupScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const auth = useContext(AuthContext);
  const { state } = auth!;

  if (state.loading) return null;

  // Not logged in → show auth
  if (!state.token) {
    return <AuthNavigator />;
  }

  // Logged in but no shop yet → show setup screen
  if (state.token && !state.shopId) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ShopSetup" component={ShopSetupScreen} />
      </Stack.Navigator>
    );
  }

  // Logged in + has shop → drawer
  return <DrawerNavigator />;
}
