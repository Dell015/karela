/**
 * 6. STYLES — Karela Design System
 */

import { StyleSheet } from "react-native";
import { KARELA } from "./designSystem";

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: KARELA.color.bg,
  },
  title: { 
    fontSize: KARELA.size.h1, 
    fontFamily: KARELA.font.bold,
    marginBottom: KARELA.space.xl,
    color: KARELA.color.textPrimary,
  },
  statsBox: { 
    backgroundColor: KARELA.color.surface, 
    padding: KARELA.space.xl, 
    borderRadius: KARELA.radius.md, 
    width: "85%", 
    ...KARELA.glow.soft,
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginVertical: 5,
    color: KARELA.color.textSecondary,
    fontFamily: KARELA.font.regular,
  },
  button: { 
    paddingVertical: 18, 
    borderRadius: KARELA.radius.xl, 
    width: "80%", 
    alignItems: "center",
  },
  startBtn: { backgroundColor: KARELA.color.brand },
  stopBtn: { backgroundColor: KARELA.color.danger },
  buttonText: { 
    color: KARELA.color.textPrimary, 
    fontSize: KARELA.size.h2, 
    fontFamily: KARELA.font.bold,
    letterSpacing: 1,
  },
  loadBtn: {
    marginTop: 10,
    backgroundColor: KARELA.color.brand,
    paddingVertical: 18, 
    borderRadius: KARELA.radius.xl, 
    width: "80%", 
    alignItems: "center",
  },

  btnText: {
    color: KARELA.color.textPrimary, 
    fontSize: KARELA.size.h2, 
    fontFamily: KARELA.font.bold,
    letterSpacing: 1,
  },
});
