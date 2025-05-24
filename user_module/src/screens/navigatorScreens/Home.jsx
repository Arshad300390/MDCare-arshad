import React, {useEffect} from 'react';
import {StyleSheet, View, Dimensions, SafeAreaView} from 'react-native';
import {theme} from '../../styles/theme';
import {globalStyles} from '../../styles/globalStyles';
import {useNavigation} from '@react-navigation/native';
import {getUser} from '../../redux/slices/userSlice';
import {useSelector, useDispatch} from 'react-redux';
import HomeHeader from '../../utils/customComponents/customHeaders/HomeHeader';
import CustomCard from '../../utils/customComponents/customCards/CustomCard';

import schoolFinderIcon from '../../assets/cardIcons/school.png';
import consultantFinderIcon from '../../assets/cardIcons/consult.png';
import blogIcon from '../../assets/cardIcons/article.png';
import videoIcon from '../../assets/cardIcons/video.png';
import gameIcon from '../../assets/cardIcons/game.png';

const {width, height} = Dimensions.get('screen');

const Home = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const user = useSelector(state => state.auth.user);
// Redirect admin users to AdminDashboard
  useEffect(() => {
    if (user && user.isSuperAdmin) {
      navigation.replace('AdminDashboard');
    }
  }, [user, navigation]);

  useEffect(() => {
    if (user && user.id) {
      dispatch(getUser(user.id));
    }
  }, [dispatch, user]);

  return (
    <SafeAreaView style={[globalStyles.container, styles.primaryContainer]}>
      <View style={styles.headerContainer}>
        <HomeHeader
          headerTitle="Hello"
          headerSubtitle={user?.fullname || user?.username}
          imageSource={
            user?.avatar
              ? {uri: user?.avatar}
              : require('../../assets/placeHolder/default_avatar.png')
          }
          onPress={() => navigation.navigate('Profile')}
        />
      </View>

      <View style={styles.secondaryContainer}>
        <CustomCard
          title="SCHOOL FINDER"
          iconSource={schoolFinderIcon}
          gradientColors={['#07BBC6', '#035B60']}
          onPress={() => navigation.navigate('School')}
        />

        <CustomCard
          title="CONSULTANT FINDER"
          iconSource={consultantFinderIcon}
          gradientColors={['#144E47', '#238579']}
          onPress={() => navigation.navigate('Consultant')}
        />

        <CustomCard
          title="ARTICLES & BLOGS"
          iconSource={blogIcon}
          gradientColors={['#AE9352', '#88835B']}
          onPress={() => navigation.navigate('Articles')}
        />

        <CustomCard
          title="VIDEOS"
          iconSource={videoIcon}
          gradientColors={['#A56E41', '#D3915C']}
          onPress={() => navigation.navigate('Videos')}
        />

        <CustomCard
          title="GAMES"
          iconSource={gameIcon}
          gradientColors={['#D5664B', '#C15D43']}
          onPress={() => navigation.navigate('Games')}
        />
      </View>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  primaryContainer: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },

  secondaryContainer: {
    gap: theme.gap(3),
    marginTop: height * 0.06,
  },
});
