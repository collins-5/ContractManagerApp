import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getProjectById, getProjectPayments, getClientById, updateProjectStatus } from '@/database/database';
import { Project, Payment, Client } from '@/types';

export default function ProjectDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    try {
      const projectData = await getProjectById(id);
      setProject(projectData as Project);
      
      if (projectData) {
        const clientData = await getClientById(projectData.client_id);
        setClient(clientData as Client);
        
        const paymentsData = await getProjectPayments(id);
        setPayments(paymentsData as Payment[]);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      Alert.alert('Error', 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateProjectStatus(id, newStatus);
      // Reload the project data instead of trying to update state manually
      await loadProjectData();
      Alert.alert('Success', `Project status updated to ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Not set';
    return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'text-success';
      case 'proposal': return 'text-warning';
      case 'completed': return 'text-primary';
      case 'on_hold': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-success';
      case 'proposal': return 'bg-warning';
      case 'completed': return 'bg-primary';
      case 'on_hold': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'bg-destructive';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-success';
      default: return 'bg-muted';
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBudget = (project?.budget || 0) - totalPaid;
  const percentageSpent = project?.budget ? (totalPaid / project.budget) * 100 : 0;

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <Text className="text-muted-foreground">Project not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header Section */}
      <View className="bg-primary p-6 pb-8">
        <View className="mb-4">
          <Text className="text-primary-foreground text-2xl font-bold">{project.project_name}</Text>
          <View className="flex-row items-center mt-2">
            <View className={`px-3 py-1 rounded-full ${getStatusBgColor(project.status)}`}>
              <Text className="text-white text-xs font-semibold uppercase">{project.status}</Text>
            </View>
            <View className={`ml-2 px-3 py-1 rounded-full ${getPriorityColor(project.priority)}`}>
              <Text className="text-white text-xs font-semibold uppercase">{project.priority}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Client Info */}
      <View className="bg-card rounded-t-3xl -mt-4 p-5">
        <View className="flex-row items-center mb-4">
          <Ionicons name="person-outline" size={24} color="hsl(var(--primary))" />
          <View className="ml-3">
            <Text className="text-xs text-muted-foreground">Client</Text>
            <Text className="text-foreground font-semibold">{client?.full_name}</Text>
            <Text className="text-muted-foreground text-sm">{client?.phone_number}</Text>
          </View>
        </View>

        {/* Budget Section */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Budget Overview</Text>
          <View className="bg-background rounded-lg p-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-muted-foreground">Total Budget:</Text>
              <Text className="text-foreground font-semibold">{formatCurrency(project.budget)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-muted-foreground">Total Paid:</Text>
              <Text className="text-success font-semibold">{formatCurrency(totalPaid)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-muted-foreground">Remaining:</Text>
              <Text className={remainingBudget >= 0 ? 'text-foreground font-semibold' : 'text-destructive font-semibold'}>
                {formatCurrency(Math.abs(remainingBudget))}
                {remainingBudget < 0 && ' (Overspent)'}
              </Text>
            </View>
            <View className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <View 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${Math.min(percentageSpent, 100)}%` }}
              />
            </View>
            <Text className="text-right text-xs text-muted-foreground mt-1">
              {percentageSpent.toFixed(1)}% spent
            </Text>
          </View>
        </View>

        {/* Description */}
        {project.description && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Description</Text>
            <Text className="text-muted-foreground">{project.description}</Text>
          </View>
        )}

        {/* Dates */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Timeline</Text>
          <View className="space-y-2">
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color="hsl(var(--muted-foreground))" />
              <Text className="text-muted-foreground text-sm ml-2">
                Start: {formatDate(project.start_date)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="flag-outline" size={16} color="hsl(var(--muted-foreground))" />
              <Text className="text-muted-foreground text-sm ml-2">
                Expected End: {formatDate(project.expected_end_date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Payments */}
        {payments.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">Recent Payments</Text>
            {payments.slice(0, 5).map((payment) => (
              <View key={payment.id} className="bg-background rounded-lg p-3 mb-2">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-semibold text-foreground">{payment.item_description}</Text>
                    <Text className="text-xs text-muted-foreground mt-1">
                      {formatDate(payment.payment_date)} • {payment.category}
                    </Text>
                  </View>
                  <Text className="text-success font-semibold">{formatCurrency(payment.amount)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-2">
          <TouchableOpacity
            className="flex-1 bg-primary py-3 rounded-lg flex-row justify-center items-center"
            onPress={() => router.push(`/payment/add?projectId=${project.id}`)}
          >
            <Ionicons name="cash-outline" size={20} color="hsl(var(--primary-foreground))" />
            <Text className="text-primary-foreground font-semibold ml-2">Add Payment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="flex-1 bg-secondary py-3 rounded-lg flex-row justify-center items-center"
            onPress={() => {
              const statuses = ['proposal', 'active', 'on_hold', 'completed'];
              Alert.alert(
                'Update Status',
                'Select new status',
                statuses.map(s => ({
                  text: s.toUpperCase(),
                  onPress: () => handleStatusChange(s)
                }))
              );
            }}
          >
            <Ionicons name="sync-outline" size={20} color="hsl(var(--secondary-foreground))" />
            <Text className="text-secondary-foreground font-semibold ml-2">Update Status</Text>
          </TouchableOpacity>
        </View> 
      </View>
    </ScrollView>
  );
}