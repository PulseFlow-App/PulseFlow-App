import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlockCard } from '../components/shared/BlockCard';
import { Footer } from '../components/shared/Footer';
import { BLOCKS } from '../blocks/registry';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'BlockDashboard'>;

const ACTIVE_IDS = ['body-signals', 'work-routine'];
const COMING_SOON_IDS = ['nutrition', 'movement', 'recovery'];

export function BlockDashboard({ navigation }: Props) {
  const activeBlocks = BLOCKS.filter((b) => ACTIVE_IDS.includes(b.id));
  const comingSoonBlocks = BLOCKS.filter((b) => COMING_SOON_IDS.includes(b.id));

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.profileButton}>Profile</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroLine1}>No noise.</Text>
          <Text style={styles.heroLine2}>Just signal.</Text>
        </View>

        <View style={styles.section}>
          {activeBlocks.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              onPress={
                block.route
                  ? () => navigation.navigate(block.route as keyof RootStackParamList)
                  : undefined
              }
            />
          ))}
        </View>

        <View style={styles.comingSoonSection}>
          <Text style={styles.comingSoonLabel}>COMING SOON</Text>
          {comingSoonBlocks.map((block) => (
            <BlockCard key={block.id} block={block} />
          ))}
        </View>

        <Footer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  hero: {
    marginBottom: 32,
  },
  heroLine1: {
    fontFamily: fonts.serif,
    fontSize: 36,
    color: colors.text,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  heroLine2: {
    fontFamily: fonts.serif,
    fontSize: 36,
    color: colors.textDim,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 24,
  },
  comingSoonSection: {
    paddingTop: 16,
  },
  comingSoonLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.textDim,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  profileButton: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.blue,
    marginRight: 16,
  },
});
