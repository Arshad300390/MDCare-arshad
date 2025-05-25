/* eslint-disable no-catch-shadow */
/* eslint-disable no-shadow */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Image, Dimensions, Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import Icon from 'react-native-vector-icons/Ionicons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import CONFIG from '../../redux/config/Config';

const { BASE_URL } = CONFIG;
const { width } = Dimensions.get('window');
const cardColors = [
  ['#07BBC6', '#035B60'],
  ['#144E47', '#238579'],
  ['#AE9352', '#88835B'],
  ['#D5664B', '#C15D43'],
];

const SchoolsSection = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const getSchools = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        navigation.replace('Signin');
        return;
      }
      const response = await axios.get(`${BASE_URL}/school/get-school`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSchools(response.data?.schools || []);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (schoolId) => {
    Alert.alert(
      'Delete School',
      'Are you sure you want to delete this school?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              await axios.post(
                `${BASE_URL}/school/delete-school`,
                { id: schoolId }, // send id in body
                { headers: { Authorization: `Bearer ${token}` } }
              );
              getSchools();
            } catch (err) {
              console.log('Error', 'Failed to delete school.');
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      getSchools();
    }, [])
  );

  const schoolList = Array.isArray(schools) ? schools : schools ? [schools] : [];

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

  if (!schoolList.length) {
    return (
      <View style={styles.centered}>
        <Text>No schools found.</Text>
        {/* Floating Add Button */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('SchoolForm')}
        >
          <LinearGradient
            colors={['#07BBC6', '#035B60']}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="add" size={32} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={schoolList}
        keyExtractor={(item, index) => item._id?.toString() || index.toString()}
        renderItem={({ item, index }) => (
          <LinearGradient
            colors={cardColors[index % cardColors.length]}
            style={styles.card}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            <Image
              source={
                item.pic
                  ? { uri: item.pic }
                  : require('../../assets/placeHolder/default_avatar.png')
              }
              style={styles.schoolImage}
              resizeMode="cover"
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardValue}>{item.name || 'No Name'}</Text>
              <Text style={styles.cardLabel}>{item.email || 'No Email'}</Text>
              <Text style={styles.cardLabel} numberOfLines={2} ellipsizeMode="tail">
                {item.description || 'No Description'}
              </Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('SchoolForm', { school: item })}
                >
                  <Icon name="create-outline" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#D5664B' }]}
                  onPress={() => handleDelete(item._id)}
                >
                  <Icon name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        )}
        contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 8 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('SchoolForm')}
      >
        <LinearGradient
          colors={['#07BBC6', '#035B60']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name="add" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default SchoolsSection;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginVertical: 10,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    backgroundColor: 'transparent',
    minHeight: 220,
  },
  schoolImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cardContent: {
    padding: 16,
    alignItems: 'flex-start',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#fff',
  },
  cardLabel: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 2,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-evenly',
    width: '100%',
  },


  actionBtn: {
    flex: 1, // Equal width
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#238579',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    marginHorizontal: 10,
  },

  actionBtnText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    zIndex: 100,
    elevation: 5,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});