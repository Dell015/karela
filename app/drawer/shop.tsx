import { KarelaIcon } from "@/components/icons/KarelaIcon";
import { Button, IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { useBuffs } from "@/services/buffs";
import { GAME_ART } from "@/services/gameArt";
import { errorMessage } from "@/services/rpc";
import {
  buyItem,
  CosmeticSlot,
  equipItem,
  getShopState,
  ShopItem,
  ShopState,
  SLOT_LABEL,
  timeLeft,
} from "@/services/shop";
import { KARELA } from "@/styles/designSystem";
import { Image } from "expo-image";
import { useFocusEffect, useNavigation } from "expo-router";
import { ReactNode, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * The Shop. Everything is bought with Gems earned by playing (runs and civic
 * reports), never with money. Items and prices come from the server
 * (supabase/10_streak_protection_and_shop.sql); purchases are checked there.
 */
export default function ShopScreen() {
  const navigation = useNavigation("/drawer");
  const { profile, reloadProfile } = useAuth();
  const buffs = useBuffs();
  const [state, setState] = useState<ShopState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const gems = Number(profile?.stats?.gems ?? 0);
  const freezes = Number(profile?.stats?.streak_freeze_count ?? 0);

  const load = useCallback(async () => {
    try {
      setState(await getShopState());
      setLoadError(null);
    } catch (e) {
      setLoadError(errorMessage(e));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), reloadProfile()]);
    setRefreshing(false);
  };

  const buy = (item: ShopItem) => {
    if (gems < item.price) {
      Alert.alert(
        "Not enough Gems",
        `${item.name} costs ${item.price} Gems and you have ${gems}. Gems come from runs (5 for every 500 m) and civic reports.`,
      );
      return;
    }
    Alert.alert(`Buy ${item.name}?`, `${item.price} Gems. You'll have ${gems - item.price} left.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: `Buy for ${item.price}`,
        onPress: async () => {
          setBusy(item.id);
          try {
            await buyItem(item.id);
            await Promise.all([load(), reloadProfile()]);
          } catch (e) {
            Alert.alert("Not bought", errorMessage(e));
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const wear = async (slot: CosmeticSlot, itemId: string | null) => {
    setBusy(`wear-${slot}`);
    try {
      await equipItem(slot, itemId);
      await load();
    } catch (e) {
      Alert.alert("Not changed", errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const items = state?.items ?? [];
  const streakItems = items.filter((i) => i.category === "streak");
  const boostItems = items.filter((i) => i.category === "boost");
  const cosmetics = (slot: CosmeticSlot) => items.filter((i) => i.slot === slot);

  /** One line under an item: what state it's in for this user. */
  const statusOf = (item: ShopItem): { text: string; blocked: boolean } | null => {
    if (item.kind === "freeze") {
      const max = item.value.max_held ?? 2;
      return { text: `You hold ${freezes} of ${max}`, blocked: freezes >= max };
    }
    if (item.kind === "repair") {
      return state?.repair_available
        ? { text: `Brings back your ${state.repair_streak}-day streak`, blocked: false }
        : { text: "Only works the day after a single missed day", blocked: true };
    }
    if (item.kind === "boost") {
      const until = state?.boosts[item.id];
      return until ? { text: `On, ${timeLeft(until)}`, blocked: true } : null;
    }
    if (item.kind === "guild_boost") {
      return buffs.guild_id ? null : { text: "For guild members", blocked: true };
    }
    return null;
  };

  return (
    <Screen variant="energy">
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <View style={styles.wallet} accessible accessibilityLabel={`${gems} Gems, ${freezes} Streak Freezes`}>
            <KarelaIcon name="gem" size={22} color={KARELA.vibrant.sky} />
            <Text style={styles.walletNum}>{gems.toLocaleString()}</Text>
            <View style={styles.walletDivider} />
            <KarelaIcon name="freeze" size={20} color={KARELA.vibrant.neonTeal} />
            <Text style={styles.walletNum}>{freezes}</Text>
          </View>
          {/* Right side, like every other screen: the drawer opens from the right. */}
          <IconButton icon="menu" label="Open menu" onPress={() => (navigation as any).openDrawer()} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={KARELA.color.brand} />}
        >
          <Text style={styles.title}>Shop</Text>
          <Text style={styles.lead}>
            Everything here costs <Text style={styles.leadStrong}>Gems you earn by moving</Text> and reporting
            problems in your city. No real money.
          </Text>

          {!state && !loadError && <ActivityIndicator color={KARELA.color.brand} style={{ marginTop: 40 }} />}
          {loadError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{loadError}</Text>
              <Button label="Try again" variant="secondary" size="sm" onPress={load} />
            </View>
          )}

          {state && (
            <>
              <Section icon="streak" title="Keep your streak">
                {streakItems.map((item) => (
                  <ItemRow key={item.id} item={item} status={statusOf(item)} busy={busy === item.id} onBuy={() => buy(item)} />
                ))}
              </Section>

              <Section icon="boost" title="Boosts">
                {boostItems.map((item) => (
                  <ItemRow key={item.id} item={item} status={statusOf(item)} busy={busy === item.id} onBuy={() => buy(item)} />
                ))}
              </Section>

              {(["trail", "frame"] as CosmeticSlot[]).map((slot) => (
                <View key={slot} style={styles.section}>
                  <View style={styles.sectionHead}>
                    <KarelaIcon name={slot} size={20} color={KARELA.color.brand} />
                    <Text style={styles.sectionTitle} accessibilityRole="header">
                      {SLOT_LABEL[slot]}
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tiles}>
                    <CosmeticTile
                      name={slot === "trail" ? "Lime" : "Karela"}
                      note="Default"
                      art={null}
                      worn={!state.equipped[slot]}
                      owned
                      busy={busy === `wear-${slot}`}
                      onPress={() => wear(slot, null)}
                    />
                    {cosmetics(slot).map((item) => {
                      const owned = state.owned.includes(item.id);
                      return (
                        <CosmeticTile
                          key={item.id}
                          name={item.name.replace(/ (trail|frame)$/, "")}
                          note={item.rarity === "rare" ? "Rare" : undefined}
                          art={GAME_ART[item.id]}
                          price={owned ? undefined : item.price}
                          owned={owned}
                          worn={state.equipped[slot] === item.id}
                          busy={busy === item.id || busy === `wear-${slot}`}
                          onPress={() => (owned ? wear(slot, item.id) : buy(item))}
                        />
                      );
                    })}
                  </ScrollView>
                </View>
              ))}

              <Text style={styles.footnote}>
                Trails and frames only change how things look. They never give anyone an edge.
              </Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const Section = ({ icon, title, children }: { icon: "streak" | "boost"; title: string; children: ReactNode }) => (
  <View style={styles.section}>
    <View style={styles.sectionHead}>
      <KarelaIcon name={icon} size={20} color={KARELA.color.brand} />
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
    </View>
    {children}
  </View>
);

const ItemRow = ({
  item,
  status,
  busy,
  onBuy,
}: {
  item: ShopItem;
  status: { text: string; blocked: boolean } | null;
  busy: boolean;
  onBuy: () => void;
}) => (
  <View style={styles.row}>
    <Image source={GAME_ART[item.id]} style={styles.rowArt} contentFit="contain" accessibilityIgnoresInvertColors />
    <View style={{ flex: 1 }}>
      <Text style={styles.rowName}>{item.name}</Text>
      <Text style={styles.rowDesc}>{item.description}</Text>
      {status && <Text style={[styles.rowStatus, status.blocked && styles.rowStatusMuted]}>{status.text}</Text>}
    </View>
    <Pressable
      onPress={onBuy}
      disabled={busy || !!status?.blocked}
      accessibilityRole="button"
      accessibilityLabel={`Buy ${item.name} for ${item.price} Gems`}
      accessibilityState={{ disabled: busy || !!status?.blocked, busy }}
      style={({ pressed }) => [styles.price, (busy || status?.blocked) && styles.priceOff, pressed && { opacity: 0.8 }]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={KARELA.color.onBright} />
      ) : (
        <>
          <KarelaIcon name="gem" size={16} color={KARELA.color.onBright} accent={KARELA.color.onBright} fillOpacity={0.15} />
          <Text style={styles.priceText}>{item.price}</Text>
        </>
      )}
    </Pressable>
  </View>
);

const CosmeticTile = ({
  name,
  note,
  art,
  price,
  owned,
  worn,
  busy,
  onPress,
}: {
  name: string;
  note?: string;
  art: (typeof GAME_ART)[string] | null;
  price?: number;
  owned: boolean;
  worn: boolean;
  busy: boolean;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    disabled={busy || worn}
    accessibilityRole="button"
    accessibilityLabel={worn ? `${name}, wearing` : owned ? `Wear ${name}` : `Buy ${name} for ${price} Gems`}
    accessibilityState={{ selected: worn, disabled: busy }}
    style={({ pressed }) => [styles.tile, worn && styles.tileWorn, pressed && { opacity: 0.85 }]}
  >
    {art ? (
      <Image source={art} style={styles.tileArt} contentFit="contain" accessibilityIgnoresInvertColors />
    ) : (
      <View style={[styles.tileArt, styles.tileDefault]}>
        <View style={styles.tileDefaultDot} />
      </View>
    )}
    <Text style={styles.tileName}>{name}</Text>
    {worn ? (
      <Text style={styles.tileWornText}>Wearing</Text>
    ) : owned ? (
      <Text style={styles.tileOwned}>Wear</Text>
    ) : (
      <View style={styles.tilePrice}>
        <KarelaIcon name="gem" size={13} color={KARELA.vibrant.sky} />
        <Text style={styles.tilePriceText}>{price}</Text>
      </View>
    )}
    {note && !worn && <Text style={styles.tileNote}>{note}</Text>}
  </Pressable>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: KARELA.space.xl,
    paddingVertical: KARELA.space.md,
  },
  wallet: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.sm,
    backgroundColor: KARELA.color.surface,
    borderRadius: KARELA.radius.pill,
    paddingHorizontal: KARELA.space.lg,
    minHeight: 40,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  walletNum: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  walletDivider: { width: 1, height: 18, backgroundColor: KARELA.color.line, marginHorizontal: KARELA.space.xs },
  scroll: { paddingHorizontal: KARELA.space.xl, paddingBottom: 140 },
  title: { color: KARELA.color.textPrimary, fontSize: KARELA.size.display, fontFamily: KARELA.font.black, marginTop: KARELA.space.sm },
  lead: {
    color: KARELA.color.textSecondary,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.regular,
    lineHeight: 22,
    marginTop: KARELA.space.sm,
  },
  leadStrong: { color: KARELA.color.brand, fontFamily: KARELA.font.bold },
  errorBox: { marginTop: KARELA.space.xxl, gap: KARELA.space.md, alignItems: "flex-start" },
  errorText: { color: KARELA.color.textSecondary, fontSize: KARELA.size.body, fontFamily: KARELA.font.regular, lineHeight: 22 },

  section: { marginTop: KARELA.space.xxl },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: KARELA.space.sm, marginBottom: KARELA.space.sm },
  sectionTitle: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h2, fontFamily: KARELA.font.bold },

  // Rows separated by rules, not boxed cards.
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: KARELA.space.md,
    paddingVertical: KARELA.space.md,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.lineSoft,
  },
  rowArt: { width: 64, height: 64 },
  rowName: { color: KARELA.color.textPrimary, fontSize: KARELA.size.body, fontFamily: KARELA.font.bold },
  rowDesc: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
    lineHeight: 17,
    marginTop: 2,
  },
  rowStatus: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, marginTop: KARELA.space.xs },
  rowStatusMuted: { color: KARELA.color.textMuted },
  price: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 72,
    minHeight: KARELA.tap,
    paddingHorizontal: KARELA.space.md,
    justifyContent: "center",
    borderRadius: KARELA.radius.pill,
    backgroundColor: KARELA.color.brand,
  },
  priceOff: { backgroundColor: KARELA.color.surfaceSoft },
  priceText: { color: KARELA.color.onBright, fontSize: KARELA.size.body, fontFamily: KARELA.font.black },

  tiles: { gap: KARELA.space.md, paddingRight: KARELA.space.xl },
  tile: {
    width: 112,
    alignItems: "center",
    paddingVertical: KARELA.space.md,
    paddingHorizontal: KARELA.space.sm,
    borderRadius: KARELA.radius.md,
    backgroundColor: KARELA.color.surface,
    borderWidth: 1,
    borderColor: KARELA.color.lineSoft,
  },
  tileWorn: { borderColor: KARELA.color.brand, backgroundColor: KARELA.color.surfaceAlt },
  tileArt: { width: 72, height: 72 },
  tileDefault: { justifyContent: "center", alignItems: "center" },
  tileDefaultDot: { width: 40, height: 6, borderRadius: 3, backgroundColor: KARELA.color.brand },
  tileName: { color: KARELA.color.textPrimary, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold, marginTop: KARELA.space.xs },
  tileWornText: { color: KARELA.color.brand, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, marginTop: 2 },
  tileOwned: { color: KARELA.color.textSecondary, fontSize: KARELA.size.label, fontFamily: KARELA.font.medium, marginTop: 2 },
  tilePrice: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  tilePriceText: { color: KARELA.vibrant.sky, fontSize: KARELA.size.label, fontFamily: KARELA.font.bold },
  tileNote: { color: KARELA.color.gold, fontSize: KARELA.size.caption, fontFamily: KARELA.font.medium, marginTop: 2 },

  footnote: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
    lineHeight: 18,
    marginTop: KARELA.space.xxl,
  },
});
