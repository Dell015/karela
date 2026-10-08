import { GuildTab } from "@/components/guild/GuildTab";
import { g } from "@/components/guild/shared";
import { SquadTab } from "@/components/guild/SquadTab";
import { TerritoryTab } from "@/components/guild/TerritoryTab";
import { KarelaIcon, KarelaIconName } from "@/components/icons/KarelaIcon";
import { Button, IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/context/AuthContext";
import { refreshBuffs } from "@/services/buffs";
import { getMyGuild, GuildState } from "@/services/guilds";
import { errorMessage } from "@/services/rpc";
import { getMySquad, SquadState } from "@/services/squads";
import { getTerritories, TerritoryState } from "@/services/territory";
import { KARELA } from "@/styles/designSystem";
import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "squad" | "guild" | "territory";
const TABS: { id: Tab; label: string; icon: KarelaIconName }[] = [
  { id: "squad", label: "Squad", icon: "squad" },
  { id: "guild", label: "Guild", icon: "guild" },
  { id: "territory", label: "Territory", icon: "territory" },
];

/**
 * Squads, guilds and landmark territory (aboutkarela.md "Squads", "Guilds",
 * "Territory Quest Specification"). All rules run on the server
 * (supabase/11_squads.sql to 13_territory.sql).
 */
export default function GuildsScreen() {
  const navigation = useNavigation("/drawer");
  const { reloadProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("squad");
  const [squad, setSquad] = useState<SquadState | null>(null);
  const [guild, setGuild] = useState<GuildState | null>(null);
  const [territory, setTerritory] = useState<TerritoryState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, gu, t] = await Promise.all([getMySquad(), getMyGuild(), getTerritories()]);
      setSquad(s);
      setGuild(gu);
      setTerritory(t);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
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

  // A squad change can change the guild too (and the reverse), so reload both.
  const onSquadChange = (s: SquadState) => {
    setSquad(s);
    getMyGuild().then(setGuild).catch(() => {});
    refreshBuffs();
    reloadProfile();
  };
  const onGuildChange = (gu: GuildState) => {
    setGuild(gu);
    getMySquad().then(setSquad).catch(() => {});
    getTerritories().then(setTerritory).catch(() => {});
    refreshBuffs();
  };

  const ready = squad && guild && territory;

  return (
    <Screen variant="ember">
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.title}>Squad and guild</Text>
          <IconButton icon="menu" label="Open menu" onPress={() => (navigation as any).openDrawer()} />
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t.label}
                style={[styles.tab, on && styles.tabOn]}
              >
                <KarelaIcon name={t.icon} size={18} color={on ? KARELA.color.brand : KARELA.color.textMuted} />
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={KARELA.color.brand} />}
        >
          {error && (
            <View style={{ marginTop: KARELA.space.xl, gap: KARELA.space.md, alignItems: "flex-start" }}>
              <Text style={g.body}>{error}</Text>
              <Button label="Try again" variant="secondary" size="sm" onPress={load} />
            </View>
          )}
          {!ready && !error && <ActivityIndicator color={KARELA.color.brand} style={{ marginTop: 40 }} />}
          {ready && tab === "squad" && <SquadTab state={squad} onChange={onSquadChange} />}
          {ready && tab === "guild" && <GuildTab state={guild} onChange={onGuildChange} goToSquad={() => setTab("squad")} />}
          {ready && tab === "territory" && <TerritoryTab state={territory} />}
        </ScrollView>
      </SafeAreaView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: KARELA.space.xl,
    paddingTop: KARELA.space.md,
  },
  title: { color: KARELA.color.textPrimary, fontSize: KARELA.size.h1, fontFamily: KARELA.font.black },
  tabs: {
    flexDirection: "row",
    marginHorizontal: KARELA.space.xl,
    marginTop: KARELA.space.lg,
    borderBottomWidth: 1,
    borderBottomColor: KARELA.color.line,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: KARELA.tap,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  tabOn: { borderBottomColor: KARELA.color.brand },
  tabText: { color: KARELA.color.textMuted, fontSize: KARELA.size.body, fontFamily: KARELA.font.medium },
  tabTextOn: { color: KARELA.color.textPrimary, fontFamily: KARELA.font.bold },
  scroll: { paddingHorizontal: KARELA.space.xl, paddingBottom: 140 },
});
