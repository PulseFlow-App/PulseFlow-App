import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { PremiumProvider } from '../contexts/PremiumContext';
import { SignInScreen } from '../screens/SignInScreen';
import { BlockDashboard } from '../screens/BlockDashboard';
import { ProfileScreen } from '../screens/ProfileScreen';
import { StakePremiumScreen } from '../screens/StakePremiumScreen';
import { BodySignalsOverview } from '../blocks/BodySignals/BodySignalsOverview';
import { BodySignalsTrends } from '../blocks/BodySignals/BodySignalsTrends';
import { BodySignalsLog } from '../blocks/BodySignals/BodySignalsLog';
import { WorkRoutineOverview } from '../blocks/WorkRoutine/WorkRoutineOverview';
import { WorkRoutineCheckIn } from '../blocks/WorkRoutine/WorkRoutineCheckIn';
import { WorkRoutineInsights } from '../blocks/WorkRoutine/WorkRoutineInsights';
import { LogoHeader } from '../components/shared/LogoHeader';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';

export type RootStackParamList = {
  SignIn: undefined;
  BlockDashboard: undefined;
  Profile: undefined;
  StakePremium: undefined;
  BodySignalsOverview: undefined;
  BodySignalsTrends: undefined;
  BodySignalsLog: undefined;
  WorkRoutineOverview: undefined;
  WorkRoutineCheckIn: undefined;
  WorkRoutineInsights: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: fonts.sansMedium, fontSize: 17, letterSpacing: -0.5 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
  headerBlurEffect: 'dark',
};

function MainStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="BlockDashboard"
        component={BlockDashboard}
        options={{ headerTitle: () => <LogoHeader />, headerLargeTitle: false }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen
        name="StakePremium"
        component={StakePremiumScreen}
        options={{ title: 'Stake for Premium' }}
      />
      <Stack.Screen
        name="BodySignalsOverview"
        component={BodySignalsOverview}
        options={{ title: 'Body Signals' }}
      />
      <Stack.Screen
        name="BodySignalsTrends"
        component={BodySignalsTrends}
        options={{ title: 'Trends' }}
      />
      <Stack.Screen
        name="BodySignalsLog"
        component={BodySignalsLog}
        options={{ title: 'Log Data' }}
      />
      <Stack.Screen
        name="WorkRoutineOverview"
        component={WorkRoutineOverview}
        options={{ title: 'Work Routine' }}
      />
      <Stack.Screen
        name="WorkRoutineCheckIn"
        component={WorkRoutineCheckIn}
        options={{ title: 'Check-in' }}
      />
      <Stack.Screen
        name="WorkRoutineInsights"
        component={WorkRoutineInsights}
        options={{ title: 'Insights' }}
      />
    </Stack.Navigator>
  );
}

function AuthGate() {
  const { auth } = useAuth();
  if (auth.status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }
  if (auth.status === 'guest') return <SignInScreen />;
  return <MainStack />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export function RootNavigator() {
  return (
    <AuthProvider>
      <PremiumProvider>
        <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.accent,
          background: colors.background,
          card: colors.background,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
        fonts: {
          regular: { fontFamily: fonts.sans, fontWeight: '400' as const },
          medium: { fontFamily: fonts.sansMedium, fontWeight: '500' as const },
          bold: { fontFamily: fonts.sansSemiBold, fontWeight: '600' as const },
          heavy: { fontFamily: fonts.sansSemiBold, fontWeight: '700' as const },
        },
      }}
        >
          <AuthGate />
        </NavigationContainer>
      </PremiumProvider>
    </AuthProvider>
  );
}
