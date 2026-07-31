import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { commonStyles } from "../commonStyles";
import { colors } from "../theme";
import { collectPrices, fetchWatchedRoutes, removeRoute } from "../lib/api";
import type { WatchedRouteWithHistory } from "../lib/types";
import Button from "../components/Button";

export default function TrackedRoutesScreen() {
  const [routes, setRoutes] = useState<WatchedRouteWithHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWatchedRoutes();
      setRoutes(data.routes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tracked routes");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function handleCollect() {
    setCollecting(true);
    try {
      await collectPrices();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Collection failed");
    } finally {
      setCollecting(false);
    }
  }

  async function handleRemove(id: number) {
    await removeRoute(id);
    await refresh();
  }

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.scrollContent}>
      <View>
        <Text style={commonStyles.title}>Tracked routes</Text>
        <Text style={commonStyles.subtitle}>
          Flags a real deal only when a price is a statistical outlier vs.
          that route&apos;s own history — not just today&apos;s cheapest.
        </Text>
      </View>

      <Button
        label={collecting ? "Collecting…" : "Collect prices now"}
        onPress={handleCollect}
        disabled={collecting || routes.length === 0}
        variant="secondary"
      />

      {error && <Text style={commonStyles.errorText}>{error}</Text>}
      {loading && routes.length === 0 && <Text style={commonStyles.dimText}>Loading…</Text>}

      {!loading && routes.length === 0 ? (
        <Text style={commonStyles.dimText}>
          No tracked routes yet. Search a flight, then track it to start
          building its price history.
        </Text>
      ) : (
        <View style={{ gap: 8 }}>
          {routes.map((route) => {
            const latest = route.snapshots[route.snapshots.length - 1];
            return (
              <View key={route.id} style={commonStyles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View>
                    <Text style={{ color: colors.text, fontWeight: "700" }}>
                      {route.origin} → {route.destination}
                    </Text>
                    <Text style={{ color: colors.textDimmer, fontSize: 11 }}>
                      {route.departDate}
                      {route.returnDate ? ` – ${route.returnDate}` : " (one-way)"}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleRemove(route.id)}>
                    <Text style={{ color: colors.textDimmer, fontSize: 12 }}>Remove</Text>
                  </Pressable>
                </View>

                {latest ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 20 }}>
                      ${latest.price}
                    </Text>
                    <Text style={{ color: colors.textDimmer, fontSize: 11 }}>
                      {route.anomaly?.sampleSize ?? 0} prior snapshot(s)
                    </Text>
                    {route.anomaly?.isAnomaly && (
                      <View style={{ backgroundColor: colors.good, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: colors.bg, fontSize: 11, fontWeight: "700" }}>
                          🔥 Deal: {Math.round(route.anomaly.percentBelowMedian * 100)}% below normal
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={{ color: colors.textDimmer, fontSize: 13, marginTop: 4 }}>
                    No price collected yet — tap &quot;Collect prices now&quot;.
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
