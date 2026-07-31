import { StatusBar } from "expo-status-bar";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Text } from "react-native";
import { colors } from "./src/theme";
import SearchScreen from "./src/screens/SearchScreen";
import SelfTransferScreen from "./src/screens/SelfTransferScreen";
import TrackedRoutesScreen from "./src/screens/TrackedRoutesScreen";
import DealsScreen from "./src/screens/DealsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.panel,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

const TAB_ICONS: Record<string, string> = {
  Search: "🔍",
  "Self-Transfer": "✈️",
  Tracked: "🔔",
  Deals: "📰",
  Settings: "⚙️",
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textDimmer,
            tabBarStyle: { backgroundColor: colors.panel, borderTopColor: colors.border },
            tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>,
          })}
        >
          <Tab.Screen name="Search" component={SearchScreen} />
          <Tab.Screen name="Self-Transfer" component={SelfTransferScreen} />
          <Tab.Screen name="Tracked" component={TrackedRoutesScreen} />
          <Tab.Screen name="Deals" component={DealsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
