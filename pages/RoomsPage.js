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
  Button,
  TextInput,
  Chip,
  Card,
  IconButton,
  ActivityIndicator,
  Dialog,
  Portal,
  useTheme,
  FAB,
} from "react-native-paper";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Ensure your firebase config and db are imported
import { db } from "../config/firebase";

function RoomsPage() {
  const theme = useTheme();
  const [rooms, setRooms] = useState([]);
  const [roomNo, setRoomNo] = useState("");
  const [roomType, setRoomType] = useState("AC");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const roomsCollection = collection(db, "rooms");

  useEffect(() => {
    const q = query(roomsCollection, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(roomsData);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const resetForm = () => {
    setRoomNo("");
    setRoomType("AC");
    setEditId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!roomNo.trim()) {
      Alert.alert("Error", "Room number cannot be empty.");
      return;
    }

    try {
      if (editId) {
        const roomRef = doc(db, "rooms", editId);
        await updateDoc(roomRef, {
          roomNo,
          roomType,
          updatedAt: serverTimestamp()
        });
        Alert.alert("Success", "Room updated successfully.");
      } else {
        await addDoc(roomsCollection, {
          roomNo,
          roomType,
          status: "Available",
          createdAt: serverTimestamp()
        });
        Alert.alert("Success", "Room added successfully.");
      }
      resetForm();
    } catch (error) {
      console.error("Error submitting room:", error);
      Alert.alert("Error", "Failed to save room. Please try again.");
    }
  };

  const handleEdit = (room) => {
    setEditId(room.id);
    setRoomNo(room.roomNo);
    setRoomType(room.roomType);
    setShowForm(true);
  };

  const handleOpenDeleteDialog = (id) => {
    setRoomToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setRoomToDelete(null);
  };

  const confirmDelete = async () => {
    if (roomToDelete) {
      await deleteDoc(doc(db, "rooms", roomToDelete));
      Alert.alert("Success", "Room deleted successfully.");
    }
    handleCloseDeleteDialog();
  };

  const getRoomIcon = (type) => {
    return type === "AC" ? "ac-unit" : "air";
  };

  const getStatusIcon = (status) => {
    return status === "Available" ? "check-circle" : "cancel";
  };

  const getStatusColor = (status) => {
    return status === "Available" ? theme.colors.primary : theme.colors.error;
  };

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
      <Appbar.Header>
        <Appbar.Content
          title="Room Management"
          subtitle="Manage your hotel rooms and their availability"
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Add/Edit Form */}
        {showForm && (
          <Animated.View entering={FadeIn.duration(300).delay(100)} exiting={FadeOut.duration(300)}>
            <Card style={styles.formCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.formTitle}>
                  {editId ? "Edit Room" : "Add New Room"}
                </Text>
                <TextInput
                  label="Room Number"
                  value={roomNo}
                  onChangeText={setRoomNo}
                  style={styles.textInput}
                />
                <TextInput
                  label="Room Type"
                  value={roomType}
                  onChangeText={setRoomType}
                  style={styles.textInput}
                />
              </Card.Content>
              <Card.Actions style={styles.formActions}>
                <Button onPress={resetForm} style={styles.formButton}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleSubmit} style={styles.formButton}>
                  {editId ? "Update" : "Add Room"}
                </Button>
              </Card.Actions>
            </Card>
          </Animated.View>
        )}

        {/* Rooms Grid */}
        <View style={styles.roomGridContainer}>
          <Text variant="titleMedium" style={styles.gridTitle}>
            All Rooms ({rooms.length})
          </Text>
          {rooms.length > 0 ? (
            <View style={styles.roomGrid}>
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  style={[
                    styles.roomCard,
                    { borderColor: `${getStatusColor(room.status)}` },
                  ]}
                >
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Icon name="hotel" size={24} color={theme.colors.primary} />
                      </View>
                      <View style={styles.statusChip}>
                        <Icon
                          name={getStatusIcon(room.status)}
                          size={18}
                          color={getStatusColor(room.status)}
                        />
                        <Text style={{ color: getStatusColor(room.status), marginLeft: 4 }}>
                          {room.status}
                        </Text>
                      </View>
                    </View>

                    <Text variant="titleLarge" style={{ fontWeight: 'bold', marginTop: 16 }}>
                      Room {room.roomNo}
                    </Text>

                    <View style={styles.roomTypeContainer}>
                      <Icon name={getRoomIcon(room.roomType)} size={20} color={theme.colors.textSecondary} />
                      <Text style={{ marginLeft: 8 }}>{room.roomType}</Text>
                    </View>
                  </Card.Content>
                  <Card.Actions style={styles.cardActions}>
                    <IconButton icon="pencil" onPress={() => handleEdit(room)} />
                    <IconButton icon="delete" onPress={() => handleOpenDeleteDialog(room.id)} />
                  </Card.Actions>
                </Card>
              ))}
            </View>
          ) : (
            <Card style={styles.emptyStateCard}>
              <Card.Content style={styles.emptyStateContent}>
                <Icon name="hotel" size={64} color={theme.colors.onSurfaceDisabled} />
                <Text variant="titleMedium" style={styles.emptyStateText}>
                  No rooms found
                </Text>
                <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
                  Get started by adding your first room
                </Text>
                <Button
                  mode="contained"
                  onPress={() => setShowForm(true)}
                  style={{ marginTop: 16 }}
                >
                  Add First Room
                </Button>
              </Card.Content>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={openDeleteDialog} onDismiss={handleCloseDeleteDialog}>
          <Dialog.Title>Confirm Deletion</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to permanently delete this room? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseDeleteDialog}>Cancel</Button>
            <Button onPress={confirmDelete} mode="contained" buttonColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* FAB */}
      <FAB
        icon="plus"
        label="Add New Room"
        onPress={() => setShowForm(true)}
        style={styles.fab}
      />
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
  formCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  formTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  textInput: {
    marginBottom: 16,
  },
  formActions: {
    justifyContent: 'flex-end',
    padding: 16,
  },
  formButton: {
    marginLeft: 8,
  },
  roomGridContainer: {
    marginTop: 16,
  },
  gridTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roomCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  roomTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cardActions: {
    justifyContent: 'flex-end',
    padding: 8,
  },
  emptyStateCard: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderRadius: 12,
    padding: 24,
    marginTop: 24,
    alignItems: 'center',
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateText: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default RoomsPage;