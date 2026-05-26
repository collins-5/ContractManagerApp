import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getDashboardStats, getRecentPayments } from '@/database/database';

export default function DashboardScreen() {
  const [stats, setStats] = useState({
    activeProjects: 0,
    proposalProjects: 0,
    completedProjects: 0,
    onHoldProjects: 0,
    totalBudget: 0,
    totalSpent: 0,
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const statsData = await getDashboardStats();
    const paymentsData = await getRecentPayments(5);
    setStats(statsData);
    setRecentPayments(paymentsData);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  };

  const remaining = stats.totalBudget - stats.totalSpent;
  const percentageSpent = stats.totalBudget > 0 ? (stats.totalSpent / stats.totalBudget) * 100 : 0;

  const quickActions = [
    { icon: 'briefcase-outline', label: 'New Project', href: '/project/add', color: '#2C4A6E' },
    { icon: 'cash-outline', label: 'Add Payment', href: '/payment/add', color: '#34C759' },
    { icon: 'person-add-outline', label: 'New Client', href: '/client/add', color: '#FF9500' },
    { icon: 'construct-outline', label: 'New Worker', href: '/worker/add', color: '#5856D6' },
  ];

  return (
    <ScrollView 
      className="flex-1 bg-background"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View className="bg-primary px-5 pt-8 pb-6">
        <Text className="text-primary-foreground text-3xl font-bold">Dashboard</Text>
        <Text className="text-primary-foreground/80 text-base mt-1">Welcome back! 👷‍♂️</Text>
      </View>

      {/* Stats Cards */}
      <View className="px-4 -mt-6">
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-card rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-muted-foreground text-xs">Active</Text>
              <View className="w-8 h-8 rounded-full bg-success/10 items-center justify-center">
                <Ionicons name="play-circle" size={16} color="#34C759" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-foreground">{stats.activeProjects}</Text>
            <Text className="text-xs text-muted-foreground mt-1">ongoing projects</Text>
          </View>
          
          <View className="flex-1 bg-card rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-muted-foreground text-xs">Proposals</Text>
              <View className="w-8 h-8 rounded-full bg-warning/10 items-center justify-center">
                <Ionicons name="document-text" size={16} color="#FF9500" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-foreground">{stats.proposalProjects}</Text>
            <Text className="text-xs text-muted-foreground mt-1">pending proposals</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-card rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-muted-foreground text-xs">Completed</Text>
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                <Ionicons name="checkmark-circle" size={16} color="#2C4A6E" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-foreground">{stats.completedProjects}</Text>
            <Text className="text-xs text-muted-foreground mt-1">finished projects</Text>
          </View>
          
          <View className="flex-1 bg-card rounded-xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-muted-foreground text-xs">On Hold</Text>
              <View className="w-8 h-8 rounded-full bg-destructive/10 items-center justify-center">
                <Ionicons name="pause-circle" size={16} color="#FF3B30" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-foreground">{stats.onHoldProjects}</Text>
            <Text className="text-xs text-muted-foreground mt-1">paused projects</Text>
          </View>
        </View>
      </View>

      {/* Financial Overview */}
      <View className="mx-4 mb-4 bg-card rounded-xl p-5 shadow-sm">
        <Text className="text-lg font-semibold text-foreground mb-3">Financial Overview</Text>
        
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted-foreground">Total Budget</Text>
          <Text className="text-foreground font-semibold">{formatCurrency(stats.totalBudget)}</Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-muted-foreground">Total Spent</Text>
          <Text className="text-success font-semibold">{formatCurrency(stats.totalSpent)}</Text>
        </View>
        <View className="flex-row justify-between mb-3">
          <Text className="text-muted-foreground">Remaining</Text>
          <Text className={`font-semibold ${remaining >= 0 ? 'text-foreground' : 'text-destructive'}`}>
            {formatCurrency(Math.abs(remaining))}
          </Text>
        </View>
        
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
          <View 
            className="h-full bg-primary rounded-full" 
            style={{ width: `${Math.min(percentageSpent, 100)}%` }}
          />
        </View>
        <Text className="text-right text-xs text-muted-foreground">
          {percentageSpent.toFixed(1)}% spent
        </Text>
      </View>

      {/* Quick Actions */}
      <View className="mx-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Quick Actions</Text>
        <View className="flex-row flex-wrap gap-2">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href as any} asChild>
              <TouchableOpacity 
                className="bg-card rounded-xl p-3 flex-row items-center shadow-sm"
                style={{ width: '48%' }}
              >
                <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: `${action.color}15` }}>
                  <Ionicons name={action.icon as any} size={18} color={action.color} />
                </View>
                <Text className="text-foreground font-medium text-sm ml-2">{action.label}</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </View>

      {/* Recent Payments */}
      <View className="mx-4 mb-6">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-semibold text-foreground">Recent Payments</Text>
          <Link href="/(tabs)/payments" asChild>
            <TouchableOpacity>
              <Text className="text-primary text-sm">See All</Text>
            </TouchableOpacity>
          </Link>
        </View>
        
        {recentPayments.length === 0 ? (
          <View className="bg-card rounded-xl p-8 items-center">
            <Ionicons name="receipt-outline" size={40} color="hsl(var(--muted-foreground))" />
            <Text className="text-muted-foreground text-center mt-2">No payments yet</Text>
          </View>
        ) : (
          recentPayments.map((payment) => (
            <View key={payment.id} className="bg-card rounded-xl p-4 mb-2 shadow-sm">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{payment.item_description}</Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    {payment.project_name}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="calendar-outline" size={12} color="hsl(var(--muted-foreground))" />
                    <Text className="text-xs text-muted-foreground ml-1">{formatDate(payment.payment_date)}</Text>
                    <View className="w-1 h-1 rounded-full bg-muted-foreground mx-2" />
                    <Text className="text-xs text-muted-foreground capitalize">{payment.category}</Text>
                  </View>
                </View>
                <Text className="text-success font-bold">{formatCurrency(payment.amount)}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}