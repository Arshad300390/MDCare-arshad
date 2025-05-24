import React, { useEffect, useState } from 'react';
import {
    StyleSheet, Text, View, Alert, ActivityIndicator, Image, Dimensions, ScrollView, TouchableOpacity
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import CONFIG from '../../redux/config/Config';

const { BASE_URL } = CONFIG;
const { width } = Dimensions.get('window');
const cardColors = [
    ['#07BBC6', '#035B60'],
    ['#144E47', '#238579'],
    ['#AE9352', '#88835B'],
    ['#D5664B', '#C15D43'],
];

const WaitingListSection = () => {
    const [waitingSchools, setWaitingSchools] = useState([]);
    const [waitingConsultants, setWaitingConsultants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigation = useNavigation();

    const getWaitingData = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
                navigation.replace('Signin');
                return;
            }
            const [schoolsRes, consultantsRes] = await Promise.all([
                axios.get(`${BASE_URL}/school/waitinglist`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                axios.get(`${BASE_URL}/consultant/get-waitinglist-consultant`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            setWaitingSchools(schoolsRes.data?.waitingList || []);
            setWaitingConsultants(consultantsRes.data?.waitinglistconsultant || []);
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    };

 const handleApprove = async (item, type) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        let url = '';
        if (type === 'school') {
            url = `${BASE_URL}/school/school-waiting-status`;
        } else if (type === 'consultant') {
            url = `${BASE_URL}/consultant/edit-consultant-waiting-status`;
        } else {
            Alert.alert('Error', 'Unknown type');
            return;
        }

        const response = await axios.post(
            url,
            { id: item._id, action: 'APPROVE' },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        if (response.data.success) {
            Alert.alert('Success', `${type === 'school' ? 'School' : 'Consultant'} approved!`);
            getWaitingData();
        } else {
            Alert.alert('Error', response.data.message || 'Approval failed');
        }
    } catch (error) {
        Alert.alert('Error', error.response?.data?.message || error.message || 'Approval failed');
    }
};

    useEffect(() => {
        getWaitingData();
    }, []);

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

    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 8 }}>
            <Text style={styles.heading}>Waiting Schools</Text>
            {waitingSchools.length === 0 ? (
                <View style={styles.centered}>
                    <Text>No waiting schools found.</Text>
                </View>
            ) : (
                waitingSchools.map((item, index) => (
                    <LinearGradient
                        key={item._id}
                        colors={cardColors[index % cardColors.length]}
                        style={styles.card}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                    >
                        <Image
                            source={
                                item.pic
                                    ? { uri: item.pic }
                                    : require('../../assets/placeHolder/default_img.jpg')
                            }
                            style={styles.schoolImage}
                            resizeMode="cover"
                        />
                        <View style={styles.cardContent}>
                            <Text style={styles.cardValue}>{item.name || 'No School Name'}</Text>
                            <Text style={styles.cardLabel}>{item.email || 'No Email'}</Text>
                            <Text style={styles.cardLabel}>{item.description || 'No Description'}</Text>
                            <Text style={styles.cardLabel}>Type: School</Text>
                            <TouchableOpacity
                                style={styles.approveBtn}
                                onPress={() => handleApprove(item, 'school')}
                            >
                                <Text style={styles.approveBtnText}>Approve</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                ))
            )}

            <Text style={styles.heading}>Waiting Consultants</Text>
            {waitingConsultants.length === 0 ? (
                <View style={styles.centered}>
                    <Text>No waiting consultants found.</Text>
                </View>
            ) : (
                waitingConsultants.map((item, index) => (
                    <LinearGradient
                        key={item._id}
                        colors={cardColors[index % cardColors.length]}
                        style={styles.card}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                    >
                        <View style={styles.cardContent}>
                            <Text style={styles.cardValue}>{item.name || 'No Consultant Name'}</Text>
                            <Text style={styles.cardLabel}>{item.email || 'No Email'}</Text>
                            <Text style={styles.cardLabel}>{item.expertise || 'No Expertise'}</Text>
                            <Text style={styles.cardLabel}>{item.bio || 'No Bio'}</Text>
                            <Text style={styles.cardLabel}>Type: Consultant</Text>
                            <TouchableOpacity
                                style={styles.approveBtn}
                                onPress={() => handleApprove(item, 'consultant')}
                            >
                                <Text style={styles.approveBtnText}>Approve</Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                ))
            )}
        </ScrollView>
    );
};

export default WaitingListSection;

const styles = StyleSheet.create({
    heading: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#035B60',
        marginTop: 18,
        marginBottom: 8,
        marginLeft: 4,
    },
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
        minHeight: 120,
        marginBottom: 8,
    },
    schoolImage: {
        width: '100%',
        height: 120,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        marginBottom: 4,
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
    approveBtn: {
        marginTop: 12,
        backgroundColor: '#07BBC6',
        paddingVertical: 8,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    approveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});