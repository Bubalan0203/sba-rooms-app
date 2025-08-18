import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import your converted pages
import DashboardPage from './pages/DashboardPage';
import RoomsPage from './pages/RoomsPage';
import BookingPage from './pages/BookingPage';
import ActiveBookingsPage from './pages/ActiveBookingsPage';
import AllBookingsPage from './pages/AllBookingsPage';


const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <PaperProvider >
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              switch (route.name) {
                case 'Dashboard':
                  iconName = 'dashboard';
                  break;
                case 'Rooms':
                  iconName = 'hotel';
                  break;
                case 'Booking':
                  iconName = 'book-online';
                  break;
                case 'Active':
                  iconName = 'event-available';
                  break;
                case 'History':
                  iconName = 'history';
                  break;
                default:
                  iconName = 'circle';
                  break;
              }
              return <Icon name={iconName} size={size} color={color} />;
            },
           
            headerShown: false, // Hides the header on each page
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