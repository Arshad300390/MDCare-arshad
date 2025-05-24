import React, { useState } from 'react';
import {
    StyleSheet, Text, View, TextInput, TouchableOpacity,
    Platform, StatusBar, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { theme } from '../../styles/theme';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import CONFIG from '../../redux/config/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';

const { BASE_URL } = CONFIG;

const ConsultantForm = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const editingConsultant = route.params?.consultant;

    const [name, setName] = useState(editingConsultant?.name || '');
    const [email, setEmail] = useState(editingConsultant?.email || '');
    const [password, setPassword] = useState('');
    const [expertise, setExpertise] = useState(editingConsultant?.expertise || '');
    const [bio, setBio] = useState(editingConsultant?.bio || '');
    const [phone, setPhone] = useState(editingConsultant?.phone || '');
    const [latitude, setLatitude] = useState(editingConsultant?.location?.coordinates?.[1]?.toString() || '');
    const [longitude, setLongitude] = useState(editingConsultant?.location?.coordinates?.[0]?.toString() || '');
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setExpertise('');
        setBio('');
        setPhone('');
        setLatitude('');
        setLongitude('');
    };

    const handleSubmit = async () => {
        if (!name || !email || (!editingConsultant && !password) || !expertise || !latitude || !longitude) {
            Alert.alert('Validation', 'All fields except phone and bio are required.');
            return;
        }
        setLoading(true);
        try {
            let url, method, bodyData;

            if (editingConsultant) {
                // EDIT: Use PUT and /consultant/edit-consultant
                url = `${BASE_URL}/consultant/edit-consultant`;
                method = 'PUT';
                bodyData = {
                    id: editingConsultant._id,
                    name,
                    expertise,
                    location: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)],
                    },
                    bio,
                    phone,
                };
            } else {
                // ADD: Use POST and /consultant/create-consultant
                url = `${BASE_URL}/consultant/create-consultant`;
                method = 'POST';
                bodyData = {
                    name,
                    email,
                    password,
                    expertise,
                    bio,
                    phone,
                    location: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)],
                    },
                };
            }

            // Remove undefined fields
            Object.keys(bodyData).forEach(key => bodyData[key] === undefined && delete bodyData[key]);

            const token = await AsyncStorage.getItem('authToken');
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(bodyData),
            });

            // Robust JSON parse
            const text = await response.text();
            let resJson;
            try {
                resJson = JSON.parse(text);
            } catch (e) {
                throw new Error('Server did not return valid JSON: ' + text);
            }

            if (resJson.success) {
                Alert.alert('Success', editingConsultant ? 'Consultant updated!' : 'Consultant created!');
                resetForm();
                navigation.goBack();
            } else {
                Alert.alert('Error', resJson.message || 'Something went wrong');
            }
        } catch (err) {
            console.log('Error', err.message);
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
                <Text style={styles.title}>{editingConsultant ? 'Edit Consultant' : 'Add Consultant'}</Text>
                <View />
            </View>
            <TextInput
                style={styles.input}
                placeholder="Name"
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
                editable={!editingConsultant} // Prevent editing email on edit
            />
            {!editingConsultant && (
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
                placeholder="Expertise"
                value={expertise}
                onChangeText={setExpertise}
            />
            <TextInput
                style={styles.input}
                placeholder="Bio (optional)"
                value={bio}
                onChangeText={setBio}
                multiline
            />
            <TextInput
                style={styles.input}
                placeholder="Phone (optional)"
                value={phone}
                keyboardType="phone-pad"
                onChangeText={setPhone}
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
                        <Text style={styles.submitText}>{editingConsultant ? 'Update' : 'Create'}</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </ScrollView>
        </View>
    );
};

export default ConsultantForm;

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