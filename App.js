import React from 'react';
import { StyleSheet } from 'react-native';
import { PaperProvider, useTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Import your pages
import DashboardPage from './pages/DashboardPage';
import RoomsPage from './pages/RoomsPage';
import BookingPage from './pages/BookingPage';
import ActiveBookingsPage from './pages/ActiveBookingsPage';
import AllBookingsPage from './pages/AllBookingsPage';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              switch (route.name) {
                case 'Dashboard':
                  iconName = 'chart-line';
                  break;
                case 'Rooms':
                  iconName = 'bed';
                  break;
                case 'Booking':
                  iconName = 'plus-circle';
                  break;
                case 'Active':
                  iconName = 'clock-time-three';
                  break;
                case 'History':
                  iconName = 'history';
                  break;
                default:
                  iconName = 'circle-outline';
                  break;
              }
              return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2196F3', // This will be fixed in the next version, but can be customized here
            tabBarInactiveTintColor: 'gray', // This will be fixed in the next version, but can be customized here
            headerShown: false,
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardPage} />
          <Tab.Screen name="Rooms" component={RoomsPage} />
          <Tab.Screen name="Booking" component={BookingPage} />
          <Tab.Screen name="Active" component={ActiveBookingsPage} />
          <Tab.Screen name="History" component={AllBookingsPage} />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
  };

export default App;