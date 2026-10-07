import { KARELA } from "@/styles/designSystem";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

interface AvatarProps {
  /** profiles.profile_picture; falls back to the first letter of `name`. */
  uri?: string | null;
  name?: string | null;
  size?: number;
  /** Karela gradient ring around the picture. */
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The user's profile picture, or their initial when there is none. */
export const Avatar = ({ uri, name, size = 56, ring, style }: AvatarProps) => {
  // A broken or deleted URL falls back to the initial instead of a blank circle.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showPhoto = !!uri && failedUri !== uri;
  const initial = (name || "K").trim().charAt(0).toUpperCase() || "K";
  const ringWidth = ring ? 3 : 0;
  const inner = size - ringWidth * 2;

  const face = (
    <View
      style={[
        s.inner,
        { width: inner, height: inner, borderRadius: inner / 2 },
        !ring && s.border,
      ]}
    >
      {showPhoto ? (
        <Image
          source={{ uri: uri! }}
          style={{ width: inner, height: inner, borderRadius: inner / 2 }}
          contentFit="cover"
          cachePolicy="disk"
          transition={150}
          onError={() => setFailedUri(uri!)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={[s.initial, { fontSize: Math.round(inner * 0.4) }]}>{initial}</Text>
      )}
    </View>
  );

  return (
    <View
      style={[{ width: size, height: size }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={showPhoto ? `Profile photo of ${name || "you"}` : `${name || "Your"} initial`}
    >
      {ring ? (
        <LinearGradient
          colors={KARELA.gradients.brand}
          style={{ width: size, height: size, borderRadius: size / 2, padding: ringWidth }}
        >
          {face}
        </LinearGradient>
      ) : (
        face
      )}
    </View>
  );
};

const s = StyleSheet.create({
  inner: {
    backgroundColor: KARELA.color.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  border: { borderWidth: 1, borderColor: KARELA.color.line },
  initial: { color: KARELA.color.brand, fontFamily: KARELA.font.black },
});
