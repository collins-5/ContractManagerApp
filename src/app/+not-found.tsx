import { router, Stack } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { Image, View } from "react-native";

const NotFoundScreen = () => {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 px-6 items-center justify-center">
        <Text className="text-6xl font-bold text-foreground mb-2">404</Text>
        <Text className="text-2xl font-semibold text-foreground mb-2">
          Page Not Found
        </Text>
        <Text className="text-base text-muted-foreground text-center max-w-xs mb-10">
          Oops! Looks like this page took a wrong turn and got lost.
        </Text>
        <TouchableOpacity
          className="w-full text-center"
          onPress={() => router.replace("/(tabs)")}
          
        >
          <Text>Go back</Text>
        </TouchableOpacity>
        
      </View>
    </>
  );
};

export default NotFoundScreen;
