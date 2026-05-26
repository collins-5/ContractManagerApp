import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Client } from '@/types';
import { getAllClients } from '@/database/database';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClientDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    try {
      const clients = await getAllClients();
      const found = clients.find((c: Client) => c.id === id);
      setClient(found || null);
    } catch (error) {
      console.error('Error loading client:', error);
      Alert.alert('Error', 'Failed to load client details');
    }
  };

  if (!client) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      {/* Custom Header with Back Button and Client Name */}
      <View className="bg-primary px-4 pt-2 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="mr-4 p-2"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-primary-foreground text-xl font-bold flex-1">
            {client.full_name}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 bg-background">
        {/* Header Card with Avatar */}
        <View className="bg-primary px-6 pb-8">
          <View className="items-center">
            <View className="w-24 h-24 bg-card rounded-full items-center justify-center mb-3">
              <Text className="text-4xl font-bold text-primary">
                {client.full_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View className="flex-row items-center mt-2">
              <Ionicons name="call-outline" size={16} color="#fff" />
              <Text className="text-primary-foreground text-base ml-2">{client.phone_number}</Text>
            </View>
          </View>
        </View>

        {/* Contact Details */}
        <View className="bg-card rounded-t-3xl -mt-4 p-5">
          <Text className="text-lg font-bold text-foreground mb-4">Contact Information</Text>
          
          {client.email && (
            <View className="flex-row items-start mb-4">
              <Ionicons name="mail-outline" size={20} color="hsl(var(--primary))" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-muted-foreground">Email</Text>
                <Text className="text-base text-foreground">{client.email}</Text>
              </View>
            </View>
          )}

          <View className="flex-row items-start mb-4">
            <Ionicons name="call-outline" size={20} color="hsl(var(--primary))" />
            <View className="ml-3 flex-1">
              <Text className="text-xs text-muted-foreground">Phone Number</Text>
              <Text className="text-base text-foreground">{client.phone_number}</Text>
            </View>
          </View>

          {client.address && (
            <View className="flex-row items-start mb-4">
              <Ionicons name="location-outline" size={20} color="hsl(var(--primary))" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-muted-foreground">Address</Text>
                <Text className="text-base text-foreground">{client.address}</Text>
              </View>
            </View>
          )}

          {client.notes && (
            <View className="flex-row items-start mb-4">
              <Ionicons name="document-text-outline" size={20} color="hsl(var(--primary))" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-muted-foreground">Notes</Text>
                <Text className="text-base text-foreground">{client.notes}</Text>
              </View>
            </View>
          )}

          <View className="flex-row items-start pt-2 border-t border-border">
            <Ionicons name="calendar-outline" size={20} color="hsl(var(--muted-foreground))" />
            <View className="ml-3 flex-1">
              <Text className="text-xs text-muted-foreground">Added on</Text>
              <Text className="text-sm text-muted-foreground">{formatDate(client.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="p-5 flex-row gap-3 pb-8">
          <TouchableOpacity 
            className="flex-1 bg-primary py-3 rounded-lg flex-row justify-center items-center"
            onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be added')}
          >
            <Ionicons name="create-outline" size={20} color="hsl(var(--primary-foreground))" />
            <Text className="text-primary-foreground font-semibold ml-2">Edit Client</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="flex-1 bg-destructive py-3 rounded-lg flex-row justify-center items-center"
            onPress={() => Alert.alert('Coming Soon', 'Delete functionality will be added')}
          >
            <Ionicons name="trash-outline" size={20} color="hsl(var(--destructive-foreground))" />
            <Text className="text-destructive-foreground font-semibold ml-2">Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}