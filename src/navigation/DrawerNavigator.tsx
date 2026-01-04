// src/navigation/DrawerNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DashboardScreen from '../screens/DashboardScreen';
import ShopSetupScreen from '../screens/ShopSetupScreen';
import EditShopScreen from '../screens/EditShopScreen'; // 🔥 Import the new screen
import CustomDrawerContent from '../components/DrawerContent'; // 🔥 Import the custom content
import BarberManagementScreen from '../screens/BarberManagementScreen'; 


const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      // 🔥 Use the custom drawer component
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        // Optional: Custom styling for drawer labels
        drawerStyle: {
          backgroundColor: '#ffffff', // Ensures consistency if content background is white
        },
        drawerLabelStyle: {
            fontSize: 18,
            fontWeight: '600',
        },
        drawerItemStyle: {
            marginVertical: 0,
        }
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      {/* We keep ShopSetupScreen hidden in the drawer but available for navigation 
        when a user needs to initially create a shop. 
      */}
      <Drawer.Screen
        name="ShopSetup"
        component={ShopSetupScreen}
        options={{ drawerItemStyle: { height: 0, overflow: 'hidden' } }}
      />
      {/* 🔥 The new Edit Shop Screen for management */}
      <Drawer.Screen
        name="EditShop"
        component={EditShopScreen}
        options={{ title: 'Edit Shop Details' }}
      />
      <Drawer.Screen
        name="BarberManagement"
        component={BarberManagementScreen}
        options={{ title: 'Staff Management' }}
      />
    </Drawer.Navigator>
  );
}