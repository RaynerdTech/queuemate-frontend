// src/screens/EditShopScreen.tsx
import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  ScrollView, 
  StatusBar,
  TextInputProps,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  useColorScheme
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { useNavigation } from '@react-navigation/native';
import debounce from 'lodash.debounce'; 
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api'; 
import { AuthContext } from '../context/AuthContext'; // Import AuthContext

const GEOAPIFY_API_KEY = 'b1544f1b7dcb4560a1579317ab36cefe'; 
const DEBOUNCE_DELAY = 500;

// --- HELPER FUNCTIONS (REUSED FROM ShopSetupScreen) ---
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Function to parse the hours string "9:00 AM - 7:00 PM" back into Date objects
const parseHoursStringToDates = (hoursString: string | undefined): { open: Date, close: Date } => {
    const defaultOpen = new Date(); defaultOpen.setHours(9, 0, 0, 0);
    const defaultClose = new Date(); defaultClose.setHours(19, 0, 0, 0);

    if (!hoursString) return { open: defaultOpen, close: defaultClose };

    try {
        const [openStr, closeStr] = hoursString.split(' - ').map(s => s.trim());
        
        const openDate = new Date();
        // Use a simple parsing method that works cross-platform with AM/PM strings
        const openTime = new Date(`2000/01/01 ${openStr}`);
        if (isNaN(openTime.getTime())) return { open: defaultOpen, close: defaultClose };

        const closeDate = new Date();
        const closeTime = new Date(`2000/01/01 ${closeStr}`);
        if (isNaN(closeTime.getTime())) return { open: defaultOpen, close: defaultClose };

        return { 
            open: new Date(openDate.setHours(openTime.getHours(), openTime.getMinutes(), 0, 0)), 
            close: new Date(closeDate.setHours(closeTime.getHours(), closeTime.getMinutes(), 0, 0)) 
        };
    } catch (e) {
        console.error("Error parsing hours string:", e);
        return { open: defaultOpen, close: defaultClose };
    }
};

// --- ICON ---
const ShopIcon = () => (
  <View className="bg-blue-600 w-16 h-16 rounded-2xl items-center justify-center shadow-lg shadow-blue-600/40 border-4 border-gray-100 dark:border-gray-900">
    <Text style={{ fontSize: 30 }}>✍️</Text>
  </View>
);

// --- REUSABLE FORM INPUT (REUSED) ---
interface FormInputProps extends TextInputProps {
  label: string;
}

const FormInput = ({ label, ...props }: FormInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View className="mb-5">
      <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </Text>
      <TextInput
        {...props}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor="#9CA3AF"
        className={`bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 ${
          isFocused ? 'border-blue-500 bg-white dark:bg-gray-800' : ''
        }`}
        style={Platform.OS === 'ios' && { height: 50 }}
      />
    </View>
  );
};

// --- TIME PICKER (REUSED) ---
interface TimeInputProps {
  label: string;
  time: Date;
  setTime: (date: Date) => void;
}

const TimeInput = ({ label, time, setTime }: TimeInputProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const onAndroidChange = (event: any, selectedDate: Date | undefined) => {
    setShowPicker(false);
    if (selectedDate) setTime(selectedDate);
  };

  const onIOSChange = (event: any, selectedDate: Date | undefined) => {
    if (selectedDate) setTime(selectedDate);
  };

  return (
    <View className="flex-1">
      <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </Text>
      
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 px-3 py-3.5 rounded-xl items-center justify-center"
        style={Platform.OS === 'ios' && { height: 50 }}
      >
        <Text className="text-gray-900 dark:text-white font-medium text-center" numberOfLines={1}>
          {formatTime(time)}
        </Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker value={time} mode="time" display="default" onChange={onAndroidChange} />
      )}

      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent={true} animationType="fade" visible={showPicker}>
          <View className="flex-1 justify-end bg-black/60">
            <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
              <View className="flex-1" />
            </TouchableWithoutFeedback>
            <View className="bg-white dark:bg-gray-900 pb-10 rounded-t-3xl">
              <View className="flex-row justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800">
                <Text className="text-gray-500 dark:text-gray-400">Select {label}</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)} className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                  <Text className="text-blue-600 dark:text-blue-400 font-bold">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={time}
                mode="time"
                display="spinner"
                onChange={onIOSChange}
                style={{ height: 200, backgroundColor: isDark ? '#111827' : '#fff' }}
                textColor={isDark ? '#fff' : '#000'}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};


// ------------------------------------------------------------------

export default function EditShopScreen() {
  const navigation = useNavigation();
  const { state } = useContext(AuthContext)!;
  const shopId = state.shopId; // We need the ID for fetching and updating

  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  
  // Initialize with default times, will be updated in useEffect
  const defaultTime = new Date(); defaultTime.setHours(9, 0, 0, 0); 
  const [openingTime, setOpeningTime] = useState(defaultTime);
  const [closingTime, setClosingTime] = useState(defaultTime);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Location logic (Reused from ShopSetupScreen)
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const shouldSearchRef = useRef(true);

  // --- 1. Fetch Existing Shop Data ---
  useEffect(() => {
    if (!shopId) {
        Alert.alert('Error', 'Shop ID not found. Please log in again.');
        navigation.goBack();
        return;
    }

    const fetchShopDetails = async () => {
        setIsFetching(true);
        try {
            // Use GETSHOP endpoint with the shop ID
            const url = API_ENDPOINTS.GETSHOP.replace(':slugOrId', shopId); 
            const res = await axios.get(url);
            const shopData = res.data;

            setShopName(shopData.name || '');
            setPhone(shopData.phone || '');
            setLocation(shopData.location || '');

            // Parse hours string into Date objects for the pickers
            const { open, close } = parseHoursStringToDates(shopData.hours);
            setOpeningTime(open);
            setClosingTime(close);

        } catch (err: any) {
            console.error('Failed to fetch shop details:', err.response?.data || err.message);
            Alert.alert('Error', 'Failed to load shop details.');
        } finally {
            setIsFetching(false);
        }
    };

    fetchShopDetails();
  }, [shopId]);


  // --- LOCATION AUTOCOMPLETE (REUSED) ---
  const fetchLocationSuggestions = async (text: string) => {
    if (text.length < 3 || !shouldSearchRef.current) {
      setLocationSuggestions([]);
      return;
    }
    setIsSearchingLocation(true);
    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&apiKey=${GEOAPIFY_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.features) {
        setLocationSuggestions(data.features.map((f: any) => f.properties.formatted));
      }
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const debouncedFetchSuggestions = useCallback(
    debounce((text: string) => fetchLocationSuggestions(text), DEBOUNCE_DELAY),
    []
  );

  const handleLocationChange = (text: string) => {
    shouldSearchRef.current = true;
    setLocation(text);
    debouncedFetchSuggestions(text);
  };

  const handleLocationSelect = (selected: string) => {
    shouldSearchRef.current = false;
    setLocation(selected);
    setLocationSuggestions([]);
    Keyboard.dismiss();
  };


  // --- 2. Handle Update Shop ---
  const handleUpdateShop = async () => {
    if (!shopId) return;
    const hoursString = `${formatTime(openingTime)} - ${formatTime(closingTime)}`;

    if (!shopName || !phone || !location) {
      Alert.alert('Missing info', 'Fill all fields');
      return;
    }

    setIsLoading(true);

    try {
      // Use the UPDATESHOP endpoint and replace the ID placeholder
      const updateUrl = API_ENDPOINTS.UPDATESHOP.replace(':id', shopId);
      
      // 🔥 Send PUT request to update the shop
      await axios.put(updateUrl, {
        name: shopName,
        phone,
        location,
        hours: hoursString,
        // Status is not updated here, it's done on the dashboard
      });

      Alert.alert('Success', 'Shop details updated successfully!');
      
      // Navigate back to the Dashboard
      navigation.goBack(); 

    } catch (err: any) {
      console.error("Update failed:", err.response?.data?.message || err.message);
      Alert.alert('Error', err.response?.data?.message || 'Failed to update shop.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER ---
  
  if (isFetching) {
    return (
      <View className="flex-1 bg-gray-100 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-gray-500 dark:text-gray-400">Loading shop details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      className="flex-1 bg-gray-100 dark:bg-gray-900"
    >
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="w-full max-w-md self-center mt-10">
           
          <View className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-visible">

            <View className="absolute -top-8 self-center">
              <ShopIcon />
            </View>

            <View className="pt-12 pb-8 px-6">
              <View className="items-center mb-6">
                <Text className="text-2xl font-extrabold text-gray-900 dark:text-white">Edit Business Details</Text>
                <Text className="text-gray-500 text-sm mt-1">Update your shop's information below.</Text>
              </View>

              <FormInput label="Shop Name" value={shopName} onChangeText={setShopName} placeholder="e.g. Fade Masters" />
              <FormInput label="Phone Number" value={phone} onChangeText={setPhone} placeholder="e.g. +234 80..." keyboardType="phone-pad" />

              <View className="relative mb-4">
                <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">Business Location</Text>
                <TextInput 
                  value={location}
                  onChangeText={handleLocationChange}
                  placeholder="Start typing address..."
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700"
                />
                {(isSearchingLocation || locationSuggestions.length > 0) && (
                  <View className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600 max-h-48 z-20">
                    {isSearchingLocation ? (
                      <View className="p-4 items-center"><ActivityIndicator color="#4F46E5" /></View>
                    ) : (
                      <ScrollView keyboardShouldPersistTaps="handled">
                        {locationSuggestions.map((item, i) => (
                          <TouchableOpacity key={i} className="p-3 border-b border-gray-100 dark:border-gray-600" onPress={() => handleLocationSelect(item)}>
                            <Text className="text-gray-800 dark:text-white text-sm">{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
              </View>

              <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mt-2 mb-1">Operating Hours</Text>
              <View className="flex-row gap-4">
                <TimeInput label="Opens" time={openingTime} setTime={setOpeningTime} />
                <TimeInput label="Closes" time={closingTime} setTime={setClosingTime} />
              </View>

              <TouchableOpacity 
                onPress={handleUpdateShop} 
                disabled={isLoading}
                className={`mt-8 rounded-xl py-4 flex-row justify-center items-center shadow-lg shadow-blue-500/30 ${isLoading ? 'bg-blue-400' : 'bg-blue-600 active:bg-blue-700'}`}
              >
                {isLoading && <ActivityIndicator color="#fff" className="mr-2" />}
                <Text className="text-white font-bold text-lg">{isLoading ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>

            </View>
          </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}