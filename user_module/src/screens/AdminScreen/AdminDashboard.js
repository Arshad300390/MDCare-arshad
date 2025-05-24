/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions, FlatList, Animated, SafeAreaView, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { theme } from '../../styles/theme';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../redux/slices/authSlice';
import UsersSection from './UsersSection';
import SchoolsSection from './SchoolsSection';
import ConsultantsSection from './ConsultantsSection';
import WaitingListSection from './WaitingListSection';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONFIG from '../../redux/config/Config';
const { BASE_URL } = CONFIG;

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = 200;
const SIDEBAR_COLLAPSED_WIDTH = 60;
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;

const menuItems = [
  { label: 'Dashboard', icon: <Icon name="grid" size={22} color="#fff" /> },
  { label: 'Chats', icon: <Icon name="chatbubble-ellipses" size={22} color="#fff" /> },
  { label: 'Users', icon: <Icon name="people" size={22} color="#fff" /> },
  { label: 'Schools', icon: <Icon name="school" size={22} color="#fff" /> },
  { label: 'Consultants', icon: <FontAwesome5 name="user-tie" size={20} color="#fff" /> },
  { label: 'Waiting List', icon: <MaterialIcon name="pending-actions" size={22} color="#fff" /> },
  { label: 'Logout', icon: <Icon name="log-out-outline" size={22} color="#fff" /> },
];

const AdminDashboard = ({ navigation }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedSection, setSelectedSection] = useState('Dashboard');
  const [counts, setCounts] = useState({ users: 0, schools: 0, consultants: 0 });
  const dispatch = useDispatch();

  const fetchCounts = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        navigation.replace('Signin');
        return;
      }
      const response = await axios.get(`${BASE_URL}/admin/counts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCounts(response.data || { users: 0, schools: 0, consultants: 0 });
    } catch (error) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    if (selectedSection === 'Dashboard') {
      fetchCounts();
    }
  }, [selectedSection]);

  const cardData = [
    {
      label: 'Total Users',
      value: counts.users,
      icon: <Icon name="people" size={32} color="#fff" />,
      colors: ['#07BBC6', '#035B60'],
      section: 'Users',
    },
    {
      label: 'Total Schools',
      value: counts.schools,
      icon: <Icon name="school" size={32} color="#fff" />,
      colors: ['#144E47', '#238579'],
      section: 'Schools',
    },
    {
      label: 'Total Consultants',
      value: counts.consultants,
      icon: <FontAwesome5 name="user-tie" size={28} color="#fff" />,
      colors: ['#AE9352', '#88835B'],
      section: 'Consultants',
    },
    {
      label: 'schl|cnsltnt Pending Approvals',
      value: `${counts.schoolsWaiting || 0} | ${counts.consultantsWaiting || 0}`,
      icon: <MaterialIcon name="pending-actions" size={32} color="#fff" />,
      colors: ['#D5664B', '#C15D43'],
      section: 'Waiting List',
    },
  ];

  const handleMenuPress = (label) => {
    if (label === 'Logout') {
      dispatch(logoutUser()).then(() => {
        navigation.replace('Signin');
      });
    } else {
      setSelectedSection(label);
    }
  };

  // Render main section based on selectedSection
  const renderMainSection = () => {
    if (selectedSection === 'Dashboard') {
      return (
        <FlatList
          data={cardData}
          keyExtractor={item => item.label}
          numColumns={2}
          columnWrapperStyle={styles.cardRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedSection(item.section)}
            >
              <LinearGradient
                colors={item.colors}
                style={styles.card}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              >
                {item.icon}
                <Text style={styles.cardValue}>{item.value}</Text>
                <Text style={styles.cardLabel}>{item.label}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      );
    }
    if (selectedSection === 'Users') {
      return <UsersSection />;
    }
    if (selectedSection === 'Schools') {
      return <SchoolsSection />;
    }
    if (selectedSection === 'Consultants') {
      return <ConsultantsSection />
    }
    if (selectedSection === 'Waiting List') {
      return <WaitingListSection />
    }
    // Add more sections as needed 
    return (
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 18 }}>No content for this section yet.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* StatusBar with solid color */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.statusBarGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Sidebar */}
      <Animated.View style={[
        styles.sidebar,
        collapsed ? styles.sidebarCollapsed : null,
        { position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 10 }
      ]}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={[styles.sidebarGradient, collapsed ? styles.sidebarCollapsed : null]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity onPress={() => setCollapsed(!collapsed)} style={styles.collapseBtn}>
            <Icon name={collapsed ? 'chevron-forward' : 'chevron-back'} size={24} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={menuItems}
            keyExtractor={item => item.label}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleMenuPress(item.label)}
              >
                {item.icon}
                {!collapsed && (
                  <Text style={styles.menuLabel}>{item.label}</Text>
                )}
              </TouchableOpacity>
            )}
            style={{ flex: 1, width: '100%' }}
          />
        </LinearGradient>
      </Animated.View>

      {/* Main Section */}
      <View style={[
        styles.mainSection,
        { marginLeft: SIDEBAR_COLLAPSED_WIDTH }
      ]}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.solidTopbar}>
            <Text style={styles.topbarTitle}>{selectedSection}</Text>
          </View>
        </SafeAreaView>
        {renderMainSection()}
      </View>
    </View>
  );
};

export default AdminDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
  },
  statusBarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StatusBar.currentHeight || 24,
    zIndex: 1,
  },

  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: 'transparent',
    paddingTop: 0,
    alignItems: 'flex-start',
    elevation: 4,
    height: '100%',
    marginTop: STATUSBAR_HEIGHT,
  },
  sidebarGradient: {
    flex: 1,
    width: SIDEBAR_WIDTH,
    paddingTop: 30,
    alignItems: 'flex-start',
  },
  sidebarCollapsed: {
    width: SIDEBAR_COLLAPSED_WIDTH,
    alignItems: 'center',
  },
  collapseBtn: {
    alignSelf: 'flex-end',
    marginVertical: 10,
    marginRight: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 20,
    padding: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: '100%',
    backgroundColor: 'transparent',
  },
  menuLabel: {
    marginLeft: 14,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  safeArea: {
    width: '100%',
  },
  solidTopbar: {
    width: '100%',
    marginTop: 50,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  topbarTitle: {
    color: 'black',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mainSection: {
    flex: 1,
    paddingTop: -24,
    marginLeft: SIDEBAR_COLLAPSED_WIDTH,
    minHeight: height,
  },
  cardRow: {
    justifyContent: 'space-evenly',
    marginBottom: 18,
  },
  card: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    minWidth: (width - SIDEBAR_COLLAPSED_WIDTH - 72) / 2,
    maxWidth: (width - SIDEBAR_COLLAPSED_WIDTH - 72) / 2,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#fff',
  },
  cardLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});