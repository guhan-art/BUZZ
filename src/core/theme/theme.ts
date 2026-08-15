export const Fonts = {
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  bold: "Outfit_700Bold",
  rounded: "Outfit_500Medium",
  mono: "Courier",
};

export const Colors = {
  light: {
    // We are forcing a dark theme everywhere for the Midnight Glass aesthetic,
    // so we map light properties to our dark palette as well, just in case.
    text: "#F2F2F2",
    background: "#0A0A0C", // Deep Obsidian
    tint: "#E99B16",       // Electric Amber/Gold
    icon: "#8A8A93",
    tabIconDefault: "#8A8A93",
    tabIconSelected: "#E99B16",
    glass: "rgba(255, 255, 255, 0.05)",
    glassBorder: "rgba(255, 255, 255, 0.1)",
  },
  dark: {
    text: "#F2F2F2",
    background: "#0A0A0C", // Deep Obsidian
    tint: "#E99B16",       // Electric Amber/Gold
    icon: "#8A8A93",
    tabIconDefault: "#8A8A93",
    tabIconSelected: "#E99B16",
    glass: "rgba(255, 255, 255, 0.05)",
    glassBorder: "rgba(255, 255, 255, 0.1)",
  },
};
