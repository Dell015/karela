import { KarelaIcon } from "@/components/icons/KarelaIcon";
import { Button, Chip, IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Field, sheet } from "@/components/ui/Sheet";
import {
  MAX_PRIVACY_ZONES,
  PRIVACY_ZONE_RADIUS_M,
  updateLocalSettings,
  useLocalSettings,
} from "@/services/localSettings";
import { PermissionManager } from "@/services/PermissionsManager";
import { KARELA } from "@/styles/designSystem";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

const NAME_IDEAS = ["Home", "School", "Work"];
/** A fix worse than this could put the zone on the wrong house. */
const MAX_ACCURACY_M = 50;

export default function PrivacyZonesScreen() {
  const router = useRouter();
  const local = useLocalSettings();
  const zones = local?.privacyZones ?? [];
  const full = zones.length >= MAX_PRIVACY_ZONES;

  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addHere = async () => {
    const label = name.trim();
    if (!label) return setError("Give the zone a name first, like Home.");
    setError(null);
    setAdding(true);
    try {
      const allowed = await PermissionManager.checkLocationStatus();
      if (!allowed) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          PermissionManager.showDeniedAlert();
          return;
        }
      }
      const fix = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const acc = fix.coords.accuracy ?? Infinity;
      if (acc > MAX_ACCURACY_M) {
        setError(
          `Your location is only accurate to about ${Math.round(acc)} m right now. Step outside or wait a moment, then try again.`,
        );
        return;
      }
      await updateLocalSettings({
        privacyZones: [
          ...zones,
          {
            id: `${Date.now()}`,
            name: label.slice(0, 30),
            latitude: fix.coords.latitude,
            longitude: fix.coords.longitude,
          },
        ],
      });
      setName("");
    } catch (e) {
      console.warn("Privacy zone add failed:", e);
      setError("Couldn't get your location. Check that location is on, then try again.");
    } finally {
      setAdding(false);
    }
  };

  const remove = (id: string, zoneName: string) => {
    Alert.alert(
      `Remove ${zoneName}?`,
      "Runs from now on will save your route near this place again. Runs already saved stay as they are.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () =>
            updateLocalSettings({ privacyZones: zones.filter((z) => z.id !== id) }),
        },
      ],
    );
  };

  return (
    <Screen variant="calm" glow={false}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Privacy Zones</Text>
        <View style={{ width: KARELA.tap }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          Within {PRIVACY_ZONE_RADIUS_M} m of a zone, your route is never saved, not even on this phone.
          Your distance and XP still count.
        </Text>
        <Text style={styles.small}>
          Zones are stored only on this phone. Karela&apos;s servers never learn where they are.
        </Text>

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Your zones ({zones.length} of {MAX_PRIVACY_ZONES})
        </Text>
        {zones.length === 0 ? (
          <Text style={styles.empty}>No zones yet. Add one where you live, so runs that start at home don&apos;t show your door.</Text>
        ) : (
          <View style={styles.list}>
            {zones.map((z, i) => (
              <View key={z.id} style={[styles.zoneRow, i === zones.length - 1 && { borderBottomWidth: 0 }]}>
                <KarelaIcon name="shield" size={20} color={KARELA.color.brand} />
                <Text style={styles.zoneName}>{z.name}</Text>
                <IconButton
                  icon="trash-outline"
                  label={`Remove ${z.name}`}
                  tone="plain"
                  iconColor={KARELA.color.danger}
                  onPress={() => remove(z.id, z.name)}
                />
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Add a zone
        </Text>
        {full ? (
          <Text style={styles.empty}>You have {MAX_PRIVACY_ZONES} zones, the most Karela allows. Remove one to add another.</Text>
        ) : (
          <>
            <Text style={styles.small}>Stand at the place you want to hide, then add it.</Text>
            <Field
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Home"
              maxLength={30}
            />
            <View style={styles.ideas}>
              {NAME_IDEAS.map((n) => (
                <Chip key={n} label={n} selected={name === n} onPress={() => setName(n)} />
              ))}
            </View>
            {error && (
              <Text style={sheet.error} accessibilityLiveRegion="polite">
                {error}
              </Text>
            )}
            <Button
              label="Add my current location"
              icon="locate-outline"
              onPress={addHere}
              loading={adding}
              block
              style={{ marginTop: KARELA.space.xl }}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: KARELA.space.xl,
    paddingTop: 60,
    paddingBottom: KARELA.space.lg,
  },
  headerTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.black },
  content: { paddingHorizontal: KARELA.space.xl, paddingBottom: KARELA.space.xxxl },
  lead: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.medium,
    lineHeight: 22,
  },
  small: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
    lineHeight: 18,
    marginTop: KARELA.space.sm,
  },
  sectionTitle: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.bold,
    marginTop: KARELA.space.xxl,
    marginBottom: KARELA.space.sm,
  },
  empty: {
    color: KARELA.color.textSecondary,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.regular,
    lineHeight: 22,
  },
  list: {
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.md,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  zoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
    paddingLeft: KARELA.space.lg,
    paddingRight: KARELA.space.xs,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.lineSoft,
  },
  zoneName: { flex: 1, color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  ideas: { flexDirection: "row", gap: KARELA.space.sm, marginTop: KARELA.space.md },
});
