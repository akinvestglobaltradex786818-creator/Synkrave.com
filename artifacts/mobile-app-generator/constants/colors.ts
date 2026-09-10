/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const darkPalette = {
  // Legacy aliases (kept for backward compatibility)
  text: '#F4F7FF',
  tint: '#6EE7F9',

  // Core surfaces
  background: '#080A0F',
  foreground: '#F4F7FF',

  // Cards / elevated surfaces
  card: '#11151D',
  cardForeground: '#F4F7FF',

  // Primary action color (buttons, links, active states)
  primary: '#6EE7F9',
  primaryForeground: '#071016',

  // Secondary / less-emphasis interactive surfaces
  secondary: '#19212B',
  secondaryForeground: '#D6E3F0',

  // Muted / subdued elements (dividers, timestamps, placeholders)
  muted: '#151A23',
  mutedForeground: '#8794A6',

  // Accent highlights (badges, selected items, focus rings)
  accent: '#1E2633',
  accentForeground: '#DDFBFF',

  // Destructive actions (delete, error states)
  destructive: '#FF7184',
  destructiveForeground: '#24080D',

  // Borders and input outlines
  border: '#26313F',
  input: '#26313F',
};

const colors = {
  // The app intentionally keeps the same dark product surface in both
  // appearance modes so the generator feels like a focused tool.
  light: darkPalette,
  dark: darkPalette,

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
