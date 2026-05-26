import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getEngineerById } from '@/database/database';
import { Engineer } from '@/types';

export default function EngineerDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEngineer();
  }, [id]);

  const loadEngineer = async () => {
    try {
      const data = await getEngineerById(id);
      setEngineer(data as Engineer);
    } catch (error) {
      console.error('Error loading engineer:', error);
      Alert.alert('Error', 'Failed to load engineer details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not set';
    return `KSh ${amount.toLocaleString()}/hour`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  if (!engineer) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-muted-foreground">Engineer not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header Card */}
      <View className="bg-primary p-6 pb-8">
        <View className="items-center">
          <View className="w-24 h-24 bg-card rounded-full items-center justify-center mb-3 shadow-sm">
            <Text className="text-4xl font-bold text-primary">
              {engineer.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-primary-foreground text-2xl font-bold text-center">
            {engineer.full_name}
          </Text>
          <View className="flex-row items-center mt-2">
            <Ionicons name="call-outline" size={16} color="#fff" />
            <Text className="text-primary-foreground text-base ml-2">{engineer.phone_number}</Text>
          </View>
        </View>
      </View>

      {/* Details Section */}
      <View className="bg-card rounded-t-3xl -mt-4 p-5">
        <Text className="text-lg font-bold text-foreground mb-4">Professional Information</Text>
        
        {engineer.email && (
          <View className="flex-row items-start mb-4">
            <Ionicons name="mail-outline" size={20} color="hsl(var(--primary))" />
            <View className="ml-3 flex-1">
              <Text className="text-xs text-muted-foreground">Email</Text>
              <Text className="text-base text-foreground">{engineer.email}</Text>
            </View>
          </View>
        )}

        <View className="flex-row items-start mb-4">
          <Ionicons name="call-outline" size={20} color="hsl(var(--primary))" />
          <View className="ml-3 flex-1">
            <Text className="text-xs text-muted-foreground">Phone Number</Text>
            <Text className="text-base text-foreground">{engineer.phone_number}</Text>
          </View>
        </View>

        {engineer.specialty && (
          <View className="flex-row items-start mb-4">
            <Ionicons name="briefcase-outline" size={20} color="hsl(var(--primary))" />
            <View className="ml-3 flex-1">
              <Text className="text-xs text-muted-foreground">Specialty</Text>
              <Text className="text-base text-foreground">{engineer.specialty}</Text>
            </View>
          </View>
        )}

        {engineer.hourly_rate && (
          <View className="flex-row items-start mb-4">
            <Ionicons name="cash-outline" size={20} color="hsl(var(--primary))" />
            <View className="ml-3 flex-1">
              <Text className="text-xs text-muted-foreground">Hourly Rate</Text>
              <Text className="text-base text-foreground font-semibold">
                {formatCurrency(engineer.hourly_rate)}
              </Text>
            </View>
          </View>
        )}

        {engineer.notes && (
          <View className="flex-row items-start mb-4">
            <Ionicons name="document-text-outline" size={20} color="hsl(var(--primary))" />
            <View className="ml-3 flex-1">
              <Text className="text-xs text-muted-foreground">Notes</Text>
              <Text className="text-base text-foreground">{engineer.notes}</Text>
            </View>
          </View>
        )}

        <View className="flex-row items-start pt-2 border-t border-border">
          <Ionicons name="calendar-outline" size={20} color="hsl(var(--muted-foreground))" />
          <View className="ml-3 flex-1">
            <Text className="text-xs text-muted-foreground">Added on</Text>
            <Text className="text-sm text-muted-foreground">{formatDate(engineer.created_at)}</Text>
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
          <Text className="text-primary-foreground font-semibold ml-2">Edit Engineer</Text>
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
  );
}