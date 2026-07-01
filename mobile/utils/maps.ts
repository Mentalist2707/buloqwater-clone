/**
 * Xarita yordamchisi — mijoz lokatsiyasini ishonchli ochish.
 * ────────────────────────────────────────────────────────────
 * Muammo: saqlangan havola ko'pincha Google Maps ko'rinishida
 * (https://www.google.com/maps?q=lat,lon) bo'ladi va uni boshqa
 * xarita ilovasi (Yandex) to'g'ri ochmasligi mumkin.
 *
 * Yechim: koordinatani ajratib olamiz va foydalanuvchiga qaysi
 * xaritada ochishni tanlatamiz (Yandex yoki Google). Har biri o'z
 * formatidagi koordinatali havola bilan aniq nuqtani ochadi.
 */
import { Linking } from "react-native";
import { Alert } from "@/utils/alert";

/** Havoladan lat,lon koordinatasini ajratib olish (Google `q=lat,lon` uslubi). */
export function extractCoords(link?: string | null): { lat: number; lon: number } | null {
  if (!link) return null;
  const q = link.match(/[?&](?:q|query|text|daddr)=(-?\d{1,3}\.\d+)\s*[,%2C\s]+\s*(-?\d{1,3}\.\d+)/i);
  if (q) return { lat: parseFloat(q[1]), lon: parseFloat(q[2]) };
  const any = link.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (any) return { lat: parseFloat(any[1]), lon: parseFloat(any[2]) };
  return null;
}

interface LocationInput {
  locationLink?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

// Yandex Maps: ll va pt = "lon,lat" tartibida (koordinata teskari!)
function yandexUrl(lat: number, lon: number) {
  return `https://yandex.uz/maps/?ll=${lon}%2C${lat}&z=17&pt=${lon}%2C${lat},pm2rdm`;
}
function yandexText(text: string) {
  return `https://yandex.uz/maps/?text=${encodeURIComponent(text)}`;
}
// Google Maps: query = "lat,lon"
function googleUrl(lat: number, lon: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lon}`;
}
function googleText(text: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
}

function open(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert("Xatolik", "Xarita ilovasini ochib bo'lmadi");
  });
}

/**
 * Mijoz lokatsiyasini ochish — Yandex yoki Google tanlovi bilan.
 * @returns true — lokatsiya bor va tanlov ko'rsatildi, false — lokatsiya yo'q.
 */
export function openLocation(opts: LocationInput): boolean {
  let lat = opts.latitude ?? null;
  let lon = opts.longitude ?? null;

  if (lat == null || lon == null) {
    const c = extractCoords(opts.locationLink);
    if (c) {
      lat = c.lat;
      lon = c.lon;
    }
  }

  const hasCoords = lat != null && lon != null;
  const hasAddress = !!(opts.address && opts.address.trim() && opts.address !== "Manzil kiritilmagan");

  if (!hasCoords && !hasAddress && !opts.locationLink) return false;

  const yUrl = hasCoords ? yandexUrl(lat!, lon!) : hasAddress ? yandexText(opts.address!) : opts.locationLink!;
  const gUrl = hasCoords ? googleUrl(lat!, lon!) : hasAddress ? googleText(opts.address!) : opts.locationLink!;

  Alert.alert("Xaritani tanlang", "Manzilni qaysi xaritada ochamiz?", [
    { text: "Yandex Maps", onPress: () => open(yUrl) },
    { text: "Google Maps", onPress: () => open(gUrl) },
    { text: "Bekor", style: "cancel" },
  ]);
  return true;
}
