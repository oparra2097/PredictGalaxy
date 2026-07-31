import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { commonStyles } from "../commonStyles";
import { getApiBaseUrl, setApiBaseUrl } from "../lib/storage";
import { fetchDeals } from "../lib/api";
import Button from "../components/Button";

export default function SettingsScreen() {
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMessage, setTestMessage] = useState<string | null>(null);

  useEffect(() => {
    getApiBaseUrl().then((stored) => {
      if (stored) {
        setUrl(stored);
        setSaved(stored);
      }
    });
  }, []);

  async function handleSave() {
    await setApiBaseUrl(url);
    const normalized = url.trim().replace(/\/+$/, "");
    setSaved(normalized);
    setUrl(normalized);
    setTestStatus("idle");
    setTestMessage(null);
  }

  async function handleTest() {
    setTestStatus("testing");
    setTestMessage(null);
    try {
      await fetchDeals();
      setTestStatus("ok");
    } catch (err) {
      setTestStatus("error");
      setTestMessage(err instanceof Error ? err.message : "Connection failed");
    }
  }

  return (
    <ScrollView style={commonStyles.screen} contentContainerStyle={commonStyles.scrollContent}>
      <View>
        <Text style={commonStyles.title}>Settings</Text>
        <Text style={commonStyles.subtitle}>
          OdysseySky is a client for your own OdysseySky backend — point it at
          wherever that&apos;s deployed (Vercel, Railway, Fly.io, or your
          computer&apos;s local IP while developing).
        </Text>
      </View>

      <View style={commonStyles.form}>
        <Text style={commonStyles.dimText}>Backend URL</Text>
        <TextInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://your-app.vercel.app"
          placeholderTextColor="rgba(229,237,247,0.3)"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={commonStyles.input}
        />
        <Button label="Save" onPress={handleSave} disabled={!url.trim()} />

        {saved && (
          <>
            <Button
              label={testStatus === "testing" ? "Testing…" : "Test connection"}
              onPress={handleTest}
              disabled={testStatus === "testing"}
              variant="secondary"
            />
            {testStatus === "ok" && (
              <Text style={{ color: "#34d399" }}>✓ Connected — backend reachable.</Text>
            )}
            {testStatus === "error" && (
              <Text style={commonStyles.errorText}>✗ {testMessage}</Text>
            )}
          </>
        )}
      </View>

      <Text style={commonStyles.dimText}>
        Running the backend locally with `npm run dev` on your computer? Use
        your computer&apos;s local network IP (e.g. http://192.168.1.20:3000),
        not localhost — your phone can&apos;t reach your computer&apos;s
        localhost over WiFi. Both devices need to be on the same network.
      </Text>
    </ScrollView>
  );
}
