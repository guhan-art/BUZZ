import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="buslist" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="driverlogin" />
    </Tabs>
  );
}
