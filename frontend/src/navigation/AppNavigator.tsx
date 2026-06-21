/**
 * AppNavigator — Bottom tab navigation with 4 main screens.
 * Design: Deep navy (#0A1628) tab bar with green (#00E676) active indicator.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import LogActivityScreen from '../screens/LogActivityScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import { useUser } from '../context/UserContext';

const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation, isDesktop }: any) {
  const { logout } = useUser();
  if (!isDesktop) {
    return (
      <View style={styles.bottomTabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : (options.title !== undefined ? options.title : route.name);
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const icons: Record<string, [string, string]> = {
            Home: ['leaf', 'leaf-outline'],
            Log: ['add-circle', 'add-circle-outline'],
            Challenges: ['trophy', 'trophy-outline'],
            Profile: ['person', 'person-outline'],
          };
          const [active, inactive] = icons[route.name] ?? ['circle', 'circle-outline'];

          return (
            <TouchableOpacity accessible={true} accessibilityRole="button" aria-label="Navigation Button"  key={route.key} onPress={onPress} style={styles.bottomTabButton} activeOpacity={0.7}>
              <Ionicons
                name={(isFocused ? active : inactive) as any}
                size={22}
                color={isFocused ? '#2C5E43' : '#8A857A'}
              />
              <Text style={[styles.bottomTabLabel, { color: isFocused ? '#2C5E43' : '#8A857A' }]}>
                {label === 'Log' ? 'Log Day' : label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Render Left Navigation Sidebar for Widescreen Desktop!
  return (
    <View style={styles.sidebar}>
      {/* Brand Title */}
      <View style={styles.sidebarHeader}>
        <Text style={styles.brandTitle}>EcoPulse</Text>
        <Text style={styles.brandSubtitle}>Carbon Hero</Text>
      </View>

      {/* Menu Container */}
      <View style={styles.menuContainer}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const icons: Record<string, string> = {
            Home: 'grid',
            Log: 'add-circle',
            Challenges: 'flash',
            Profile: 'people',
          };
          const iconName = icons[route.name] || 'circle';

          const labelMap: Record<string, string> = {
            Home: 'Dashboard',
            Log: 'Activity Log',
            Challenges: 'Challenges',
            Profile: 'Leaderboard',
          };
          const label = labelMap[route.name] || route.name;

          return (
            <TouchableOpacity accessible={true} accessibilityRole="button" aria-label="Navigation Button" 
              key={route.key}
              onPress={onPress}
              style={[styles.sidebarMenuItem, isFocused && styles.sidebarMenuItemActive]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={(isFocused ? iconName : iconName + '-outline') as any}
                size={20}
                color={isFocused ? '#0F172A' : '#94A3B8'}
                style={{ marginRight: 12 }}
              />
              <Text style={[styles.menuItemLabel, isFocused && styles.menuItemLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer CTA Button */}
      <View style={styles.sidebarFooter}>
        <TouchableOpacity accessible={true} accessibilityRole="button" aria-label="Navigation Button" 
          style={styles.newActionButton}
          onPress={() => navigation.navigate('Log')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#0F172A" style={{ marginRight: 6 }} />
          <Text style={styles.newActionText}>New Action</Text>
        </TouchableOpacity>

        <TouchableOpacity accessible={true} accessibilityRole="button" aria-label="Navigation Button" 
          style={styles.logoutButton}
          onPress={() => logout()}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color="#94A3B8" style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AppNavigator() {
  const { userId } = useUser();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  if (!userId) {
    return <LoginScreen />;
  }

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} isDesktop={isDesktop} />}
      sceneContainerStyle={{ paddingLeft: isDesktop ? 240 : 0, backgroundColor: '#FAF8F5' }}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Log" component={LogActivityScreen} />
      <Tab.Screen name="Challenges" component={ChallengesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Bottom Tab Bar
  bottomTabBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6E2D8',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 6,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  // Sidebar Tab Bar
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 240,
    backgroundColor: '#0F172A',
    paddingTop: 48,
    paddingHorizontal: 20,
    borderRightWidth: 1,
    borderRightColor: '#1E293B',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingBottom: 32,
    zIndex: 1000,
  },
  sidebarHeader: {
    marginBottom: 36,
  },
  brandTitle: {
    color: '#00E5FF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContainer: {
    flex: 1,
    gap: 8,
  },
  sidebarMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sidebarMenuItemActive: {
    backgroundColor: '#00E5FF',
  },
  menuItemLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  menuItemLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  sidebarFooter: {
    marginTop: 'auto',
  },
  newActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  newActionText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    backgroundColor: 'transparent',
  },
  logoutText: {
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 14,
  },
});
