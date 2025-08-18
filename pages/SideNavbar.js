import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  useWindowDimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Drawer as PaperDrawer,
  List,
  Text,
  Divider,
  Chip,
  Avatar,
  IconButton,
  useTheme,
  Portal,
  Modal,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// You would replace this with your navigation logic (e.g., from React Navigation)
const mockNavigate = (path) => {
  Alert.alert("Navigation", `Navigating to ${path}`);
};

const SideNavbar = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const menuItems = [
    { text: 'Dashboard', icon: 'dashboard', path: '/', color: theme.colors.primary },
    { text: 'Manage Rooms', icon: 'hotel', path: '/rooms', color: theme.colors.tertiary },
    { text: 'New Booking', icon: 'book-online', path: '/booking', color: theme.colors.warning },
    { text: 'Active Bookings', icon: 'event-available', path: '/active-bookings', color: theme.colors.success },
    { text: 'All Bookings', icon: 'history', path: '/all-bookings', color: theme.colors.accent },
  ];

  const drawerContent = (
    <View style={[styles.drawerContainer, { backgroundColor: theme.colors.surface }]}>
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        {/* Close button for mobile */}
        {isMobile && (
          <IconButton
            icon="close"
            iconColor={theme.colors.onPrimary}
            onPress={onClose}
            style={styles.closeButton}
          />
        )}
        <View style={styles.headerContent}>
          <Avatar.Text
            size={64}
            label="SBA"
            style={[styles.avatar, { backgroundColor: `${theme.colors.onPrimary}20` }]}
            labelStyle={styles.avatarLabel}
          />
          <Text variant="titleLarge" style={[styles.title, { color: theme.colors.onPrimary }]}>
            SBA Rooms
          </Text>
         <Chip
      textStyle={{ color: theme.colors.onPrimary }}
      style={[styles.chip, { backgroundColor: theme.colors.primary }]}
    >
      Management System
    </Chip>
        </View>
      </View>

      {/* Navigation Menu */}
      <View style={styles.menuContainer}>
        <List.Section style={{ flex: 1, paddingHorizontal: 8 }}>
          {menuItems.map((item, index) => (
            <Animated.View
              key={item.path}
              entering={FadeIn.duration(300).delay(index * 100)}
            >
              <TouchableOpacity
                onPress={() => {
                  mockNavigate(item.path);
                  if (isMobile) onClose();
                }}
                style={styles.navItem}
              >
                <List.Item
                  title={item.text}
                  left={() => <Icon name={item.icon} size={24} color={item.color} />}
                  style={{ borderRadius: 8, backgroundColor: 'transparent' }}
                  titleStyle={{ color: theme.colors.onSurfaceVariant }}
                />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </List.Section>
      </View>

      <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.onSurfaceDisabled }]}>
          © 2025 SBA Rooms
        </Text>
        <Text style={[styles.footerVersion, { color: theme.colors.onSurfaceDisabled }]}>
          Version 1.0.0
        </Text>
      </View>
    </View>
  );

  if (isMobile) {
    return (
      <Portal>
        <Modal
          visible={isOpen}
          onDismiss={onClose}
          contentContainerStyle={[styles.mobileModal, { backgroundColor: theme.colors.surface }]}
        >
          {drawerContent}
        </Modal>
      </Portal>
    );
  }

  return (
    <View style={[styles.desktopDrawer, { borderRightColor: theme.colors.outlineVariant }]}>
      {drawerContent}
    </View>
  );
};

const styles = StyleSheet.create({
  // Shared styles for both mobile and desktop drawers
  drawerContainer: {
    flex: 1,
    width: '100%',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 16,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLabel: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuContainer: {
    flexGrow: 1,
    paddingTop: 16,
  },
  navItem: {
    borderRadius: 8,
    marginVertical: 4,
  },
  divider: {
    marginHorizontal: 16,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
  footerVersion: {
    fontSize: 10,
    marginTop: 4,
  },
  
  // Mobile-specific styles
  mobileModal: {
    width: 280,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    margin: 0,
  },

  // Desktop-specific styles
  desktopDrawer: {
    width: 280,
    height: '100%',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
});

export default SideNavbar;