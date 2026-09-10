import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const starterPrompts = [
  'A habit tracker with streaks',
  'A recipe planner for busy weeks',
];

const generatedSnippet = `import { View, Text } from 'react-native';

export default function App() {
  return (
    <View>
      <Text>Welcome to your new app</Text>
    </View>
  );
}`;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleGenerate = () => {
    Keyboard.dismiss();
    if (!prompt.trim()) {
      setError('Add a short description to get started.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setError('');
    setIsGenerating(true);
    setGeneratedCode('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedCode(generatedSnippet);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 900);
  };

  const handleVoicePress = () => {
    setIsListening((current) => !current);
    setError('');
    Haptics.selectionAsync();
  };

  const handleStarterPress = (starter: string) => {
    setPrompt(starter);
    setError('');
    Haptics.selectionAsync();
  };

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.background, '#0B1119', colors.background]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 18,
            paddingBottom: Math.max(insets.bottom, 18) + 10,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={[styles.brandMark, { backgroundColor: colors.accent }]}>
              <Feather name="code" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.brandName, { color: colors.foreground }]}>
              appforge
            </Text>
          </View>
          <View style={[styles.betaPill, { borderColor: colors.border }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.betaText, { color: colors.mutedForeground }]}>
              BETA
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>
            PROMPT TO PRODUCT
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Turn ideas{'\n'}
            <Text style={{ color: colors.primary }}>into apps.</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Describe what you want to build. We&apos;ll shape the first version
            for you.
          </Text>
        </View>

        <View style={styles.composerSection}>
          <View
            style={[
              styles.composer,
              {
                backgroundColor: colors.card,
                borderColor: error
                  ? colors.destructive
                  : isFocused
                    ? colors.primary
                    : colors.border,
              },
            ]}
          >
            <TextInput
              testID="prompt-input"
              value={prompt}
              onChangeText={(value) => {
                setPrompt(value);
                if (error) setError('');
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Describe your app..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
              maxLength={500}
              style={[styles.promptInput, { color: colors.foreground }]}
            />
            <View style={styles.composerFooter}>
              <Text style={[styles.characterCount, { color: colors.mutedForeground }]}>
                {prompt.length}/500
              </Text>
              <Pressable
                testID="voice-button"
                accessibilityRole="button"
                accessibilityLabel={
                  isListening ? 'Stop voice input' : 'Start voice input'
                }
                onPress={handleVoicePress}
                style={({ pressed }) => [
                  styles.micButton,
                  {
                    backgroundColor: isListening
                      ? colors.primary
                      : colors.secondary,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
                <Feather
                  name={isListening ? 'square' : 'mic'}
                  size={18}
                  color={
                    isListening ? colors.primaryForeground : colors.foreground
                  }
                />
              </Pressable>
            </View>
          </View>

          {isListening ? (
            <View style={styles.voiceStatus}>
              <View
                style={[styles.voicePulse, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.voiceStatusText, { color: colors.primary }]}>
                Voice input ready
              </Text>
              <Text style={[styles.voiceHint, { color: colors.mutedForeground }]}>
                Tap the mic to stop
              </Text>
            </View>
          ) : null}

          {error ? (
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          ) : null}

          <View style={styles.starterRow}>
            <Text style={[styles.starterLabel, { color: colors.mutedForeground }]}>
              TRY
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.starterScroll}
            >
              {starterPrompts.map((starter) => (
                <Pressable
                  key={starter}
                  onPress={() => handleStarterPress(starter)}
                  style={({ pressed }) => [
                    styles.starterChip,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.muted,
                      opacity: pressed ? 0.68 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.starterText, { color: colors.secondaryForeground }]}>
                    {starter}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <Pressable
          testID="generate-button"
          accessibilityRole="button"
          accessibilityLabel="Generate app"
          onPress={handleGenerate}
          disabled={isGenerating}
          style={({ pressed }) => [
            styles.generateButton,
            {
              backgroundColor: colors.primary,
              opacity: pressed || isGenerating ? 0.78 : 1,
            },
          ]}
        >
          {isGenerating ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Text style={[styles.generateText, { color: colors.primaryForeground }]}>
                Generate App
              </Text>
              <Feather name="arrow-up-right" size={20} color={colors.primaryForeground} />
            </>
          )}
        </Pressable>

        <View style={styles.outputHeader}>
          <View>
            <Text style={[styles.outputEyebrow, { color: colors.mutedForeground }]}>
              WORKSPACE
            </Text>
            <Text style={[styles.outputTitle, { color: colors.foreground }]}>
              Generated output
            </Text>
          </View>
          <View style={[styles.outputBadge, { backgroundColor: colors.muted }]}>
            <Feather
              name={generatedCode ? 'check-circle' : 'code'}
              size={14}
              color={generatedCode ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.outputBadgeText, { color: colors.mutedForeground }]}>
              {generatedCode ? 'READY' : 'EMPTY'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.outputCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {generatedCode ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.codeContent}
            >
              <Text style={[styles.codeText, { color: colors.secondaryForeground }]}>
                {generatedCode}
              </Text>
            </ScrollView>
          ) : (
            <View style={styles.emptyOutput}>
              <View style={[styles.outputIcon, { backgroundColor: colors.accent }]}>
                <Feather name="layers" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Your app will appear here
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Start with a prompt above to generate your first screen.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Feather name="zap" size={14} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Built for quick ideas and clean starts
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  brandMark: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  brandName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    letterSpacing: -0.4,
  },
  betaPill: {
    alignItems: 'center',
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  liveDot: {
    borderRadius: 99,
    height: 5,
    width: 5,
  },
  betaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  hero: {
    marginTop: 66,
  },
  eyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.8,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 42,
    letterSpacing: -2,
    lineHeight: 46,
    marginTop: 12,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 16,
    maxWidth: 325,
  },
  composerSection: {
    marginTop: 32,
  },
  composer: {
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 174,
    padding: 16,
  },
  promptInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    lineHeight: 25,
    minHeight: 100,
  },
  composerFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  characterCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  micButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  voiceStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 11,
  },
  voicePulse: {
    borderRadius: 99,
    height: 6,
    width: 6,
  },
  voiceStatusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  voiceHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 10,
  },
  starterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 16,
  },
  starterLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    marginRight: 10,
  },
  starterScroll: {
    gap: 8,
  },
  starterChip: {
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  starterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  generateButton: {
    alignItems: 'center',
    borderRadius: 15,
    flexDirection: 'row',
    height: 58,
    justifyContent: 'center',
    marginTop: 27,
    gap: 9,
  },
  generateText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  outputHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 42,
  },
  outputEyebrow: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 1.6,
  },
  outputTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    letterSpacing: -0.5,
    marginTop: 5,
  },
  outputBadge: {
    alignItems: 'center',
    borderRadius: 99,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  outputBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  outputCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
    minHeight: 190,
    overflow: 'hidden',
  },
  emptyOutput: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 190,
    paddingHorizontal: 30,
  },
  outputIcon: {
    alignItems: 'center',
    borderRadius: 13,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginTop: 13,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  codeContent: {
    padding: 18,
  },
  codeText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontSize: 13,
    lineHeight: 21,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    marginTop: 23,
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
});