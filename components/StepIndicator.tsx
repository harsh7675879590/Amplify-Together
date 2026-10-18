import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface StepIndicatorProps {
  currentStep: number;
}

const STEPS = [
  { step: 1, label: "Basics" },
  { step: 2, label: "Story" },
  { step: 3, label: "Visuals" },
  { step: 4, label: "Reach" },
  { step: 5, label: "Submit" },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((s, idx) => {
          const isCompleted = s.step < currentStep;
          const isActive = s.step === currentStep;

          return (
            <React.Fragment key={s.step}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isActive && styles.circleActive,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color={colors.white} />
                  ) : (
                    <Text
                      style={[
                        styles.stepNum,
                        typography.micro,
                        isActive && styles.stepNumActive,
                      ]}
                    >
                      {s.step}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.label,
                    typography.micro,
                    isActive && styles.labelActive,
                    isCompleted && styles.labelCompleted,
                  ]}
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
              </View>

              {idx < STEPS.length - 1 && (
                <View
                  style={[
                    styles.line,
                    s.step < currentStep && styles.lineCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate200,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    width: 52,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.slate100,
    borderWidth: 1,
    borderColor: colors.slate300,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  circleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  circleCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepNum: {
    color: colors.slate500,
  },
  stepNumActive: {
    color: colors.white,
    fontWeight: "700",
  },
  label: {
    color: colors.slate400,
    fontSize: 10,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  labelCompleted: {
    color: colors.slate700,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.slate200,
    marginHorizontal: 2,
    marginBottom: 16,
  },
  lineCompleted: {
    backgroundColor: colors.success,
  },
});
