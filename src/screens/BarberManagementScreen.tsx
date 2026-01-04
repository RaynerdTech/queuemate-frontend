// src/screens/BarberManagementScreen.tsx
import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Clipboard,
  Modal,
} from 'react-native';
import axios from 'axios';
import { Feather, Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../config/api';
import { AuthContext } from '../context/AuthContext';
import AddBarberForm from './AddBarber';

type Service = {
  name: string;
  duration: number;
  _id?: string;
};

type Barber = {
  _id: string;
  name: string;
  status: 'active' | 'On Break' | 'Off Today';
  services: Service[];
  avgDuration: number;
  accessCode: string;
  isActive: boolean;
};

type FilterType = 'all' | 'active' | 'On Break' | 'Off Today';

export default function BarberManagementScreen({ navigation }: any) {
  const auth = useContext(AuthContext);
  const [showAddForm, setShowAddForm] = useState(false);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  useEffect(() => {
    fetchBarbers();
  }, []);

  useEffect(() => {
    filterBarbers();
  }, [barbers, searchQuery, activeFilter]);

  const fetchBarbers = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.BARBER);
      setBarbers(response.data);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to fetch team members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBarbers();
  }, []);

  const filterBarbers = () => {
    let filtered = barbers;
    if (activeFilter !== 'all') {
      filtered = filtered.filter(b => b.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        b =>
          b.name.toLowerCase().includes(query) ||
          b.services.some(s => s.name.toLowerCase().includes(query))
      );
    }
    setFilteredBarbers(filtered);
  };

  const handleCopyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied', 'Access code copied to clipboard');
  };

  const openStatusModal = (barber: Barber) => {
    setSelectedBarber(barber);
    setStatusModalVisible(true);
  };

  const updateBarberStatus = async (newStatus: 'active' | 'On Break' | 'Off Today') => {
    if (!selectedBarber) return;
    
    try {
      await axios.patch(`${API_ENDPOINTS.BARBER}/${selectedBarber._id}`, { status: newStatus });
      fetchBarbers();
      setStatusModalVisible(false);
      setSelectedBarber(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const deleteBarber = async (barberId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this team member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_ENDPOINTS.BARBER}/${barberId}`);
            fetchBarbers();
            Alert.alert('Success', 'Team member deleted');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete team member');
          }
        },
      },
    ]);
  };

  const getFilterCount = (filter: FilterType) => {
    if (filter === 'all') return barbers.length;
    return barbers.filter(b => b.status === filter).length;
  };

  const renderBarberItem = ({ item: barber }: { item: Barber }) => (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
      {/* Barber Header */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold text-xl">
            {barber.name}
          </Text>
          <View className="flex-row items-center mt-1.5">
            <View
              className="w-2 h-2 rounded-full mr-1.5"
              style={{
                backgroundColor:
                  barber.status === 'active'
                    ? '#10B981'
                    : barber.status === 'On Break'
                    ? '#F59E0B'
                    : '#EF4444',
              }}
            />
            <Text
              className={`text-xl font-medium ${
                barber.status === 'active'
                  ? 'text-green-700'
                  : barber.status === 'On Break'
                  ? 'text-yellow-700'
                  : 'text-red-700'
              }`}
            >
              {barber.status === 'active'
                ? 'Active'
                : barber.status === 'On Break'
                ? 'On Break'
                : 'Off Duty'}
            </Text>
          </View>
        </View>
      </View>

      {/* Average Duration */}
      <View className="flex-row items-center mb-3 mt-1">
        <Feather name="clock" size={16} color="#6B7280" />
        <Text className="text-gray-600 text-xl ml-1.5">
          {barber.avgDuration} min average
        </Text>
      </View>

      {/* Services */}
      <View className="flex-row flex-wrap mb-3">
        {barber.services.map((service, idx) => (
          <View
            key={service._id || idx}
            className="bg-gray-100 px-3 py-1.5 rounded-md mr-2 mb-2"
          >
            <Text className="text-gray-700 text-xl">{service.name}</Text>
          </View>
        ))}
      </View>

      {/* Access Code */}
      <View className="flex-row items-center justify-between mb-3 bg-gray-50 px-3 py-3 rounded-lg">
        <View className="flex-row items-center">
          <Text className="text-gray-500 text-xl">Access Code:</Text>
          <Text className="text-gray-900 font-mono font-semibold text-base ml-2">
            {barber.accessCode}
          </Text>
        </View>
        <TouchableOpacity
          className="p-1"
          onPress={() => handleCopyCode(barber.accessCode)}
        >
          <Feather name="copy" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('EditBarber', { barberId: barber._id })
          }
          className="flex-1 bg-blue-50 py-2.5 rounded-lg flex-row items-center justify-center"
        >
          <Feather name="edit-2" size={16} color="#2563EB" />
          <Text className="text-blue-600 font-medium text-xl ml-1.5">Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => openStatusModal(barber)}
          className="flex-1 bg-gray-100 py-2.5 rounded-lg flex-row items-center justify-center"
        >
          <Ionicons name="swap-horizontal" size={16} color="#4B5563" />
          <Text className="text-gray-700 font-medium text-xl ml-1.5">
            Status
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => deleteBarber(barber._id)}
          className="bg-red-50 px-3 py-2.5 rounded-lg"
        >
          <Feather name="trash-2" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (showAddForm) {
    return (
      <AddBarberForm
        onBack={() => setShowAddForm(false)}
        onSuccess={() => {
          setShowAddForm(false);
          fetchBarbers();
        }}
      />
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-12 pb-12">
        <Text className="text-white text-3xl font-bold">Staff Management</Text>
        <Text className="text-blue-100 text-xl mt-1">
          Manage your team and schedules
        </Text>
      </View>

      {/* Add New Barber Button */}
      <TouchableOpacity
        onPress={() => setShowAddForm(true)}
        activeOpacity={0.7}
        className="bg-white mx-6 -mt-6 rounded-xl p-4 flex-row items-center justify-between shadow-md"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
            <Feather name="plus" size={20} color="#2563EB" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-gray-900 font-semibold text-xl">
              Add New Staff
            </Text>
            <Text className="text-gray-500 text-xl mt-0.5">
              Create a new team member
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Search Bar */}
      <View className="px-6 mt-6">
        <View className="bg-gray-50 rounded-xl border border-gray-200 flex-row items-center px-4 py-3">
          <Feather name="search" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-3 text-xl text-gray-900"
            placeholder="Search staffs or services..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="mt-5">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 24 }}
        >
          <TouchableOpacity
            onPress={() => setActiveFilter('all')}
            className={`mr-2 px-5 py-2.5 rounded-full ${
              activeFilter === 'all'
                ? 'bg-blue-600'
                : 'bg-white border border-gray-300'
            }`}
          >
            <Text
              className={`font-medium text-xl ${
                activeFilter === 'all' ? 'text-white' : 'text-gray-700'
              }`}
            >
              All ({getFilterCount('all')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('active')}
            className={`mr-2 px-5 py-2.5 rounded-full ${
              activeFilter === 'active'
                ? 'bg-blue-600'
                : 'bg-white border border-gray-300'
            }`}
          >
            <Text
              className={`font-medium text-xl ${
                activeFilter === 'active' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Active ({getFilterCount('active')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('On Break')}
            className={`mr-2 px-5 py-2.5 rounded-full ${
              activeFilter === 'On Break'
                ? 'bg-blue-600'
                : 'bg-white border border-gray-300'
            }`}
          >
            <Text
              className={`font-medium text-xl ${
                activeFilter === 'On Break' ? 'text-white' : 'text-gray-700'
              }`}
            >
              On Break ({getFilterCount('On Break')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter('Off Today')}
            className={`px-5 py-2.5 rounded-full ${
              activeFilter === 'Off Today'
                ? 'bg-blue-600'
                : 'bg-white border border-gray-300'
            }`}
          >
            <Text
              className={`font-medium text-xl ${
                activeFilter === 'Off Today' ? 'text-white' : 'text-gray-700'
              }`}
            >
              Off Duty ({getFilterCount('Off Today')})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Barbers List */}
      <FlatList
        data={filteredBarbers}
        renderItem={renderBarberItem}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
          />
        }
        ListEmptyComponent={
          loading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : (
            <View className="items-center justify-center py-20">
              <Feather name="users" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 text-xl mt-3">
                No team members found
              </Text>
            </View>
          )
        }
      />

      {/* Status Change Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
          className="flex-1 bg-black/50 justify-center items-center px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
          >
            {/* Modal Header */}
            <View className="bg-blue-600 px-6 py-5">
              <Text className="text-white text-2xl font-bold">
                Change Status
              </Text>
              <Text className="text-blue-100 text-lg mt-1">
                {selectedBarber?.name}
              </Text>
            </View>

            {/* Status Options */}
            <View className="p-4">
              <TouchableOpacity
                onPress={() => updateBarberStatus('active')}
                className="flex-row items-center p-4 rounded-xl mb-2 bg-green-50 border-2 border-green-200"
              >
                <View className="w-4 h-4 rounded-full bg-green-500 mr-3" />
                <View className="flex-1">
                  <Text className="text-green-900 font-semibold text-xl">
                    Active
                  </Text>
                  <Text className="text-green-700 text-base mt-0.5">
                    Available for appointments
                  </Text>
                </View>
                {selectedBarber?.status === 'active' && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => updateBarberStatus('On Break')}
                className="flex-row items-center p-4 rounded-xl mb-2 bg-yellow-50 border-2 border-yellow-200"
              >
                <View className="w-4 h-4 rounded-full bg-yellow-500 mr-3" />
                <View className="flex-1">
                  <Text className="text-yellow-900 font-semibold text-xl">
                    On Break
                  </Text>
                  <Text className="text-yellow-700 text-base mt-0.5">
                    Temporarily unavailable
                  </Text>
                </View>
                {selectedBarber?.status === 'On Break' && (
                  <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => updateBarberStatus('Off Today')}
                className="flex-row items-center p-4 rounded-xl mb-2 bg-red-50 border-2 border-red-200"
              >
                <View className="w-4 h-4 rounded-full bg-red-500 mr-3" />
                <View className="flex-1">
                  <Text className="text-red-900 font-semibold text-xl">
                    Off Duty
                  </Text>
                  <Text className="text-red-700 text-base mt-0.5">
                    Not working today
                  </Text>
                </View>
                {selectedBarber?.status === 'Off Today' && (
                  <Ionicons name="checkmark-circle" size={24} color="#EF4444" />
                )}
              </TouchableOpacity>
            </View>

            {/* Cancel Button */}
            <View className="px-4 pb-4">
              <TouchableOpacity
                onPress={() => setStatusModalVisible(false)}
                className="bg-gray-100 py-3 rounded-xl"
              >
                <Text className="text-gray-700 font-semibold text-xl text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}