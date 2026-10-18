import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface TextFieldProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  maxLength?: number;
  showCharCount?: boolean;
  containerStyle?: ViewStyle;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  helperText,
  errorMessage,
  maxLength,
  showCharCount = false,
  containerStyle,
  value,
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const currentLength = (value || "").length;
  const isOverLimit = maxLength ? currentLength > maxLength : false;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label and Character Count Row */}
      {(label || (showCharCount && maxLength)) && (
        <View style={styles.headerRow}>
          {label ? (
            <Text style={[styles.label, typography.uiH3]}>{label}</Text>
          ) : <View />}
          {showCharCount && maxLength && (
            <Text
              style={[
                styles.charCount,
                typography.uiMicro,
                isOverLimit && styles.charCountOver,
              ]}
            >
              {currentLength}/{maxLength}
            </Text>
          )}
        </View>
      )}

      {/* Input Field */}
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          isFocused && styles.inputFocused,
          Boolean(errorMessage) && styles.inputError,
          style,
        ]}
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />

      {/* Error Message or Helper Text */}
      {errorMessage ? (
        <View style={styles.feedbackRow}>
          <Ionicons name="alert-circle" size={14} color={colors.error} />
          <Text style={[styles.errorText, typography.uiMicro]}>{errorMessage}</Text>
        </View>
      ) : helperText ? (
        <Text style={[styles.helperText, typography.uiMicro]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.s16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.s4,
  },
  label: {
    color: colors.textPrimary,
  },
  charCount: {
    color: colors.textMuted,
  },
  charCountOver: {
    color: colors.error,
    fontWeight: "700",
  },
  input: {
    minHeight: spacing.minTouchTarget, // 44px
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: spacing.radiusInput,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s12,
    fontSize: 16, // Minimum 16px to prevent zoom
    color: colors.textPrimary,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: spacing.s12,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.error,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.s4,
    gap: spacing.s4,
  },
  errorText: {
    color: colors.error,
  },
  helperText: {
    color: colors.textMuted,
    marginTop: spacing.s4,
  },
});
