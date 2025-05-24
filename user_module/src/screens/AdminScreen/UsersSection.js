/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-catch-shadow */
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import CONFIG from '../../redux/config/Config';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const { BASE_URL } = CONFIG;
const { width } = Dimensions.get('window');
const cardColors = [
  ['#07BBC6', '#035B60'],
  ['#144E47', '#238579'],
  ['#AE9352', '#88835B'],
  ['#D5664B', '#C15D43'],
];

const UsersSection = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const getUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        navigation.replace('Signin');
        return;
      }
      const response = await axios.get(`${BASE_URL}/auth/get-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data?.users);
      setUsers(response.data?.users || []);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, []);

  const userList = Array.isArray(users) ? users : users ? [users] : [];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#07BBC6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red' }}>
          {typeof error === 'string'
            ? error
            : error.message
              ? error.message
              : JSON.stringify(error)}
        </Text>
      </View>
    );
  }

  if (!userList.length) {
    return (
      <View style={styles.centered}>
        <Text>No users found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={userList}
      keyExtractor={(item, index) => item._id?.toString() || index.toString()}
      numColumns={2}
      columnWrapperStyle={styles.cardRow}
      renderItem={({ item, index }) => {
        // Check for a valid avatar URL
        const hasValidAvatar =
          item.avatar &&
          item.avatar !== 'null' &&
          item.avatar !== null &&
          item.avatar !== undefined &&
          item.avatar !== '';

        return (
          <LinearGradient
            colors={cardColors[index % cardColors.length]}
            style={styles.card}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            <View style={styles.avatarContainer}>
              <Image
                source={
                  hasValidAvatar
                    ? { uri: item.avatar }
                    : require('../../assets/placeHolder/default_avatar.png')
                }
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.cardValue}>{item.fullname || 'No Name'}</Text>
            <Text style={styles.cardLabel}>{item.email || 'No Email'}</Text>
            <Text style={styles.cardLabel}>{item.superAdmin ? 'Admin' : 'User'}</Text>
          </LinearGradient>
        );
      }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default UsersSection;

const styles = StyleSheet.create({
  cardRow: {
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  card: {
    flex: 1,
    margin: 4,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    backgroundColor: 'transparent',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
    color: '#fff',
    textAlign: 'center',
  },
  cardLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: 'rgba(255,255,255,0.15)',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 8,
},
avatarImage: {
  width: 40,
  height: 40,
  borderRadius: 20,
},
});