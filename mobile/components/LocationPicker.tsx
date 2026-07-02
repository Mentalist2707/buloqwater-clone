/**
 * LocationPicker — xaritadan lokatsiya tanlash (Leaflet + OpenStreetMap).
 * ────────────────────────────────────────────────────────────
 * Foydalanuvchi pin'ni surib yoki xaritaga bosib kerakli joyni
 * belgilaydi. "Mening joylashuvim" tugmasi joriy GPS'ga markazlaydi.
 * API kaliti talab qilinmaydi (OSM tayllari).
 */
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { theme, spacing, radius, fontSize, fontWeight, shadow } from "@/constants/theme";

const DEFAULT = { lat: 41.311081, lon: 69.240562 }; // Toshkent markazi

interface Props {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  onClose: () => void;
  onSelect: (coords: { latitude: number; longitude: number }) => void;
}

function buildHtml(lat: number, lon: number): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;padding:0}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var lat=${lat}, lon=${lon};
  var map=L.map('map',{zoomControl:true}).setView([lat,lon],16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:''}).addTo(map);
  var marker=L.marker([lat,lon],{draggable:true}).addTo(map);
  function send(){var p=marker.getLatLng();if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify({lat:p.lat,lng:p.lng}));}}
  marker.on('dragend',send);
  map.on('click',function(e){marker.setLatLng(e.latlng);send();});
  window.setPoint=function(la,ln){marker.setLatLng([la,ln]);map.setView([la,ln],16);send();};
  send();
</script></body></html>`;
}

export default function LocationPicker({ initialLatitude, initialLongitude, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const [selected, setSelected] = useState({
    lat: initialLatitude ?? DEFAULT.lat,
    lon: initialLongitude ?? DEFAULT.lon,
  });
  const [locating, setLocating] = useState(false);
  const [ready, setReady] = useState(false);

  // Boshlang'ich koordinata yo'q bo'lsa — joriy joyга markazlash
  useEffect(() => {
    if (initialLatitude == null || initialLongitude == null) {
      (async () => {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const c = { lat: loc.coords.latitude, lon: loc.coords.longitude };
            setSelected(c);
            webRef.current?.injectJavaScript(`window.setPoint(${c.lat},${c.lon});true;`);
          }
        } catch {}
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const locateMe = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const c = { lat: loc.coords.latitude, lon: loc.coords.longitude };
      setSelected(c);
      webRef.current?.injectJavaScript(`window.setPoint(${c.lat},${c.lon});true;`);
    } catch {}
    setLocating(false);
  };

  const confirm = () => {
    onSelect({ latitude: selected.lat, longitude: selected.lon });
    onClose();
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html: buildHtml(selected.lat, selected.lon) }}
        style={{ flex: 1 }}
        onLoadEnd={() => setReady(true)}
        onMessage={(e) => {
          try {
            const d = JSON.parse(e.nativeEvent.data);
            if (typeof d.lat === "number" && typeof d.lng === "number") {
              setSelected({ lat: d.lat, lon: d.lng });
            }
          } catch {}
        }}
      />

      {!ready && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Xarita yuklanmoqda...</Text>
        </View>
      )}

      {/* Yuqori panel */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={onClose} activeOpacity={0.8}>
          <Feather name="x" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.hintPill}>
          <Feather name="map-pin" size={13} color={theme.primaryDark} />
          <Text style={styles.hintText}>Pin'ni suring yoki xaritaga bosing</Text>
        </View>
      </View>

      {/* Joylashuvim tugmasi */}
      <TouchableOpacity
        style={[styles.locateBtn, { bottom: insets.bottom + 120 }]}
        onPress={locateMe}
        activeOpacity={0.85}
      >
        {locating ? (
          <ActivityIndicator size="small" color={theme.primaryDark} />
        ) : (
          <Ionicons name="locate" size={22} color={theme.primaryDark} />
        )}
      </TouchableOpacity>

      {/* Pastki tasdiqlash paneli */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.coordsRow}>
          <Feather name="navigation" size={14} color={theme.textSecondary} />
          <Text style={styles.coordsText}>
            {selected.lat.toFixed(6)}, {selected.lon.toFixed(6)}
          </Text>
        </View>
        <TouchableOpacity style={styles.confirmBtn} onPress={confirm} activeOpacity={0.9}>
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.confirmText}>Shu joyni tanlash</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.bg, zIndex: 1000 },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg, gap: spacing.md },
  loadingText: { fontSize: fontSize.base, color: theme.textSecondary, fontWeight: fontWeight.medium },

  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.md,
  },
  hintPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.surface,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    ...shadow.sm,
  },
  hintText: { fontSize: fontSize.sm, color: theme.text, fontWeight: fontWeight.semibold },

  locateBtn: {
    position: "absolute",
    right: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.md,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.surface,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.md,
    ...shadow.lg,
  },
  coordsRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  coordsText: { fontSize: fontSize.sm, color: theme.textSecondary, fontWeight: fontWeight.semibold },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: theme.primary,
  },
  confirmText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: "#fff" },
});
