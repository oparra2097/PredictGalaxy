import { StyleSheet } from "react-native";
import { colors } from "./theme";

export const commonStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textDim,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  form: {
    backgroundColor: colors.panel,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  input: {
    backgroundColor: colors.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.bg,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: colors.chipBg,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 13,
  },
  chip: {
    backgroundColor: colors.chipBg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    color: colors.textDim,
    fontSize: 11,
  },
  errorText: {
    color: colors.danger,
  },
  dimText: {
    color: colors.textDim,
  },
});
