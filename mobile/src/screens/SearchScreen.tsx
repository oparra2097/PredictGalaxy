import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { commonStyles } from "../commonStyles";
import { searchFlights, trackRoute, type SearchParams } from "../lib/api";
import type { ScoredFlightOffer } from "../lib/types";
import Button from "../components/Button";
import FlightOfferCard from "../components/FlightOfferCard";

export default function SearchScreen() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [offers, setOffers] = useState<ScoredFlightOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearch, setLastSearch] = useState<SearchParams | null>(null);
  const [tracking, setTracking] = useState(false);
  const [trackedMessage, setTrackedMessage] = useState<string | null>(null);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setTrackedMessage(null);
    try {
      const values: SearchParams = {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departDate,
        returnDate: returnDate || undefined,
        adults: 1,
      };
      const data = await searchFlights(values);
      setOffers(data.offers || []);
      setLastSearch(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleTrack() {
    if (!lastSearch) return;
    setTracking(true);
    setTrackedMessage(null);
    try {
      await trackRoute(lastSearch);
      setTrackedMessage("Tracking started — check the Tracked tab to collect prices over time.");
    } catch (err) {
      setTrackedMessage(err instanceof Error ? err.message : "Failed to track route");
    } finally {
      setTracking(false);
    }
  }

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.scrollContent}>
      <View>
        <Text style={commonStyles.title}>OdysseySky</Text>
        <Text style={commonStyles.subtitle}>
          Ad-free flight search across airline data.
        </Text>
      </View>

      <View style={commonStyles.form}>
        <TextInput
          placeholder="From (e.g. JFK)"
          placeholderTextColor="rgba(229,237,247,0.3)"
          value={origin}
          onChangeText={(t) => setOrigin(t.toUpperCase())}
          autoCapitalize="characters"
          maxLength={3}
          style={commonStyles.input}
        />
        <TextInput
          placeholder="To (e.g. LIS)"
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
        <TextInput
          placeholder="Return date (optional)"
          placeholderTextColor="rgba(229,237,247,0.3)"
          value={returnDate}
          onChangeText={setReturnDate}
          style={commonStyles.input}
        />
        <Button
          label={loading ? "Searching…" : "Find deals"}
          onPress={handleSearch}
          disabled={loading || !origin || !destination || !departDate}
        />
      </View>

      {error && <Text style={commonStyles.errorText}>{error}</Text>}

      {hasSearched && !loading && (
        <View style={{ gap: 8 }}>
          {offers.length === 0 ? (
            <Text style={commonStyles.dimText}>No flights found for that search.</Text>
          ) : (
            <>
              {offers.map((offer) => (
                <FlightOfferCard key={offer.id} offer={offer} />
              ))}
              <Button
                label={tracking ? "Tracking…" : "Track this route for price-drop alerts"}
                onPress={handleTrack}
                disabled={tracking}
                variant="secondary"
              />
              {trackedMessage && <Text style={{ color: "#34d399" }}>{trackedMessage}</Text>}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}
