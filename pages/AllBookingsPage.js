import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  Provider as PaperProvider,
  Appbar,
  Text,
  Button,
  Card,
  Chip,
  Avatar,
  ActivityIndicator,
  useTheme,
  Dialog,
  Portal,
  TextInput,
  List,
  Divider,
  Icon,
  Surface,
  Badge,
} from "react-native-paper";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { db } from "../config/firebase";

// SBA Color Scheme
const sbaColors = {
  primary: {
    main: '#2563eb',
    light: '#60a5fa',
    dark: '#1d4ed8',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
    contrastText: '#ffffff',
  },
  accent: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  background: {
    default: '#f1f5f9',
    paper: '#ffffff',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
  },
  text: {
    primary: '#1e293b',
    secondary: '#475569',
    disabled: '#94a3b8',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
  },
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
  },
};

const StatCard = ({ title, value, icon, color, subtitle, delay = 0 }) => {
  return (
    <Animated.View entering={FadeInDown.duration(600).delay(delay)}>
      <Card style={[styles.statCard, { elevation: 4 }]}>
        <Card.Content style={styles.statCardContent}>
          <View style={styles.statHeader}>
            <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
              <Icon source={icon} size={28} color={color} />
            </View>
            <View style={styles.statTextContainer}>
              <Text variant="headlineMedium" style={[styles.statValue, { color }]}>
                {value}
              </Text>
              <Text variant="bodyMedium" style={[styles.statTitle, { color: sbaColors.text.primary }]}>
                {title}
              </Text>
              {subtitle && (
                <Text variant="bodySmall" style={[styles.statSubtitle, { color: sbaColors.text.secondary }]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const BookingCard = ({ booking, onPress, onGenerateBill, index }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return sbaColors.info.main;
      case 'Completed': return sbaColors.success.main;
      case 'Extended': return sbaColors.warning.main;
      default: return sbaColors.text.disabled;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return 'clock-outline';
      case 'Completed': return 'check-circle-outline';
      case 'Extended': return 'refresh-circle';
      default: return 'help-circle-outline';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Animated.View entering={FadeInRight.duration(500).delay(index * 100)}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card style={styles.bookingCard}>
          <Card.Content style={styles.bookingCardContent}>
            {/* Header Row */}
            <View style={styles.bookingHeader}>
              <View style={styles.roomInfo}>
                <Avatar.Text 
                  size={48} 
                  label={booking.roomNo?.toString() || '?'} 
                  style={{ backgroundColor: sbaColors.primary.main }}
                  labelStyle={{ color: sbaColors.primary.contrastText, fontWeight: 'bold' }}
                />
                <View style={styles.roomDetails}>
                  <Text variant="titleMedium" style={[styles.roomNumber, { color: sbaColors.text.primary }]}>
                    Room {booking.roomNo}
                  </Text>
                  <Text variant="bodyMedium" style={[styles.guestName, { color: sbaColors.text.secondary }]}>
                    {booking.guestName}
                  </Text>
                </View>
              </View>
              <Chip
                icon={() => <Icon source={getStatusIcon(booking.status)} size={16} color={getStatusColor(booking.status)} />}
                style={[styles.statusChip, { backgroundColor: `${getStatusColor(booking.status)}15` }]}
                textStyle={{ color: getStatusColor(booking.status), fontWeight: '600' }}
              >
                {booking.status}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Icon source="phone" size={16} color={sbaColors.text.secondary} />
                <Text variant="bodySmall" style={[styles.detailText, { color: sbaColors.text.secondary }]}>
                  {booking.customerPhone}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Icon source="account-group" size={16} color={sbaColors.text.secondary} />
                <Text variant="bodySmall" style={[styles.detailText, { color: sbaColors.text.secondary }]}>
                  {booking.numberOfPersons || 1} Guest{(booking.numberOfPersons || 1) > 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Icon source="calendar-plus" size={16} color={sbaColors.text.secondary} />
                <Text variant="bodySmall" style={[styles.detailText, { color: sbaColors.text.secondary }]}>
                  {formatTimestamp(booking.checkIn)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Icon source="cash" size={16} color={sbaColors.success.main} />
                <Text variant="bodySmall" style={[styles.detailText, { color: sbaColors.success.main, fontWeight: 'bold' }]}>
                  ₹{booking.amount?.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                mode="outlined"
                onPress={() => onGenerateBill(booking)}
                style={[styles.actionButton, { borderColor: sbaColors.primary.main }]}
                labelStyle={{ color: sbaColors.primary.main }}
                icon={() => <Icon source="download" size={16} color={sbaColors.primary.main} />}
              >
                Bill
              </Button>
              <Button
                mode="contained"
                onPress={onPress}
                style={[styles.actionButton, { backgroundColor: sbaColors.primary.main }]}
                labelStyle={{ color: sbaColors.primary.contrastText }}
                icon={() => <Icon source="eye" size={16} color={sbaColors.primary.contrastText} />}
              >
                Details
              </Button>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AllBookingsPage = () => {
  const theme = useTheme();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const bookingsCollection = collection(db, "bookings");
    const q = query(bookingsCollection, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBookings(bookingsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp?.toDate) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleGenerateBill = (booking) => {
    Alert.alert(
      "Download Bill",
      `Bill for Room ${booking.roomNo} - ${booking.guestName} is being prepared for download.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Download", onPress: () => console.log("Downloading bill...") }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return sbaColors.info.main;
      case 'Completed': return sbaColors.success.main;
      case 'Extended': return sbaColors.warning.main;
      default: return sbaColors.text.disabled;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return 'clock-outline';
      case 'Completed': return 'check-circle-outline';
      case 'Extended': return 'refresh-circle';
      default: return 'help-circle-outline';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.roomNo?.toString().includes(searchTerm) ||
      booking.customerPhone?.includes(searchTerm);

    const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: bookings.length,
    active: bookings.filter(b => b.status === 'Active').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    extended: bookings.filter(b => b.status === 'Extended').length,
    totalRevenue: bookings.reduce((sum, b) => sum + (b.amount || 0), 0),
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: sbaColors.background.default }]}>
        <ActivityIndicator size="large" color={sbaColors.primary.main} />
        <Text style={{ marginTop: 16, color: sbaColors.text.primary }}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <View style={[styles.pageContainer, { backgroundColor: sbaColors.background.default }]}>
        {/* Custom Header with Gradient */}
        <Surface style={styles.headerSurface} elevation={4}>
          <View style={[styles.gradientHeader, { backgroundColor: sbaColors.primary.main }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerTitleContainer}>
                <Avatar.Icon 
                  size={56} 
                  icon={() => <Icon source="history" size={28} color={sbaColors.primary.contrastText} />} 
                  style={{ backgroundColor: `${sbaColors.primary.contrastText}20` }} 
                />
                <View style={styles.headerTextContainer}>
                  <Text variant="headlineSmall" style={[styles.headerTitle, { color: sbaColors.primary.contrastText }]}>
                    Booking History
                  </Text>
                  <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: `${sbaColors.primary.contrastText}90` }]}>
                    Complete record of all guest stays
                  </Text>
                </View>
              </View>
              
              {/* Quick Stats in Header */}
              <View style={styles.headerStats}>
                <View style={styles.headerStatItem}>
                  <Text variant="titleMedium" style={[styles.headerStatValue, { color: sbaColors.primary.contrastText }]}>
                    {stats.total}
                  </Text>
                  <Text variant="bodySmall" style={[styles.headerStatLabel, { color: `${sbaColors.primary.contrastText}80` }]}>
                    Total
                  </Text>
                </View>
                <View style={styles.headerStatDivider} />
                <View style={styles.headerStatItem}>
                  <Text variant="titleMedium" style={[styles.headerStatValue, { color: sbaColors.primary.contrastText }]}>
                    ₹{(stats.totalRevenue / 1000).toFixed(0)}K
                  </Text>
                  <Text variant="bodySmall" style={[styles.headerStatLabel, { color: `${sbaColors.primary.contrastText}80` }]}>
                    Revenue
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Surface>

        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <StatCard
              title="Active Bookings"
              value={stats.active}
              icon="clock-outline"
              color={sbaColors.info.main}
              subtitle="Currently occupied"
              delay={0}
            />
            <StatCard
              title="Completed"
              value={stats.completed}
              icon="check-circle-outline"
              color={sbaColors.success.main}
              subtitle="Successfully finished"
              delay={100}
            />
            <StatCard
              title="Extended Stays"
              value={stats.extended}
              icon="refresh-circle"
              color={sbaColors.warning.main}
              subtitle="Extended bookings"
              delay={200}
            />
            <StatCard
              title="Total Revenue"
              value={`₹${stats.totalRevenue.toLocaleString()}`}
              icon="cash"
              color={sbaColors.secondary.main}
              subtitle="All time earnings"
              delay={300}
            />
          </View>

          {/* Search and Filter Section */}
          <Animated.View entering={FadeInDown.duration(600).delay(400)}>
            <Card style={styles.filterCard} elevation={2}>
              <Card.Content style={styles.filterContent}>
                <Text variant="titleMedium" style={[styles.filterTitle, { color: sbaColors.text.primary }]}>
                  Search & Filter
                </Text>
                
                <View style={styles.filterRow}>
                  <TextInput
                    style={[styles.searchInput, { backgroundColor: sbaColors.background.paper }]}
                    label="Search bookings..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    left={<TextInput.Icon icon={() => <Icon source="magnify" size={20} color={sbaColors.text.secondary} />} />}
                    mode="outlined"
                    outlineColor={sbaColors.text.disabled}
                    activeOutlineColor={sbaColors.primary.main}
                  />
                  
                  <TouchableOpacity
                    onPress={() => Alert.alert("Filter Status", "Select a status to filter by:", [
                      { text: "All", onPress: () => setStatusFilter("All") },
                      { text: "Active", onPress: () => setStatusFilter("Active") },
                      { text: "Completed", onPress: () => setStatusFilter("Completed") },
                      { text: "Extended", onPress: () => setStatusFilter("Extended") },
                    ])}
                    style={[styles.filterButton, { backgroundColor: sbaColors.primary.main }]}
                  >
                    <Icon source="filter-variant" size={20} color={sbaColors.primary.contrastText} />
                    <Text style={[styles.filterButtonText, { color: sbaColors.primary.contrastText }]}>
                      {statusFilter}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.resultContainer}>
                  <Text style={[styles.resultText, { color: sbaColors.text.secondary }]}>
                    Showing {filteredBookings.length} of {bookings.length} bookings
                  </Text>
                  {(searchTerm || statusFilter !== 'All') && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchTerm('');
                        setStatusFilter('All');
                      }}
                      style={styles.clearButton}
                    >
                      <Text style={[styles.clearButtonText, { color: sbaColors.primary.main }]}>
                        Clear filters
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card.Content>
            </Card>
          </Animated.View>

          {/* Bookings List */}
          <View style={styles.bookingsContainer}>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking, index) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onPress={() => handleViewDetails(booking)}
                  onGenerateBill={() => handleGenerateBill(booking)}
                  index={index}
                />
              ))
            ) : (
              <Animated.View entering={FadeInDown.duration(600).delay(500)}>
                <Card style={styles.emptyStateCard} elevation={2}>
                  <Card.Content style={styles.emptyStateContent}>
                    <Icon source="history" size={64} color={sbaColors.text.disabled} />
                    <Text variant="titleLarge" style={[styles.emptyStateTitle, { color: sbaColors.text.primary }]}>
                      No bookings found
                    </Text>
                    <Text variant="bodyMedium" style={[styles.emptyStateSubtitle, { color: sbaColors.text.secondary }]}>
                      {searchTerm || statusFilter !== 'All'
                        ? 'Try adjusting your search or filter criteria'
                        : 'Bookings will appear here once guests check in'
                      }
                    </Text>
                    {(searchTerm || statusFilter !== 'All') && (
                      <Button
                        mode="outlined"
                        onPress={() => {
                          setSearchTerm('');
                          setStatusFilter('All');
                        }}
                        style={[styles.emptyStateButton, { borderColor: sbaColors.primary.main }]}
                        labelStyle={{ color: sbaColors.primary.main }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </Card.Content>
                </Card>
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* Booking Details Dialog */}
        <Portal>
          <Dialog 
            visible={dialogOpen} 
            onDismiss={handleCloseDialog} 
            style={styles.dialog}
          >
            <Dialog.Title style={{ color: sbaColors.text.primary }}>
              Booking Details - Room {selectedBooking?.roomNo}
            </Dialog.Title>
            <Dialog.Content>
              {selectedBooking && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Guest Information Section */}
                  <Surface style={styles.dialogSection} elevation={1}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: sbaColors.text.primary }]}>
                      Guest Information
                    </Text>
                    <View style={styles.dialogDetailRow}>
                      <Icon source="account" size={20} color={sbaColors.text.secondary} />
                      <View style={styles.dialogDetailContent}>
                        <Text variant="bodySmall" style={{ color: sbaColors.text.secondary }}>Guest Name</Text>
                        <Text variant="bodyLarge" style={{ color: sbaColors.text.primary, fontWeight: '600' }}>
                          {selectedBooking.guestName}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dialogDetailRow}>
                      <Icon source="phone" size={20} color={sbaColors.text.secondary} />
                      <View style={styles.dialogDetailContent}>
                        <Text variant="bodySmall" style={{ color: sbaColors.text.secondary }}>Phone Number</Text>
                        <Text variant="bodyLarge" style={{ color: sbaColors.text.primary, fontWeight: '600' }}>
                          {selectedBooking.customerPhone}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dialogDetailRow}>
                      <Icon source="account-group" size={20} color={sbaColors.text.secondary} />
                      <View style={styles.dialogDetailContent}>
                        <Text variant="bodySmall" style={{ color: sbaColors.text.secondary }}>Number of Guests</Text>
                        <Text variant="bodyLarge" style={{ color: sbaColors.text.primary, fontWeight: '600' }}>
                          {selectedBooking.numberOfPersons || 1}
                        </Text>
                      </View>
                    </View>
                  </Surface>

                  {/* Booking Timeline Section */}
                  <Surface style={styles.dialogSection} elevation={1}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: sbaColors.text.primary }]}>
                      Booking Timeline
                    </Text>
                    <View style={styles.dialogDetailRow}>
                      <Icon source="calendar-plus" size={20} color={sbaColors.success.main} />
                      <View style={styles.dialogDetailContent}>
                        <Text variant="bodySmall" style={{ color: sbaColors.text.secondary }}>Check-In</Text>
                        <Text variant="bodyLarge" style={{ color: sbaColors.text.primary, fontWeight: '600' }}>
                          {formatTimestamp(selectedBooking.checkIn)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dialogDetailRow}>
                      <Icon source="calendar-check" size={20} color={selectedBooking.checkOut ? sbaColors.success.main : sbaColors.text.disabled} />
                      <View style={styles.dialogDetailContent}>
                        <Text variant="bodySmall" style={{ color: sbaColors.text.secondary }}>Check-Out</Text>
                        <Text variant="bodyLarge" style={{ color: sbaColors.text.primary, fontWeight: '600' }}>
                          {selectedBooking.checkOut ? formatTimestamp(selectedBooking.checkOut) : "Still checked in"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dialogDetailRow}>
                      <Icon source="cash" size={20} color={sbaColors.secondary.main} />
                      <View style={styles.dialogDetailContent}>
                        <Text variant="bodySmall" style={{ color: sbaColors.text.secondary }}>Total Amount</Text>
                        <Text variant="headlineSmall" style={{ color: sbaColors.secondary.main, fontWeight: 'bold' }}>
                          ₹{selectedBooking.amount?.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </Surface>

                  {/* Status Section */}
                  <Surface style={styles.dialogSection} elevation={1}>
                    <Text variant="titleMedium" style={[styles.sectionTitle, { color: sbaColors.text.primary }]}>
                      Status Information
                    </Text>
                    <View style={styles.statusContainer}>
                      <Chip
                        icon={() => <Icon source={getStatusIcon(selectedBooking.status)} size={18} color={getStatusColor(selectedBooking.status)} />}
                        style={[styles.statusChipLarge, { backgroundColor: `${getStatusColor(selectedBooking.status)}15` }]}
                        textStyle={{ color: getStatusColor(selectedBooking.status), fontWeight: 'bold', fontSize: 16 }}
                      >
                        {selectedBooking.status}
                      </Chip>
                    </View>
                  </Surface>

                  {selectedBooking.idProof && (
                    <Surface style={styles.dialogSection} elevation={1}>
                      <Text variant="titleMedium" style={[styles.sectionTitle, { color: sbaColors.text.primary }]}>
                        ID Proof
                      </Text>
                      <View style={[styles.imagePlaceholder, { backgroundColor: sbaColors.background.default }]}>
                        <Icon source="id-card" size={32} color={sbaColors.text.disabled} />
                        <Text style={{ color: sbaColors.text.secondary, marginTop: 8 }}>
                          ID Proof Document
                        </Text>
                      </View>
                    </Surface>
                  )}
                </ScrollView>
              )}
            </Dialog.Content>
            <Dialog.Actions style={styles.dialogActions}>
              <Button 
                onPress={handleCloseDialog}
                labelStyle={{ color: sbaColors.text.secondary }}
              >
                Close
              </Button>
              <Button
                onPress={() => handleGenerateBill(selectedBooking)}
                mode="contained"
                style={{ backgroundColor: sbaColors.primary.main }}
                labelStyle={{ color: sbaColors.primary.contrastText }}
                icon={() => <Icon source="download" size={16} color={sbaColors.primary.contrastText} />}
              >
                Download Bill
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSurface: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  gradientHeader: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingTop: 48,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 24,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerStatItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerStatValue: {
    fontWeight: 'bold',
  },
  headerStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  headerStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  container: {
    padding: 20,
    paddingTop: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flexBasis: '48%',
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  statCardContent: {
    padding: 20,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontWeight: 'bold',
    lineHeight: 32,
  },
  statTitle: {
    fontWeight: '600',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  filterCard: {
    borderRadius: 16,
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  filterContent: {
    padding: 20,
  },
  filterTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  filterButtonText: {
    fontWeight: '600',
  },
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  resultText: {
    fontSize: 14,
  },
  clearButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bookingsContainer: {
    gap: 16,
  },
  bookingCard: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  bookingCardContent: {
    padding: 20,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roomDetails: {
    marginLeft: 16,
    flex: 1,
  },
  roomNumber: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  guestName: {
    marginTop: 2,
    fontSize: 14,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#f1f5f9',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flexBasis: '48%',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  emptyStateCard: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  emptyStateContent: {
    alignItems: 'center',
    padding: 48,
  },
  emptyStateTitle: {
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyStateButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  dialog: {
    marginHorizontal: 20,
    borderRadius: 16,
  },
  dialogSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dialogDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogDetailContent: {
    marginLeft: 16,
    flex: 1,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusChipLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  dialogActions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
});

export default AllBookingsPage;