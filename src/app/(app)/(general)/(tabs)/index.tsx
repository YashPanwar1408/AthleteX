import { Link } from "expo-router";
import React from "react";
import { SafeAreaView, Text, View } from "react-native";

export default function Page() {
  return (
    <SafeAreaView className="flex flex-1">

      <Content />
    </SafeAreaView>
  );
}

function Content() {
  return (
    <View className="flex-1">
      <Text className="text-center text-2xl mt-10">Welcome to the Fitness App!</Text>
    </View>
  );
}
