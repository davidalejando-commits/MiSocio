// src/navigation/AppNavigator.tsx
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";
import ClientesScreen from "../screens/ClientesScreen";
import InventarioScreen from "../screens/InventarioScreen";
import HistorialScreen from "../screens/HistorialScreen";
import NuevoClienteScreen from "../screens/NuevoClienteScreen";
import NuevoProductoScreen from "../screens/NuevoProductoScreen";
import EstadoCuentaScreen from "../screens/EstadoCuentaScreen";
import NuevaVentaScreen from "../screens/NuevaVentaScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function ClientesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientesList" component={ClientesScreen} />
      <Stack.Screen name="NuevoCliente" component={NuevoClienteScreen} />
      <Stack.Screen name="EstadoCuenta" component={EstadoCuentaScreen} />
    </Stack.Navigator>
  );
}

function VentasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NuevaVenta" component={NuevaVentaScreen} />
    </Stack.Navigator>
  );
}

function InventarioStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="InventarioList" component={InventarioScreen} />
      <Stack.Screen name="NuevoProducto" component={NuevoProductoScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#1A56FF",
          tabBarInactiveTintColor: "#888",
          tabBarStyle: { height: 60, paddingBottom: 8 },
          tabBarIcon: ({ focused, color, size }) => {
            const icons: Record<string, string> = {
              Home: focused ? "home" : "home-outline",
              Clients: focused ? "people" : "people-outline",
              Sales: focused ? "cart" : "cart-outline",
              Inventory: focused ? "archive" : "archive-outline",
              History: focused ? "time" : "time-outline",
            };
            return (
              <Ionicons
                name={icons[route.name] as any}
                size={size}
                color={color}
              />
            );
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{ title: "Home" }}
        />
        <Tab.Screen
          name="Clients"
          component={ClientesStack}
          options={{ title: "Clients" }}
        />
        <Tab.Screen
  name="Sales"
  component={VentasStack}
  options={{
    title: "Ventas",
    tabBarLabel: () => null,
    tabBarIcon: ({ focused }) => (
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: focused ? "#1A56FF" : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="cart"
          size={24}
          color={focused ? "#fff" : "#888"}
        />
      </View>
    ),
  }}
/>
        <Tab.Screen
          name="Inventory"
          component={InventarioStack}
          options={{ title: "Inventory" }}
        />
        <Tab.Screen
          name="History"
          component={HistorialScreen}
          options={{ title: "History" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
