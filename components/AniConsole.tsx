import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  interpolate, 
  Extrapolation 
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
    backgroundColor: "#161616",
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
          <Text style={dashboard_ui.consoleTitle}>ANI COMMAND CONSOLE</Text>
          <View style={dashboard_ui.btnRow}>
            {['IDLE', 'WALK', 'RUN'].map((mode) => (
              <TouchableOpacity 
                key={mode}
                onPress={() => setCurrentAniAction(`Female_rig|female_${mode}`)}
                style={[dashboard_ui.commandBtn, currentAniAction.includes(mode) && dashboard_ui.commandBtnActive]}
              >
                <MaterialCommunityIcons 
                  name={mode === 'IDLE' ? "pause" : mode === 'WALK' ? "walk" : "run"} 
                  size={24} 
                  color={currentAniAction.includes(mode) ? "#000" : "#7CF205"} 
                />
                <Text style={[dashboard_ui.commandBtnText, currentAniAction.includes(mode) && dashboard_ui.commandBtnTextActive]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={dashboard_ui.closeConsoleBtn} onPress={toggleConsole}>
            <Text style={dashboard_ui.closeConsoleBtnText}>EXIT COMMAND</Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};