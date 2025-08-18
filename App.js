import React from 'react';
import { StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

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
                  iconName = 'analytics';
                  break;
                case 'Rooms':
                  iconName = 'bed';
                  break;
                case 'Booking':
                  iconName = 'add-circle';
                  break;
                case 'Active':
                  iconName = 'time';
                  break;
                case 'History':
                  iconName = 'library';
                  break;
                default:
                  iconName = 'ellipse';
                  break;
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2196F3',
            tabBarInactiveTintColor: 'gray',
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