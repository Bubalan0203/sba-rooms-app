import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import {
  Provider as PaperProvider,
  Appbar,
  Text,
  Card,
  Button,
  Chip,
  Avatar,
  useTheme,
  ActivityIndicator,
  Dialog,
  Portal,
  TextInput,
  Divider,
  Icon, // <-- Added Icon component here
} from "react-native-paper";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
// Switched to a single, consistent icon library: MaterialCommunityIcons
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { db } from "../config/firebase";

const BOOKING_START_HOUR = 12;

const ActiveBookingsPage = () => {
  const theme = useTheme();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [extendDialog, setExtendDialog] = useState({ open: false, booking: null });
  const [extendAmount, setExtendAmount] = useState('');

  useEffect(() => {
    const bookingsCollection = collection(db, "bookings");
    const unsubBookings = onSnapshot(bookingsCollection, (snapshot) => {
      const bookingsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      bookingsData.sort((a, b) => a.roomNo - b.roomNo);
      setBookings(bookingsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching bookings: ", error);
      setLoading(false);
      Alert.alert("Error", "Failed to load bookings.");
    });
    return () => unsubBookings();
  }, []);

  const getBookingCycleEnd = (checkInTimestamp) => {
    if (!checkInTimestamp) return null;
    const checkInDate = checkInTimestamp.toDate();
    const cycleEnd = new Date(checkInDate);
    cycleEnd.setHours(BOOKING_START_HOUR, 0, 0, 0);

    if (checkInDate.getHours() >= BOOKING_START_HOUR) {
      cycleEnd.setDate(cycleEnd.getDate() + 1);
    }
    return cycleEnd;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCheckout = async (bookingId, roomId) => {
    Alert.alert(
      "Confirm Checkout",
      "Are you sure you want to check out this guest?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const bookingRef = doc(db, "bookings", bookingId);
              const roomRef = doc(db, "rooms", roomId);
              await updateDoc(bookingRef, { checkOut: serverTimestamp(), status: 'Completed' });
              await updateDoc(roomRef, { status: 'Available' });
              Alert.alert("Success", "Guest checked out successfully.");
            } catch (error) {
              console.error("Checkout failed:", error);
              Alert.alert("Error", "Failed to checkout. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleAlreadyCheckout = async (bookingId, roomId, cycleEndDate) => {
    Alert.alert(
      "Confirm Checkout",
      "Mark this guest as checked out at the cycle end time?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const bookingRef = doc(db, "bookings", bookingId);
              const roomRef = doc(db, "rooms", roomId);
              await updateDoc(bookingRef, { checkOut: Timestamp.fromDate(cycleEndDate), status: 'Completed' });
              await updateDoc(roomRef, { status: 'Available' });
              Alert.alert("Success", "Guest checked out successfully.");
            } catch (error) {
              console.error("Already checked out failed:", error);
              Alert.alert("Error", "Failed to update status. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleOpenExtendDialog = (booking) => {
    setExtendDialog({ open: true, booking });
    setExtendAmount(booking.amount.toString());
  };

  const handleCloseExtendDialog = () => {
    setExtendDialog({ open: false, booking: null });
    setExtendAmount('');
  };

  const handleExtendStay = async () => {
    const { booking } = extendDialog;
    const newAmount = parseFloat(extendAmount);
    
    if (isNaN(newAmount) || newAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to extend the stay.");
      return;
    }

    const cycleEndDate = getBookingCycleEnd(booking.checkIn);
    const { id, ...oldBookingData } = booking;
    const oldBookingRef = doc(db, "bookings", booking.id);
    const bookingsCollection = collection(db, "bookings");

    try {
      await runTransaction(db, async (transaction) => {
        const oldDoc = await transaction.get(oldBookingRef);
        if (!oldDoc.exists()) {
            throw new Error("Booking does not exist!");
        }

        transaction.update(oldBookingRef, { checkOut: Timestamp.fromDate(cycleEndDate), status: 'Extended' });
        
        const newCheckIn = new Date(cycleEndDate);
        transaction.set(doc(bookingsCollection), {
          ...oldBookingData,
          amount: newAmount,
          checkIn: Timestamp.fromDate(newCheckIn),
          checkOut: null,
          status: 'Active',
          createdAt: serverTimestamp()
        });
      });
      Alert.alert("Success", `Stay for Room ${booking.roomNo} has been successfully extended.`);
      handleCloseExtendDialog();
    } catch (error) {
      console.error("Extension transaction failed: ", error);
      Alert.alert("Error", "Failed to extend stay. Please try again.");
    }
  };

  const activeBookings = bookings.filter(b => b.status === 'Active');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading active bookings...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content
          title="Active Bookings"
          subtitle="Manage current guest stays and check-outs"
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Header and Stats */}
        <View style={styles.headerContainer}>
          <View style={styles.titleContainer}>
            <Avatar.Icon 
              size={48} 
              icon={() => <Icon source="clock-time-three-outline" size={24} color={theme.colors.primary} />} 
              style={{ backgroundColor: theme.colors.primaryContainer }} 
            />
            <View style={{ marginLeft: 16 }}>
              <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Active Bookings</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Manage current guest stays and check-outs
              </Text>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                  {activeBookings.length}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Active Bookings</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.error }}>
                  {activeBookings.filter(b => {
                    const cycleEnd = getBookingCycleEnd(b.checkIn);
                    return cycleEnd && new Date() > cycleEnd;
                  }).length}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Overdue</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                  ₹{activeBookings.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Total Revenue</Text>
              </View>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statContent}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: theme.colors.success }}>
                  {Math.round(activeBookings.reduce((sum, b) => sum + (b.numberOfPersons || 1), 0) / Math.max(activeBookings.length, 1))}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Avg. Guests</Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Bookings Grid */}
        {activeBookings.length > 0 ? (
          <View style={styles.gridContainer}>
            {activeBookings.map((booking, index) => {
              const cycleEndDate = getBookingCycleEnd(booking.checkIn);
              const isOverdue = cycleEndDate && new Date() > cycleEndDate;

              return (
                <Card
                  key={booking.id}
                  style={[
                    styles.card,
                    {
                      borderColor: isOverdue ? theme.colors.error : theme.colors.primary,
                    },
                  ]}
                >
                  <Card.Content style={styles.cardContent}>
                    {/* Header */}
                    <View style={styles.cardHeader}>
                      <View style={styles.roomInfo}>
                        <Avatar.Icon 
                          size={40} 
                          icon={() => <Icon source="bed" size={20} color={theme.colors.primary} />} 
                          style={{ backgroundColor: theme.colors.primaryContainer }} 
                        />
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginLeft: 8 }}>
                          Room {booking.roomNo}
                        </Text>
                      </View>
                      <Chip
                        icon={() => <Icon source={isOverdue ? 'alert-circle' : 'check-circle'} size={18} color={isOverdue ? theme.colors.error : theme.colors.success} />}
                        style={{ backgroundColor: isOverdue ? theme.colors.errorContainer : theme.colors.successContainer }}
                      >
                        <Text style={{ color: isOverdue ? theme.colors.onError : theme.colors.onSuccess }}>
                          {isOverdue ? "Overdue" : "Active"}
                        </Text>
                      </Chip>
                    </View>

                    {/* Guest Info */}
                    <View style={styles.detailRow}>
                      <Icon source="account" size={18} color={theme.colors.onSurfaceVariant} />
                      <Text style={{ fontWeight: 'bold', marginLeft: 8 }}>
                        {booking.guestName}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon source="phone" size={18} color={theme.colors.onSurfaceVariant} />
                      <Text style={{ marginLeft: 8 }}>
                        {booking.customerPhone}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon source="cash" size={18} color={theme.colors.success} />
                      <Text style={{ fontWeight: 'bold', marginLeft: 8, color: theme.colors.success }}>
                        ₹{parseFloat(booking.amount).toLocaleString()}
                      </Text>
                    </View>

                    <Divider style={{ marginVertical: 12 }} />

                    {/* Timing Info */}
                    <View style={styles.detailRow}>
                      <Icon source="clock" size={18} color={theme.colors.onSurfaceVariant} />
                      <Text style={{ marginLeft: 8, color: theme.colors.onSurfaceVariant }}>
                        Check-in: {formatDate(booking.checkIn?.toDate())}
                      </Text>
                    </View>
                    {cycleEndDate && (
                      <View style={styles.detailRow}>
                        <Icon source="calendar-clock" size={18} color={isOverdue ? theme.colors.error : theme.colors.warning} />
                        <Text style={{ marginLeft: 8, color: isOverdue ? theme.colors.error : theme.colors.warning }}>
                          Cycle ends: {formatDate(cycleEndDate)}
                        </Text>
                      </View>
                    )}
                    
                    {/* Persons */}
                    <Chip
                      icon={() => <Icon source="account-group" size={18} />}
                      style={{ marginTop: 12, backgroundColor: theme.colors.surfaceVariant }}
                    >
                      <Text>
                        {booking.numberOfPersons || 1} Guest{(booking.numberOfPersons || 1) > 1 ? 's' : ''}
                      </Text>
                    </Chip>
                  </Card.Content>

                  <Card.Actions style={styles.cardActions}>
                    {isOverdue ? (
                      <>
                        <Button mode="outlined" onPress={() => handleAlreadyCheckout(booking.id, booking.roomId, cycleEndDate)} style={{ borderRadius: 8 }}>
                          Already Left
                        </Button>
                        <Button mode="contained" onPress={() => handleOpenExtendDialog(booking)} style={{ borderRadius: 8 }}>
                          Extend
                        </Button>
                      </>
                    ) : (
                      <Button mode="contained" onPress={() => handleCheckout(booking.id, booking.roomId)} style={{ borderRadius: 8 }}>
                        Checkout
                      </Button>
                    )}
                  </Card.Actions>
                </Card>
              );
            })}
          </View>
        ) : (
          <Card style={styles.emptyStateCard}>
            <Card.Content style={styles.emptyStateContent}>
              <Icon source="clock-time-three-outline" size={64} color={theme.colors.onSurfaceVariant} />
              <Text variant="titleMedium" style={styles.emptyStateText}>
                No Active Bookings
              </Text>
              <Text variant="bodySmall" style={{ textAlign: 'center' }}>
                All rooms are currently available. New bookings will appear here.
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Extend Stay Dialog */}
      <Portal>
        <Dialog visible={extendDialog.open} onDismiss={handleCloseExtendDialog} style={styles.dialog}>
          <Dialog.Title>Extend Stay - Room {extendDialog.booking?.roomNo}</Dialog.Title>
          <Dialog.Content>
            <Text>
              Enter the amount for the extended booking period for {extendDialog.booking?.guestName}.
            </Text>
            <TextInput
              label="Extension Amount"
              keyboardType="numeric"
              value={extendAmount}
              onChangeText={setExtendAmount}
              style={{ marginTop: 16 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseExtendDialog}>Cancel</Button>
            <Button onPress={handleExtendStay} mode="contained">
              Extend Stay
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
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  statContent: {
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardContent: {
    paddingBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardActions: {
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 0,
  },
  emptyStateCard: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    marginTop: 24,
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateText: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  dialog: {
    marginHorizontal: 16,
  },
});

export default ActiveBookingsPage;