import { Platform, TextStyle } from "react-native";

const serifFont = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia, serif",
});

const sansFont = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
});

export const typography = {
  // Editorial story headings & article body (Serif)
  storyHero: {
    fontFamily: serifFont,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as TextStyle["fontWeight"],
  },
  storyH1: {
    fontFamily: serifFont,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700" as TextStyle["fontWeight"],
  },
  storyH2: {
    fontFamily: serifFont,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700" as TextStyle["fontWeight"],
  },
  storyBody: {
    fontFamily: serifFont,
    fontSize: 16, // Minimum 16px
    lineHeight: 26, // ~1.5 ratio
    fontWeight: "400" as TextStyle["fontWeight"],
  },
  storyBodyMedium: {
    fontFamily: serifFont,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "600" as TextStyle["fontWeight"],
  },

  // Clean Sans for UI controls, inputs, buttons, headers, and metadata
  uiTitle: {
    fontFamily: sansFont,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700" as TextStyle["fontWeight"],
  },
  uiH2: {
    fontFamily: sansFont,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700" as TextStyle["fontWeight"],
  },
  uiH3: {
    fontFamily: sansFont,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600" as TextStyle["fontWeight"],
  },
  uiBody: {
    fontFamily: sansFont,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as TextStyle["fontWeight"],
  },
  uiBodyMedium: {
    fontFamily: sansFont,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600" as TextStyle["fontWeight"],
  },
  uiCaption: {
    fontFamily: sansFont,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as TextStyle["fontWeight"],
  },
  uiMicro: {
    fontFamily: sansFont,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as TextStyle["fontWeight"],
    letterSpacing: 0.4,
  },
};
