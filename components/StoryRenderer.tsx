import React from "react";
import { View, Text, StyleSheet, Image, ViewStyle } from "react-native";
import { StoryBlock } from "../types";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface StoryRendererProps {
  blocks: StoryBlock[];
  style?: ViewStyle;
}

export const StoryRenderer: React.FC<StoryRendererProps> = ({ blocks, style }) => {
  if (!blocks || blocks.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <Text key={index} style={[styles.heading, typography.storyH1]}>
                {block.text}
              </Text>
            );

          case "paragraph":
            return (
              <Text key={index} style={[styles.paragraph, typography.storyBody]}>
                {block.text}
              </Text>
            );

          case "stat":
            return (
              <View key={index} style={styles.statBox}>
                <Text style={[styles.statValue, typography.storyHero]}>
                  {block.value}
                </Text>
                {block.label && (
                  <Text style={[styles.statLabel, typography.uiCaption]}>
                    {block.label}
                  </Text>
                )}
              </View>
            );

          case "image":
            return (
              <View key={index} style={styles.imageBlock}>
                {block.url && (
                  <Image
                    source={{ uri: block.url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                )}
                {(block.caption || block.credit) && (
                  <View style={styles.captionContainer}>
                    {block.caption && (
                      <Text style={[styles.caption, typography.uiCaption]}>
                        {block.caption}
                      </Text>
                    )}
                    {block.credit && (
                      <Text style={[styles.credit, typography.uiMicro]}>
                        Source / Photo: {block.credit}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );

          case "quote":
            return (
              <View key={index} style={styles.quoteBlock}>
                <Text style={[styles.quoteText, typography.storyBodyMedium]}>
                  "{block.text}"
                </Text>
                {block.label && (
                  <Text style={[styles.quoteAuthor, typography.uiCaption]}>
                    — {block.label}
                  </Text>
                )}
              </View>
            );

          default:
            return null;
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.s8,
  },
  heading: {
    color: colors.textPrimary,
    marginTop: spacing.s24,
    marginBottom: spacing.s12,
  },
  paragraph: {
    color: colors.textSecondary,
    marginBottom: spacing.s16,
    lineHeight: 26,
  },
  statBox: {
    backgroundColor: colors.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: spacing.s16,
    borderRadius: spacing.radiusInput,
    marginVertical: spacing.s16,
  },
  statValue: {
    color: colors.primary,
    marginBottom: spacing.s4,
  },
  statLabel: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  imageBlock: {
    marginVertical: spacing.s16,
    borderRadius: spacing.radiusCard,
    overflow: "hidden",
    backgroundColor: colors.slate100,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  image: {
    width: "100%",
    height: 220,
  },
  captionContainer: {
    padding: spacing.s12,
    backgroundColor: colors.surface,
  },
  caption: {
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  credit: {
    color: colors.textMuted,
    marginTop: spacing.s4,
  },
  quoteBlock: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingLeft: spacing.s16,
    paddingVertical: spacing.s8,
    marginVertical: spacing.s16,
    backgroundColor: colors.accentLight,
    borderRadius: spacing.radiusInput,
  },
  quoteText: {
    color: colors.textPrimary,
    fontStyle: "italic",
  },
  quoteAuthor: {
    color: colors.accentHover,
    marginTop: spacing.s4,
    fontWeight: "600",
  },
});
