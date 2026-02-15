import {
  Environment,
  OrbitControls,
  useAnimations,
  useGLTF,
} from "@react-three/drei/native";
import { Canvas } from "@react-three/fiber/native";
import { useAssets } from "expo-asset";
import React, { Suspense, useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

// --- SILENCE THE TERMINAL SPAM ---
const originalLog = console.log;
console.log = (...args) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (msg.includes("pixelStorei") || msg.includes("WeakMap")) return;
  originalLog(...args);
};

function Model({ url }: { url: string }) {
  const { scene, animations } = useGLTF(url);
  const group = useRef<any>(null);
  const { actions, names } = useAnimations(animations, group);

  // LOG 1: Check if animations even exist in the file
  console.log("Total animations found in file:", animations.length);

  useEffect(() => {
    // LOG 2: Check if the 'names' array is populated
    console.log("Current animation names:", names);

    if (names.length > 0 && actions) {
      const activeAnim = names[0]; 
      actions[activeAnim]?.reset().fadeIn(0.5).play();
    }
  }, [actions, names]);

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} scale={0.009} position={[0, -1.5, 0]} />
    </group>
  );
}

export default function DatiViewer() {
  const [assets] = useAssets([require("../../assets/miku_chibi.glb")]);

  return (
    <View style={styles.container}>
      <Suspense fallback={<ActivityIndicator size="large" color="#7CF205" />}>
        {assets ? (
          <Canvas
            camera={{ position: [0, 1.5, 8], fov: 40 }}
            // Fix #2: Tell the renderer to be less aggressive with power management
            gl={{ antialias: false, powerPreference: "high-performance" }}
          >
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} intensity={2.0} />

            <OrbitControls enablePan={false} enableZoom={false} />

            <Model url={assets[0].localUri || assets[0].uri} />

            {/* If it still crashes, try removing Environment temporarily 
                to see if the textures are the culprit. */}
            <Environment preset="city" />
          </Canvas>
        ) : null}
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: "70%", width: "100%" },
});
