// ./src/Provider/firebaseBackgroundHandler.js
import messaging from '@react-native-firebase/messaging';

const registerBackgroundHandler = () => {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('📩 Message handled in the background!', remoteMessage);
  });
};

export default registerBackgroundHandler;
