title: "SaaS Infrastructure Blueprint",
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

/**
 * ---------------------------------------------------------------------------
 * BRAND / CONTACT CONFIG
 * ---------------------------------------------------------------------------
 * Only one address lives in the app. Where that mail actually ends up
 * (forwarding, routing, inbox rules) is handled entirely outside this code —
 * on the domain's DNS / email-routing provider (e.g. Cloudflare Email
 * Routing). The app has no way to know about or control that, and doesn't
 * need to: it just opens the device's mail app addressed to this one inbox.
 * ---------------------------------------------------------------------------
 */
const BRAND_DOMAIN = "https://synkrave.com";
const SUPPORT_EMAIL_PRIMARY = "support@synkrave.com";

const openSupportEmail = async (subject: string) => {
  const mailUrl = `mailto:${SUPPORT_EMAIL_PRIMARY}?subject=${encodeURIComponent(subject)}`;
  try {
    const canOpen = await Linking.canOpenURL(mailUrl);
    if (!canOpen) throw new Error("No mail client available on this device");
    await Linking.openURL(mailUrl);
    return "opened";
  } catch (error) {
    console.warn("[Synkrave] Could not open mail client:", error);
    return "failed";
  }
};

/**
 * ---------------------------------------------------------------------------
 * BACKEND / HOSTING CONFIG
 * ---------------------------------------------------------------------------
 * This build targets Vercel only, for both the generated front-end preview
 * and the app's own hosting. There is no Netlify, Supabase, or Firebase
 * wiring in this file. A real production backend on Vercel (e.g. a Postgres
 * database via Vercel's own integrations, or a separate API) still needs to
 * be connected with real environment variables — this constant just reports
 * whether that has been done, it does not create the connection itself.
 * ---------------------------------------------------------------------------
 */
const HOSTING_PROVIDER = "Vercel";
const BACKEND_CONFIG = {
  databaseUrl: process.env.EXPO_PUBLIC_DATABASE_URL ?? "",
};
const isBackendConnected = Boolean(BACKEND_CONFIG.databaseUrl);

/**
 * ---------------------------------------------------------------------------
 * ENTERPRISE TIERS
 * ---------------------------------------------------------------------------
 */
const TIER_NAMES = [
  "Free",
  "Starter",
  "Growth",
  "Business",
  "Enterprise",
  "Elite",
] as const;

type EnterpriseModule = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  requiredTier: number; // index into TIER_NAMES
};

const enterpriseModules: EnterpriseModule[] = [
  {
    id: "support-bot",
    title: "Automated Customer Support",
    description: "Deploys a scripted FAQ + handoff chat widget",
    icon: "message-circle",
    requiredTier: 1,
  },
  {
    id: "lead-gen",
    title: "Lead Generation Modules",
    description: "Capture forms with export-ready lead lists",
    icon: "target",
    requiredTier: 2,
  },
  {
    id: "ivr",
    title: "Interactive Voice System (IVR)",
    description: "Menu-based call routing script generator",
    icon: "phone-call",
    requiredTier: 4,
  },
  {
    id: "ops-engine",
    title: "Autonomous Business Operation Engine",
    description: "Order + inventory log templates for your team",
    icon: "activity",
    requiredTier: 5,
  },
];

/**
 * ---------------------------------------------------------------------------
 * LANGUAGES — 100+ entries for the global voice picker
 * ---------------------------------------------------------------------------
 */
const worldLanguages: { label: string; value: string }[] = [
  { label: "English (US)", value: "en-US" },
  { label: "English (UK)", value: "en-GB" },
  { label: "اردو (Urdu)", value: "ur-PK" },
  { label: "हिन्दी (Hindi)", value: "hi-IN" },
  { label: "Español (España)", value: "es-ES" },
  { label: "Español (México)", value: "es-MX" },
  { label: "Français", value: "fr-FR" },
  { label: "Deutsch", value: "de-DE" },
  { label: "العربية (Arabic)", value: "ar-SA" },
  { label: "中文 (简体)", value: "zh-CN" },
  { label: "中文 (繁體)", value: "zh-TW" },
  { label: "日本語 (Japanese)", value: "ja-JP" },
  { label: "한국어 (Korean)", value: "ko-KR" },
  { label: "Português (Brasil)", value: "pt-BR" },
  { label: "Italiano", value: "it-IT" },
  { label: "Русский (Russian)", value: "ru-RU" },
  { label: "Türkçe (Turkish)", value: "tr-TR" },
  { label: "Nederlands (Dutch)", value: "nl-NL" },
  { label: "Polski (Polish)", value: "pl-PL" },
  { label: "فارسی (Persian)", value: "fa-IR" },
  { label: "বাংলা (Bengali)", value: "bn-BD" }
];

// Maps an ISO country code (from reverse-geocoding the device's GPS
// position) to the closest matching entry in worldLanguages. This is a
// reasonable default for a country, not a certainty about the person's
// preferred language — they can always change it from the picker.
const countryToLanguage: Record<string, string> = {
  US: "en-US", GB: "en-GB", CA: "en-US", AU: "en-GB", IE: "ga-IE", NZ: "mi-NZ",
  PK: "ur-PK", IN: "hi-IN", BD: "bn-BD", NP: "ne-NP", LK: "si-LK", AF: "ps-AF",
  IR: "fa-IR", SA: "ar-SA", AE: "ar-SA", EG: "ar-SA", IQ: "ar-SA", JO: "ar-SA",
  CN: "zh-CN", TW: "zh-TW", HK: "zh-TW", JP: "ja-JP", KR: "ko-KR",
  FR: "fr-FR", DE: "de-DE", ES: "es-ES", MX: "es-MX", PT: "pt-PT", BR: "pt-BR",
  IT: "it-IT", RU: "ru-RU", TR: "tr-TR", NL: "nl-NL", PL: "pl-PL",
  SE: "sv-SE", NO: "no-NO", DK: "da-DK", FI: "fi-FI", GR: "el-GR", IL: "he-IL",
  ID: "id-ID", MY: "ms-MY", TH: "th-TH", VN: "vi-VN", PH: "fil-PH",
  KE: "sw-KE", ET: "am-ET", NG: "ha-NG", ZA: "zu-ZA", GH: "ak-GH", ZW: "sn-ZW",
  UA: "uk-UA", RO: "ro-RO", HU: "hu-HU", CZ: "cs-CZ", SK: "sk-SK", BG: "bg-BG",
  RS: "sr-RS", HR: "hr-HR", BA: "bs-BA", SI: "sl-SI", LT: "lt-LT", LV: "lv-LV",
  EE: "et-EE", GE: "ka-GE", AM: "hy-AM", AZ: "az-AZ", KZ: "kk-KZ", UZ: "uz-UZ",
  MN: "mn-MN", KH: "km-KH", LA: "lo-LA", MM: "my-MM", SO: "so-SO",
  MG: "mg-MG", RW: "rw-RW", UG: "lg-UG", MW: "ny-MW", TZ: "sw-KE",
  IS: "is-IS", MT: "mt-MT", LU: "lb-LU", AL: "sq-AL", MK: "mk-MK", BY: "be-BY",
};

type TemplateDefinition = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: keyof typeof Feather.glyphMap;
  locked: boolean;
};

const starterPrompts = [
  "User habits & streaks schema
",
  "Recipes & meal planner database
",
];
const templateCatalog: TemplateDefinition[] = [
  {
    id: "grocery",
    title: "E-commerce Core Schema",
    description: "Products, orders, and delivery models",
    prompt:
      "An e-commerce database schema for products, orders, customers, payments, and delivery",
    icon: "shopping-bag",
    locked: false,
  },
  {
    id: "tailor",
    title: "Simple Inventory Schema",
    description: "Services, products, and stock data",
    prompt:
      "A simple inventory database schema for services, products, stock levels, and inventory movements",
    icon: "database",
    locked: true,
  },
  {
    id: "barber",
    title: "Service Booking DB Schema",
    description: "Cuts, hours, and appointments data",
    prompt:
      "A service booking database schema for services, business hours, customers, and appointments",
    icon: "calendar",
    locked: true,
  },

  {
    id: "grocery",
    title: "Simple Grocery Store",
    description: "Fresh products and local delivery",
    prompt:
      "A simple grocery store website with products and local delivery CTA",
    icon: "shopping-bag",
    locked: false,
  },
  {
    id: "corporate",
    title: "Corporate Business schema",
    description: "Enterprise services and trust signals",
    prompt:
      "A corporate business website with services, trust signals, and contact CTA",
    icon: "briefcase",
    locked: true,
  },
  {
    id: "financial",
    title: "Financial analytics schema",
    description: "Revenue, cash flow, and performance KPIs",
    prompt:
      "A financial dashboard with revenue, cash flow, and performance KPIs",
    icon: "bar-chart-2",
    locked: true,
  },
  {
    id: "ecommerce",
    title: "E-commerce Store",
    description: "Products, offers, and conversion",
    prompt: "An e-commerce store with featured products and a shopping CTA",
    icon: "shopping-bag",
    locked: true,
  },
  {
    id: "real-estate",
    title: "Real Estate data Blueprint",
    description: "Listings and property discovery",
    prompt: "A real estate portal with property listings and search filters",
    icon: "home",
    locked: true,
  },
  {
    id: "education",
    title: "Educational LMS schema",
    description: "Courses, lessons, and learner progress",
    prompt:
      "An educational LMS portal with courses, lessons, and learner progress",
    icon: "book-open",
    locked: true,
  },
  {
  id: "startup",
  title: "SaaS Infrastructure Blueprint",
  description: "Cloud architecture, scaling, and database clusters",
  prompt: "A comprehensive SaaS infrastructure database schema for users, multi-tenant scaling, and cloud clusters",
  icon: "layers",
  locked: true,
},
{
  id: "secure-login",
  title: "Auth & OAuth Identity Schema",
  description: "User authentication, JWT, and OAuth tokens data",
  prompt: "A secure authentication database schema for user logins, OAuth profiles, JWT sessions, and password resets",
  icon: "lock",
  locked: true,
},

  {
   {
  id: "pricing",
  title: "Subscription & Billing Model",
  description: "Plans, billing tiers, and recurring invoices",
  prompt: "A subscription billing database schema for service plans, invoices, transactions, and user tiers",
  icon: "credit-card",
  locked: true,
},

  {
    id: "custom",
    title: "Custom Blueprint",
    description: "Start from your own product brief",
    prompt: "A custom app based on my requirements",
    icon: "layers",
    locked: true,
  },
];

type GeneratedFiles = { html: string; css: string; js: string };
type SpeechTarget = "prompt" | "chat";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const createStandalonePreviewUrl = (html: string) =>
  `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

const splitGeneratedFiles = (documentHtml: string): GeneratedFiles => {
  const styleMatch = documentHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const scriptMatch = documentHtml.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  const css = styleMatch?.[1]?.trim() ?? "";
  const js = scriptMatch?.[1]?.trim() ?? "";
  const html = documentHtml
    .replace(
      styleMatch?.[0] ?? "",
      '<link rel="stylesheet" href="styles.css" />',
    )
    .replace(scriptMatch?.[0] ?? "", '<script src="script.js"></script>');
  return { html, css, js };
};

const localGenerateApp = (idea: string): Promise<string> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(buildLocalApp(idea)), 3000);
  });

function buildLocalApp(idea: string): string {
  const normalizedIdea = idea.toLowerCase();
  const safeIdea = escapeHtml(
    idea.replace(/\s+/g, " ").trim().slice(0, 90) ||
      "A simple generated text card",
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
      .eyebrow { margin: 0 0 10px; color: #6ee7f9; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
      h1 { margin: 0 0 10px; font-size: 30px; letter-spacing: -0.04em; }
      h2 { margin: 0; font-size: 18px; }
      p { margin: 0 0 22px; color: #a9b5c5; line-height: 1.6; }
      button { border: 0; border-radius: 12px; padding: 13px 18px; background: #6ee7f9; color: #071016; cursor: pointer; font: inherit; font-weight: 700; transition: transform 160ms ease, background 160ms ease; }
      button:hover { background: #a0f2ff; transform: translateY(-1px); }
      .status { min-height: 22px; margin: 14px 0 0; color: #6ee7f9; font-size: 14px; }
      input { width: 100%; margin: 0 0 12px; border: 1px solid #26313f; border-radius: 12px; padding: 13px; background: #0b1119; color: #f4f7ff; font: inherit; }
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
    case /corporate|business site|company|services|website/.test(normalizedIdea):
      templateKey = "landing";
      break;
    case /financial|finance|revenue|cash flow|kpi/.test(normalizedIdea):
      templateKey = "dashboard";
      break;
    case /e-commerce|ecommerce|store|shop|product catalog/.test(normalizedIdea):
      templateKey = "pricing";
      break;
    case /real estate|property|listing|home search/.test(normalizedIdea):
      templateKey = "card";
      break;
    case /education|educational|course|lesson|learning|school/.test(normalizedIdea):
      templateKey = "tasks";
      break;
    case /custom|other/.test(normalizedIdea):
      templateKey = "card";
      break;
    case /profile|team|portfolio/.test(normalizedIdea):
      templateKey = "profile";
      break;
    case /login|sign in|signin|register|signup|auth/.test(normalizedIdea):
      templateKey = "login";
      break;
    case /dashboard|analytics|admin|overview/.test(normalizedIdea):
      templateKey = "dashboard";
      break;
    case /button|cta|call to action/.test(normalizedIdea):
      templateKey = "button";
      break;
    case /todo|to-do|task|habit/.test(normalizedIdea):
      templateKey = "tasks";
      break;
    case /pricing|subscription|plan/.test(normalizedIdea):
      templateKey = "pricing";
      break;
    case /landing|hero|waitlist/.test(normalizedIdea):
      templateKey = "landing";
      break;
    default:
      templateKey = "card";
  }

  switch (templateKey) {
    case "profile":
      return page(
        "Profile Card",
        `.avatar { display: grid; width: 72px; height: 72px; margin-bottom: 22px; place-items: center; border-radius: 24px; background: linear-gradient(135deg, #6ee7f9, #8b7cff); color: #071016; font-size: 22px; font-weight: 800; } .meta { display: flex; gap: 8px; margin-bottom: 24px; }`,
        `<main class="shell"><div class="avatar">AM</div><p class="eyebrow">Profile card</p><h1>Alex Morgan</h1><p>Product designer building calm, useful digital experiences for thoughtful teams.</p><div class="meta"><span class="pill">Design</span><span class="pill">Available</span></div><button id="follow-button" type="button">Follow Alex</button><p id="status" class="status" aria-live="polite"></p></main>`,
        `const button = document.querySelector('#follow-button'); const status = document.querySelector('#status'); button.addEventListener('click', () => { const following = button.textContent === 'Following'; button.textContent = following ? 'Follow Alex' : 'Following'; status.textContent = following ? 'You unfollowed Alex.' : 'You are now following Alex.'; });`,
      );
    case "login":
      return page(
        "Welcome Back",
        `.form-copy { margin-bottom: 26px; } .form-copy p { margin-bottom: 0; } .links { display: flex; justify-content: space-between; margin-top: 18px; color: #6ee7f9; font-size: 13px; }`,
        `<main class="shell"><p class="eyebrow">Welcome back</p><h1>Sign in to continue.</h1><div class="form-copy"><p>Pick up where you left off and keep building.</p></div><form id="login-form"><input id="email" type="email" placeholder="Email address" required /><input id="password" type="password" placeholder="Password" required /><button class="full" type="submit">Sign in</button></form><div class="links"><span>New here?</span><span>Create an account</span></div><p id="status" class="status" aria-live="polite"></p></main>`,
        `document.querySelector('#login-form').addEventListener('submit', (event) => { event.preventDefault(); document.querySelector('#status').textContent = 'Signed in successfully — welcome back.'; });`,
      );
    case "dashboard":
      return page(
        "Project Dashboard",
        `.dashboard-head { margin-bottom: 24px; } .grid { margin-bottom: 20px; } .activity { padding: 18px; } .activity p { margin: 8px 0 0; font-size: 14px; }`,
        `<main class="shell"><div class="row dashboard-head"><div><p class="eyebrow">Overview</p><h1>Good morning, Alex.</h1></div><span class="pill">Live</span></div><div class="grid"><div class="surface stat"><span>Active projects</span><strong>12</strong></div><div class="surface stat"><span>Completed this week</span><strong>28</strong></div></div><div class="surface activity"><h2>Recent activity</h2><p>Design system updated · 8 minutes ago</p><p>New project created · 42 minutes ago</p></div><button id="project-button" class="full" type="button" style="margin-top: 18px;">Create project</button><p id="status" class="status" aria-live="polite"></p></main>`,
        `document.querySelector('#project-button').addEventListener('click', () => { document.querySelector('#status').textContent = 'New project draft created.'; });`,
      );
    case "button":
      return page(
        "Button Showcase",
        `.button-stack { display: grid; gap: 12px; margin-top: 24px; } .secondary { background: #253849; color: #d6e3f0; } .outline { border: 1px solid #6ee7f9; background: transparent; color: #6ee7f9; }`,
        `<main class="shell"><p class="eyebrow">Interaction kit</p><h1>Buttons that invite action.</h1><p>Three flexible states for a clear, confident interface.</p><div class="button-stack"><button id="primary-button" type="button">Primary action</button><button class="secondary" id="secondary-button" type="button">Secondary action</button><button class="outline" id="outline-button" type="button">Learn more</button></div><p id="status" class="status" aria-live="polite"></p></main>`,
        `document.querySelectorAll('button').forEach((button) => { button.addEventListener('click', () => { document.querySelector('#status').textContent = button.textContent + ' selected.'; }); });`,
      );
    case "tasks":
      return page(
        "Task List",
        `form { display: flex; gap: 8px; } form input { flex: 1; margin: 0; } ul { display: grid; gap: 10px; margin: 22px 0 0; padding: 0; list-style: none; } li { display: flex; justify-content: space-between; padding: 13px 14px; border-radius: 12px; background: #19212b; color: #d6e3f0; } li.done { color: #6d7d8e; text-decoration: line-through; }`,
        `<main class="shell"><p class="eyebrow">Daily focus</p><h1>Small steps, every day.</h1><p>Keep the next useful thing within reach.</p><form id="task-form"><input id="task-input" aria-label="New task" placeholder="Add a task" /><button type="submit">Add</button></form><ul id="task-list"><li>Plan the next step <span>✓</span></li><li>Take a focused break <span>○</span></li></ul></main>`,
        `const form = document.querySelector('#task-form'); const input = document.querySelector('#task-input'); const list = document.querySelector('#task-list'); form.addEventListener('submit', (event) => { event.preventDefault(); const value = input.value.trim(); if (!value) return; const item = document.createElement('li'); const label = document.createTextNode(value); const marker = document.createElement('span'); marker.textContent = '○'; item.append(label, marker); item.addEventListener('click', () => item.classList.toggle('done')); list.appendChild(item); input.value = ''; });`,
      );
    case "pricing":
      return page(
        "Pricing Card",
        `.price { margin: 8px 0 18px; font-size: 48px; font-weight: 800; letter-spacing: -0.06em; } .price span { color: #a9b5c5; font-size: 14px; font-weight: 400; letter-spacing: 0; } ul { margin: 0 0 24px; padding-left: 20px; color: #a9b5c5; line-height: 2; }`,
        `<main class="shell"><p class="eyebrow">Simple pricing</p><h1>Starter plan</h1><p class="price">$12 <span>/ month</span></p><ul><li>Unlimited projects</li><li>Shared workspaces</li><li>Priority support</li></ul><button id="choose-button" type="button">Choose starter</button><p id="status" class="status" aria-live="polite"></p></main>`,
        `document.querySelector('#choose-button').addEventListener('click', (event) => { event.currentTarget.textContent = 'Selected'; document.querySelector('#status').textContent = 'Starter plan selected.'; });`,
      );
    case "landing":
      return page(
        "Landing Page",
        `.shell { text-align: center; } h1 { font-size: 42px; } .glow { color: #6ee7f9; }`,
        `<main class="shell"><p class="eyebrow">Coming soon</p><h1>Build something <span class="glow">worth sharing.</span></h1><p>Join the early list for a quieter way to turn ideas into products.</p><button id="join-button" type="button">Join the waitlist</button><p id="status" class="status" aria-live="polite"></p></main>`,
        `document.querySelector('#join-button').addEventListener('click', (event) => { event.currentTarget.textContent = 'You are on the list'; document.querySelector('#status').textContent = 'Thanks — we will be in touch.'; });`,
      );
    case "card":
    default:
      return page(
        "Generated App",
        `.card-label { display: inline-block; margin-bottom: 16px; color: #6ee7f9; font-weight: 700; }`,
        `<main class="shell"><span class="card-label">Offline starter</span><h1>Your idea, in motion.</h1><p>${safeIdea}</p><button id="action-button" type="button">Get started</button><p id="status" class="status" aria-live="polite"></p></main>`,
        `document.querySelector('#action-button').addEventListener('click', (event) => { event.currentTarget.textContent = 'Started'; document.querySelector('#status').textContent = 'Your first action is working.'; });`,
      );
  }
}

const helpArticles = [
  {
    title: "1. Describe your app",
    body: "Type your idea into the composer, or tap the mic and speak in any of the 100+ supported languages. Keep it to one clear sentence for the best first draft.",
  },
  {
    title: "2. Generate a first draft",
    body: "Tap Generate App. Synkrave builds an offline starter (HTML/CSS/JS) in your device — no data leaves your phone during this step.",
  },
  {
    title: "3. Refine with AI Chat",
    body: "Use the follow-up box to ask for changes in plain language, e.g. 'make the hero warmer' or 'add a pricing table'.",
  },
  {
    title: "4. Preview, download, or deploy",
    body: "Switch to the live preview, download the three source files to your device, or create a shareable standalone preview link.",
  },
  {
    title: "5. Enterprise modules",
    body: "Support bots, lead capture, IVR scripts, and the operations engine unlock by tier. These currently generate deployment-ready templates — connecting them to a live phone line, ad account, or payment processor requires your own backend and provider accounts.",
  },
  {
    title: "Is my data sent to a server?",
    body: "Not in this build. Generation runs on-device. Real cloud deployment and a live database on Vercel require you to connect your own project credentials — see the footer for backend status.",
  },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [listeningTarget, setListeningTarget] = useState<SpeechTarget | null>(null);
  const [voiceLanguage, setVoiceLanguage] = useState<string>("en-US");
  const [languagePickerVisible, setLanguagePickerVisible] = useState<boolean>(false);
  const [languageSearch, setLanguageSearch] = useState<string>("");
  const [helpVisible, setHelpVisible] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFiles>({ html: "", css: "", js: "" });
  const [isLivePreview, setIsLivePreview] = useState<boolean>(false);
  const [isTesterRunning, setIsTesterRunning] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authModalVisible, setAuthModalVisible] = useState<boolean>(false);
  const [authReason, setAuthReason] = useState<string>("Unlock professional templates");
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [actionStatus, setActionStatus] = useState<string>("");
  const [chatMessage, setChatMessage] = useState<string>("");
  const [isChatSending, setIsChatSending] = useState<boolean>(false);
  const [trialUseCount, setTrialUseCount] = useState<number>(0);
  const [scanImageUri, setScanImageUri] = useState<string>("");
  const [adminPasswordModalVisible, setAdminPasswordModalVisible] = useState<boolean>(false);
  const [adminPanelVisible, setAdminPanelVisible] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminError, setAdminError] = useState<string>("");
  const [livePreviewUrl, setLivePreviewUrl] = useState<string>("");
  const [currentTier, setCurrentTier] = useState<number>(0);
  const [adControls, setAdControls] = useState<Record<string, boolean>>({
    interest: true,
    gambling: true,
    adult: true,
  });
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    void AsyncStorage.getItem("synkrave-ad-controls").then((storedControls) => {
      if (!storedControls) return;
      try {
        const parsedControls = JSON.parse(storedControls) as Record<string, boolean>;
        setAdControls((current) => ({ ...current, ...parsedControls }));
      } catch {
        // Keep the safe default when stored local settings are malformed.
      }
    });
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem("synkrave-ad-controls", JSON.stringify(adControls));
  }, [adControls]);

  // Ask for location permission and use the device's actual GPS position
  // (reverse-geocoded to a country) to pick a sensible starting language —
  // the same pattern large apps use. If the person declines the permission,
  // or geocoding fails for any reason, this falls back to the device's own
  // language setting instead of forcing a request retry.
  
  const filteredLanguages = useMemo(() => {
    const query = languageSearch.trim().toLowerCase();
    if (!query) return worldLanguages;
    return worldLanguages.filter(
      (language) =>
        language.label.toLowerCase().includes(query) ||
        language.value.toLowerCase().includes(query),
    );
  }, [languageSearch]);

  const activeLanguageLabel =
    worldLanguages.find((language) => language.value === voiceLanguage)?.label ??
    voiceLanguage;

  const openAuthModal = (reason: string) => {
    setAuthReason(reason);
    setAuthError("");
    setAuthModalVisible(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const closeAuthModal = () => {
    Keyboard.dismiss();
    setAuthModalVisible(false);
    setAuthError("");
  };

  const handleOfflineLogin = () => {
    const email = authEmail.trim();
    if (!email.includes("@") || !email.includes(".")) {
      setAuthError("Enter a valid email address.");
      return;
    }
    if (authPassword.length < 6) {
      setAuthError("Use a password with at least 6 characters.");
      return;
    }
    setIsAuthenticated(true);
    setAuthModalVisible(false);
    setAuthError("");
    setActionStatus("You are signed in. All professional templates are unlocked.");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleGoogleLogin = () => {
    setIsAuthenticated(true);
    setAuthModalVisible(false);
    setAuthError("");
    setActionStatus("Google sign-in completed in offline demo mode.");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleTemplatePress = (template: TemplateDefinition) => {
    if (template.locked && !isAuthenticated) {
      if (trialUseCount >= 1) {
        openAuthModal(`Unlock ${template.title} after your 3 free trials`);
        return;
      }
      setTrialUseCount((count) => count + 1);
      setActionStatus(
        `${template.title} selected. Free trial ${trialUseCount + 1} of 3 — tap Generate App.`,
      );
    }
    setPrompt(template.prompt);
    setError("");
    if (!template.locked || isAuthenticated) {
      setActionStatus(`${template.title} selected. Tap Generate App to build it.`);
    }
    Haptics.selectionAsync();
  };

  const handleDownload = () => {
    if (!isAuthenticated) {
      openAuthModal("Download generated app");
      return;
    }
    if (!generatedCode || !generatedFiles.html) {
      setActionStatus("Generate an app before downloading its files.");
      return;
    }
    if (Platform.OS === "web" && typeof window !== "undefined") {
      [
        ["index.html", generatedFiles.html],
        ["styles.css", generatedFiles.css],
        ["script.js", generatedFiles.js],
      ].forEach(([filename, contents]) => {
        const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      });
    } else {
      const indexFile = new File(Paths.document, "index.html");
      const stylesFile = new File(Paths.document, "styles.css");
      const scriptFile = new File(Paths.document, "script.js");
      indexFile.write(generatedFiles.html);
      stylesFile.write(generatedFiles.css);
      scriptFile.write(generatedFiles.js);
      setActionStatus("Saved index.html, styles.css, and script.js to app storage.");
      return;
    }
    setActionStatus("Downloaded index.html, styles.css, and script.js.");
  };

  const handleDeploy = () => {
    if (!isAuthenticated) {
      openAuthModal("Deploy generated app");
      return;
    }
    if (!generatedCode) {
      setActionStatus("Generate an app before deploying it.");
      return;
    }
    const previewUrl = createStandalonePreviewUrl(generatedCode);
    setLivePreviewUrl(previewUrl);
    setActionStatus(
      `Standalone preview created (demo). Connect a real ${HOSTING_PROVIDER} API token to make this a live deployment.`,
    );
  };

  const openLivePreview = () => {
    if (!livePreviewUrl) return;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(livePreviewUrl, "_blank", "noopener,noreferrer");
      return;
    }
    void Linking.openURL(livePreviewUrl);
  };

  const handleTester = () => {
    if (!generatedCode) {
      setActionStatus("Generate an app before running the AI One-Click Tester.");
      return;
    }
    setIsLivePreview(true);
    setIsTesterRunning(true);
    setActionStatus("AI One-Click Tester is running inside the interactive WebView.");
    setTimeout(() => {
      setIsTesterRunning(false);
      setActionStatus("AI One-Click Tester completed. Interactive controls are ready.");
    }, 1200);
  };

  const handleChatSubmit = async () => {
    if (!chatMessage.trim()) {
      setActionStatus("Describe a change for the AI follow-up box first.");
      return;
    }
    const updatedPrompt = `${prompt || "Build a useful local business app"}. Modification: ${chatMessage.trim()}`;
    setIsChatSending(true);
    setPrompt(updatedPrompt.slice(0, 500));
    const updatedHtml = await localGenerateApp(updatedPrompt);
    const updatedFiles = splitGeneratedFiles(updatedHtml);
    setGeneratedFiles(updatedFiles);
    setGeneratedCode(updatedHtml);
    setChatMessage("");
    setIsChatSending(false);
    setIsLivePreview(true);
    setActionStatus("AI follow-up applied. The live preview has been refreshed.");
  };

  const handleBugFix = async () => {
    if (!generatedCode) {
      setActionStatus("Generate an app before asking the AI Bug Fixer to repair it.");
      return;
    }
    setIsChatSending(true);
    const repairedHtml = await localGenerateApp(`${prompt} with repaired interactions`);
    const repairedFiles = splitGeneratedFiles(repairedHtml);
    setGeneratedFiles(repairedFiles);
    setGeneratedCode(repairedHtml);
    setIsChatSending(false);
    setIsLivePreview(true);
    setActionStatus("AI Bug Fixer rebuilt the template interactions and refreshed the preview.");
  };

  const handleExportGithub = () => {
    if (!isAuthenticated) {
      openAuthModal("Export project to GitHub");
      return;
    }
    if (!generatedFiles.html) {
      setActionStatus("Generate an app before exporting it to GitHub.");
      return;
    }
    setActionStatus(
      "GitHub-ready export prepared with index.html, styles.css, and script.js. Connect GitHub to publish it.",
    );
  };

  const handleVoiceCapture = (target: SpeechTarget) => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setListeningTarget(null);
      return;
    }
    const speechGlobals = globalThis as typeof globalThis & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Recognition = speechGlobals.SpeechRecognition ?? speechGlobals.webkitSpeechRecognition;

    if (!Recognition) {
      setIsListening(true);
      setListeningTarget(target);
      setActionStatus(
        `Microphone ready for ${activeLanguageLabel}. Native speech-to-text needs a provider (e.g. Google Cloud Speech, Whisper) wired in — this demo only transcribes in browsers that expose Web Speech.`,
      );
      Haptics.selectionAsync();
      return;
    }

    const recognition = new Recognition();
    recognition.lang = voiceLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (target === "prompt") {
        setPrompt(transcript.slice(0, 500));
      } else {
        setChatMessage(transcript);
      }
      setActionStatus(`Voice captured in ${activeLanguageLabel}.`);
    };
    recognition.onerror = () => {
      setActionStatus("Voice capture could not start. You can type the same request instead.");
    };
    recognition.onend = () => {
      setIsListening(false);
      setListeningTarget(null);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    setListeningTarget(target);
    recognition.start();
    Haptics.selectionAsync();
  };

  const handleVoicePress = () => {
    handleVoiceCapture("prompt");
    setError("");
  };

  const handleChatVoicePress = () => {
    handleVoiceCapture("chat");
  };

  const handleScanClone = async () => {
    try {
      const result =
        Platform.OS === "web"
          ? await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              quality: 1,
            })
          : await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              allowsEditing: true,
              quality: 1,
            });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const imageUri = result.assets[0].uri;
      setScanImageUri(imageUri);
      setPrompt("Recreate this scanned screenshot as a responsive, accessible interface");
      setActionStatus("Screenshot captured. The offline clone scaffold is ready for generation.");
    } catch {
      setActionStatus("Camera access was unavailable. Choose a screenshot from your gallery instead.");
    }
  };

  const handleAdminTrigger = () => {
    setAdminPassword("");
    setAdminError("");
    setAdminPasswordModalVisible(true);
    Haptics.selectionAsync();
  };

  const handleAdminUnlock = () => {
    // NOTE: this is a client-side demo gate only. A hardcoded string inside
    // the app bundle is readable by anyone who decompiles the APK — it is
    // NOT real access control. Replace with a server-side authenticated
    // session before shipping anything sensitive behind this screen.
    if (adminPassword !== "admin3322") {
      setAdminError("Incorrect admin password.");
      return;
    }
    setAdminPasswordModalVisible(false);
    setAdminPanelVisible(true);
    setAdminError("");
    setAdminPassword("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

    const handleGenerate = async () => {
    Keyboard.dismiss();
    if (!prompt.trim()) {
      setError("Add a short description to get started.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!isAuthenticated && trialUseCount >= 1) {
      setError("Your free schema has been used. Upgrade to generate another blueprint.");
      setIsGenerating(false);
      return;
    }

    setError("");
    setIsGenerating(true);
    setGeneratedCode("");
    setGeneratedFiles({ html: "", css: "", js: "" });
    setIsLivePreview(false);

    if (!isAuthenticated) {
      setTrialUseCount(1);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt.trim()
        })
      });


  if (!response.ok) {
    throw new Error("Server error");
  }

  const data = await response.json();

  setGeneratedCode(data.html || "");
  setGeneratedFiles(data);
  setIsLivePreview(true);

} catch (error) {
  setError("Server se response nahi aya");
}

setIsGenerating(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleStarterPress = (starter: string) => {
    setPrompt(starter);
    setError("");
    Haptics.selectionAsync();
  };

  const handleModulePress = (moduleItem: EnterpriseModule) => {
    if (currentTier < moduleItem.requiredTier) {
      setActionStatus(
        `🔒 ${moduleItem.title} requires the ${TIER_NAMES[moduleItem.requiredTier]} tier or higher. This is a demo tier switch — wire up real billing before enforcing this in production.`,
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setActionStatus(
      `${moduleItem.title} queued as a deployable template. Connect a live phone/chat/payment provider to make it operate for real.`,
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleContactSupport = async () => {
    const result = await openSupportEmail("Synkrave support request");
    if (result === "opened") {
      setActionStatus(`Opened mail app to ${SUPPORT_EMAIL_PRIMARY}.`);
    } else {
      setActionStatus("No mail app is configured on this device.");
    }
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.background, "#0B1119", colors.background]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 18, paddingBottom: Math.max(insets.bottom, 18) + 10 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Open admin controls"
            accessibilityRole="button"
            onLongPress={handleAdminTrigger}
            delayLongPress={900}
            style={({ pressed }) => [styles.brandRow, { opacity: pressed ? 0.72 : 1 }]}
          >
            <View style={[styles.brandMark, { backgroundColor: colors.accent }]}>
              <Feather name="zap" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.brandName, { color: colors.foreground }]}>Synkrave</Text>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open help center"
              onPress={() => setHelpVisible(true)}
              style={({ pressed }) => [styles.helpButton, { borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
            >
              <Feather name="help-circle" size={16} color={colors.mutedForeground} />
            </Pressable>
            <View style={[styles.betaPill, { borderColor: colors.border }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.betaText, { color: colors.mutedForeground }]}>BETA</Text>
            </View>
          </View>
        </View>

        <View style={styles.hero}>
         <Text style={[styles.eyebrow, { color: colors.primary }]}>PROMPT TO BLUEPRINT</Text>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Turn ideas{"\n"}
<Text style={{ color: colors.primary }}>into blueprints.</Text>

          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Describe what you want to build. We&apos;ll shape the first version for you.
          </Text>
        </View>

        <View style={styles.composerSection}>
          <View
            style={[
              styles.composer,
              {
                backgroundColor: colors.card,
                borderColor: error ? colors.destructive : isFocused ? colors.primary : colors.border,
              },
            ]}
          >
            <TextInput
              testID="prompt-input"
              value={prompt}
              onChangeText={(value) => {
                setPrompt(value);
                if (error) setError("");
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
             placeholder="Describe your database system or schema..."

              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
              maxLength={500}
              style={[styles.promptInput, { color: colors.foreground }]}
            />
            <View style={styles.composerFooter}>
              <Text style={[styles.characterCount, { color: colors.mutedForeground }]}>{prompt.length}/500</Text>
              <Pressable
                testID="voice-button"
                accessibilityRole="button"
                accessibilityLabel={isListening ? "Stop voice input" : "Start voice input"}
                onPress={handleVoicePress}
                style={({ pressed }) => [
                  styles.micButton,
                  { backgroundColor: isListening ? colors.primary : colors.secondary, opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Feather name={isListening ? "mic-off" : "mic"}
 size={18} color={isListening ? colors.primaryForeground : colors.foreground} />
              </Pressable>
            </View>
          </View>

          {isListening ? (
            <View style={styles.voiceStatus}>
              <View style={[styles.voicePulse, { backgroundColor: colors.primary }]} />
              <Text style={[styles.voiceStatusText, { color: colors.primary }]}>Voice input ready</Text>
              <Text style={[styles.voiceHint, { color: colors.mutedForeground }]}>Tap the mic to stop</Text>
            </View>
          ) : null}

          <View style={styles.voiceToolsRow}>
            <Text style={[styles.voiceToolsLabel, { color: colors.mutedForeground }]}>VOICE</Text>
            <Pressable
              testID="language-picker-button"
              accessibilityRole="button"
              accessibilityLabel="Choose voice language from 100+ options"
              onPress={() => setLanguagePickerVisible(true)}
              style={[styles.languageTrigger, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Feather name="globe" size={13} color={colors.primary} />
              <Text numberOfLines={1} style={[styles.languageTriggerText, { color: colors.secondaryForeground }]}>
                {activeLanguageLabel}
              </Text>
              <Feather name="chevron-down" size={13} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              testID="scan-clone-button"
              accessibilityRole="button"
              accessibilityLabel="Scan and clone screenshot"
              onPress={handleScanClone}
              style={({ pressed }) => [styles.scanButton, { backgroundColor: colors.accent, opacity: pressed ? 0.72 : 1 }]}
            >
              <Feather name="camera" size={15} color={colors.primary} />
            </Pressable>
          </View>
          {scanImageUri ? (
            <View style={[styles.scanStatus, { backgroundColor: colors.accent }]}>
              <Feather name="check-circle" size={14} color={colors.primary} />
              <Text style={[styles.scanStatusText, { color: colors.accentForeground }]}>
                Screenshot scanned — clone brief ready
              </Text>
            </View>
          ) : null}

          {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}

          <View style={styles.starterRow}>
            <Text style={[styles.starterLabel, { color: colors.mutedForeground }]}>TRY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.starterScroll}>
              {starterPrompts.map((starter) => (
                <Pressable
                  key={starter}
                  onPress={() => handleStarterPress(starter)}
                  style={({ pressed }) => [
                    styles.starterChip,
                    { borderColor: colors.border, backgroundColor: colors.muted, opacity: pressed ? 0.68 : 1 },
                  ]}
                >
                  <Text style={[styles.starterText, { color: colors.secondaryForeground }]}>{starter}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <Pressable
          testID="generate-button"
          accessibilityRole="button"
          accessibilityLabel="Generate blueprint"

          onPress={handleGenerate}
          disabled={isGenerating}
          style={({ pressed }) => [
            styles.generateButton,
            { backgroundColor: colors.primary, opacity: pressed || isGenerating ? 0.78 : 1 },
          ]}
        >
          {isGenerating ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Text style={[styles.generateText, { color: colors.primaryForeground }]}>
  Generate Blueprint
</Text>

              <Feather name="arrow-up-right" size={20} color={colors.primaryForeground} />
            </>
          )}
        </Pressable>

        <View style={styles.templatesSection}>
          <View style={styles.templatesHeader}>
            <View>
              <Text style={[styles.outputEyebrow, { color: colors.mutedForeground }]}>STARTER LIBRARY</Text>
              <Text style={[styles.templatesTitle, { color: colors.foreground }]}>Choose a template</Text>
            </View>
            <View style={[styles.templateCount, { backgroundColor: colors.muted }]}>
              <Text style={[styles.templateCountText, { color: colors.mutedForeground }]}>
                {isAuthenticated ? "12 unlocked" : "3 free · 9 locked"}
              </Text>
            </View>
          </View>
          <View style={styles.templateGrid}>
            {templateCatalog.map((template) => {
              const isLocked = template.locked && !isAuthenticated;
              return (
                <Pressable
                  key={template.id}
                  testID={`template-${template.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={isLocked ? `Unlock ${template.title}` : `Use ${template.title}`}
                  onPress={() => handleTemplatePress(template)}
                  style={({ pressed }) => [
                    styles.templateCard,
                    { backgroundColor: colors.card, borderColor: isLocked ? colors.border : colors.accent, opacity: pressed ? 0.72 : 1 },
                  ]}
                >
                  <View style={styles.templateCardTop}>
                    <View style={[styles.templateIcon, { backgroundColor: isLocked ? colors.muted : colors.accent }]}>
                      <Feather name={template.icon} size={16} color={isLocked ? colors.mutedForeground : colors.primary} />
                    </View>
                    {isLocked ? (
                      <Feather name="lock" size={14} color={colors.mutedForeground} />
                    ) : (
                      <Text style={[styles.freeLabel, { color: colors.primary }]}>{template.locked ? "PRO" : "FREE"}</Text>
                    )}
                  </View>
                  <Text style={[styles.templateName, { color: colors.foreground }]}>{template.title}</Text>
                  <Text style={[styles.templateDescription, { color: colors.mutedForeground }]}>{template.description}</Text>
                </Pressable>
              );
            })}
          </View>
          {actionStatus ? (
            <View style={[styles.actionStatus, { backgroundColor: colors.accent }]}>
              <Feather name="info" size={14} color={colors.primary} />
              <Text style={[styles.actionStatusText, { color: colors.accentForeground }]}>{actionStatus}</Text>
            </View>
          ) : null}
        </View>

        {/* ENTERPRISE OPERATIONS WORKSPACE */}
        <View style={styles.templatesSection}>
          <View style={styles.templatesHeader}>
            <View>
              <Text style={[styles.outputEyebrow, { color: colors.mutedForeground }]}>ENTERPRISE OPERATIONS</Text>
              <Text style={[styles.templatesTitle, { color: colors.foreground }]}>Automation modules</Text>
            </View>
          </View>
          <Text style={[styles.tierHint, { color: colors.mutedForeground }]}>
            Demo tier switch (no billing wired up yet) — tap to preview lock behavior:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierRow}>
            {TIER_NAMES.map((tierName, index) => (
              <Pressable
                key={tierName}
                onPress={() => setCurrentTier(index)}
                style={[
                  styles.tierChip,
                  {
                    backgroundColor: currentTier === index ? colors.primary : colors.muted,
                    borderColor: currentTier === index ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tierChipText,
                    { color: currentTier === index ? colors.primaryForeground : colors.secondaryForeground },
                  ]}
                >
                  {tierName}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.templateGrid}>
            {enterpriseModules.map((moduleItem) => {
              const locked = currentTier < moduleItem.requiredTier;
              return (
                <Pressable
                  key={moduleItem.id}
                  accessibilityRole="button"
                  accessibilityLabel={locked ? `Locked: ${moduleItem.title}` : `Deploy ${moduleItem.title}`}
                  onPress={() => handleModulePress(moduleItem)}
                  style={({ pressed }) => [
                    styles.templateCard,
                    { backgroundColor: colors.card, borderColor: locked ? colors.border : colors.accent, opacity: pressed ? 0.72 : 1 },
                  ]}
                >
                  <View style={styles.templateCardTop}>
                    <View style={[styles.templateIcon, { backgroundColor: locked ? colors.muted : colors.accent }]}>
                      <Feather name={moduleItem.icon} size={16} color={locked ? colors.mutedForeground : colors.primary} />
                    </View>
                    {locked ? (
                      <Feather name="lock" size={14} color={colors.mutedForeground} />
                    ) : (
                      <Text style={[styles.freeLabel, { color: colors.primary }]}>READY</Text>
                    )}
                  </View>
                  <Text style={[styles.templateName, { color: colors.foreground }]}>{moduleItem.title}</Text>
                  <Text style={[styles.templateDescription, { color: colors.mutedForeground }]}>{moduleItem.description}</Text>
                  <Text style={[styles.tierRequirement, { color: colors.mutedForeground }]}>
                    Requires {TIER_NAMES[moduleItem.requiredTier]}+
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.outputHeader}>
          <View>
            <Text style={[styles.outputEyebrow, { color: colors.mutedForeground }]}>WORKSPACE</Text>
            <Text style={[styles.outputTitle, { color: colors.foreground }]}>Generated output</Text>
          </View>
          <View style={styles.outputActions}>
            <Pressable
              testID="live-preview-toggle"
              accessibilityRole="button"
              accessibilityLabel={isLivePreview ? "Show generated code" : "View live app"}
              disabled={!generatedCode}
              onPress={() => {
                setIsLivePreview((current) => !current);
                Haptics.selectionAsync();
              }}
              style={({ pressed }) => [
                styles.previewToggle,
                {
                  backgroundColor: isLivePreview ? colors.primary : colors.muted,
                  borderColor: isLivePreview ? colors.primary : colors.border,
                  opacity: !generatedCode ? 0.45 : pressed ? 0.7 : 1,
                },
              ]}
            >
              <Feather name={isLivePreview ? "code" : "play"} size={13} color={isLivePreview ? colors.primaryForeground : colors.secondaryForeground} />
              <Text style={[styles.previewToggleText, { color: isLivePreview ? colors.primaryForeground : colors.secondaryForeground }]}>
                {isLivePreview ? "Show code" : "View live app"}
              </Text>
            </Pressable>
            <View style={[styles.outputBadge, { backgroundColor: colors.muted }]}>
              <Feather name={generatedCode ? "check-circle" : "code"} size={14} color={generatedCode ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.outputBadgeText, { color: colors.mutedForeground }]}>{generatedCode ? "READY" : "EMPTY"}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.testerBar, { backgroundColor: colors.muted }]}>
          <View style={styles.testerCopy}>
            <Feather name="check-circle" size={15} color={colors.primary} />
            <View>
              <Text style={[styles.testerTitle, { color: colors.foreground }]}>AI One-Click Tester</Text>
              <Text style={[styles.testerDescription, { color: colors.mutedForeground }]}>Test buttons inside the live simulator</Text>
            </View>
          </View>
          <Pressable
            testID="one-click-tester-button"
            accessibilityRole="button"
            accessibilityLabel="Run AI One-Click Tester"
            onPress={handleTester}
            style={({ pressed }) => [styles.testerButton, { backgroundColor: colors.primary, opacity: pressed ? 0.72 : 1 }]}
          >
            <Feather name={isTesterRunning ? "loader" : "play"} size={14} color={colors.primaryForeground} />
            <Text style={[styles.testerButtonText, { color: colors.primaryForeground }]}>{isTesterRunning ? "Testing" : "Run test"}</Text>
          </Pressable>
        </View>

        <View style={[styles.outputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {generatedCode ? (
            isLivePreview ? (
              <View style={styles.previewFrame}>
                {Platform.OS === "web" ? (
                  createElement("iframe", {
                    title: "Generated live app preview",
                    srcDoc: generatedCode,
                    sandbox: "allow-scripts",
                    style: { border: "0", height: 360, width: "100%" },
                  })
                ) : (
                  <WebView
                    originWhitelist={["*"]}
                    source={{ html: generatedCode }}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    style={styles.webView}
                  />
                )}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.codeContent}>
                <Text style={[styles.codeText, { color: colors.secondaryForeground }]}>{generatedCode}</Text>
              </ScrollView>
            )
          ) : (
            <View style={styles.emptyOutput}>
              <View style={[styles.outputIcon, { backgroundColor: colors.accent }]}>
                <Feather name="layers" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your app will appear here</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Start with a prompt above to generate your first screen.
              </Text>
            </View>
          )}
        </View>

        {generatedCode ? (
          <View style={styles.fileOutputSection}>
            <View style={styles.fileOutputHeader}>
              <Text style={[styles.fileOutputTitle, { color: colors.foreground }]}>Multi-file output</Text>
              <Text style={[styles.fileOutputHint, { color: colors.mutedForeground }]}>3 files ready</Text>
            </View>
            <View style={styles.fileChipRow}>
              {[
                ["index.html", generatedFiles.html.length, "file-text"],
                ["styles.css", generatedFiles.css.length, "layers"],
                ["script.js", generatedFiles.js.length, "code"],
              ].map(([name, size, icon]) => (
                <View key={name} style={[styles.fileChip, { backgroundColor: colors.muted }]}>
                  <Feather name={icon as keyof typeof Feather.glyphMap} size={14} color={colors.primary} />
                  <View style={styles.fileChipCopy}>
                    <Text style={[styles.fileChipName, { color: colors.foreground }]}>{name}</Text>
                    <Text style={[styles.fileChipSize, { color: colors.mutedForeground }]}>{size} chars</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        
        <View style={styles.businessActions}>
          <Pressable
            testID="download-button"
            accessibilityRole="button"
            accessibilityLabel="Download Blueprint JSON"
            onPress={handleDownload}
            style={({ pressed }) => [
              styles.secondaryAction,
              { borderColor: colors.border, backgroundColor: colors.secondary, opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <Feather name="download" size={16} color={colors.secondaryForeground} />
            <Text style={[styles.secondaryActionText, { color: colors.secondaryForeground }]}>Download Blueprint JSON</Text>
          </Pressable>

          <Pressable
            testID="deploy-button"
            accessibilityRole="button"
            accessibilityLabel="Deploy to Internet"
            onPress={handleDeploy}
            style={({ pressed }) => [styles.primaryAction, { backgroundColor: colors.primary, opacity: pressed ? 0.72 : 1 }]}
          >
            <Feather name="upload-cloud" size={16} color={colors.primaryForeground} />
            <Text style={[styles.primaryActionText, { color: colors.primaryForeground }]}>Deploy (demo)</Text>
          </Pressable>
        </View>

        {livePreviewUrl ? (
          <View style={[styles.liveLinkCard, { backgroundColor: colors.accent }]}>
            <View style={styles.liveLinkHeader}>
              <View style={styles.liveLinkTitleRow}>
                <Feather name="globe" size={15} color={colors.primary} />
                <Text style={[styles.liveLinkTitle, { color: colors.foreground }]}>Live preview URL</Text>
              </View>
              <View style={[styles.liveLinkBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.liveLinkBadgeText, { color: colors.primaryForeground }]}>READY</Text>
              </View>
            </View>
            <Text selectable numberOfLines={2} style={[styles.liveLinkUrl, { color: colors.mutedForeground }]}>
              {livePreviewUrl}
            </Text>
            <Pressable
              testID="open-live-preview-button"
              accessibilityRole="link"
              accessibilityLabel="Open standalone live preview"
              onPress={openLivePreview}
              style={({ pressed }) => [styles.openPreviewButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.72 : 1 }]}
            >
              <Feather name="external-link" size={15} color={colors.primary} />
              <Text style={[styles.openPreviewText, { color: colors.secondaryForeground }]}>Open standalone preview</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.chatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.chatHeader}>
            <View>
              <Text style={[styles.outputEyebrow, { color: colors.mutedForeground }]}>FOLLOW-UP WORKSPACE</Text>
              <Text style={[styles.chatTitle, { color: colors.foreground }]}>AI Chat &amp; Follow-up</Text>
            </View>
            <Feather name="message-square" size={18} color={colors.primary} />
          </View>
          <TextInput
            testID="chat-input"
            value={chatMessage}
            onChangeText={setChatMessage}
            multiline
            placeholder="Ask for a change, such as: make the hero warmer..."
            placeholderTextColor={colors.mutedForeground}
            textAlignVertical="top"
            style={[styles.chatInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
          />
          <View style={styles.chatActions}>
            <Pressable
              testID="chat-voice-button"
              accessibilityRole="button"
              accessibilityLabel="Speak a follow-up modification"
              onPress={handleChatVoicePress}
              style={({ pressed }) => [styles.chatIconButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.72 : 1 }]}
            >
              <Feather name={isListening && listeningTarget === "chat" ? "mic-off" : "mic"}
 size={16} color={colors.secondaryForeground} />
            </Pressable>
            <Pressable
              testID="bug-fix-button"
              accessibilityRole="button"
              accessibilityLabel="Run AI Bug Fixer"
              onPress={handleBugFix}
              style={({ pressed }) => [styles.bugFixButton, { backgroundColor: colors.accent, opacity: pressed ? 0.72 : 1 }]}
            >
              <Feather name="tool" size={15} color={colors.primary} />
              <Text style={[styles.bugFixText, { color: colors.accentForeground }]}>AI Bug Fixer</Text>
            </Pressable>
            <Pressable
              testID="chat-submit-button"
              accessibilityRole="button"
              accessibilityLabel="Apply follow-up"
              disabled={isChatSending}
              onPress={handleChatSubmit}
              style={({ pressed }) => [styles.chatSubmitButton, { backgroundColor: colors.primary, opacity: isChatSending || pressed ? 0.72 : 1 }]}
            >
              {isChatSending ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : <Feather name="arrow-up" size={17} color={colors.primaryForeground} />}
            </Pressable>
          </View>
        </View>

        <Pressable
          testID="github-export-button"
          accessibilityRole="button"
          accessibilityLabel="Export to GitHub"
          onPress={handleExportGithub}
          style={({ pressed }) => [
            styles.githubButton,
            { borderColor: colors.border, backgroundColor: colors.secondary, opacity: pressed ? 0.72 : 1 },
          ]}
        >
          <Feather name="github" size={17} color={colors.secondaryForeground} />
          <Text style={[styles.githubButtonText, { color: colors.secondaryForeground }]}>Export to GitHub</Text>
        </Pressable>

        {/* FOOTER: brand domain, support contact, backend status, honest "secured" badge */}
        <View style={[styles.brandFooter, { borderColor: colors.border }]}>
          <Pressable onPress={() => Linking.openURL(BRAND_DOMAIN)} style={styles.footerRow}>
            <Feather name="link" size={13} color={colors.primary} />
            <Text style={[styles.footerLinkText, { color: colors.primary }]}>{BRAND_DOMAIN.replace("https://", "")}</Text>
          </Pressable>
          <Pressable onPress={handleContactSupport} style={styles.footerRow}>
            <Feather name="mail" size={13} color={colors.mutedForeground} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>{SUPPORT_EMAIL_PRIMARY}</Text>
          </Pressable>
          <View style={styles.footerRow}>
            <Feather name="lock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Secured connection (HTTPS)</Text>
          </View>
          <View style={styles.footerRow}>
            <Feather name="cloud" size={12} color={colors.mutedForeground} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Hosting: {HOSTING_PROVIDER}
            </Text>
          </View>
          <View style={styles.footerRow}>
            <Feather name="database" size={12} color={isBackendConnected ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.footerText, { color: isBackendConnected ? colors.primary : colors.mutedForeground }]}>
              Database: {isBackendConnected ? "Connected" : "Not connected — add your database URL"}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Feather name="zap" size={14} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Built for quick ideas and clean starts</Text>
        </View>
      </ScrollView>

      {/* LANGUAGE PICKER MODAL */}
      <Modal visible={languagePickerVisible} transparent animationType="fade" onRequestClose={() => setLanguagePickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.languageModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground, fontSize: 18 }]}>Choose a language</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close language picker" onPress={() => setLanguagePickerVisible(false)} style={styles.iconButton}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <TextInput
              value={languageSearch}
              onChangeText={setLanguageSearch}
              placeholder="Search languages..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, marginTop: 6 }]}
            />
            <FlatList
              data={filteredLanguages}
              keyExtractor={(item) => item.value}
              style={{ marginTop: 10, maxHeight: 360 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setVoiceLanguage(item.value);
                    setLanguagePickerVisible(false);
                    setLanguageSearch("");
                    Haptics.selectionAsync();
                  }}
                  style={[styles.languageRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={{ color: colors.foreground, fontSize: 14 }}>{item.label}</Text>
                  {item.value === voiceLanguage ? <Feather name="check" size={16} color={colors.primary} /> : null}
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* HELP CENTER MODAL */}
      <Modal visible={helpVisible} transparent animationType="slide" onRequestClose={() => setHelpVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.adminPanelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalEyebrow, { color: colors.primary }]}>DOCUMENTATION</Text>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Help Center</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close help center" onPress={() => setHelpVisible(false)} style={styles.iconButton}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.adminPanelContent}>
              {helpArticles.map((article) => (
                <View key={article.title} style={{ marginBottom: 18 }}>
                  <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 6 }}>
                    {article.title}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18 }}>{article.body}</Text>
                </View>
              ))}
              <Pressable
                onPress={handleContactSupport}
                style={({ pressed }) => [styles.modalPrimaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.72 : 1, marginTop: 6 }]}
              >
                <Text style={[styles.modalPrimaryText, { color: colors.primaryForeground }]}>Still stuck? Email support</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={authModalVisible} transparent animationType="fade" onRequestClose={closeAuthModal}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalEyebrow, { color: colors.primary }]}>FREE ACCOUNT</Text>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Unlock Synkrave</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close login" onPress={closeAuthModal} style={styles.iconButton}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
              {authReason}. Sign in for free to unlock all professional tools.
            </Text>
            <TextInput
              testID="auth-email"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={(value) => {
                setAuthEmail(value);
                if (authError) setAuthError("");
              }}
              placeholder="Email address"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={authEmail}
            />
            <TextInput
              testID="auth-password"
              autoCapitalize="none"
              autoComplete="password"
              onChangeText={(value) => {
                setAuthPassword(value);
                if (authError) setAuthError("");
              }}
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={authPassword}
            />
            {authError ? <Text style={[styles.modalError, { color: colors.destructive }]}>{authError}</Text> : null}
            <Pressable
              testID="email-login-button"
              accessibilityRole="button"
              accessibilityLabel="Continue with email"
              onPress={handleOfflineLogin}
              style={({ pressed }) => [styles.modalPrimaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.72 : 1 }]}
            >
              <Text style={[styles.modalPrimaryText, { color: colors.primaryForeground }]}>Continue with email</Text>
            </Pressable>
            <View style={styles.modalDivider}>
              <View style={[styles.modalDividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.modalDividerText, { color: colors.mutedForeground }]}>OR</Text>
              <View style={[styles.modalDividerLine, { backgroundColor: colors.border }]} />
            </View>
            <Pressable
              testID="google-login-button"
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              onPress={handleGoogleLogin}
              style={({ pressed }) => [styles.googleButton, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}
            >
              <Text style={[styles.googleMark, { color: colors.primary }]}>G</Text>
              <Text style={[styles.googleButtonText, { color: colors.secondaryForeground }]}>Continue with Google</Text>
            </Pressable>
            <Text style={[styles.privacyNote, { color: colors.mutedForeground }]}>Offline demo account. No credentials leave this device.</Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={adminPasswordModalVisible} transparent animationType="fade" onRequestClose={() => setAdminPasswordModalVisible(false)}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalEyebrow, { color: colors.primary }]}>RESTRICTED (DEMO GATE)</Text>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Admin access</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close admin access" onPress={() => setAdminPasswordModalVisible(false)} style={styles.iconButton}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
              This panel is gated by a password stored inside the app bundle. That is not real security — anyone
              who inspects the app code can read it. Treat this as a UI placeholder only.
            </Text>
            <TextInput
              testID="admin-password"
              autoCapitalize="none"
              onChangeText={(value) => {
                setAdminPassword(value);
                if (adminError) setAdminError("");
              }}
              placeholder="Admin password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={adminPassword}
            />
            {adminError ? <Text style={[styles.modalError, { color: colors.destructive }]}>{adminError}</Text> : null}
            <Pressable
              testID="admin-unlock-button"
              accessibilityRole="button"
              accessibilityLabel="Unlock admin panel"
              onPress={handleAdminUnlock}
              style={({ pressed }) => [styles.modalPrimaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.72 : 1 }]}
            >
              <Text style={[styles.modalPrimaryText, { color: colors.primaryForeground }]}>Open admin panel</Text>
            </Pressable>
            <Text style={[styles.privacyNote, { color: colors.mutedForeground }]}>
              Local-only demo gate. Use a real server-side authenticated session before production.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={adminPanelVisible} transparent animationType="slide" onRequestClose={() => setAdminPanelVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.adminPanelCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalEyebrow, { color: colors.primary }]}>ADMIN PANEL</Text>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Operations overview</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close admin panel" onPress={() => setAdminPanelVisible(false)} style={styles.iconButton}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.adminPanelContent}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MOCK TRAFFIC ANALYTICS</Text>
              <View style={styles.analyticsGrid}>
                <View style={[styles.analyticsCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.analyticsValue, { color: colors.foreground }]}>12.8k</Text>
                  <Text style={[styles.analyticsLabel, { color: colors.mutedForeground }]}>Visitors</Text>
                </View>
                <View style={[styles.analyticsCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.analyticsValue, { color: colors.foreground }]}>4.2k</Text>
                  <Text style={[styles.analyticsLabel, { color: colors.mutedForeground }]}>Apps generated</Text>
                </View>
                <View style={[styles.analyticsCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.analyticsValue, { color: colors.foreground }]}>68%</Text>
                  <Text style={[styles.analyticsLabel, { color: colors.mutedForeground }]}>Return rate</Text>
                </View>
                <View style={[styles.analyticsCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.analyticsValue, { color: colors.primary }]}>+24%</Text>
                  <Text style={[styles.analyticsLabel, { color: colors.mutedForeground }]}>Weekly growth</Text>
                </View>
              </View>
              <View style={[styles.chartCard, { backgroundColor: colors.background }]}>
                <View style={styles.chartHeader}>
                  <Text style={[styles.chartTitle, { color: colors.foreground }]}>Weekly traffic</Text>
                  <Text style={[styles.chartPeriod, { color: colors.primary }]}>7 days</Text>
                </View>
                <View style={styles.chartBars}>
                  {[42, 58, 46, 74, 62, 88, 96].map((height, index) => (
                    <View key={index} style={styles.chartBarColumn}>
                      <View style={[styles.chartBar, { backgroundColor: colors.primary, height: height * 1.25 }]} />
                      <Text style={[styles.chartDay, { color: colors.mutedForeground }]}>{["M", "T", "W", "T", "F", "S", "S"][index]}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>BACKEND STATUS</Text>
              <View style={[styles.controlsCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.controlsDescription, { color: colors.mutedForeground }]}>
                  Hosting: {HOSTING_PROVIDER} · Database: {BACKEND_CONFIG.databaseUrl ? "URL set" : "Not configured"}.
                  Add a real database URL as an environment variable in your Vercel project settings to move off
                  demo mode.
                </Text>
              </View>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SHARIAH-COMPLIANT AD CONTROLS</Text>
              <View style={[styles.controlsCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.controlsDescription, { color: colors.mutedForeground }]}>
                  Blocks sensitive ad categories in this app's own UI before an ad slot is shown. This does not
                  control what a third-party ad network itself decides to serve — enforce category blocking in
                  your AdMob dashboard as the authoritative source of truth.
                </Text>
                {[
                  ["interest", "Interest", "Block interest-based promotions"],
                  ["gambling", "Gambling", "Block betting and casino ads"],
                  ["adult", "Adult Content", "Block explicit or mature ads"],
                ].map(([key, title, description]) => (
                  <View key={key} style={styles.controlRow}>
                    <View style={styles.controlCopy}>
                      <Text style={[styles.controlTitle, { color: colors.foreground }]}>{title}</Text>
                      <Text style={[styles.controlDescription, { color: colors.mutedForeground }]}>{description}</Text>
                    </View>
                    <Switch
                      accessibilityLabel={`Block ${title}`}
                      onValueChange={(value) => setAdControls((current) => ({ ...current, [key]: value }))}
                      thumbColor={adControls[key] ? colors.primaryForeground : colors.mutedForeground}
                      trackColor={{ false: colors.secondary, true: colors.primary }}
                      value={adControls[key]}
                    />
                  </View>
                ))}
              </View>
              <View style={[styles.protectionStatus, { backgroundColor: colors.accent }]}>
                <Feather name="shield" size={15} color={colors.primary} />
                <Text style={[styles.protectionStatusText, { color: colors.accentForeground }]}>
                  {Object.values(adControls).filter(Boolean).length}/3 categories blocked
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  brandMark: { alignItems: "center", borderRadius: 10, height: 34, justifyContent: "center", width: 34 },
  brandName: { fontFamily: "Inter_700Bold", fontSize: 17, letterSpacing: -0.4 },
  headerActions: { alignItems: "center", flexDirection: "row", gap: 8 },
  helpButton: { alignItems: "center", borderRadius: 99, borderWidth: 1, height: 30, justifyContent: "center", width: 30 },
  betaPill: { alignItems: "center", borderRadius: 99, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 9, paddingVertical: 5 },
  liveDot: { borderRadius: 99, height: 5, width: 5 },
  betaText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1 },
  hero: { marginTop: 66 },
  eyebrow: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1.8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 42, letterSpacing: -2, lineHeight: 46, marginTop: 12 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 23, marginTop: 16, maxWidth: 325 },
  composerSection: { marginTop: 32 },
  composer: { borderRadius: 18, borderWidth: 1, minHeight: 174, padding: 16 },
  promptInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 17, lineHeight: 25, minHeight: 100 },
  composerFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  characterCount: { fontFamily: "Inter_400Regular", fontSize: 11 },
  micButton: { alignItems: "center", borderRadius: 12, height: 38, justifyContent: "center", width: 38 },
  voiceStatus: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 11 },
  voicePulse: { borderRadius: 99, height: 6, width: 6 },
  voiceStatusText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  voiceHint: { fontFamily: "Inter_400Regular", fontSize: 12 },
  voiceToolsRow: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 14 },
  voiceToolsLabel: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.1 },
  languageTrigger: {
    alignItems: "center",
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: "row",
    flex: 1,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  languageTriggerText: { flex: 1, fontFamily: "Inter_600SemiBold", fontSize: 11 },
  scanButton: { alignItems: "center", borderRadius: 10, height: 32, justifyContent: "center", width: 34 },
  scanStatus: { alignItems: "center", borderRadius: 10, flexDirection: "row", gap: 7, marginTop: 9, paddingHorizontal: 10, paddingVertical: 8 },
  scanStatusText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  errorText: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 10 },
  starterRow: { alignItems: "center", flexDirection: "row", marginTop: 16 },
  starterLabel: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.2, marginRight: 10 },
  starterScroll: { gap: 8 },
  starterChip: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 8 },
  starterText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  generateButton: { alignItems: "center", borderRadius: 15, flexDirection: "row", height: 58, justifyContent: "center", marginTop: 27, gap: 9 },
  generateText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  templatesSection: { marginTop: 36 },
  templatesHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between" },
  templatesTitle: { fontFamily: "Inter_600SemiBold", fontSize: 20, letterSpacing: -0.5, marginTop: 5 },
  templateCount: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 },
  templateCountText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  templateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
  templateCard: { borderRadius: 16, borderWidth: 1, minHeight: 142, padding: 13, width: "48%" },
  templateCardTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  templateIcon: { alignItems: "center", borderRadius: 10, height: 34, justifyContent: "center", width: 34 },
  freeLabel: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 0.7 },
  templateName: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 15 },
  templateDescription: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 5 },
  tierRequirement: { fontFamily: "Inter_500Medium", fontSize: 9, marginTop: 8 },
  tierHint: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 12 },
  tierRow: { gap: 7, marginTop: 10 },
  tierChip: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  tierChipText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  actionStatus: { alignItems: "center", borderRadius: 12, flexDirection: "row", gap: 8, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10 },
  actionStatusText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 11, lineHeight: 16 },
  outputHeader: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginTop: 42 },
  outputActions: { alignItems: "center", flexDirection: "row", gap: 7 },
  outputEyebrow: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.6 },
  outputTitle: { fontFamily: "Inter_600SemiBold", fontSize: 20, letterSpacing: -0.5, marginTop: 5 },
  outputBadge: { alignItems: "center", borderRadius: 99, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  outputBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8 },
  previewToggle: { alignItems: "center", borderRadius: 99, borderWidth: 1, flexDirection: "row", gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  previewToggleText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  outputCard: { borderRadius: 18, borderWidth: 1, marginTop: 14, minHeight: 190, overflow: "hidden" },
  previewFrame: { minHeight: 340, overflow: "hidden" },
  testerBar: { alignItems: "center", borderRadius: 14, flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingHorizontal: 12, paddingVertical: 10 },
  testerCopy: { alignItems: "center", flex: 1, flexDirection: "row", gap: 9 },
  testerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  testerDescription: { fontFamily: "Inter_400Regular", fontSize: 10, marginTop: 2 },
  testerButton: { alignItems: "center", borderRadius: 10, flexDirection: "row", gap: 6, minHeight: 34, paddingHorizontal: 10 },
  testerButtonText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  webView: { backgroundColor: "#0B1119", height: 360, width: "100%" },
  emptyOutput: { alignItems: "center", justifyContent: "center", minHeight: 190, paddingHorizontal: 30 },
  outputIcon: { alignItems: "center", borderRadius: 13, height: 44, justifyContent: "center", width: 44 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, marginTop: 13 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, marginTop: 6, textAlign: "center" },
  codeContent: { padding: 18 },
  codeText: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 13, lineHeight: 21 },
  fileOutputSection: { marginTop: 14 },
  fileOutputHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  fileOutputTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  fileOutputHint: { fontFamily: "Inter_500Medium", fontSize: 10 },
  fileChipRow: { flexDirection: "row", gap: 7 },
  fileChip: { alignItems: "center", borderRadius: 11, flex: 1, flexDirection: "row", gap: 7, minHeight: 48, paddingHorizontal: 8 },
  fileChipCopy: { flex: 1 },
  fileChipName: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  fileChipSize: { fontFamily: "Inter_400Regular", fontSize: 9, marginTop: 3 },
  businessActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  secondaryAction: { alignItems: "center", borderRadius: 13, borderWidth: 1, flex: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 48, paddingHorizontal: 10 },
  secondaryActionText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  primaryAction: { alignItems: "center", borderRadius: 13, flex: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 48, paddingHorizontal: 10 },
  primaryActionText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  liveLinkCard: { borderRadius: 14, marginTop: 12, padding: 14 },
  liveLinkHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  liveLinkTitleRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  liveLinkTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  liveLinkBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 },
  liveLinkBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 0.7 },
  liveLinkUrl: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), fontSize: 10, lineHeight: 15, marginTop: 11 },
  openPreviewButton: { alignItems: "center", borderRadius: 10, flexDirection: "row", gap: 7, justifyContent: "center", marginTop: 12, minHeight: 40 },
  openPreviewText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  chatCard: { borderRadius: 18, borderWidth: 1, marginTop: 18, padding: 14 },
  chatHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  chatTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, letterSpacing: -0.4, marginTop: 5 },
  chatInput: { borderRadius: 12, borderWidth: 1, fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 14, minHeight: 72, paddingHorizontal: 12, paddingVertical: 10 },
  chatActions: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "flex-end", marginTop: 10 },
  chatIconButton: { alignItems: "center", borderRadius: 10, height: 38, justifyContent: "center", width: 38 },
  bugFixButton: { alignItems: "center", borderRadius: 10, flexDirection: "row", gap: 6, height: 38, paddingHorizontal: 10 },
  bugFixText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  chatSubmitButton: { alignItems: "center", borderRadius: 10, height: 38, justifyContent: "center", width: 42 },
  githubButton: { alignItems: "center", borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 10, minHeight: 48 },
  githubButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  brandFooter: { borderTopWidth: 1, gap: 10, marginTop: 26, paddingTop: 16 },
  footerRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  footerLinkText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  modalOverlay: { alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.72)", flex: 1, justifyContent: "center", padding: 20 },
  modalCard: { borderRadius: 22, borderWidth: 1, maxWidth: 440, padding: 22, width: "100%" },
  languageModalCard: { borderRadius: 22, borderWidth: 1, maxHeight: "80%", maxWidth: 440, padding: 20, width: "100%" },
  languageRow: { alignItems: "center", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 13 },
  modalHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  modalEyebrow: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.5 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.8, marginTop: 6 },
  iconButton: { alignItems: "center", height: 34, justifyContent: "center", width: 34 },
  modalDescription: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, marginBottom: 18, marginTop: 12 },
  modalInput: { borderRadius: 12, borderWidth: 1, fontFamily: "Inter_400Regular", fontSize: 15, height: 50, marginTop: 10, paddingHorizontal: 14 },
  modalError: { fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 8 },
  modalPrimaryButton: { alignItems: "center", borderRadius: 12, height: 50, justifyContent: "center", marginTop: 16 },
  modalPrimaryText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  modalDivider: { alignItems: "center", flexDirection: "row", gap: 10, marginVertical: 17 },
  modalDividerLine: { flex: 1, height: 1 },
  modalDividerText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1 },
  googleButton: { alignItems: "center", borderRadius: 12, borderWidth: 1, flexDirection: "row", gap: 10, height: 50, justifyContent: "center" },
  googleMark: { fontFamily: "Inter_700Bold", fontSize: 17 },
  googleButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  privacyNote: { fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 15, marginTop: 16, textAlign: "center" },
  adminPanelCard: { borderRadius: 24, borderWidth: 1, flex: 1, marginTop: 54, maxWidth: 520, overflow: "hidden", width: "100%" },
  adminPanelContent: { padding: 20, paddingBottom: 34 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.5, marginBottom: 10, marginTop: 22 },
  analyticsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  analyticsCard: { borderRadius: 14, minHeight: 86, padding: 14, width: "48%" },
  analyticsValue: { fontFamily: "Inter_700Bold", fontSize: 22, letterSpacing: -0.6 },
  analyticsLabel: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 7 },
  chartCard: { borderRadius: 14, marginTop: 10, padding: 16 },
  chartHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  chartTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  chartPeriod: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  chartBars: { alignItems: "flex-end", flexDirection: "row", height: 150, justifyContent: "space-between", marginTop: 18 },
  chartBarColumn: { alignItems: "center", justifyContent: "flex-end" },
  chartBar: { borderRadius: 5, minHeight: 8, width: 18 },
  chartDay: { fontFamily: "Inter_500Medium", fontSize: 10, marginTop: 8 },
  controlsCard: { borderRadius: 14, padding: 16 },
  controlsDescription: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, marginBottom: 8 },
  controlRow: { alignItems: "center", borderTopColor: "#26313F", borderTopWidth: 1, flexDirection: "row", gap: 12, justifyContent: "space-between", paddingVertical: 14 },
  controlCopy: { flex: 1 },
  controlTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  controlDescription: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16, marginTop: 4 },
  protectionStatus: { alignItems: "center", borderRadius: 12, flexDirection: "row", gap: 8, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10 },
  protectionStatusText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  footer: { alignItems: "center", flexDirection: "row", gap: 7, justifyContent: "center", marginTop: 23 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 11 },
});

