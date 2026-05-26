import { View, Text, FlatList } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { getAllPayments, getProjectById } from '@/database/database';
import { Payment, Project } from '@/types';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [projects, setProjects] = useState<Map<string, Project>>(new Map());

  const loadPayments = async () => {
    const paymentsData = await getAllPayments();
    setPayments(paymentsData as Payment[]);
    
    // Load project names for each payment
    const projectMap = new Map();
    for (const payment of paymentsData) {
      if (!projectMap.has(payment.project_id)) {
        const project = await getProjectById(payment.project_id);
        projectMap.set(payment.project_id, project);
      }
    }
    setProjects(projectMap);
  };

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [])
  );

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'material': return 'cube-outline';
      case 'labor': return 'people-outline';
      case 'transport': return 'car-outline';
      case 'permit': return 'document-text-outline';
      case 'equipment': return 'hardware-chip-outline';
      default: return 'receipt-outline';
    }
  };

  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold text-foreground mb-4">All Payments</Text>
      
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const project = projects.get(item.project_id);
          return (
            <View className="bg-card rounded-lg p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground">
                    {item.item_description}
                  </Text>
                  {project && (
                    <Text className="text-sm text-primary mt-1">
                      {project.project_name}
                    </Text>
                  )}
                </View>
                <Text className="text-success font-bold text-base">
                  {formatCurrency(item.amount)}
                </Text>
              </View>
              
              <View className="flex-row items-center mt-2">
                <Ionicons name={getCategoryIcon(item.category)} size={14} color="hsl(var(--muted-foreground))" />
                <Text className="text-xs text-muted-foreground ml-1 capitalize">
                  {item.category}
                </Text>
                <Text className="text-xs text-muted-foreground mx-2">•</Text>
                <Ionicons name="calendar-outline" size={14} color="hsl(var(--muted-foreground))" />
                <Text className="text-xs text-muted-foreground ml-1">
                  {formatDate(item.payment_date)}
                </Text>
              </View>
              
              {item.notes && (
                <Text className="text-xs text-muted-foreground mt-2" numberOfLines={1}>
                  📝 {item.notes}
                </Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text className="text-center text-muted-foreground mt-8">
            No payments yet. Add your first payment!
          </Text>
        }
      />
    </View>
  );
}