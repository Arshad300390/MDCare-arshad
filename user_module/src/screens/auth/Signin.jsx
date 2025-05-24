/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {globalStyles} from '../../styles/globalStyles';
import {useNavigation} from '@react-navigation/native';
import Header from '../../utils/customComponents/customHeaders/Header';
import {theme} from '../../styles/theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InputField from '../../utils/customComponents/customInputField/InputField';
import Button from '../../utils/customComponents/customButton/Button';
import {
  isValidInput,
  validateEmail,
  validatePassword,
} from '../../utils/customValidations/Validations';
import {useDispatch} from 'react-redux';
import {loginUser} from '../../redux/slices/authSlice';
import CustomModal from '../../utils/customModals/CustomModal';

const {width, height} = Dimensions.get('screen');

const Signin = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const hasErrors =
      emailError ||
      passwordError ||
      !email ||
      !password ||
      setIsButtonEnabled(!hasErrors);
  }, [emailError, passwordError]);

  const handleEmailChange = value => {
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = value => {
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleLogin = async () => {
    if (isValidInput(email, password)) {
      setLoading(true);

      const loginData = {
        email,
        password,
      };

      try {
        const resultAction = await dispatch(loginUser(loginData));

        if (loginUser.fulfilled.match(resultAction)) {
          const {user} = resultAction.payload;
          console.log('user in signin', user.isSuperAdmin);
          setShowSuccessModal(true);

          setTimeout(() => {
            setShowSuccessModal(false);
            if(user.isSuperAdmin === true){
                console.log('goto admin')
              navigation.replace('AdminDashboard')
            }else{
              console.log('goto main')
              navigation.replace('Main');
            }
            
          }, 3000);
        } else {
          const errorMessage =
            loginUser.rejected.match(resultAction) && resultAction.payload
              ? resultAction.payload.error || 'Login failed. Please try again.'
              : 'Unexpected response from server.';

          setLoading(false);
          console.error(errorMessage);
        }
      } catch (err) {
        console.error('An error occurred during login:', err);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={[globalStyles.container, styles.primaryContainer]}>
      <View style={styles.headerContainer}>
        <View style={styles.headerContainer}>
          <Header
            imageSource={require('../../assets/auth/login_img.png')}
            headerTitle="LOG IN"
            headerSubtitle="Welcome Please Log In"
          />
        </View>

        <View style={[styles.secondaryContainer]}>
          <View style={styles.formContainer}>
            <ScrollView
              contentContainerStyle={styles.scrollViewContainer}
              showsVerticalScrollIndicator={false}>
              <View style={styles.emailContainer}>
                <Text style={[globalStyles.inputLabel]}>Email</Text>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={'mail'}
                    size={width * 0.05}
                    color={theme.colors.primary}
                  />
                </View>
                <InputField
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter Email"
                  placeholderTextColor={theme.colors.primary}
                  backgroundColor={theme.colors.white}
                />
                {emailError ? (
                  <Text style={[globalStyles.textError, styles.errorText]}>
                    {emailError}
                  </Text>
                ) : null}
              </View>

              <View style={styles.passwordContainer}>
                <Text style={[globalStyles.inputLabel]}>Password</Text>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={'lock-closed'}
                    size={width * 0.05}
                    color={theme.colors.primary}
                  />
                </View>
                <InputField
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="Enter Password"
                  placeholderTextColor={theme.colors.primary}
                  backgroundColor={theme.colors.white}
                  secureTextEntry={hidePassword}
                />
                <TouchableOpacity
                  style={styles.eyeIconContainer}
                  onPress={() => setHidePassword(!hidePassword)}>
                  <Ionicons
                    name={hidePassword ? 'eye-off' : 'eye'}
                    size={width * 0.06}
                    color={theme.colors.primary}
                  />
                </TouchableOpacity>
                {passwordError ? (
                  <Text
                    style={[globalStyles.textError, styles.passwordErrorText]}>
                    {passwordError}
                  </Text>
                ) : null}
              </View>

              <View style={styles.extraContainer}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Forgot_Password')}>
                  <Text style={[globalStyles.textBlack, styles.extraText]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.btnContainer}>
                <Button
                  title="Login"
                  color={theme.colors.black}
                  loading={loading}
                  onPress={handleLogin}
                  disabled={!isButtonEnabled}
                />
              </View>

              <View style={styles.signupContainer}>
                <View style={styles.leftContainer}>
                  <Text style={[globalStyles.textBlack]}>
                    Didn't have an account?
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.rightContainer}
                  onPress={() => navigation.navigate('Signup')}>
                  <Text style={[globalStyles.textPrimary, styles.textPrimary]}>
                    Signup
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>

      <CustomModal
        visible={showSuccessModal}
        title="Login Successfully!"
        imageSource={require('../../assets/icons/success.png')}
        onClose={() => setShowSuccessModal(false)}
      />
    </SafeAreaView>
  );
};

export default Signin;

const styles = StyleSheet.create({
  primaryContainer: {
    backgroundColor: theme.colors.white,
  },

  headerContainer: {
    flex: 1,
    marginTop: height * 0.02,
  },

  scrollViewContainer: {
    marginTop: height * 0.005,
  },

  emailContainer: {
    marginBottom: height * 0.02,
  },

  passwordContainer: {
    marginBottom: height * 0.02,
  },

  secondaryContainer: {
    flex: 2,
    borderTopLeftRadius: theme.borderRadius.large,
    borderTopRightRadius: theme.borderRadius.large,
    padding: height * 0.014,
    marginTop: height * 0.04,
  },

  iconContainer: {
    position: 'absolute',
    left: width * 0.02,
    transform: [{translateY: width * 0.134}],
    zIndex: 8,
  },

  eyeIconContainer: {
    alignSelf: 'flex-end',
    right: width * 0.02,
    bottom: theme.spacing(6.64),
  },

  extraContainer: {
    bottom: height * 0.02,
    alignSelf: 'flex-end',
  },

  extraText: {
    fontSize: width * 0.044,
    fontFamily: theme.typography.PoppinsfontFamilyMedium,
  },

  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: width * 0.9,
    marginTop: height * 0.065,
  },

  textPrimary: {
    fontFamily: theme.typography.RobotofontFamilyMedium,
    fontSize: width * 0.044,
  },

  errorText: {
    position: 'absolute',
    bottom: -height * 0.014,
    paddingHorizontal: width * 0.014,
    fontSize: width * 0.034,
    fontFamily: theme.typography.RobotofontFamilyRegular,
  },

  passwordErrorText: {
    position: 'absolute',
    bottom: height * 0.014,
    paddingHorizontal: width * 0.014,
    fontSize: width * 0.034,
    fontFamily: theme.typography.RobotofontFamilyRegular,
  },
});
