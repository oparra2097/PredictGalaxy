import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { commonStyles } from "../commonStyles";
import { colors } from "../theme";
import { fetchDeals } from "../lib/api";
import type { DealPost } from "../lib/types";

export default function DealsScreen() {
  const [deals, setDeals] = useState<DealPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDeals();
      setDeals(data.deals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load deal feed");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.scrollContent}>
      <View>
        <Text style={commonStyles.title}>Deal blog finds</Text>
        <Text style={commonStyles.subtitle}>
          Latest posts scanned from independent flight-deal blogs.
        </Text>
      </View>

      {error && <Text style={commonStyles.errorText}>{error}</Text>}
      {loading && <Text style={commonStyles.dimText}>Scanning deal blogs…</Text>}

      {!loading && deals.length === 0 && !error && (
        <Text style={commonStyles.dimText}>No deal posts loaded yet.</Text>
      )}

      <View style={{ gap: 8 }}>
        {deals.map((deal) => (
          <Pressable key={deal.id} style={commonStyles.card} onPress={() => Linking.openURL(deal.link)}>
            <Text style={{ color: colors.text, fontWeight: "600" }}>{deal.title}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
              <View style={commonStyles.chip}>
                <Text style={commonStyles.chipText}>{deal.source}</Text>
              </View>
              {deal.route && (
                <View style={commonStyles.chip}>
                  <Text style={commonStyles.chipText}>{deal.route}</Text>
                </View>
              )}
              {deal.price !== null && (
                <View style={{ backgroundColor: "rgba(52,211,153,0.2)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Text style={{ color: colors.good, fontSize: 11 }}>~${deal.price}</Text>
                </View>
              )}
            </View>
            {deal.summary ? (
              <Text style={{ color: colors.textDim, fontSize: 13, marginTop: 2 }}>{deal.summary}</Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
