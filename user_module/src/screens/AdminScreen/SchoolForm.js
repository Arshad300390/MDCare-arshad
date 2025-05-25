import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform, StatusBar
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import ImageCropPicker from 'react-native-image-crop-picker';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import CONFIG from '../../redux/config/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../styles/theme';

const { BASE_URL } = CONFIG;

const SchoolForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const editingSchool = route.params?.school;

  const [name, setName] = useState(editingSchool?.name || '');
  const [email, setEmail] = useState(editingSchool?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(editingSchool?.phone || '');
  const [description, setDescription] = useState(editingSchool?.description || '');
  const [specialties, setSpecialties] = useState(editingSchool?.specialties?.join(', ') || '');
  const [latitude, setLatitude] = useState(editingSchool?.location?.coordinates?.[1]?.toString() || '');
  const [longitude, setLongitude] = useState(editingSchool?.location?.coordinates?.[0]?.toString() || '');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // For edit, show existing image
  const existingImage = editingSchool?.pic;

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
          name: img.filename || 'school.jpg',
          type: img.mime || 'image/jpeg',
        });
      }
    } catch (e) {
      // User cancelled or error
    }
  };

  const handleSubmit = async () => {
    if (!name || !email || (!editingSchool && !password) || !description || !specialties || !latitude || !longitude) {
      Alert.alert('Validation', 'All fields except phone are required.');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      if (editingSchool) formData.append('id', editingSchool._id); // <-- always send id for edit
      formData.append('name', name);
      formData.append('email', email);
      if (!editingSchool) formData.append('password', password);
      formData.append('phone', phone);
      formData.append('description', description);

      // Specialties as array
      const specialtiesArr = specialties.split(',').map(s => s.trim()).filter(Boolean);
      specialtiesArr.forEach(s => formData.append('specialties[]', s));

      // Location as GeoJSON Point
      formData.append('location[type]', 'Point');
      formData.append('location[coordinates][0]', parseFloat(longitude)); // longitude first
      formData.append('location[coordinates][1]', parseFloat(latitude));  // latitude second

      // Only append image if user picked a new one
      if (image) {
        formData.append('profile', {
          uri: image.uri,
          name: image.name || 'school.jpg',
          type: image.type || 'image/jpeg',
        });
      }

      let url, method;
      if (editingSchool) {
        url = `${BASE_URL}/school/edit-school`; // <-- use your new endpoint
        method = 'put';
      } else {
        url = `${BASE_URL}/school/create-school`;
        method = 'post';
      }

      const token = await AsyncStorage.getItem('authToken');
      const response = await axios({
        method,
        url,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        Alert.alert('Success', editingSchool ? 'School updated!' : 'School created!');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.data.message || 'Something went wrong');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.message);
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
        colors={[theme.colors.primary, theme.colors.secondary]}
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
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={26} color="#035B60" />
          </TouchableOpacity>
          <Text style={styles.title}>{editingSchool ? 'Edit School' : 'Add School'}</Text>
          <View />
        </View>

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.image} />
          ) : existingImage ? (
            <Image source={{ uri: existingImage }} style={styles.image} />
          ) : (
            <Icon name="image-outline" size={40} color="#888" />
          )}
          <Text style={styles.imagePickerText}>Pick Image</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="School Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
        />
        {!editingSchool && (
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={phone}
          keyboardType="phone-pad"
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Specialties (comma separated)"
          value={specialties}
          onChangeText={setSpecialties}
        />
        <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 6 }]}
            placeholder="Latitude"
            value={latitude}
            keyboardType="numeric"
            onChangeText={setLatitude}
          />
          <TextInput
            style={[styles.input, { flex: 1, marginLeft: 6 }]}
            placeholder="Longitude"
            value={longitude}
            keyboardType="numeric"
            onChangeText={setLongitude}
          />
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#07BBC6', '#035B60']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{editingSchool ? 'Update' : 'Create'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default SchoolForm;

const styles = StyleSheet.create({
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
    borderRadius: 12,
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
});