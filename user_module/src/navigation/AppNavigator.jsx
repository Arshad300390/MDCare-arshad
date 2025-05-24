import React from 'react';
import {StatusBar} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Calling from '../screens/callScreens/Calling';
import Receiving from '../screens/callScreens/Receiving';
import InCall from '../screens/callScreens/InCall';
// Shared Imports
import Splash from '../screens/shared/Splash';
import OnBoarding from '../screens/shared/OnBoarding';

// Auth Imports
import Signin from '../screens/auth/Signin';
import Signup from '../screens/auth/Signup';
import ForgotPassword from '../screens/auth/ForgotPassword';

// Main Imports
import BottomNavigator from './bottomNavigator/BottomNavigator';
import KidInfoForm from '../screens/kidInfoForm/KidInfoForm';
import Articles from '../screens/articlesModule/Articles';
import School from '../screens/schoolModule/School';
import Consultant from '../screens/consultantModule/Consultant';
import Profile from '../screens/profileModule/Profile';
import Video from '../screens/videoModule/Video';
import SchoolDetail from '../screens/schoolModule/SchoolDetail';
import ConsultantDetail from '../screens/consultantModule/ConsultantDetail';
import SchoolChat from '../screens/chatScreen/SchoolChat';
import ConsultantChat from '../screens/chatScreen/ConsultantChat';
import MathQuizGame from '../screens/gamesModule/MathQuizGame';
import Games from '../screens/gamesModule/Games';
import SpellingBeeGame from '../screens/gamesModule/SpellingBeeGame';
import MemoryMatchGame from '../screens/gamesModule/MemoryMatchGame';
import ColorSortGame from '../screens/gamesModule/ColorSortGame';
import AdminDashboard from '../screens/AdminScreen/AdminDashboard';
import SchoolForm from '../screens/AdminScreen/SchoolForm';
import ConsultantForm from '../screens/AdminScreen/ConsultantForm';
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <>
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      <Stack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName="Splash">
        {/* Shared Screens */}
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="OnBoard" component={OnBoarding} />
        <Stack.Screen name="Profile" component={Profile} />

        {/* Auth Screens */}
        <Stack.Screen name="Signin" component={Signin} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="Forgot_Password" component={ForgotPassword} />

        {/* Main Screens */}
        <Stack.Screen name="Main" component={BottomNavigator} />
        <Stack.Screen name="School" component={School} />
        <Stack.Screen name="SchoolDetail" component={SchoolDetail} />
        <Stack.Screen name="Consultant" component={Consultant} />
        <Stack.Screen name="ConsultantDetail" component={ConsultantDetail} />
        <Stack.Screen name="Articles" component={Articles} />
        <Stack.Screen name="Videos" component={Video} />
        <Stack.Screen name="Games" component={Games} />
        <Stack.Screen name="Kid_Info_Form" component={KidInfoForm} />

        <Stack.Screen name="SchoolChat" component={SchoolChat} />
        <Stack.Screen name="ConsultantChat" component={ConsultantChat} />

        <Stack.Screen name="MathQuizGame" component={MathQuizGame} />
        <Stack.Screen name="SpellingBeeGame" component={SpellingBeeGame} />
        <Stack.Screen name="MemoryMatchGame" component={MemoryMatchGame} />
        <Stack.Screen name="ColorSortGame" component={ColorSortGame} />
         {/* call screen Screens */}
         <Stack.Screen name="Calling" component={Calling} />
        <Stack.Screen name="Receiving" component={Receiving} />
        <Stack.Screen name="InCall" component={InCall} />
        {/* admin screens */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="SchoolForm" component={SchoolForm} />
        <Stack.Screen name="ConsultantForm" component={ConsultantForm} />



      </Stack.Navigator>
    </>
  );
};

export default AppNavigator;
