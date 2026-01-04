import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/DashboardScreen';
import { AuthContext } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthContext must be used within AuthProvider');

  const { state } = auth;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {state.token ? (
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}
