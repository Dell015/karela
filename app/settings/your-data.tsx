import { IconButton } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { KARELA } from "@/styles/designSystem";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

/**
 * Plain-language summary of what Karela stores and sends. Every line must
 * match what the code does today (checked 2026-10-08):
 *   - routes: services/database/sqlite (phone only); run_history and
 *     run_summaries hold no coordinates
 *   - Gemini: services/ai/aiService.ts and app/drawer/ai_coach.tsx prompts
 *   - reports: civic_reports readable by signed-in users, civic-photos bucket public
 *   - squads/guilds: karela_public_member() in 11_squads.sql (name, username,
 *     photo, frame, level, streak); territory: services/territory.ts sends
 *     only (landmark, km)
 * Update this screen whenever one of those changes.
 */

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Your route stays on your phone",
    body: [
      "The GPS trail of each run is saved only on this phone, so your ghost can learn from it. Your account gets the distance, time, calories and XP of a run, not the route.",
      "Inside a Privacy Zone, the route isn't saved at all.",
      "If you're in a guild, your phone works out how far you ran inside each landmark's circle and sends only that distance, never the route.",
    ],
  },
  {
    title: "What your squad and guild see",
    body: [
      "People in your squad or guild see your display name, username, profile photo, level and streak. They don't see your email, your body details, your runs or where you are.",
    ],
  },
  {
    title: "Civic reports are shared on purpose",
    body: [
      "A report is meant to be seen. Other Karela users can see its photo, its category and where it is, so neighbours can confirm it and local governments can act on it.",
    ],
  },
  {
    title: "What Ani sends to Google Gemini",
    body: [
      "Ani's replies and quests are written by Google's Gemini AI. To fit them to you, Karela sends what she needs: your display name, level, weight and age, your notes for Ani, short summaries of recent runs, and what you type to her.",
      "Karela doesn't send your email address or your routes.",
    ],
  },
  {
    title: "Ani is a coach, not a doctor",
    body: [
      "Ani gives general wellness tips. She can't diagnose anything, and her advice isn't a substitute for a doctor's.",
    ],
  },
  {
    title: "Your rights",
    body: [
      "Karela is designed around the Data Privacy Act of 2012 (RA 10173). In Settings you can download everything your account holds, and delete your account and all of it, at any time.",
      "You can turn any permission off in your phone settings at any time. A feature that needs it, like run tracking, will ask again when you use it.",
    ],
  },
];

export default function YourDataScreen() {
  const router = useRouter();

  return (
    <Screen variant="calm" glow={false}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Your data</Text>
        <View style={{ width: KARELA.tap }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lead}>How Karela handles your data, in plain words.</Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.title} accessibilityRole="header">
              {s.title}
            </Text>
            {s.body.map((p, i) => (
              <Text key={i} style={styles.body}>
                {p}
              </Text>
            ))}
          </View>
        ))}
        <Text style={styles.note}>A full privacy policy is coming before the public launch.</Text>
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
    color: KARELA.color.textSecondary,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.regular,
    lineHeight: 22,
  },
  section: {
    marginTop: KARELA.space.xl,
    paddingTop: KARELA.space.xl,
    borderTopWidth: 1,
    borderTopColor: KARELA.color.lineSoft,
  },
  title: {
    color: KARELA.color.textPrimary,
    fontSize: KARELA.size.h2,
    fontFamily: KARELA.font.bold,
    marginBottom: KARELA.space.sm,
  },
  body: {
    color: KARELA.color.textSecondary,
    fontSize: KARELA.size.body,
    fontFamily: KARELA.font.regular,
    lineHeight: 23,
    marginTop: KARELA.space.sm,
  },
  note: {
    color: KARELA.color.textMuted,
    fontSize: KARELA.size.label,
    fontFamily: KARELA.font.regular,
    marginTop: KARELA.space.xxl,
  },
});
