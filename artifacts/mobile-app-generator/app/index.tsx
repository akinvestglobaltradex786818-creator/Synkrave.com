import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { createElement, useState } from 'react';
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
import { WebView } from 'react-native-webview';
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
        background: radial-gradient(circle at 20% 10%, #162c3b 0, #0b1119 42%);
        color: #f4f7ff;
        font-family: Inter, system-ui, sans-serif;
      }
      .shell {
        width: min(100%, 520px);
        padding: 32px;
        border: 1px solid #26313f;
        border-radius: 24px;
        background: linear-gradient(145deg, #151d28, #11151d);
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
      }
      .eyebrow {
        margin: 0 0 10px;
        color: #6ee7f9;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      h1 { margin: 0 0 10px; font-size: 30px; letter-spacing: -0.04em; }
      h2 { margin: 0; font-size: 18px; }
      p { margin: 0 0 22px; color: #a9b5c5; line-height: 1.6; }
      .muted { color: #a9b5c5; }
      button {
        border: 0;
        border-radius: 12px;
        padding: 13px 18px;
        background: #6ee7f9;
        color: #071016;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        transition: transform 160ms ease, background 160ms ease;
      }
      button:hover { background: #a0f2ff; transform: translateY(-1px); }
      .status { min-height: 22px; margin: 14px 0 0; color: #6ee7f9; font-size: 14px; }
      input {
        width: 100%;
        margin: 0 0 12px;
        border: 1px solid #26313f;
        border-radius: 12px;
        padding: 13px;
        background: #0b1119;
        color: #f4f7ff;
        font: inherit;
      }
      .row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
      .surface { border: 1px solid #26313f; border-radius: 16px; background: #0b1119; }
      .pill { display: inline-flex; padding: 6px 10px; border-radius: 99px; background: #253849; color: #6ee7f9; font-size: 12px; font-weight: 700; }
      .grid { display: grid; gap: 12px; grid-template-columns: repeat(2, 1fr); }
      .stat { padding: 16px; }
      .stat strong { display: block; margin-top: 6px; font-size: 24px; }
      .stat span { color: #a9b5c5; font-size: 12px; }
      .full { width: 100%; }`;

  const page = (
    title: string,
    extraStyles: string,
    body: string,
    script: string,
  ) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>${sharedStyles}${extraStyles}</style>
  </head>
  <body>
    ${body}
    <script>${script}</script>
  </body>
</html>`;

  let templateKey: string;
  switch (true) {
    case /profile|team|portfolio/.test(normalizedIdea):
      templateKey = 'profile';
      break;
    case /login|sign in|signin|register|signup|auth/.test(normalizedIdea):
      templateKey = 'login';
      break;
    case /dashboard|analytics|admin|overview/.test(normalizedIdea):
      templateKey = 'dashboard';
      break;
    case /button|cta|call to action/.test(normalizedIdea):
      templateKey = 'button';
      break;
    case /todo|to-do|task|habit/.test(normalizedIdea):
      templateKey = 'tasks';
      break;
    case /pricing|subscription|plan/.test(normalizedIdea):
      templateKey = 'pricing';
      break;
    case /landing|hero|waitlist/.test(normalizedIdea):
      templateKey = 'landing';
      break;
    default:
      templateKey = 'card';
  }

  switch (templateKey) {
    case 'profile':
      return page(
        'Profile Card',
        `
      .avatar { display: grid; width: 72px; height: 72px; margin-bottom: 22px; place-items: center; border-radius: 24px; background: linear-gradient(135deg, #6ee7f9, #8b7cff); color: #071016; font-size: 22px; font-weight: 800; }
      .meta { display: flex; gap: 8px; margin-bottom: 24px; }`,
        `<main class="shell">
      <div class="avatar">AM</div>
      <p class="eyebrow">Profile card</p>
      <h1>Alex Morgan</h1>
      <p>Product designer building calm, useful digital experiences for thoughtful teams.</p>
      <div class="meta"><span class="pill">Design</span><span class="pill">Available</span></div>
      <button id="follow-button" type="button">Follow Alex</button>
      <p id="status" class="status" aria-live="polite"></p>
    </main>`,
        `const button = document.querySelector('#follow-button');
      const status = document.querySelector('#status');
      button.addEventListener('click', () => {
        const following = button.textContent === 'Following';
        button.textContent = following ? 'Follow Alex' : 'Following';
        status.textContent = following ? 'You unfollowed Alex.' : 'You are now following Alex.';
      });`,
      );
    case 'login':
      return page(
        'Welcome Back',
        `
      .form-copy { margin-bottom: 26px; }
      .form-copy p { margin-bottom: 0; }
      .links { display: flex; justify-content: space-between; margin-top: 18px; color: #6ee7f9; font-size: 13px; }`,
        `<main class="shell">
      <p class="eyebrow">Welcome back</p>
      <h1>Sign in to continue.</h1>
      <div class="form-copy"><p>Pick up where you left off and keep building.</p></div>
      <form id="login-form">
        <input id="email" type="email" placeholder="Email address" required />
        <input id="password" type="password" placeholder="Password" required />
        <button class="full" type="submit">Sign in</button>
      </form>
      <div class="links"><span>New here?</span><span>Create an account</span></div>
      <p id="status" class="status" aria-live="polite"></p>
    </main>`,
        `document.querySelector('#login-form').addEventListener('submit', (event) => {
        event.preventDefault();
        document.querySelector('#status').textContent = 'Signed in successfully — welcome back.';
      });`,
      );
    case 'dashboard':
      return page(
        'Project Dashboard',
        `
      .dashboard-head { margin-bottom: 24px; }
      .grid { margin-bottom: 20px; }
      .activity { padding: 18px; }
      .activity p { margin: 8px 0 0; font-size: 14px; }`,
        `<main class="shell">
      <div class="row dashboard-head"><div><p class="eyebrow">Overview</p><h1>Good morning, Alex.</h1></div><span class="pill">Live</span></div>
      <div class="grid">
        <div class="surface stat"><span>Active projects</span><strong>12</strong></div>
        <div class="surface stat"><span>Completed this week</span><strong>28</strong></div>
      </div>
      <div class="surface activity"><h2>Recent activity</h2><p>Design system updated · 8 minutes ago</p><p>New project created · 42 minutes ago</p></div>
      <button id="project-button" class="full" type="button" style="margin-top: 18px;">Create project</button>
      <p id="status" class="status" aria-live="polite"></p>
    </main>`,
        `document.querySelector('#project-button').addEventListener('click', () => {
        document.querySelector('#status').textContent = 'New project draft created.';
      });`,
      );
    case 'button':
      return page(
        'Button Showcase',
        `
      .button-stack { display: grid; gap: 12px; margin-top: 24px; }
      .secondary { background: #253849; color: #d6e3f0; }
      .outline { border: 1px solid #6ee7f9; background: transparent; color: #6ee7f9; }`,
        `<main class="shell">
      <p class="eyebrow">Interaction kit</p>
      <h1>Buttons that invite action.</h1>
      <p>Three flexible states for a clear, confident interface.</p>
      <div class="button-stack">
        <button id="primary-button" type="button">Primary action</button>
        <button class="secondary" id="secondary-button" type="button">Secondary action</button>
        <button class="outline" id="outline-button" type="button">Learn more</button>
      </div>
      <p id="status" class="status" aria-live="polite"></p>
    </main>`,
        `document.querySelectorAll('button').forEach((button) => {
        button.addEventListener('click', () => {
          document.querySelector('#status').textContent = button.textContent + ' selected.';
        });
      });`,
      );
    case 'tasks':
      return page(
        'Task List',
        `
      form { display: flex; gap: 8px; }
      form input { flex: 1; margin: 0; }
      ul { display: grid; gap: 10px; margin: 22px 0 0; padding: 0; list-style: none; }
      li { display: flex; justify-content: space-between; padding: 13px 14px; border-radius: 12px; background: #19212b; color: #d6e3f0; }
      li.done { color: #6d7d8e; text-decoration: line-through; }`,
        `<main class="shell">
      <p class="eyebrow">Daily focus</p>
      <h1>Small steps, every day.</h1>
      <p>Keep the next useful thing within reach.</p>
      <form id="task-form"><input id="task-input" aria-label="New task" placeholder="Add a task" /><button type="submit">Add</button></form>
      <ul id="task-list"><li>Plan the next step <span>✓</span></li><li>Take a focused break <span>○</span></li></ul>
    </main>`,
        `const form = document.querySelector('#task-form');
      const input = document.querySelector('#task-input');
      const list = document.querySelector('#task-list');
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = input.value.trim();
        if (!value) return;
        const item = document.createElement('li');
        const label = document.createTextNode(value);
        const marker = document.createElement('span');
        marker.textContent = '○';
        item.append(label, marker);
        item.addEventListener('click', () => item.classList.toggle('done'));
        list.appendChild(item);
        input.value = '';
      });`,
      );
    case 'pricing':
      return page(
        'Pricing Card',
        `
      .price { margin: 8px 0 18px; font-size: 48px; font-weight: 800; letter-spacing: -0.06em; }
      .price span { color: #a9b5c5; font-size: 14px; font-weight: 400; letter-spacing: 0; }
      ul { margin: 0 0 24px; padding-left: 20px; color: #a9b5c5; line-height: 2; }`,
        `<main class="shell">
      <p class="eyebrow">Simple pricing</p><h1>Starter plan</h1>
      <p class="price">$12 <span>/ month</span></p>
      <ul><li>Unlimited projects</li><li>Shared workspaces</li><li>Priority support</li></ul>
      <button id="choose-button" type="button">Choose starter</button>
      <p id="status" class="status" aria-live="polite"></p>
    </main>`,
        `document.querySelector('#choose-button').addEventListener('click', (event) => {
        event.currentTarget.textContent = 'Selected';
        document.querySelector('#status').textContent = 'Starter plan selected.';
      });`,
      );
    case 'landing':
      return page(
        'Landing Page',
        `
      .shell { text-align: center; }
      h1 { font-size: 42px; }
      .glow { color: #6ee7f9; }`,
        `<main class="shell">
      <p class="eyebrow">Coming soon</p>
      <h1>Build something <span class="glow">worth sharing.</span></h1>
      <p>Join the early list for a quieter way to turn ideas into products.</p>
      <button id="join-button" type="button">Join the waitlist</button>
      <p id="status" class="status" aria-live="polite"></p>
    </main>`,
        `document.querySelector('#join-button').addEventListener('click', (event) => {
        event.currentTarget.textContent = 'You are on the list';
        document.querySelector('#status').textContent = 'Thanks — we will be in touch.';
      });`,
      );
    case 'card':
    default:
      return page(
        'Generated App',
        `.card-label { display: inline-block; margin-bottom: 16px; color: #6ee7f9; font-weight: 700; }`,
        `<main class="shell">
      <span class="card-label">Offline starter</span>
      <h1>Your idea, in motion.</h1>
      <p>${safeIdea}</p>
      <button id="action-button" type="button">Get started</button>
      <p id="status" class="status" aria-live="polite"></p>
    </main>`,
        `document.querySelector('#action-button').addEventListener('click', (event) => {
        event.currentTarget.textContent = 'Started';
        document.querySelector('#status').textContent = 'Your first action is working.';
      });`,
      );
  }
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isLivePreview, setIsLivePreview] = useState<boolean>(false);
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
    setIsLivePreview(false);
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
          <View style={styles.outputActions}>
            <Pressable
              testID="live-preview-toggle"
              accessibilityRole="button"
              accessibilityLabel={
                isLivePreview ? 'Show generated code' : 'View live app'
              }
              disabled={!generatedCode}
              onPress={() => {
                setIsLivePreview((current) => !current);
                Haptics.selectionAsync();
              }}
              style={({ pressed }) => [
                styles.previewToggle,
                {
                  backgroundColor: isLivePreview
                    ? colors.primary
                    : colors.muted,
                  borderColor: isLivePreview ? colors.primary : colors.border,
                  opacity: !generatedCode ? 0.45 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather
                name={isLivePreview ? 'code' : 'play'}
                size={13}
                color={
                  isLivePreview
                    ? colors.primaryForeground
                    : colors.secondaryForeground
                }
              />
              <Text
                style={[
                  styles.previewToggleText,
                  {
                    color: isLivePreview
                      ? colors.primaryForeground
                      : colors.secondaryForeground,
                  },
                ]}
              >
                {isLivePreview ? 'Show code' : 'View live app'}
              </Text>
            </Pressable>
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
        </View>

        <View
          style={[
            styles.outputCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {generatedCode ? (
            isLivePreview ? (
              <View style={styles.previewFrame}>
                {Platform.OS === 'web' ? (
                  createElement('iframe', {
                    title: 'Generated live app preview',
                    srcDoc: generatedCode,
                    sandbox: 'allow-scripts',
                    style: {
                      border: '0',
                      height: 360,
                      width: '100%',
                    },
                  })
                ) : (
                  <WebView
                    originWhitelist={['*']}
                    source={{ html: generatedCode }}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    style={styles.webView}
                  />
                )}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.codeContent}
              >
                <Text style={[styles.codeText, { color: colors.secondaryForeground }]}>
                  {generatedCode}
                </Text>
              </ScrollView>
            )
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
  outputActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
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
  previewToggle: {
    alignItems: 'center',
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  previewToggleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  outputCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 14,
    minHeight: 190,
    overflow: 'hidden',
  },
  previewFrame: {
    minHeight: 340,
    overflow: 'hidden',
  },
  webView: {
    backgroundColor: '#0B1119',
    height: 360,
    width: '100%',
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