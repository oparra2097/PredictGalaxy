import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { commonStyles } from "../commonStyles";
import { colors } from "../theme";
import { searchSelfTransfer } from "../lib/api";
import type { SelfTransferCombo } from "../lib/types";
import Button from "../components/Button";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLayover(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h ${m}m` : `${h}h ${m}m`;
}

export default function SelfTransferScreen() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [combos, setCombos] = useState<SelfTransferCombo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const data = await searchSelfTransfer({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departDate,
        adults: 1,
      });
      setCombos(data.combos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.scrollContent}>
      <View>
        <Text style={commonStyles.title}>Fly via any hub</Text>
        <Text style={commonStyles.subtitle}>
          Books two separate one-way tickets through a European hub instead
          of one connecting itinerary — often cheaper, and can combine
          airlines that don&apos;t interline.
        </Text>
      </View>

      <View style={commonStyles.form}>
        <TextInput
          placeholder="From (e.g. IST)"
          placeholderTextColor="rgba(229,237,247,0.3)"
          value={origin}
          onChangeText={(t) => setOrigin(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={3}
          style={commonStyles.input}
        />
        <TextInput
          placeholder="Final destination (e.g. JFK)"
          placeholderTextColor="rgba(229,237,247,0.3)"
          value={destination}
          onChangeText={(t) => setDestination(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={3}
          style={commonStyles.input}
        />
        <TextInput
          placeholder="Depart date (YYYY-MM-DD)"
          placeholderTextColor="rgba(229,237,247,0.3)"
          value={departDate}
          onChangeText={setDepartDate}
          style={commonStyles.input}
        />
        <Button
          label={loading ? "Searching…" : "Find hub combos"}
          onPress={handleSearch}
          disabled={loading || !origin || !destination || !departDate}
        />
      </View>

      {error && <Text style={commonStyles.errorText}>{error}</Text>}

      {searched && !loading && (
        combos.length === 0 ? (
          <Text style={commonStyles.dimText}>No valid self-transfer combos found for that route/date.</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {combos.map((combo) => (
              <View key={combo.hub} style={commonStyles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {origin} → {combo.hub} → {destination}
                  </Text>
                  <Text style={{ color: colors.accent, fontWeight: "700", fontSize: 18 }}>
                    ${combo.totalPrice}
                  </Text>
                </View>
                <Text style={{ color: colors.textDim, fontSize: 13 }}>
                  Leg 1: {combo.leg1.airline} · ${combo.leg1.price} · {formatTime(combo.leg1.departAt)} →{" "}
                  {formatTime(combo.leg1.arriveAt)}
                </Text>
                <Text style={{ color: colors.textDim, fontSize: 13 }}>
                  Leg 2: {combo.leg2.airline} · ${combo.leg2.price} · {formatTime(combo.leg2.departAt)} →{" "}
                  {formatTime(combo.leg2.arriveAt)}
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  <View style={commonStyles.chip}>
                    <Text style={commonStyles.chipText}>
                      Layover: {formatLayover(combo.layoverMinutes)}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: "rgba(251,191,36,0.2)", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: "#fcd34d", fontSize: 11 }}>
                      Self-transfer — no missed-connection protection
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )
      )}
    </ScrollView>
  );
}
