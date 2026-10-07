import { KARELA } from "@/styles/designSystem";
import { Button, Chip } from "@/components/ui/Button";
import React, { useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  interpolate, 
  Extrapolation 
} from 'react-native-reanimated';
import AniView from "@/components/AniModel";
import { dashboard_ui } from "@/styles/dashboardStyle";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const AniConsole = () => {
  const [currentAniAction, setCurrentAniAction] = useState("Female_rig|female_IDLE");
  const aniExpandProgress = useSharedValue(0);

  const animatedAniContainerStyle = useAnimatedStyle(() => ({
    width: interpolate(aniExpandProgress.value, [0, 1], [(SCREEN_WIDTH - 60) / 2, SCREEN_WIDTH]),
    height: interpolate(aniExpandProgress.value, [0, 1], [180, SCREEN_HEIGHT]),
    position: aniExpandProgress.value > 0 ? 'absolute' : 'relative',
    bottom: interpolate(aniExpandProgress.value, [0, 1], [0, -250]), 
    left: interpolate(aniExpandProgress.value, [0, 1], [0, -20]),
    borderRadius: interpolate(aniExpandProgress.value, [0, 1], [15, 0]),
    zIndex: aniExpandProgress.value > 0 ? 10000 : 1,
    backgroundColor: KARELA.color.surfaceAlt,
  }));

  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(aniExpandProgress.value, [0.8, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const toggleConsole = () => {
    aniExpandProgress.value = aniExpandProgress.value === 0 ? withSpring(1) : withTiming(0);
  };

  return (
    <Animated.View style={[dashboard_ui.characterBox, animatedAniContainerStyle, { overflow: 'hidden' }]}>
      <Pressable onPress={toggleConsole} style={{ flex: 1 }}>
        <AniView action={currentAniAction} />

        <Animated.View style={[dashboard_ui.consoleOverlay, animatedControlsStyle]}>
          <Text style={dashboard_ui.consoleTitle}>Ani&apos;s moves</Text>
          <View style={dashboard_ui.btnRow}>
            {['IDLE', 'WALK', 'RUN'].map((mode) => (
              <Chip
                key={mode}
                label={mode.charAt(0) + mode.slice(1).toLowerCase()}
                icon={mode === "IDLE" ? "pause" : mode === "WALK" ? "walk" : "fitness"}
                selected={currentAniAction.includes(mode)}
                onPress={() => setCurrentAniAction(`Female_rig|female_${mode}`)}
              />
            ))}
          </View>
          <Button label="Close" variant="secondary" size="sm" block onPress={toggleConsole} style={{ marginTop: KARELA.space.md }} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};