// Navigation setup for the Digital Meeting app
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { HomeScreen } from '@/screens/HomeScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { MeetingDetailsScreen } from '@/screens/MeetingDetailsScreen';
import { MeetingsScreen } from '@/screens/MeetingsScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { ReportsScreen } from '@/screens/ReportsScreen';
import { SubmittedTasksScreen } from '@/screens/SubmittedTasksScreen';
import { TasksScreen } from '@/screens/TasksScreen';
import { colors } from '@/theme/appTheme';
import type { MainTabParamList, RootStackParamList } from '@/types/app';
import { AdminDashboard } from '@/screens/AdminDashboard';
import { UserManagement } from '@/screens/UserManagement';
import { isAdmin } from '@/utils/format';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ focused, label }: { focused: boolean; label: string }) {
  // Map label identifiers to Ionicons names
  const iconMap: Record<string, string> = {
    Home: 'home-outline',
    Dashboard: 'speedometer-outline',
    UserManagement: 'people-outline',
    ManageMeetings: 'calendar-outline',
    ActionItems: 'list-outline',
    SubmittedTasks: 'cloud-upload-outline',
    Reports: 'bar-chart-outline',
    Profile: 'person-outline',
    Meetings: 'people-outline',
    Tasks: 'checkbox-outline',
    // Add more mappings as needed
  };
  const iconName = iconMap[label] || 'ellipse-outline';
  const color = focused ? colors.primary : colors.muted;
  return <Ionicons name={iconName} size={24} color={color} />;
}

function TabLabel({ color, label }: { color: string; label: string }) {
  return <Text style={[styles.tabLabelText, { color }]}>{label}</Text>;
}

function MainTabs() {
  const { isAuthenticated, user } = useAuth();
  const admin = isAuthenticated && isAdmin(user);
  const tabOptions = {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: [styles.tabBar, admin && styles.adminTabBar],
    tabBarShowLabel: false,
    tabBarLabelStyle: styles.tabLabel,
  };

  if (admin) {
    return (
      <Tab.Navigator screenOptions={tabOptions}>
        <Tab.Screen
          name="Dashboard"
          component={AdminDashboard}
          options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Dashboard" /> }}
        />
        <Tab.Screen
          name="UserManagement"
          component={UserManagement}
          options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="UserManagement" /> }}
        />
        <Tab.Screen
          name="ManageMeetings"
          component={MeetingsScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="ManageMeetings" /> }}
        />
        <Tab.Screen
          name="ActionItems"
          component={TasksScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="ActionItems" /> }}
        />
        <Tab.Screen
          name="SubmittedTasks"
          component={SubmittedTasksScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="SubmittedTasks" /> }}
        />
        <Tab.Screen
          name="Reports"
          component={ReportsScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Reports" /> }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Profile" /> }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Home" /> }} />
      <Tab.Screen name="Meetings" component={MeetingsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Meetings" /> }} />
      <Tab.Screen name="Tasks" component={TasksScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Tasks" /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="Profile" /> }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  console.log('=> AppNavigator rendering, loading:', loading, 'isAuthenticated:', isAuthenticated);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  console.log('=> AppNavigator rendering NavigationContainer');
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? 'Main' : 'Login'}
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.background },
        }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="MeetingDetails" component={MeetingDetailsScreen} options={({ route }) => ({ title: route.params.title || 'Meeting Details' })} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    minHeight: 62,
    paddingBottom: 8,
    paddingTop: 8,
  },
  adminTabBar: {
    minHeight: 72,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabLabelText: {
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
    textAlign: 'center',
  },
  tabIcon: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  tabIconFocused: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  tabIconText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  tabIconTextFocused: {
    color: colors.text,
  },
});
