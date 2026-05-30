import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';

export default function TabLayout() {
  return (
    <>
      <StatusBar barStyle={"light-content"} backgroundColor="#2C4A6E" />
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: '#2C4A6E',
            tabBarInactiveTintColor: '#8E8E93',
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopColor: '#E5E5EA',
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="projects"
            options={{
              title: 'Projects',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="construct-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="contacts"
            options={{
              title: 'Contacts',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="people-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="payments"
            options={{
              title: 'Payments',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="cash-outline" size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="reports"
            options={{
              title: 'Reports',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="stats-chart-outline" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
    </>
  );
}