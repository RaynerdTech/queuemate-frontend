import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Share,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { AuthContext } from '../context/AuthContext';

// --- Types ---
type Shop = {
  name: string;
  slug?: string;
  phone?: string;
  location?: string;
  hours?: string;
  status?: 'open' | 'close' | 'frozen';
  _id: string;
};

type QueueItem = {
  _id: string;
  name: string;
  barber: string | { name?: string };
  serviceName: string;
  serviceDuration: number;
  status: string;
  createdAt: string;
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // 🔥 FIX 1: Get 'setShopIdLocally' so we can clear bad IDs
  const { state, setShopIdLocally } = useContext(AuthContext)!;
  const shopId = state.shopId;

  const [shop, setShop] = useState<Shop | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- API Calls ---
  const fetchShop = useCallback(
    async (currentShopId: string) => {
      try {
        const url = API_ENDPOINTS.GETSHOP.replace(':slugOrId', currentShopId);
        const res = await axios.get(url);

        if (!res.data) {
          throw new Error('Shop data is empty');
        }
        setShop(res.data);
      } catch (err: any) {
        // 🔥 FIX 2: BREAK THE LOOP
        // If 404, the shop ID is invalid. We MUST clear it from context
        // before redirecting, otherwise ShopSetup will send us right back.
        if (err.response && err.response.status === 404) {
          console.log('Shop not found (404), clearing ID and redirecting...');
          if (setShopIdLocally) {
            await setShopIdLocally('');
          }
        } else {
          console.warn('fetchShop error', err);
        }

        navigation.reset({
          index: 0,
          routes: [{ name: 'ShopSetup' as never }],
        });
      }
    },
    [navigation, setShopIdLocally]
  );

  const fetchQueue = useCallback(async (currentShopId: string) => {
    try {
      const url = API_ENDPOINTS.GETQUEUE.replace(':id', currentShopId);
      const res = await axios.get(url);
      setQueue(res.data || []);
    } catch (err) {
      console.warn('fetchQueue err', err);
    }
  }, []);

  const refreshData = useCallback(async () => {
    if (!shopId) return;
    setRefreshing(true);
    await Promise.all([fetchShop(shopId), fetchQueue(shopId)]);
    setRefreshing(false);
  }, [shopId, fetchShop, fetchQueue]);

  // --- Initial Data Fetch & Polling ---
  useEffect(() => {
    if (state.loading) return;

    // Redirect if no shopId exists in context
    if (!shopId) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'ShopSetup' as never }],
      });
      return;
    }

    setLoading(true);
    refreshData().finally(() => setLoading(false));

    const t = setInterval(() => {
      if (isFocused && shopId) {
        fetchQueue(shopId);
      }
    }, 8000);

    return () => clearInterval(t);
  }, [shopId, state.loading, isFocused, refreshData, navigation, fetchQueue]);

  // --- Actions ---

  const handleCopyLink = async () => {
    if (!shop) return;
    const link = `queuely.app/${shop.slug || shop._id}`;
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async () => {
    if (!shop) return;
    const link = `https://${API_BASE_URL.replace('https://', '').replace(/\/$/, '')}/shops/${shop.slug || shop._id}`;
    try {
      await Share.share({
        message: `Join our queue at ${shop.name}: ${link}`,
        title: `Join Queue - ${shop.name}`,
      });
    } catch (err) {
      console.warn(err);
    }
  };

  const toggleShopStatus = async (newStatus: 'open' | 'close' | 'frozen') => {
    if (!shopId) return;

    const previousShop = shop;
    setShop((prev) => (prev ? { ...prev, status: newStatus } : null));

    try {
      const updateUrl = API_ENDPOINTS.UPDATESHOP.replace(':id', shopId);
      const res = await axios.put(updateUrl, { status: newStatus });
      setShop(res.data.shop);
    } catch (err: any) {
      setShop(previousShop);
      Alert.alert('Error', err.response?.data?.message || 'Could not update shop status');
    }
  };

  // --- Helpers ---
  const totalToday = queue.length;
  const completed = queue.filter((q) => q.status === 'completed').length;
  const waiting = queue.filter((q) => q.status === 'waiting').length;
  const publicLinkDisplay = shop ? `queuely.app/${shop.slug || shop._id}` : 'Loading...';

  // --- Render ---

  if (state.loading || (!shopId && !shop)) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!shop) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* 1. Header Section */}
      <View className="flex-row items-start justify-between border-b border-gray-100 bg-white px-4 pb-4 pt-4 dark:border-gray-700 dark:bg-gray-800">
        {/* Name + Location (Left Column) */}
        <View className="mr-2 flex-1 flex-col">
          <Text
            className="text-xl font-bold text-black dark:text-white"
            numberOfLines={1}
            ellipsizeMode="tail">
            {shop.name}
          </Text>
          <Text className="mt-1 text-lg text-gray-500 dark:text-gray-400" numberOfLines={2}>
            {shop.location}
          </Text>
        </View>

        {/* Status + Hours (Right Column) */}
        <View className="flex-col items-end">
          {/* Status Pill */}
          <View
            className={`mb-1.5 rounded-full px-3 py-1.5 ${
              shop.status === 'open'
                ? 'bg-emerald-600'
                : shop.status === 'frozen'
                  ? 'bg-amber-600'
                  : 'bg-red-600'
            }`}>
            <Text className="text-xs font-bold uppercase tracking-wide text-white">
              {shop.status || 'CLOSE'}
            </Text>
          </View>

          {/* Hours Display */}
          {shop.hours && (
            <Text className="text-right text-sm font-medium text-gray-400 dark:text-gray-500">
              {shop.hours}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-2 pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} />}
        showsVerticalScrollIndicator={false}>
        {/* 2. Public Queue Link Card */}
        <View className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Text className="mb-3 text-xl font-semibold text-black dark:text-white">
            Your Public Queue Link
          </Text>

          <View className="mb-4 rounded-xl bg-gray-100 px-4 py-3.5 dark:bg-gray-700">
            <Text className="text-lg font-medium text-blue-500 dark:text-blue-400">
              {publicLinkDisplay}
            </Text>
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleCopyLink}
              activeOpacity={0.7}
              className={`flex-1 flex-row items-center justify-center rounded-xl py-3 ${copied ? 'bg-green-600' : 'bg-blue-600'}`}>
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={20}
                color="white"
              />
              <Text className="ml-2 text-lg font-bold text-white">
                {copied ? 'Copied!' : 'Copy Link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShareLink}
              activeOpacity={0.7}
              className="flex-1 flex-row items-center justify-center rounded-xl border border-gray-200 bg-gray-100 py-3 dark:border-gray-600 dark:bg-gray-700">
              <Feather name="share-2" size={18} color="#374151" className="dark:text-gray-300" />
              <Text className="ml-2 text-lg font-bold text-gray-700 dark:text-gray-300">Share</Text>
            </TouchableOpacity>
          </View>

          <Text className="mt-3 text-left text-xl text-gray-500 dark:text-gray-400">
            Customers use this link to join your queue.
          </Text>
        </View>

        {/* 3. Quick Actions Grid */}
        <View className="mb-5 flex-row gap-3">
          <TouchableOpacity
            className="flex-1 items-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            onPress={() => navigation.navigate('Barbers' as never)}>
            <View className="mb-2 rounded-[14px] bg-blue-50 p-3 dark:bg-blue-900/50">
              <Feather name="user-plus" size={24} color="#2563eb" />
            </View>
            <Text className="text-center text-xl text-black dark:text-white">Add Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            onPress={() => navigation.navigate('Barbers' as never)}>
            <View className="mb-2 rounded-[14px] bg-purple-50 p-3 dark:bg-purple-900/50">
              <Feather name="users" size={24} color="#9333ea" />
            </View>
            <Text className="text-center text-xl text-black dark:text-white">Manage Barbers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 items-center rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            onPress={() => navigation.navigate('Controls' as never)}>
            <View className="mb-2 rounded-[14px] bg-gray-100 p-3 dark:bg-gray-700">
              <Feather name="settings" size={24} color="#4b5563" />
            </View>
            <Text className="text-center text-xl text-black dark:text-white">Shop Settings</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Daily Stats */}
        <View className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Text className="mb-4 text-xl font-bold text-black dark:text-white">Daily Stats</Text>
          <View className="flex-row justify-between">
            <View className="flex-1 items-center">
              <Text className="text-2xl text-black dark:text-white">
                {loading && !refreshing ? '-' : totalToday}
              </Text>
              <Text className="mt-1 text-center text-xl text-gray-500 dark:text-gray-400">
                Total Customers Today
              </Text>
            </View>
            <View className="mx-1 h-16 w-[1px] self-center bg-gray-200 dark:bg-gray-700" />
            <View className="flex-1 items-center">
              <Text className="text-2xl text-emerald-500">
                {loading && !refreshing ? '-' : completed}
              </Text>
              <Text className="mt-1 text-center text-xl text-gray-500 dark:text-gray-400">
                Completed
              </Text>
            </View>
            <View className="mx-1 h-16 w-[1px] self-center bg-gray-200 dark:bg-gray-700" />
            <View className="flex-1 items-center">
              <Text className="text-2xl text-blue-500">
                {loading && !refreshing ? '-' : waiting}
              </Text>
              <Text className="mt-1 text-center text-xl text-gray-500 dark:text-gray-400">
                Waiting
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Shop Controls */}
        <View className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Text className="mb-4 text-xl text-black dark:text-white">Shop Controls</Text>

          <View className="mb-3 flex-row gap-3">
            <TouchableOpacity
              onPress={() => toggleShopStatus('open')}
              className={`flex-1 flex-row items-center justify-center rounded-xl border p-3 ${
                shop.status === 'open'
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/40'
                  : 'border-emerald-100 bg-white dark:border-emerald-800 dark:bg-gray-900/50'
              }`}>
              <MaterialCommunityIcons name="door-open" size={20} color="#10b981" />
              <Text className="ml-2 text-xl font-bold text-emerald-500">Open Shop</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleShopStatus('close')}
              className={`flex-1 flex-row items-center justify-center rounded-xl border p-3 ${
                shop.status === 'close'
                  ? 'border-rose-200 bg-rose-50 dark:border-rose-700 dark:bg-rose-900/40'
                  : 'border-rose-100 bg-white dark:border-rose-800 dark:bg-gray-900/50'
              }`}>
              <MaterialCommunityIcons name="door-closed" size={20} color="#f43f5e" />
              <Text className="ml-2 text-xl font-bold text-rose-500">Close Shop</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => toggleShopStatus(shop.status === 'frozen' ? 'open' : 'frozen')}
            className={`w-full flex-row items-center justify-center rounded-xl border p-3 ${
              shop.status === 'frozen'
                ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/40'
                : 'border-amber-200 bg-white dark:border-amber-800 dark:bg-gray-900/50'
            }`}>
            <MaterialCommunityIcons name="pause" size={20} color="#d97706" />
            <Text className="ml-2 text-xl font-bold text-amber-600">
              {shop.status === 'frozen' ? 'Unfreeze Queue' : 'Freeze Queue'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 6. Today's Queue List */}
        <View className="mb-10 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Text className="mb-4 text-xl text-black dark:text-white">Today's Queue</Text>

          {loading && !refreshing ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : queue.filter((q) => q.status === 'waiting').length === 0 ? (
            <View className="items-center py-6">
              <Text className="text-xl text-gray-500 dark:text-gray-400">
                Queue is currently empty
              </Text>
            </View>
          ) : (
            queue
              .filter((q) => q.status === 'waiting')
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .map((item, index) => (
                <View
                  key={item._id}
                  className={`flex-row items-start justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700 ${index !== 0 ? 'mt-3' : ''}`}>
                  <View className="flex-1">
                    <Text className="mb-1 text-xl text-black dark:text-white">{item.name}</Text>
                    <View className="flex-col">
                      <Text className="mb-1 text-xl text-gray-500 dark:text-gray-400">
                        Barber:{' '}
                        {(typeof item.barber === 'object' ? item.barber?.name : item.barber) ||
                          'Any Barber'}
                      </Text>
                      <Text className="text-xl text-black dark:text-white">{item.serviceName}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center rounded border border-gray-100 bg-white px-2 py-1 dark:border-gray-500 dark:bg-gray-600">
                    <Feather name="clock" size={14} color="#2563eb" />
                    <Text className="ml-1.5 text-xl font-medium text-blue-600">
                      {item.serviceDuration} min
                    </Text>
                  </View>
                </View>
              ))
          )}
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
