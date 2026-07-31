import { Pressable, Text } from "react-native";
import { commonStyles } from "../commonStyles";

export default function Button({
  label,
  onPress,
  disabled,
  variant = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  const buttonStyle = variant === "primary" ? commonStyles.button : commonStyles.secondaryButton;
  const textStyle = variant === "primary" ? commonStyles.buttonText : commonStyles.secondaryButtonText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[buttonStyle, disabled ? commonStyles.buttonDisabled : null]}
    >
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}
