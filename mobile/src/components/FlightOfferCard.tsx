import { Linking, Pressable, Text, View } from "react-native";
import { colors } from "../theme";
import type { ScoredFlightOffer } from "../lib/types";
import DealBadge from "./DealBadge";

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function FlightOfferCard({ offer }: { offer: ScoredFlightOffer }) {
  return (
    <View style={{ backgroundColor: colors.panel, borderRadius: 12, padding: 14, gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: colors.text, fontWeight: "700" }}>{offer.airline}</Text>
        <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 18 }}>
          ${offer.price} <Text style={{ color: colors.textDimmer, fontSize: 11 }}>{offer.currency}</Text>
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <DealBadge label={offer.label} />
        <Text style={{ color: colors.textDimmer, fontSize: 11 }}>via {offer.provider}</Text>
      </View>
      <Text style={{ color: colors.textDim, fontSize: 13 }}>
        {offer.origin} → {offer.destination} · {offer.stops === 0 ? "Direct" : `${offer.stops} stop(s)`} ·{" "}
        {formatDuration(offer.durationMinutes)}
      </Text>
      <Pressable onPress={() => Linking.openURL(offer.deepLink)}>
        <Text style={{ color: colors.accent, fontSize: 13, marginTop: 2 }}>View →</Text>
      </Pressable>
    </View>
  );
}
