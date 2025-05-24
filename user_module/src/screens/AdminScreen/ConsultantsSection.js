import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert, Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import CONFIG from '../../redux/config/Config';

const { BASE_URL } = CONFIG;
const { width } = Dimensions.get('window');
const cardColors = [
  ['#07BBC6', '#035B60'],
  ['#144E47', '#238579'],
  ['#AE9352', '#88835B'],
  ['#D5664B', '#C15D43'],
];

const ConsultantsSection = () => {
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const getConsultants = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        navigation.replace('Signin');
        return;
      }
      const response = await axios.get(`${BASE_URL}/consultant/get-consultant`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setConsultants(response.data?.consultants || []);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (consultantId) => {
    Alert.alert(
      'Delete Consultant',
      'Are you sure you want to delete this consultant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              await axios.delete(`${BASE_URL}/consultant/delete/${consultantId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              getConsultants();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete consultant.');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    getConsultants();
  }, []);

  const consultantList = Array.isArray(consultants) ? consultants : consultants ? [consultants] : [];

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

  if (!consultantList.length) {
    return (
      <View style={styles.centered}>
        <Text>No consultants found.</Text>
        {/* Floating Add Button */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ConsultantForm')}
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
        data={consultantList}
        keyExtractor={(item, index) => item._id?.toString() || index.toString()}
        renderItem={({ item, index }) => (
          <LinearGradient
            colors={cardColors[index % cardColors.length]}
            style={styles.card}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            {item.pic ? (
              <Image
                source={{ uri: item.pic }}
                style={styles.consultantImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarRect}>
                <Text style={styles.avatarInitials}>
                  {item.name
                    ? item.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'C'}
                </Text>
              </View>
            )}
            <View style={styles.cardContent}>
              <Text style={styles.cardValue}>{item.name || 'No Name'}</Text>
              <Text style={styles.cardLabel}>{item.email || 'No Email'}</Text>
              <Text style={styles.cardLabel}>{item.expertise || 'No Expertise'}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('ConsultantForm', { consultant: item })}
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
        onPress={() => navigation.navigate('ConsultantForm')}
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

export default ConsultantsSection;

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
  consultantImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  avatarRect: {
    width: '100%',
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  avatarInitials: {
    fontSize: 38,
    color: '#fff',
    fontWeight: 'bold',
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
    flex: 1,
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