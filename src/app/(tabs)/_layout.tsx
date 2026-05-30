import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PatientTabsLayout() {
  const insets = useSafeAreaInsets();

  const TAB_BAR_BASE_HEIGHT = 60;
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;

  return (
    <>
      <StatusBar barStyle={"light-content"} backgroundColor="#2C4A6E" />
      <View style={{ height: insets.top, backgroundColor: 'red' }} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#2a4b7c",
          tabBarInactiveTintColor: "#6b7280",
          tabBarStyle: {
            backgroundColor: "#ffffff",
            height: tabBarHeight,         
            paddingBottom: insets.bottom, 
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: "#f3f4f6",
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