import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL_KEY = "odysseysky:apiBaseUrl";

export async function getApiBaseUrl(): Promise<string | null> {
  return AsyncStorage.getItem(API_BASE_URL_KEY);
}

export async function setApiBaseUrl(url: string): Promise<void> {
  // Trim trailing slash so callers can safely do `${base}/api/...`.
  const normalized = url.trim().replace(/\/+$/, "");
  await AsyncStorage.setItem(API_BASE_URL_KEY, normalized);
}
