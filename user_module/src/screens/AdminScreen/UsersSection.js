/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator,
  Alert, Image, Dimensions, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import CONFIG from '../../redux/config/Config';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

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
      setUsers(response.data?.users || []);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };
 useFocusEffect(
    React.useCallback(() => {
      getUsers();
    }, [])
  );

  const handleEdit = (user) => {
    navigation.navigate('UserForm', { user }); // Make sure you have a UserForm screen
  };

 const handleDelete = async (userId, token) => {
  try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        navigation.replace('Signin');
        return;
      }
      const response = await axios.delete(
      `${BASE_URL}/auth/delete-user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.data.success) {
      Alert.alert('Success', 'User deleted successfully!');
      getUsers();
    } else {
      console.log('Error', response.data.message || 'Failed to delete user');
    }
    // }
  } catch (error) {
    console.log('Error', error.response?.data?.message || error.message);
  }
};

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
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('UserForm')}
        >
          <Feather name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={userList}
        keyExtractor={(item, index) => item._id?.toString() || index.toString()}
        numColumns={2}
        columnWrapperStyle={styles.cardRow}
        renderItem={({ item, index }) => {
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
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleEdit(item)}
                >
                  <Feather name="edit-2" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#FF7F50' }]} // <-- orange background for delete
                  onPress={() => handleDelete(item._id)}
                >
                  <Feather name="trash-2" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          );
        }}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('UserForm')}
      >
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
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
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  actionBtn: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 20,
    padding: 6,
    marginHorizontal: 2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#07BBC6',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 10,
  },
});