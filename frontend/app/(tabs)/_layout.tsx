import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tabs.Screen
        name="capture"
        options={{
          title: '撮影',
        }}
      />
      <Tabs.Screen
        name="result"
        options={{
          title: '結果',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
        }}
      />
    </Tabs>
  );
}
