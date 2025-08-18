import React, { useEffect, useState, useMemo } from "react";
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
  Text,
  Card,
  Chip,
  Avatar,
  useTheme,
  ActivityIndicator,
  ProgressBar,
  Appbar,
  Button,
} from "react-native-paper";
import { collection, onSnapshot } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  LineChart,
  BarChart,
} from "react-native-chart-kit";
import DateTimePicker from "@react-native-community/datetimepicker";
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import {
  subDays,
  format,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { Dimensions } from 'react-native';

// Make sure to import your firebase config and db instance
import { db } from "../config/firebase";

const screenWidth = Dimensions.get("window").width;

const KPICard = ({ title, value, icon, color, trend }) => {
  const theme = useTheme();
  
  return (
    <Animated.View entering={FadeIn.duration(500)}>
      <Card
        style={[
          styles.kpiCard,
          {
            borderColor: `${color}30`,
          },
        ]}
      >
        <Card.Content style={styles.kpiCardContent}>
          <View style={styles.kpiHeader}>
            <Avatar.Icon
              size={56}
              icon={icon}
              style={{ backgroundColor: `${color}20`, color: color }}
            />
            {trend && (
              <Chip
                icon={() => <Icon name="trending-up" size={18} />}
                style={{ backgroundColor: `${theme.colors.success}20` }}
              >
                <Text style={{ color: theme.colors.success }}>{trend}</Text>
              </Chip>
            )}
          </View>
          <Text variant="headlineMedium" style={styles.kpiValue}>
            {value}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {title}
          </Text>
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const DashboardPage = () => {
  const theme = useTheme();
  const [allBookings, setAllBookings] = useState([]);
  const [dateRange, setDateRange] = useState([subDays(new Date(), 30), new Date()]);
  const [startDate, endDate] = dateRange;
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState(null);

  const TOTAL_AVAILABLE_ROOMS = 15;

  useEffect(() => {
    const bookingsCollection = collection(db, "bookings");
    const unsubscribe = onSnapshot(bookingsCollection, (snapshot) => {
      const bookingsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllBookings(bookingsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredBookings = useMemo(() => {
    if (!startDate || !endDate) return [];
    return allBookings.filter((booking) => {
      const checkInDate = booking.checkIn?.toDate();
      if (!checkInDate) return false;
      return isWithinInterval(checkInDate, {
        start: startOfDay(startDate),
        end: endOfDay(endDate),
      });
    });
  }, [allBookings, startDate, endDate]);

  const {
    totalRevenue,
    totalBookings,
    occupancyRate,
    averageDailyRate,
    revenueOverTime,
    bookingsByRoom,
    performanceByRoom,
  } = useMemo(() => {
    if (filteredBookings.length === 0) {
      return {
        totalRevenue: 0,
        totalBookings: 0,
        occupancyRate: 0,
        averageDailyRate: 0,
        revenueOverTime: { labels: [], data: [] },
        bookingsByRoom: { labels: [], data: [] },
        performanceByRoom: [],
      };
    }

    const totalRevenue = filteredBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
    const totalBookings = filteredBookings.length;
    const averageDailyRate = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    const daysInRange = (endOfDay(endDate).getTime() - startOfDay(startDate).getTime()) / (1000 * 3600 * 24) + 1;
    const totalRoomNightsAvailable = TOTAL_AVAILABLE_ROOMS * daysInRange;
    const occupancyRate = totalRoomNightsAvailable > 0 ? (totalBookings / totalRoomNightsAvailable) * 100 : 0;

    const revenueByDate = {};
    const bookingsByRoomData = {};
    const performanceByRoomData = {};

    filteredBookings.forEach((booking) => {
      const dateStr = format(booking.checkIn.toDate(), "yyyy-MM-dd");
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + booking.amount;

      const roomNo = booking.roomNo || "Unknown";
      bookingsByRoomData[roomNo] = (bookingsByRoomData[roomNo] || 0) + 1;
      if (!performanceByRoomData[roomNo]) {
        performanceByRoomData[roomNo] = { roomNo, totalBookings: 0, totalRevenue: 0 };
      }
      performanceByRoomData[roomNo].totalBookings += 1;
      performanceByRoomData[roomNo].totalRevenue += booking.amount;
    });

    const sortedRevenueDates = Object.keys(revenueByDate).sort();
    const revenueOverTime = {
      labels: sortedRevenueDates.map(date => format(new Date(date), 'MMM d')),
      data: sortedRevenueDates.map(date => revenueByDate[date]),
    };
    
    const sortedRooms = Object.keys(bookingsByRoomData).sort((a,b) => bookingsByRoomData[b] - bookingsByRoomData[a]);
    const bookingsByRoom = {
        labels: sortedRooms,
        data: sortedRooms.map(room => bookingsByRoomData[room]),
    };

    const performanceByRoom = Object.values(performanceByRoomData).sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      totalRevenue,
      totalBookings,
      occupancyRate,
      averageDailyRate,
      revenueOverTime,
      bookingsByRoom,
      performanceByRoom,
    };
  }, [filteredBookings, startDate, endDate]);
  
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerType === 'start') {
        setDateRange([selectedDate, endDate]);
      } else {
        setDateRange([startDate, selectedDate]);
      }
    }
  };

  const lineChartData = {
    labels: revenueOverTime.labels,
    datasets: [{
      data: revenueOverTime.data,
      color: (opacity = 1) => theme.colors.primary,
      strokeWidth: 3,
    }],
    legend: ["Revenue"]
  };
  
  const barChartData = {
    labels: bookingsByRoom.labels,
    datasets: [{
      data: bookingsByRoom.data,
      color: (opacity = 1) => theme.colors.secondary,
    }],
    legend: ["# of Bookings"]
  };
  
  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: theme.colors.primary,
    },
    decimalPlaces: 0,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content
          title="Dashboard"
          subtitle="Monitor your hotel's performance"
        />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text variant="headlineSmall" style={styles.pageTitle}>
            Dashboard Overview
          </Text>
          <Text variant="bodyMedium" style={styles.pageSubtitle}>
            Monitor your hotel's performance and key metrics
          </Text>
        </View>

        {/* Date Picker */}
        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            onPress={() => {
              setDatePickerType('start');
              setShowDatePicker(true);
            }}
            style={styles.datePickerButton}
          >
            <Text style={styles.datePickerText}>
              {startDate ? format(startDate, 'MMM d, yyyy') : 'Start Date'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.dateRangeDivider}> to </Text>
          <TouchableOpacity
            onPress={() => {
              setDatePickerType('end');
              setShowDatePicker(true);
            }}
            style={styles.datePickerButton}
          >
            <Text style={styles.datePickerText}>
              {endDate ? format(endDate, 'MMM d, yyyy') : 'End Date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={datePickerType === 'start' ? startDate || new Date() : endDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          <KPICard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            icon="attach-money"
            color={theme.colors.success}
            trend="+12%"
          />
          <KPICard
            title="Total Bookings"
            value={totalBookings}
            icon="hotel"
            color={theme.colors.primary}
            trend="+8%"
          />
          <KPICard
            title="Occupancy Rate"
            value={`${occupancyRate.toFixed(1)}%`}
            icon="assessment"
            color={theme.colors.warning}
            trend="+5%"
          />
          <KPICard
            title="Avg. Daily Rate"
            value={`₹${averageDailyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon="trending-up"
            color={theme.colors.secondary}
            trend="+15%"
          />
        </View>

        {/* Charts */}
        <View style={styles.chartContainer}>
          <Animated.View entering={FadeIn.duration(500).delay(200)}>
            <Card style={styles.chartCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.chartTitle}>
                  Revenue Trend
                </Text>
                {revenueOverTime.labels.length > 0 ? (
                  <LineChart
                    data={lineChartData}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => theme.colors.primary,
                    }}
                    bezier
                    style={styles.chart}
                  />
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No data for this period.</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </Animated.View>
        </View>

        <View style={styles.chartContainer}>
          <Animated.View entering={FadeIn.duration(500).delay(300)}>
            <Card style={styles.chartCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.chartTitle}>
                  Bookings by Room
                </Text>
                {bookingsByRoom.labels.length > 0 ? (
                  <BarChart
                    data={barChartData}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => theme.colors.secondary,
                    }}
                    style={styles.chart}
                    fromZero
                  />
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No data for this period.</Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </Animated.View>
        </View>

        {/* Performance Table */}
        <Animated.View entering={FadeIn.duration(500).delay(400)}>
          <Card style={styles.tableCard}>
            <Card.Title
              title="Room Performance"
              subtitle="Detailed breakdown of bookings and revenue per room"
            />
            <Card.Content style={styles.tableContent}>
              {performanceByRoom.length > 0 ? (
                performanceByRoom.map((room, index) => (
                  <View key={room.roomNo} style={styles.tableRow}>
                    <View style={styles.tableCell}>
                      <Avatar.Text size={32} label={room.roomNo} />
                      <Text style={{ marginLeft: 8 }}>Room {room.roomNo}</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Chip>{room.totalBookings}</Chip>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={{ fontWeight: 'bold', color: theme.colors.success }}>
                        ₹{room.totalRevenue.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.tableCell}>
                      <ProgressBar
                        progress={Math.min((room.totalRevenue / Math.max(...performanceByRoom.map(r => r.totalRevenue))) * 100, 100) / 100}
                        color={index === 0 ? theme.colors.success : theme.colors.primary}
                        style={{ width: 80 }}
                      />
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No performance data available for this period.</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>
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
    marginBottom: 16,
  },
  pageTitle: {
    fontWeight: 'bold',
  },
  pageSubtitle: {
    color: 'gray',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  datePickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  datePickerText: {
    fontWeight: 'bold',
  },
  dateRangeDivider: {
    color: 'gray',
    marginHorizontal: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  kpiCardContent: {
    padding: 16,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontWeight: 'bold',
  },
  chartContainer: {
    marginBottom: 16,
  },
  chartCard: {
    borderRadius: 12,
  },
  chartTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tableCard: {
    borderRadius: 12,
  },
  tableContent: {
    padding: 0,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  tableCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noDataText: {
    color: 'gray',
  },
});

export default DashboardPage;