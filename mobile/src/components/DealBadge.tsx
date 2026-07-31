import { Text, View } from "react-native";
import type { DealLabel } from "../lib/types";

const LABEL_STYLES: Record<DealLabel, { bg: string; text: string }> = {
  "best-deal": { bg: "#34d399", text: "#0b1220" },
  great: { bg: "rgba(52,211,153,0.2)", text: "#6ee7b7" },
  good: { bg: "rgba(56,189,248,0.2)", text: "#7dd3fc" },
  average: { bg: "rgba(255,255,255,0.1)", text: "rgba(229,237,247,0.7)" },
  high: { bg: "rgba(251,191,36,0.2)", text: "#fcd34d" },
};

const LABEL_TEXT: Record<DealLabel, string> = {
  "best-deal": "Best deal",
  great: "Great price",
  good: "Good price",
  average: "Average",
  high: "Above average",
};

export default function DealBadge({ label }: { label: DealLabel }) {
  const style = LABEL_STYLES[label];
  return (
    <View style={{ backgroundColor: style.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color: style.text, fontSize: 11, fontWeight: "600" }}>{LABEL_TEXT[label]}</Text>
    </View>
  );
}
