import { TextStyle } from "react-native";

export const typography = {
  hero: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800" as TextStyle["fontWeight"],
  },
  h1: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700" as TextStyle["fontWeight"],
  },
  h2: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as TextStyle["fontWeight"],
  },
  h3: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600" as TextStyle["fontWeight"],
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as TextStyle["fontWeight"],
  },
  bodyMedium: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500" as TextStyle["fontWeight"],
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500" as TextStyle["fontWeight"],
  },
  micro: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600" as TextStyle["fontWeight"],
  },
};
