/**
 * Loads the Google Maps JavaScript API once per page, on demand (only
 * when a form that needs it is on screen), using Google's documented
 * `loading=async` + callback bootstrap. After it resolves,
 * `google.maps.importLibrary()` is available.
 *
 * Replaces the <gmpx-api-loader> / extended-component-library approach
 * from the snippet Cristian brought: that snippet also relied on the
 * legacy `places.Autocomplete`, which Google closed to new customers in
 * March 2025 — a new key would never get it. This app uses Places API
 * (New)'s PlaceAutocompleteElement instead (see AddressAutocomplete).
 */
let loading: Promise<void> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Google Maps needs a browser."));
  // Typed as always-present by @types/google.maps, but it only exists once the script has loaded.
  const maybeGoogle = (window as unknown as { google?: { maps?: { importLibrary?: unknown } } }).google;
  if (typeof maybeGoogle?.maps?.importLibrary === "function") return Promise.resolve();

  loading ??= new Promise<void>((resolve, reject) => {
    const callbackName = "__cbGoogleMapsReady";
    (window as unknown as Record<string, () => void>)[callbackName] = () => resolve();
    const script = document.createElement("script");
    const params = new URLSearchParams({
      key: apiKey,
      v: "weekly",
      loading: "async",
      language: "es",
      region: "CO",
      callback: callbackName,
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("Google Maps failed to load."));
    };
    document.head.appendChild(script);
  });
  return loading;
}
