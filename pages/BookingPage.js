import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Pressable,
} from "react-native";
import {
  Provider as PaperProvider,
  Appbar,
  Text,
  Button,
  Modal,
  Portal,
  Card,
  TextInput,
  Chip,
  ActivityIndicator,
  Divider,
  ProgressBar,
  List,
  useTheme,
  RadioButton,
} from "react-native-paper";
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import RNModal from "react-native-modal";
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Make sure to import your firebase config and db instance
import { db } from "../config/firebase";

const modalStyle = {
  justifyContent: "center",
  margin: 0,
};

function BookingPage() {
  const theme = useTheme();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [step, setStep] = useState(0);
  const [numRooms, setNumRooms] = useState(1);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [roomDetails, setRoomDetails] = useState({});
  const [commonAmount, setCommonAmount] = useState('');
  
  // Guest Details State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [idProofBase64, setIdProofBase64] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = ['Select Rooms', 'Guest Details', 'Review & Confirm'];

  useEffect(() => {
    const roomsCollection = collection(db, "rooms");
    const q = query(roomsCollection, where("status", "==", "Available"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => {
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setStep(0);
    setNumRooms(1);
    setSelectedRooms([]);
    setRoomDetails({});
    setCommonAmount('');
    setGuestName('');
    setGuestPhone('');
    setIdProofBase64('');
    setIsSubmitting(false);
  };

  const handleNext = () => {
    if (step === 0 && selectedRooms.length !== parseInt(numRooms, 10)) {
      Alert.alert(`Please select exactly ${numRooms} room(s).`);
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleRoomSelect = (roomId) => {
    setSelectedRooms(prev => {
      const newSelection = prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId];
      
      newSelection.forEach(id => {
        if (!roomDetails[id]) {
          setRoomDetails(prevDetails => ({
            ...prevDetails,
            [id]: { numberOfPersons: '', amount: commonAmount }
          }));
        }
      });
      return newSelection;
    });
  };

  const handleDetailChange = (roomId, field, value) => {
    setRoomDetails(prev => ({
      ...prev,
      [roomId]: { ...prev[roomId], [field]: value }
    }));
  };

  const handleCommonAmountChange = (newAmount) => {
    setCommonAmount(newAmount);
    setRoomDetails(prevDetails => {
      const newDetails = { ...prevDetails };
      selectedRooms.forEach(roomId => {
        newDetails[roomId] = { ...newDetails[roomId], amount: newAmount };
      });
      return newDetails;
    });
  };

  const handleFileChange = () => {
    Alert.alert("File Upload", "This functionality requires a platform-specific implementation (e.g., using a library like react-native-image-picker). The web-based file reader has been simulated here.");
    // Simulate a successful upload
    setIdProofBase64('data:image/jpeg;base64,ID_PROOF_SIMULATED_BASE64_STRING');
  };

  const handleSubmit = async () => {
    if (!guestName || !guestPhone || !idProofBase64) {
      Alert.alert("Cannot submit. Guest details are missing.");
      return;
    }
    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const bookingsCollection = collection(db, "bookings");
        for (const roomId of selectedRooms) {
          const roomRef = doc(db, "rooms", roomId);
          const room = rooms.find(r => r.id === roomId);
          const finalAmount = parseFloat(roomDetails[roomId]?.amount || commonAmount || 0);
          transaction.set(doc(bookingsCollection), {
            roomId: roomId,
            roomNo: room.roomNo,
            numberOfPersons: parseInt(roomDetails[roomId]?.numberOfPersons || 1, 10),
            amount: finalAmount,
            guestName: guestName,
            customerPhone: guestPhone,
            idProof: idProofBase64,
            checkIn: serverTimestamp(),
            checkOut: null,
            status: 'Active',
            createdAt: serverTimestamp()
          });
          transaction.update(roomRef, { status: "Booked" });
        }
      });
      Alert.alert('Success', 'Booking successful!');
      handleCloseModal();
    } catch (error) {
      Alert.alert('Booking Failed', 'The selected room(s) might have just been booked.');
      console.error("Transaction failed: ", error);
      setIsSubmitting(false);
    }
  };
  
  const totalAmount = selectedRooms.reduce((total, roomId) => {
    const amount = parseFloat(roomDetails[roomId]?.amount || commonAmount || 0);
    return total + amount;
  }, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Loading rooms...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header style={styles.appBar}>
        <Appbar.Content title="Booking Management" subtitle="Create new bookings and manage guest reservations" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Welcome Card */}
        <Card style={styles.welcomeCard}>
          <Card.Content style={styles.welcomeContent}>
            <Icon name="hotel" size={48} color={theme.colors.primary} />
            <Text variant="headlineSmall" style={styles.welcomeTitle}>
              Ready to Create a New Booking?
            </Text>
            <Text variant="bodyMedium" style={styles.welcomeSubtitle}>
              Click the "New Booking" button below to start the booking process for your guests.
            </Text>
            <Button
              mode="outlined"
              onPress={handleOpenModal}
              style={{ marginTop: 16 }}
            >
              Get Started
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Booking Modal */}
      <Portal>
        <RNModal
          isVisible={modalOpen}
          onBackdropPress={handleCloseModal}
          onBackButtonPress={handleCloseModal}
          style={modalStyle}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          useNativeDriver
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text variant="titleLarge">Create New Booking</Text>
              <View style={styles.stepperContainer}>
                {steps.map((label, index) => (
                  <View key={label} style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepIcon,
                        {
                          backgroundColor:
                            index <= step ? theme.colors.primary : theme.colors.outline,
                        },
                      ]}
                    >
                      <Text style={{ color: 'white', fontWeight: 'bold' }}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.stepLabel, { color: index <= step ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Modal Body */}
            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* Step 1: Room Selection */}
              {step === 0 && (
                <Animated.View entering={FadeIn.duration(300).delay(100)} exiting={FadeOut.duration(300)}>
                  <View style={styles.stepHeader}>
                    <Icon name="hotel" size={24} color={theme.colors.primary} />
                    <Text variant="titleMedium" style={styles.stepTitle}>
                      Select Rooms
                    </Text>
                  </View>
                  
                  <TextInput
                    label={`Number of Rooms (Max: ${Math.min(10, rooms.length)})`}
                    value={String(numRooms)}
                    onChangeText={(val) => {
                      const number = parseInt(val, 10);
                      if (isNaN(number) || number < 1) {
                        setNumRooms(1);
                        setSelectedRooms([]);
                      } else {
                        setNumRooms(number);
                        setSelectedRooms([]);
                      }
                    }}
                    keyboardType="numeric"
                    style={{ marginBottom: 16 }}
                  />

                  <Text variant="bodyLarge" style={{ fontWeight: 'bold', marginBottom: 8 }}>
                    Available Rooms ({selectedRooms.length} / {numRooms} selected)
                  </Text>
                  <View style={styles.roomListContainer}>
                    {rooms.length > 0 ? (
                      rooms.map(room => (
                        <Pressable
                          key={room.id}
                          onPress={() => handleRoomSelect(room.id)}
                          disabled={!selectedRooms.includes(room.id) && selectedRooms.length >= numRooms}
                          style={[
                            styles.roomCard,
                            {
                              borderColor: selectedRooms.includes(room.id)
                                ? theme.colors.primary
                                : theme.colors.outlineVariant,
                              backgroundColor: selectedRooms.includes(room.id)
                                ? theme.colors.primaryContainer
                                : theme.colors.surface,
                            },
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <RadioButton.Android
                              value={room.id}
                              status={selectedRooms.includes(room.id) ? 'checked' : 'unchecked'}
                              onPress={() => handleRoomSelect(room.id)}
                              disabled={!selectedRooms.includes(room.id) && selectedRooms.length >= numRooms}
                            />
                            <View style={{ flex: 1, paddingLeft: 8 }}>
                              <Text style={styles.roomCardTitle}>
                                Room {room.roomNo}
                              </Text>
                              <Chip>{room.roomType}</Chip>
                            </View>
                          </View>
                        </Pressable>
                      ))
                    ) : (
                      <Text style={styles.emptyText}>
                        No available rooms found
                      </Text>
                    )}
                  </View>
                </Animated.View>
              )}

              {/* Step 2: Guest and Payment Details */}
              {step === 1 && (
                <Animated.View entering={FadeIn.duration(300).delay(100)} exiting={FadeOut.duration(300)}>
                  <View style={styles.stepHeader}>
                    <Icon name="person" size={24} color={theme.colors.primary} />
                    <Text variant="titleMedium" style={styles.stepTitle}>
                      Guest & Payment Details
                    </Text>
                  </View>
                  
                  <View style={styles.sectionCard}>
                    <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 12 }}>
                      Guest Information
                    </Text>
                    <TextInput
                      label="Guest Name"
                      value={guestName}
                      onChangeText={setGuestName}
                      style={{ marginBottom: 16 }}
                    />
                    <TextInput
                      label="Phone Number"
                      value={guestPhone}
                      onChangeText={setGuestPhone}
                      keyboardType="phone-pad"
                      style={{ marginBottom: 16 }}
                    />
                    <Button
                      mode="outlined"
                      onPress={handleFileChange}
                      icon="upload"
                      style={{ marginBottom: 8 }}
                    >
                      Upload ID Proof
                    </Button>
                    {idProofBase64 && (
                      <Text style={{ color: 'green', marginTop: 4 }}>
                        ID Proof uploaded successfully
                      </Text>
                    )}
                  </View>
                  
                  <View style={styles.sectionCard}>
                    <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 12 }}>
                      Room Details & Charges
                    </Text>
                    <TextInput
                      label="Common Amount (per room)"
                      value={commonAmount}
                      onChangeText={handleCommonAmountChange}
                      keyboardType="numeric"
                      style={{ marginBottom: 16 }}
                    />
                    <Divider style={{ marginVertical: 8 }} />
                    <ScrollView style={{ maxHeight: 200 }}>
                      {selectedRooms.map(roomId => {
                        const room = rooms.find(r => r.id === roomId);
                        return (
                          <View key={roomId} style={styles.roomDetailsCard}>
                            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
                              Room {room.roomNo}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                              <TextInput
                                label="Persons"
                                value={roomDetails[roomId]?.numberOfPersons || ''}
                                onChangeText={(val) => handleDetailChange(roomId, 'numberOfPersons', val)}
                                keyboardType="numeric"
                                style={{ flex: 1 }}
                              />
                              <TextInput
                                label="Amount"
                                value={roomDetails[roomId]?.amount || ''}
                                onChangeText={(val) => handleDetailChange(roomId, 'amount', val)}
                                keyboardType="numeric"
                                style={{ flex: 1 }}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                </Animated.View>
              )}

              {/* Step 3: Review & Confirm */}
              {step === 2 && (
                <Animated.View entering={FadeIn.duration(300).delay(100)} exiting={FadeOut.duration(300)}>
                  <View style={styles.stepHeader}>
                    <Icon name="check-circle" size={24} color={theme.colors.primary} />
                    <Text variant="titleMedium" style={styles.stepTitle}>
                      Review & Confirm Booking
                    </Text>
                  </View>
                  
                  <View style={styles.sectionCard}>
                    <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 12 }}>
                      Guest Details
                    </Text>
                    <Text>
                      <Text style={{ fontWeight: 'bold' }}>Name:</Text> {guestName}
                    </Text>
                    <Text style={{ marginTop: 4 }}>
                      <Text style={{ fontWeight: 'bold' }}>Phone:</Text> {guestPhone}
                    </Text>
                    {idProofBase64 && (
                      <View style={{ marginTop: 16 }}>
                        <Text style={{ fontWeight: 'bold' }}>ID Proof: (Simulated)</Text>
                        <View style={styles.imagePlaceholder} />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.sectionCard}>
                    <Text variant="titleSmall" style={{ fontWeight: 'bold', marginBottom: 12 }}>
                      Booking Summary
                    </Text>
                    {selectedRooms.map(roomId => {
                      const room = rooms.find(r => r.id === roomId);
                      const finalAmount = parseFloat(roomDetails[roomId]?.amount || commonAmount || 0);
                      return (
                        <View key={roomId} style={styles.summaryItem}>
                          <Text style={{ flex: 1 }}>Room {room.roomNo}</Text>
                          <Text style={{ flex: 1 }}>
                            {roomDetails[roomId]?.numberOfPersons || 1} Person(s)
                          </Text>
                          <Text style={{ fontWeight: 'bold' }}>
                            ₹{finalAmount.toFixed(2)}
                          </Text>
                        </View>
                      );
                    })}
                    <Divider style={{ marginVertical: 12 }} />
                    <View style={styles.totalSummary}>
                      <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Total Amount</Text>
                      <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                        ₹{totalAmount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              )}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <Button
                mode="text"
                onPress={step === 0 ? handleCloseModal : handleBack}
              >
                {step === 0 ? 'Cancel' : 'Back'}
              </Button>
              
              {step < steps.length - 1 ? (
                <Button
                  mode="contained"
                  onPress={handleNext}
                >
                  Next
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Confirm Booking
                </Button>
              )}
            </View>
          </View>
        </RNModal>
      </Portal>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appBar: {
    backgroundColor: 'white',
  },
  welcomeCard: {
    padding: 16,
    borderRadius: 12,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: 'gray',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    padding: 24,
  },
  modalHeader: {
    marginBottom: 20,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel: {
    marginTop: 4,
    fontSize: 12,
  },
  modalBody: {
    paddingBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  roomListContainer: {
    maxHeight: 300,
    padding: 8,
  },
  roomCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
  },
  roomCardTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: 'gray',
    marginTop: 32,
  },
  sectionCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  roomDetailsCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: 200,
    height: 150,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
});

export default BookingPage;