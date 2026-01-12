import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

interface EditBarberModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  barber: any;
}

const EditBarberModal = ({ isVisible, onClose, onSuccess, barber }: EditBarberModalProps) => {
  const [name, setName] = useState('');
  const [newService, setNewService] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [avgDuration, setAvgDuration] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (barber && isVisible) {
      setName(barber.name);
      setServices(barber.services || []);
      setAvgDuration(barber.avgDuration?.toString() || '');
      setStatus(barber.status);
    }
  }, [barber, isVisible]);

  const addService = () => {
    if (newService.trim()) {
      setServices([...services, { name: newService.trim() }]);
      setNewService('');
    }
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (!name || !avgDuration) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const url = API_ENDPOINTS.EDITBARBER.replace(':barberId', barber._id);
      
      await axios.patch(url, {
        name,
        services,
        avgDuration: parseInt(avgDuration),
        status,
      });

      onSuccess();
    } catch (error) {
      Alert.alert('Error', 'Failed to update staff member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center px-5">
        <View className="bg-white rounded-lg w-full max-w-md overflow-hidden">
          {/* Header */}
          <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <Text className="text-gray-900 text-xl font-semibold">Edit staff</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <ScrollView className="px-6 py-5" keyboardShouldPersistTaps="handled">
            {/* Name Field */}
            <Text className="text-gray-700 text-xl mb-2 font-medium">Name</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 mb-5 text-gray-900 text-xl"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9CA3AF"
            />

            {/* Services Field */}
            <Text className="text-gray-700 text-xl mb-2 font-medium">Services</Text>
            <View className="flex-row mb-3">
              <TextInput
                className="flex-1 border border-gray-300 rounded-l-lg px-3 py-3 text-gray-900 text-xl"
                placeholder="Add a service"
                value={newService}
                onChangeText={setNewService}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity 
                onPress={addService}
                className="bg-blue-500 px-6 justify-center items-center rounded-r-lg"
              >
                <Text className="text-white font-semibold text-xl">Add</Text>
              </TouchableOpacity>
            </View>

            {/* Service Chips */}
            <View className="flex-row flex-wrap mb-5">
              {services.map((service, index) => (
                <View key={index} className="bg-blue-100 flex-row items-center px-3 py-2 rounded-md mr-2 mb-2">
                  <Text className="text-blue-700 text-xl mr-2">{service.name}</Text>
                  <TouchableOpacity onPress={() => removeService(index)}>
                    <Feather name="x" size={14} color="#1D4ED8" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Average Duration Field */}
            <Text className="text-gray-700 text-xl mb-2 font-medium">Average Duration (minutes)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-3 mb-5 text-gray-900 text-xl"
              value={avgDuration}
              onChangeText={setAvgDuration}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />

            {/* Status Field */}
            <Text className="text-gray-700 text-xl mb-2 font-medium">Status</Text>
            <View className="flex-row mb-6" style={{ gap: 8 }}>
              <TouchableOpacity 
                onPress={() => setStatus('active')}
                className={`flex-1 py-3 rounded-lg items-center border-2 ${status === 'active' ? 'bg-green-50 border-green-500' : 'bg-white border-gray-300'}`}
              >
                <Text className={`font-medium text-lg ${status === 'active' ? 'text-green-700' : 'text-gray-600'}`}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setStatus('On Break')}
                className={`flex-1 py-3 rounded-lg items-center border-2 ${status === 'On Break' ? 'bg-gray-50 border-gray-400' : 'bg-white border-gray-300'}`}
              >
                <Text className={`font-medium text-lg ${status === 'On Break' ? 'text-gray-700' : 'text-gray-600'}`}>Break</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setStatus('Off Today')}
                className={`flex-1 py-3 rounded-lg items-center border-2 ${status === 'Off Today' ? 'bg-gray-50 border-gray-400' : 'bg-white border-gray-300'}`}
              >
                <Text className={`font-medium text-lg ${status === 'Off Today' ? 'text-gray-700 '  : 'text-gray-600'}`}>Off</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Buttons */}
            <View className="flex-row" style={{ gap: 12 }}>
              <TouchableOpacity 
                onPress={onClose}
                className="flex-1 border border-gray-300 py-3.5 rounded-lg items-center bg-white"
              >
                <Text className="text-gray-700 font-medium text-xl">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleUpdate}
                disabled={loading}
                className="flex-1 bg-blue-600 py-3.5 rounded-lg items-center"
              >
                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-semibold text-xl">Update Barber</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default EditBarberModal;