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
} from "react-native-paper";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Ionicons } from '@expo/vector-icons';

import { db } from "../config/firebase";

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
    const formattedDate = date.toLocaleDateString();
    const formattedTime = date.toLocaleTimeString();
    return `${formattedDate} ${formattedTime}`;
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
      `Simulated: Bill for Room ${booking.roomNo} is being prepared for download. You would use a library like react-native-html-to-pdf here.`
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#2196F3';
      case 'Completed': return '#4CAF50';
      case 'Extended': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return 'bed';
      case 'Completed': return 'checkmark-circle';
      case 'Extended': return 'refresh';
      default: return 'help-circle';
    }
  };

  // Filter bookings based on search and status
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch =
      booking.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.roomNo?.toString().includes(searchTerm) ||
      booking.customerPhone?.includes(searchTerm);

    const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: bookings.length,
    active: bookings.filter(b => b.status === 'Active').length,
    completed: bookings.filter(b => b.status === 'Completed').length,
    totalRevenue: bookings.reduce((sum, b) => sum + (b.amount || 0), 0),
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content
          title="All Bookings"
          subtitle="Complete history of all guest bookings"
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Header and Stats */}
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Avatar.Icon 
              size={48} 
              icon={() => <Ionicons name="library" size={24} color="#2196F3" />} 
              style={{ backgroundColor: '#E3F2FD' }} 
            />
            <View style={{ marginLeft: 16 }}>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>All Bookings</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Complete history of all guest bookings and transactions
              </Text>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Avatar.Icon 
                  size={40} 
                  icon={() => <Ionicons name="library" size={20} color="#2196F3" />} 
                  style={{ backgroundColor: '#E3F2FD' }} 
                />
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#2196F3' }}>
                  {stats.total}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Total Bookings</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Avatar.Icon 
                  size={40} 
                  icon={() => <Ionicons name="bed" size={20} color="#4CAF50" />} 
                  style={{ backgroundColor: '#E8F5E8' }} 
                />
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                  {stats.active}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Active</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Avatar.Icon 
                  size={40} 
                  icon={() => <Ionicons name="calendar" size={20} color="#FF9800" />} 
                  style={{ backgroundColor: '#FFF3E0' }} 
                />
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#FF9800' }}>
                  {stats.completed}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Completed</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Avatar.Icon 
                  size={40} 
                  icon={() => <Ionicons name="cash" size={20} color="#9C27B0" />} 
                  style={{ backgroundColor: '#F3E5F5' }} 
                />
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#9C27B0' }}>
                  ₹{stats.totalRevenue.toLocaleString()}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Total Revenue</Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Filters */}
        <Card style={styles.filterCard}>
          <TextInput
            style={styles.textInput}
            label="Search by name, room, or phone"
            value={searchTerm}
            onChangeText={setSearchTerm}
            left={<TextInput.Icon icon={() => <Ionicons name="search" size={20} />} />}
          />
          <TextInput
            style={styles.textInput}
            label="Status Filter"
            value={statusFilter}
            onChangeText={setStatusFilter}
            right={<TextInput.Icon icon={() => <Ionicons name="chevron-down" size={20} />} />}
            showSoftInputOnFocus={false}
            onPressIn={() => Alert.alert("Filter", "This is a placeholder for a status picker. Select a status.", [
              { text: "All", onPress: () => setStatusFilter("All") },
              { text: "Active", onPress: () => setStatusFilter("Active") },
              { text: "Completed", onPress: () => setStatusFilter("Completed") },
              { text: "Extended", onPress: () => setStatusFilter("Extended") },
            ])}
          />
          <Text style={styles.resultText}>
            Showing {filteredBookings.length} of {bookings.length} bookings
          </Text>
        </Card>

        {/* Bookings List */}
        <Card style={styles.tableCard}>
          {filteredBookings.length > 0 ? (
            <List.Section>
              {filteredBookings.map((booking) => (
                <View key={booking.id}>
                  <TouchableOpacity onPress={() => handleViewDetails(booking)}>
                    <View style={styles.row}>
                      <View style={styles.cell}>
                        <Text style={{ fontWeight: 'bold' }}>Room {booking.roomNo}</Text>
                        <Text style={{ color: theme.colors.onSurfaceVariant }}>{booking.guestName}</Text>
                      </View>
                      <View style={styles.cell}>
                        <Chip
                          icon={() => <Ionicons name={getStatusIcon(booking.status)} size={18} />}
                          style={{ backgroundColor: `${getStatusColor(booking.status)}30` }}
                        >
                          <Text style={{ color: getStatusColor(booking.status) }}>{booking.status}</Text>
                        </Chip>
                        <Text style={{ marginTop: 4, color: '#2196F3' }}>
                          ₹{booking.amount?.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  <Divider />
                </View>
              ))}
            </List.Section>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="library" size={48} color="#ccc" />
              <Text variant="titleMedium" style={{ marginTop: 16 }}>No bookings found</Text>
              <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 8 }}>
                {searchTerm || statusFilter !== 'All'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Bookings will appear here once guests check in'
                }
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Booking Details Dialog */}
      <Portal>
        <Dialog visible={dialogOpen} onDismiss={handleCloseDialog} style={styles.dialog}>
          <Dialog.Title>Booking Details - Room {selectedBooking?.roomNo}</Dialog.Title>
          <Dialog.Content>
            {selectedBooking && (
              <ScrollView>
                <List.Section>
                  <List.Subheader>Guest Information</List.Subheader>
                  <List.Item
                    title="Guest Name"
                    description={selectedBooking.guestName}
                    left={() => <List.Icon icon={() => <Ionicons name="person" size={20} />} />}
                  />
                  <List.Item
                    title="Phone Number"
                    description={selectedBooking.customerPhone}
                    left={() => <List.Icon icon={() => <Ionicons name="call" size={20} />} />}
                  />
                  <List.Item
                    title="Number of Persons"
                    description={selectedBooking.numberOfPersons}
                    left={() => <List.Icon icon={() => <Ionicons name="people" size={20} />} />}
                  />
                  <List.Item
                    title="Status"
                    description={selectedBooking.status}
                    left={() => <List.Icon icon={() => <Ionicons name={getStatusIcon(selectedBooking.status)} size={20} />} />}
                  />
                </List.Section>
                <Divider />
                <List.Section>
                  <List.Subheader>Booking Timeline</List.Subheader>
                  <List.Item
                    title="Check-In Time"
                    description={formatTimestamp(selectedBooking.checkIn)}
                    left={() => <List.Icon icon={() => <Ionicons name="calendar" size={20} />} />}
                  />
                  <List.Item
                    title="Check-Out Time"
                    description={selectedBooking.checkOut ? formatTimestamp(selectedBooking.checkOut) : "Not Checked Out"}
                    left={() => <List.Icon icon={() => <Ionicons name="calendar" size={20} />} />}
                  />
                  <List.Item
                    title="Total Amount"
                    description={`₹${selectedBooking.amount?.toLocaleString()}`}
                    left={() => <List.Icon icon={() => <Ionicons name="cash" size={20} />} />}
                  />
                </List.Section>
                {selectedBooking.idProof && (
                  <View style={{ marginTop: 24 }}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>ID Proof</Text>
                    <View style={styles.imagePlaceholder}>
                      <Text>ID Proof Image</Text>
                    </View>
                    <Text style={{ marginTop: 8, color: theme.colors.onSurfaceDisabled }}>
                      (Simulated image placeholder)
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseDialog}>Close</Button>
            <Button
              onPress={() => handleGenerateBill(selectedBooking)}
              mode="contained"
              icon={() => <Ionicons name="download" size={20} />}
            >
              Download Bill
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 8,
    padding: 12,
  },
  statContent: {
    alignItems: 'center',
  },
  filterCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 12,
  },
  resultText: {
    marginTop: 8,
    color: 'gray',
  },
  tableCard: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cell: {
    flex: 1,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 48,
  },
  dialog: {
    marginHorizontal: 16,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AllBookingsPage;