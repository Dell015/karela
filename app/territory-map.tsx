import { TerritoryBars } from "@/components/guild/TerritoryBars";
import { KarelaIcon } from "@/components/icons/KarelaIcon";
import { Button, IconButton } from "@/components/ui/Button";
import { useBuffs } from "@/services/buffs";
import { guildColor } from "@/services/guilds";
import { errorMessage } from "@/services/rpc";
import { getTerritories, HOLDER_REASON, LandmarkState } from "@/services/territory";
import { calculateDistance } from "@/services/tracker/geoUtils";
import { KARELA } from "@/styles/designSystem";
import { bayanihanMapStyle, ghostMapStyle } from "@/styles/ghostMapStyle";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Circle, MapPressEvent, Marker } from "react-native-maps";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Territory map: every landmark circle filled in the colour of the guild
 * that holds it, with a legend of who holds what. Tap a circle (or a name in
 * the legend) to see how it was won and this month's km.
 *
 * A screen of its own, not a map inside the Territory tab's scroll view:
 * maps inside scroll views are slow on low-end Android (QA M2).
 */

const UNCLAIMED = KARELA.color.textMuted;
// Tuguegarao City, only used until the landmarks load.
const FALLBACK_REGION = { latitude: 17.6132, longitude: 121.727, latitudeDelta: 0.06, longitudeDelta: 0.06 };

/** The four edge points of a landmark circle, so fitting the map never cuts one off. */
const circleEdges = (l: LandmarkState) => {
  const dLat = l.radius_m / 110574;
  const dLng = l.radius_m / (111320 * Math.cos((l.latitude * Math.PI) / 180));
  return [
    { latitude: l.latitude + dLat, longitude: l.longitude },
    { latitude: l.latitude - dLat, longitude: l.longitude },
    { latitude: l.latitude, longitude: l.longitude + dLng },
    { latitude: l.latitude, longitude: l.longitude - dLng },
  ];
};

export default function TerritoryMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const buffs = useBuffs();
  const mapRef = useRef<MapView>(null);

  const [landmarks, setLandmarks] = useState<LandmarkState[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);

  const fetchLandmarks = useCallback(
    () =>
      getTerritories()
        .then((t) => setLandmarks(t.landmarks))
        .catch((e) => setError(errorMessage(e))),
    [],
  );
  useEffect(() => {
    fetchLandmarks();
  }, [fetchLandmarks]);
  const retry = () => {
    setError(null);
    fetchLandmarks();
  };

  // Fit every circle on screen once the map and the landmarks are both ready,
  // leaving room for the header and the bottom panel.
  const fitted = useRef(false);
  useEffect(() => {
    if (!mapReady || !landmarks?.length || panelHeight === 0 || fitted.current) return;
    fitted.current = true;
    mapRef.current?.fitToCoordinates(landmarks.flatMap(circleEdges), {
      edgePadding: { top: insets.top + 90, bottom: panelHeight + 24, left: 32, right: 32 },
      animated: false,
    });
  }, [mapReady, landmarks, panelHeight, insets.top]);

  const selected = landmarks?.find((l) => l.id === selectedId) ?? null;

  // Legend: one row per guild that holds something, then the unclaimed ones.
  const legend = useMemo(() => {
    const rows = new Map<string, { name: string; color: string; landmarks: LandmarkState[] }>();
    const unclaimed: LandmarkState[] = [];
    for (const l of landmarks ?? []) {
      if (!l.holder.guild_id) {
        unclaimed.push(l);
        continue;
      }
      const row = rows.get(l.holder.guild_id) ?? { name: l.holder.name ?? "Guild", color: guildColor(l.holder.color), landmarks: [] };
      row.landmarks.push(l);
      rows.set(l.holder.guild_id, row);
    }
    const held = [...rows.values()].sort((a, b) => b.landmarks.length - a.landmarks.length || a.name.localeCompare(b.name));
    return { held, unclaimed };
  }, [landmarks]);

  const focus = (l: LandmarkState) => {
    setSelectedId(l.id);
    mapRef.current?.animateToRegion(
      { latitude: l.latitude, longitude: l.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 },
      reduceMotion ? 0 : 400,
    );
  };

  // A tap inside a circle selects it; a tap anywhere else clears the selection.
  // (iPhone also reports taps on a flag here; the flag handles those.)
  const onMapPress = (e: MapPressEvent) => {
    if (e.nativeEvent.action === "marker-press") return;
    const p = e.nativeEvent.coordinate;
    const hit = (landmarks ?? [])
      .map((l) => ({ l, d: calculateDistance(p, l) }))
      .filter(({ l, d }) => d <= l.radius_m)
      .sort((a, b) => a.d - b.d)[0];
    setSelectedId(hit ? hit.l.id : null);
  };

  const holderLine = (l: LandmarkState) =>
    l.holder.guild_id ? `${l.holder.name}, ${HOLDER_REASON[l.holder.reason].toLowerCase()}` : "Unclaimed. Guilds win it by running here.";

  return (
    <View style={s.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        // Same map as the Run screen: Google + dark style on Android, Apple Maps' own dark mode on iPhone.
        provider={Platform.OS === "android" ? "google" : undefined}
        userInterfaceStyle="dark"
        customMapStyle={buffs.guild_map_theme ? bayanihanMapStyle : ghostMapStyle}
        initialRegion={FALLBACK_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onMapReady={() => setMapReady(true)}
        onPress={onMapPress}
      >
        {(landmarks ?? []).map((l) => {
          const held = !!l.holder.guild_id;
          const color = held ? guildColor(l.holder.color) : UNCLAIMED;
          const isSelected = l.id === selectedId;
          return (
            <React.Fragment key={l.id}>
              <Circle
                center={{ latitude: l.latitude, longitude: l.longitude }}
                radius={l.radius_m}
                strokeColor={color}
                strokeWidth={isSelected ? 4 : 2}
                fillColor={held ? `${color}${isSelected ? "66" : "40"}` : "rgba(147,158,143,0.12)"}
                zIndex={isSelected ? 60 : 50}
              />
              <Marker
                coordinate={{ latitude: l.latitude, longitude: l.longitude }}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={false}
                onPress={() => setSelectedId(l.id)}
                accessibilityLabel={`${l.name}. ${holderLine(l)}`}
              >
                <KarelaIcon name="territory" size={28} color={color} />
              </Marker>
            </React.Fragment>
          );
        })}
      </MapView>

      {/* Header */}
      <View style={[s.header, { top: insets.top + KARELA.space.sm }]}>
        <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
        <View style={s.headerText}>
          <Text style={s.title} accessibilityRole="header">
            Territory map
          </Text>
          <Text style={s.subtitle}>Who holds each landmark this month</Text>
        </View>
      </View>

      {/* Bottom panel: the selected landmark, or the legend */}
      <View
        style={[s.panel, { paddingBottom: insets.bottom + KARELA.space.lg }]}
        onLayout={(e) => setPanelHeight(Math.round(e.nativeEvent.layout.height))}
      >
        {error ? (
          <>
            <Text style={s.panelTitle}>Couldn&apos;t load the territory map</Text>
            <Text style={s.muted}>{error}</Text>
            <Button label="Try again" variant="secondary" size="sm" onPress={retry} style={{ marginTop: KARELA.space.md, alignSelf: "flex-start" }} />
          </>
        ) : landmarks === null ? (
          <View style={s.loading}>
            <ActivityIndicator color={KARELA.color.brand} />
            <Text style={s.muted}>Loading landmarks…</Text>
          </View>
        ) : landmarks.length === 0 ? (
          <>
            <Text style={s.panelTitle}>No landmarks yet</Text>
            <Text style={s.muted}>The Karela team adds landmarks around Tuguegarao. They&apos;ll show here once they&apos;re added.</Text>
          </>
        ) : selected ? (
          <>
            <View style={s.selectedHead}>
              <KarelaIcon name="territory" size={24} color={selected.holder.guild_id ? guildColor(selected.holder.color) : UNCLAIMED} />
              <View style={{ flex: 1 }}>
                <Text style={s.panelTitle}>{selected.name}</Text>
                <Text style={[s.holder, { color: selected.holder.guild_id ? guildColor(selected.holder.color) : UNCLAIMED }]}>
                  {holderLine(selected)}
                </Text>
              </View>
              <IconButton icon="close" label="Close" tone="plain" onPress={() => setSelectedId(null)} />
            </View>
            <TerritoryBars monthTop={selected.month_top} />
          </>
        ) : (
          <>
            <Text style={s.panelTitle}>Who holds what</Text>
            {legend.held.map((row) => (
              <View key={row.name} style={s.legendRow}>
                <View style={[s.swatch, { backgroundColor: `${row.color}40`, borderColor: row.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.legendName}>{row.name}</Text>
                  <View style={s.places}>
                    {row.landmarks.map((l) => (
                      <Pressable
                        key={l.id}
                        onPress={() => focus(l)}
                        accessibilityRole="button"
                        accessibilityLabel={`Show ${l.name} on the map`}
                        hitSlop={8}
                      >
                        <Text style={[s.place, { color: row.color }]}>{l.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Text style={s.count}>
                  {row.landmarks.length} {row.landmarks.length === 1 ? "landmark" : "landmarks"}
                </Text>
              </View>
            ))}
            {legend.unclaimed.length > 0 && (
              <View style={s.legendRow}>
                <View style={[s.swatch, { backgroundColor: "rgba(147,158,143,0.12)", borderColor: UNCLAIMED }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.legendName}>Unclaimed</Text>
                  <View style={s.places}>
                    {legend.unclaimed.map((l) => (
                      <Pressable key={l.id} onPress={() => focus(l)} accessibilityRole="button" accessibilityLabel={`Show ${l.name} on the map`} hitSlop={8}>
                        <Text style={[s.place, { color: KARELA.color.textSecondary }]}>{l.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}
            <Text style={[s.muted, { marginTop: KARELA.space.md }]}>Tap a circle to see this month&apos;s km.</Text>
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: KARELA.color.bg },
  header: {
    position: "absolute",
    left: KARELA.space.lg,
    right: KARELA.space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
  },
  headerText: {
    flex: 1,
    paddingVertical: KARELA.space.sm,
    paddingHorizontal: KARELA.space.md,
    borderRadius: KARELA.radius.md,
    backgroundColor: KARELA.color.surface,
    borderWidth: 1,
    borderColor: KARELA.color.line,
  },
  title: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  subtitle: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, marginTop: 2 },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: KARELA.space.lg,
    paddingHorizontal: KARELA.space.lg,
    backgroundColor: KARELA.color.surface,
    borderTopLeftRadius: KARELA.radius.lg,
    borderTopRightRadius: KARELA.radius.lg,
    borderTopWidth: 1,
    borderColor: KARELA.color.line,
  },
  panelTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },
  muted: { color: KARELA.color.textMuted, fontSize: KARELA.size.label, fontFamily: KARELA.font.regular, lineHeight: 18, marginTop: 4 },
  loading: { flexDirection: "row", alignItems: "center", gap: KARELA.space.md, paddingVertical: KARELA.space.sm },
  selectedHead: { flexDirection: "row", alignItems: "center", gap: KARELA.space.md },
  holder: { fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, marginTop: 2 },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
    paddingVertical: KARELA.space.md,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.lineSoft,
  },
  swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  legendName: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  places: { flexDirection: "row", flexWrap: "wrap", columnGap: KARELA.space.md, rowGap: 2, marginTop: 2 },
  place: { fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, textDecorationLine: "underline" },
  count: { color: KARELA.color.textSecondary, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium },
});
