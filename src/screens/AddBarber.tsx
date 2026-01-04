// src/components/AddBarberForm.tsx
import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { Feather, Ionicons } from '@expo/vector-icons';
import { API_ENDPOINTS } from '../config/api';
import { AuthContext } from '../context/AuthContext';

type Service = {
  name: string;
  duration: string;
};

type AddBarberFormProps = {
  onBack: () => void;
  onSuccess: () => void;
};

export default function AddBarberForm({ onBack, onSuccess }: AddBarberFormProps) {
  const auth = useContext(AuthContext);
  if (!auth) return null;

  const [name, setName] = useState('');
  const [services, setServices] = useState<Service[]>([
    { name: '', duration: '30' },
  ]);
  const [status, setStatus] = useState<'active' | 'On Break' | 'Off Today'>('active');
  const [loading, setLoading] = useState(false);

  const updateService = (
    index: number,
    field: keyof Service,
    value: string
  ) => {
    const updated = [...services];
    updated[index][field] = value;
    setServices(updated);
  };

  const addService = () => {
    setServices([...services, { name: '', duration: '30' }]);
  };

  const removeService = (index: number) => {
    if (services.length === 1) return;
    setServices(services.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter the barber\'s name');
      return;
    }

    const cleanedServices = services
      .filter(s => s.name.trim())
      .map(s => ({
        name: s.name.trim(),
        duration: Number(s.duration) || 30,
      }));

    if (!cleanedServices.length) {
      Alert.alert('Required', 'Please add at least one service');
      return;
    }

    try {
      setLoading(true);

      await axios.post(API_ENDPOINTS.BARBER, {
        name,
        services: cleanedServices,
        status,
        avgDuration: Math.round(
          cleanedServices.reduce((a, b) => a + b.duration, 0) /
            cleanedServices.length
        ),
      });

      Alert.alert('Success', 'Team member added successfully');
      onSuccess();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err?.response?.data?.message || 'Failed to add barber'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-5 pt-6">
        {/* Back Button */}
        <TouchableOpacity
          onPress={onBack}
          className="flex-row items-center mb-4"
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
          <Text className="text-xl text-gray-700 ml-2">Back to Management</Text>
        </TouchableOpacity>

        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-semibold text-gray-900">
            Add Team Member
          </Text>
          <Text className="text-xl text-gray-600 mt-1">
            Enter the details for your new team member
          </Text>
        </View>

        {/* Barber Name Section */}
        <View className="mb-5">
          <Text className="text-xl font-medium text-gray-700 mb-2">
            Full Name
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-xl text-gray-900"
            placeholder="Enter name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Services Section */}
        <View className="mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xl font-medium text-gray-700">Services</Text>
            <Text className="text-base text-gray-500">
              {services.length} {services.length === 1 ? 'service' : 'services'}
            </Text>
          </View>

          {services.map((service, index) => (
            <View
              key={index}
              className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-medium text-gray-500 uppercase">
                  Service {index + 1}
                </Text>
                {services.length > 1 && (
                  <TouchableOpacity 
                    onPress={() => removeService(index)}
                    className="p-1"
                  >
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>

              <Text className="text-xl font-medium text-gray-700 mb-2">Service Name</Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5 mb-3 text-xl text-gray-900"
                placeholder="e.g., Haircut"
                placeholderTextColor="#9CA3AF"
                value={service.name}
                onChangeText={v => updateService(index, 'name', v)}
              />

              <Text className="text-xl font-medium text-gray-700 mb-2">Duration (minutes)</Text>
              <View className="flex-row items-center bg-gray-50 border border-gray-300 rounded-lg px-3 py-2.5">
                <Feather name="clock" size={18} color="#6B7280" />
                <TextInput
                  className="flex-1 text-xl text-gray-900 ml-2"
                  placeholder="30"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={service.duration}
                  onChangeText={v => updateService(index, 'duration', v)}
                />
              </View>
            </View>
          ))}

          <TouchableOpacity 
            onPress={addService}
            activeOpacity={0.7}
            className="flex-row items-center justify-center bg-white border border-gray-300 rounded-lg py-3"
          >
            <Feather name="plus" size={18} color="#4B5563" />
            <Text className="text-gray-700 font-medium text-xl ml-2">Add Service</Text>
          </TouchableOpacity>
        </View>

        {/* Status Section */}
        <View className="mb-6">
          <Text className="text-xl font-medium text-gray-700 mb-3">Status</Text>

          {[
            {
              key: 'active',
              label: 'Active',
              desc: 'Available for bookings',
              icon: 'checkmark-circle-outline',
            },
            {
              key: 'On Break',
              label: 'On Break',
              desc: 'Temporarily unavailable',
              icon: 'time-outline',
            },
            {
              key: 'Off Today',
              label: 'Off Today',
              desc: 'Not available today',
              icon: 'close-circle-outline',
            },
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              activeOpacity={0.7}
              onPress={() => setStatus(option.key as any)}
              className={`flex-row items-center bg-white border rounded-lg p-4 mb-2 ${
                status === option.key
                  ? 'border-blue-500'
                  : 'border-gray-200'
              }`}
            >
              <Ionicons 
                name={option.icon as any} 
                size={22} 
                color={status === option.key ? '#3B82F6' : '#9CA3AF'} 
              />

              <View className="flex-1 ml-3">
                <Text className={`font-medium text-xl ${
                  status === option.key ? 'text-gray-900' : 'text-gray-700'
                }`}>{option.label}</Text>
                <Text className="text-xl text-gray-500">{option.desc}</Text>
              </View>

              <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                status === option.key 
                  ? 'border-blue-500' 
                  : 'border-gray-300'
              }`}>
                {status === option.key && (
                  <View className="w-3 h-3 rounded-full bg-blue-500" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={submit}
          disabled={loading}
          activeOpacity={0.8}
          className={`rounded-lg py-3.5 items-center ${
            loading ? 'bg-blue-400' : 'bg-blue-600'
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-xl">
              Add Team Member
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}