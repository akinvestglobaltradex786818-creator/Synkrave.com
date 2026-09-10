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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const localGenerateApp = (idea: string): Promise<string> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(buildLocalApp(idea)), 3000);
  });

function buildLocalApp(idea: string): string {
  const normalizedIdea = idea.toLowerCase();
  const safeIdea = escapeHtml(
    idea.replace(/\s+/g, ' ').trim().slice(0, 90) ||
      'A simple generated text card',
  );
  const sharedStyles = `
      * { box-sizing: border-box; }
      body {
        display: grid;
        min-height: 100vh;
        place-items: center;
        margin: 0;
        padding: 24px;
        background: #0b1119;
        color: #f4f7ff;
        font-family: Inter, system-ui, sans-serif;
      }
      .shell {
        width: min(100%, 460px);
        padding: 28px;
        border: 1px solid #26313f;
        border-radius: 20px;
        background: #11151d;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.24);
      }
      .eyebrow {
        margin: 0 0 10px;
        color: #6ee7f9;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      h1 { margin: 0 0 10px; font-size: 28px; }
      p { margin: 0 0 22px; color: #a9b5c5; line-height: 1.6; }
      .muted { color: #a9b5c5; }
      button {
        border: 0;
        border-radius: 10px;
        padding: 12px 18px;
        background: #6ee7f9;
        color: #071016;
        cursor: pointer;
        font-weight: 700;
      }
      button:hover { background: #a0f2ff; }
      .status { min-height: 22px; margin: 14px 0 0; color: #6ee7f9; font-size: 14px; }
      input {
        width: 100%;
        margin: 0 0 12px;
        border: 1px solid #26313f;
        border-radius: 10px;
        padding: 12px;
        background: #0b1119;
        color: #f4f7ff;
        font: inherit;
      }`;

  if (
    normalizedIdea.includes('profile') ||
    normalizedIdea.includes('team') ||
    normalizedIdea.includes('portfolio')
  ) {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Profile Card</title>
    <style>${sharedStyles}
      .avatar {
        display: grid;
        width: 64px;
        height: 64px;
        margin-bottom: 22px;
        place-items: center;
        border-radius: 50%;
        background: #253849;
        color: #6ee7f9;
        font-size: 20px;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="avatar">AM</div>
      <p class="eyebrow">Profile card</p>
      <h1>Alex Morgan</h1>
      <p>Product designer building calm, useful digital experiences.</p>
      <button id="follow-button" type="button">Follow</button>
      <p id="status" class="status" aria-live="polite"></p>
    </main>
    <script>
      const button = document.querySelector('#follow-button');
      const status = document.querySelector('#status');
      button.addEventListener('click', () => {
        const following = button.textContent === 'Following';
        button.textContent = following ? 'Follow' : 'Following';
        status.textContent = following ? 'You unfollowed Alex.' : 'You are now following Alex.';
      });
    </script>
  </body>
</html>`;
  }

  if (
    normalizedIdea.includes('todo') ||
    normalizedIdea.includes('to-do') ||
    normalizedIdea.includes('task') ||
    normalizedIdea.includes('habit')
  ) {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Task List</title>
    <style>${sharedStyles}
      form { display: flex; gap: 8px; }
      form input { flex: 1; margin: 0; }
      ul { display: grid; gap: 10px; margin: 22px 0 0; padding: 0; list-style: none; }
      li { padding: 12px 14px; border-radius: 10px; background: #19212b; color: #d6e3f0; }
    </style>
  </head>
  <body>
    <main class="shell">
      <p class="eyebrow">Daily focus</p>
      <h1>Small steps, every day.</h1>
      <p>Keep the next useful thing within reach.</p>
      <form id="task-form">
        <input id="task-input" aria-label="New task" placeholder="Add a task" />
        <button type="submit">Add</button>
      </form>
      <ul id="task-list">
        <li>Plan the next step</li>
        <li>Take a focused break</li>
      </ul>
    </main>
    <script>
      const form = document.querySelector('#task-form');
      const input = document.querySelector('#task-input');
      const list = document.querySelector('#task-list');
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = input.value.trim();
        if (!value) return;
        const item = document.createElement('li');
        item.textContent = value;
        list.appendChild(item);
        input.value = '';
      });
    </script>
  </body>
</html>`;
  }

  if (
    normalizedIdea.includes('pricing') ||
    normalizedIdea.includes('subscription') ||
    normalizedIdea.includes('plan')
  ) {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pricing Card</title>
    <style>${sharedStyles}
      .price { margin: 8px 0 18px; font-size: 42px; font-weight: 800; }
      .price span { color: #a9b5c5; font-size: 14px; font-weight: 400; }
      ul { margin: 0 0 24px; padding-left: 20px; color: #a9b5c5; line-height: 2; }
    </style>
  </head>
  <body>
    <main class="shell">
      <p class="eyebrow">Simple pricing</p>
      <h1>Starter plan</h1>
      <p class="price">$12 <span>/ month</span></p>
      <ul>
        <li>Unlimited projects</li>
        <li>Shared workspaces</li>
        <li>Priority support</li>
      </ul>
      <button id="choose-button" type="button">Choose starter</button>
      <p id="status" class="status" aria-live="polite"></p>
    </main>
    <script>
      document.querySelector('#choose-button').addEventListener('click', (event) => {
        event.currentTarget.textContent = 'Selected';
        document.querySelector('#status').textContent = 'Starter plan selected.';
      });
    </script>
  </body>
</html>`;
  }

  if (
    normalizedIdea.includes('landing') ||
    normalizedIdea.includes('hero') ||
    normalizedIdea.includes('waitlist')
  ) {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Landing Page</title>
    <style>${sharedStyles}
      .shell { text-align: center; }
      h1 { font-size: 38px; letter-spacing: -0.04em; }
      .glow { color: #6ee7f9; }
    </style>
  </head>
  <body>
    <main class="shell">
      <p class="eyebrow">Coming soon</p>
      <h1>Build something <span class="glow">worth sharing.</span></h1>
      <p>Join the early list for a quieter way to turn ideas into products.</p>
      <button id="join-button" type="button">Join the waitlist</button>
      <p id="status" class="status" aria-live="polite"></p>
    </main>
    <script>
      document.querySelector('#join-button').addEventListener('click', (event) => {
        event.currentTarget.textContent = 'You are on the list';
        document.querySelector('#status').textContent = 'Thanks — we will be in touch.';
      });
    </script>
  </body>
</html>`;
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated App</title>
    <style>${sharedStyles}
      .card-label { display: inline-block; margin-bottom: 16px; color: #6ee7f9; font-weight: 700; }
    </style>
  </head>
  <body>
    <main class="shell">
      <span class="card-label">Generated starter</span>
      <h1>Your idea, in motion.</h1>
      <p>${safeIdea}</p>
      <button id="action-button" type="button">Get started</button>
      <p id="status" class="status" aria-live="polite"></p>
    </main>
    <script>
      document.querySelector('#action-button').addEventListener('click', (event) => {
        event.currentTarget.textContent = 'Started';
        document.querySelector('#status').textContent = 'Your first action is working.';
      });
    </script>
  </body>
</html>`;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleGenerate = async () => {
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

    const generatedHtml = await localGenerateApp(prompt);
    setIsGenerating(false);
    setGeneratedCode(generatedHtml);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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