import { View, Text, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { getAllProjects, getAllPayments } from '@/database/database';
import { Project, Payment } from '@/types';
import { Ionicons } from '@expo/vector-icons';

export default function ReportsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const loadData = async () => {
    const projectsData = await getAllProjects();
    const paymentsData = await getAllPayments();
    setProjects(projectsData as Project[]);
    setPayments(paymentsData as Payment[]);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalRemaining = totalBudget - totalSpent;
  const percentageSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const proposalProjects = projects.filter(p => p.status === 'proposal').length;

  const formatCurrency = (amount: number) => {
    return `KSh ${amount.toLocaleString()}`;
  };

  const getPaymentByCategory = () => {
    const categories: { [key: string]: number } = {};
    payments.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + p.amount;
    });
    return categories;
  };

  const categoryTotals = getPaymentByCategory();

  return (
    <ScrollView className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold text-foreground mb-4">Financial Reports</Text>
      
      {/* Summary Cards */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-card rounded-lg p-3 shadow-sm">
          <Text className="text-xs text-muted-foreground">Total Budget</Text>
          <Text className="text-lg font-bold text-foreground">{formatCurrency(totalBudget)}</Text>
        </View>
        <View className="flex-1 bg-card rounded-lg p-3 shadow-sm">
          <Text className="text-xs text-muted-foreground">Total Spent</Text>
          <Text className="text-lg font-bold text-success">{formatCurrency(totalSpent)}</Text>
        </View>
        <View className="flex-1 bg-card rounded-lg p-3 shadow-sm">
          <Text className="text-xs text-muted-foreground">Remaining</Text>
          <Text className={`text-lg font-bold ${totalRemaining >= 0 ? 'text-foreground' : 'text-destructive'}`}>
            {formatCurrency(Math.abs(totalRemaining))}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="bg-card rounded-lg p-4 mb-4 shadow-sm">
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-foreground">Overall Progress</Text>
          <Text className="text-sm text-foreground">{percentageSpent.toFixed(1)}%</Text>
        </View>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View className="h-full bg-primary rounded-full" style={{ width: `${Math.min(percentageSpent, 100)}%` }} />
        </View>
      </View>

      {/* Project Stats */}
      <View className="bg-card rounded-lg p-4 mb-4 shadow-sm">
        <Text className="text-md font-semibold text-foreground mb-3">Project Status</Text>
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary">{activeProjects}</Text>
            <Text className="text-xs text-muted-foreground">Active</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-warning">{proposalProjects}</Text>
            <Text className="text-xs text-muted-foreground">Proposals</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-success">{completedProjects}</Text>
            <Text className="text-xs text-muted-foreground">Completed</Text>
          </View>
        </View>
      </View>

      {/* Spending by Category */}
      <View className="bg-card rounded-lg p-4 mb-4 shadow-sm">
        <Text className="text-md font-semibold text-foreground mb-3">Spending by Category</Text>
        {Object.entries(categoryTotals).length > 0 ? (
          Object.entries(categoryTotals).map(([category, amount]) => (
            <View key={category} className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-foreground capitalize">{category}</Text>
                <Text className="text-sm text-foreground">{formatCurrency(amount)}</Text>
              </View>
              <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${(amount / totalSpent) * 100}%` }}
                />
              </View>
            </View>
          ))
        ) : (
          <Text className="text-center text-muted-foreground">No spending data yet</Text>
        )}
      </View>

      {/* Top Projects by Spending */}
      <View className="bg-card rounded-lg p-4 mb-4 shadow-sm">
        <Text className="text-md font-semibold text-foreground mb-3">Projects by Spending</Text>
        {projects
          .sort((a, b) => b.actual_cost - a.actual_cost)
          .slice(0, 5)
          .map((project) => (
            <View key={project.id} className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-foreground flex-1" numberOfLines={1}>
                  {project.project_name}
                </Text>
                <Text className="text-sm text-foreground">{formatCurrency(project.actual_cost)}</Text>
              </View>
              <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${(project.actual_cost / project.budget) * 100}%` }}
                />
              </View>
            </View>
          ))}
        {projects.length === 0 && (
          <Text className="text-center text-muted-foreground">No projects yet</Text>
        )}
      </View>
    </ScrollView>
  );
}