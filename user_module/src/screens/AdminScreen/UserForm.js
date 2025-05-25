import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  Switch,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageCropPicker from 'react-native-image-crop-picker';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { theme } from '../../styles/theme';
import CONFIG from '../../redux/config/Config'; // <-- adjust if needed

const { BASE_URL } = CONFIG;

const UserForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const editingUser = route.params?.user;

  const [fullname, setFullname] = useState(editingUser?.fullname || '');
  const [email, setEmail] = useState(editingUser?.email || '');
  const [password, setPassword] = useState('');
  const [superAdmin, setSuperAdmin] = useState(editingUser?.superAdmin || false);
  const [latitude, setLatitude] = useState(editingUser?.location?.coordinates?.[1]?.toString() || '');
  const [longitude, setLongitude] = useState(editingUser?.location?.coordinates?.[0]?.toString() || '');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const existingAvatar = editingUser?.avatar;

  const pickImage = async () => {
    try {
      const img = await ImageCropPicker.openPicker({
        width: 600,
        height: 600,
        cropping: true,
        compressImageQuality: 0.8,
        mediaType: 'photo',
      });
      if (img && img.path) {
        setImage({
          uri: img.path,
          name: img.filename || 'avatar.jpg',
          type: img.mime || 'image/jpeg',
        });
      }
    } catch (e) {
      console.log('Image picker error:', e);
    }
  };

  const fillCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.log('Error', 'Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
      },
      error => {
        console.log('Error getting location:', error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleSubmit = async () => {
    const trimmedLat = latitude.trim();
    const trimmedLng = longitude.trim();
    const nLat = Number(trimmedLat);
    const nLng = Number(trimmedLng);

    if (!fullname || !email || (!editingUser && !password)) {
      console.log('Validation', 'All fields except password (for update) are required.');
      return;
    }

    if (!trimmedLat || !trimmedLng || isNaN(nLat) || isNaN(nLng)) {
      console.log('Error', 'Longitude and Latitude are required and must be valid numbers!');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (editingUser) formData.append('id', String(editingUser._id));
      formData.append('fullname', fullname);
      formData.append('email', email);
      if (!editingUser) {
        formData.append('password', password);
        formData.append('confirmPassword', password);
      }
      formData.append('superAdmin', String(superAdmin));
      formData.append('latitude', String(trimmedLat));
      formData.append('longitude', String(trimmedLng));

      if (image) {
        formData.append('avatar', {
          uri: image.uri,
          name: image.name,
          type: image.type,
        });
      }

      const token = await AsyncStorage.getItem('authToken');

      const response = await axios({
        method: editingUser ? 'put' : 'post',
        url: `${BASE_URL}/auth/${editingUser ? 'edit-user' : 'create-user'}`,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        console.log('Success', editingUser ? 'User updated!' : 'User created!');
        navigation.goBack();
      } else {
        console.log('Error', response.data.message || 'Something went wrong');
      }
    } catch (err) {
      console.error('Request Error:', err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />
      <LinearGradient
        colors={['#07BBC6', '#035B60']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
          zIndex: 1,
        }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView contentContainerStyle={localStyles.container}>
        <View style={localStyles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={localStyles.backBtn}>
            <Feather name="arrow-left" size={26} color="#035B60" />
          </TouchableOpacity>
          <Text style={localStyles.title}>{editingUser ? 'Edit User' : 'Add User'}</Text>
          <View />
        </View>

        <TouchableOpacity style={localStyles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={localStyles.image} />
          ) : existingAvatar ? (
            <Image source={{ uri: existingAvatar }} style={localStyles.image} />
          ) : (
            <Icon name="image-outline" size={40} color="#888" />
          )}
          <Text style={localStyles.imagePickerText}>Pick Avatar</Text>
        </TouchableOpacity>

        <TextInput
          style={localStyles.input}
          placeholder="Full Name"
          value={fullname}
          onChangeText={setFullname}
        />
        <TextInput
          style={localStyles.input}
          placeholder="Email"
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
        />
        {!editingUser && (
          <TextInput
            style={localStyles.input}
            placeholder="Password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />
        )}
        <View style={localStyles.switchRow}>
          <Text style={localStyles.switchLabel}>Super Admin</Text>
          <Switch
            value={superAdmin}
            onValueChange={setSuperAdmin}
            thumbColor={superAdmin ? '#07BBC6' : '#ccc'}
            trackColor={{ false: '#ccc', true: '#07BBC6' }}
          />
        </View>
        <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextInput
            style={[localStyles.input, { flex: 1, marginRight: 6 }]}
            placeholder="Latitude"
            value={latitude}
            keyboardType="numeric"
            onChangeText={setLatitude}
          />
          <TextInput
            style={[localStyles.input, { flex: 1, marginLeft: 6 }]}
            placeholder="Longitude"
            value={longitude}
            keyboardType="numeric"
            onChangeText={setLongitude}
          />
          <TouchableOpacity onPress={fillCurrentLocation} style={{ marginLeft: 8 }}>
            <Feather name="map-pin" size={28} color="#035B60" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={localStyles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#07BBC6', '#035B60']}
            style={localStyles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={localStyles.submitText}>{editingUser ? 'Update' : 'Create'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default UserForm;

const localStyles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F7F7F7',
    flexGrow: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#035B60',
    marginBottom: 18,
  },
  imagePicker: {
    alignItems: 'center',
    marginBottom: 18,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 6,
    backgroundColor: '#e0e0e0',
  },
  imagePickerText: {
    color: '#035B60',
    fontWeight: '600',
    fontSize: 15,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  submitBtn: {
    width: '100%',
    marginTop: 18,
    borderRadius: 10,
    overflow: 'hidden',
  },
  submitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 50,
    marginBottom: 18,
  },
  backBtn: {
    marginRight: 10,
    padding: 4,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 16,
    color: '#035B60',
    fontWeight: '600',
  },
});