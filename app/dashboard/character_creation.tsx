// 1. Grab the original log function
const originalLog = console.log;

// 2. Rewrite it to "filter" out the junk
console.log = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('EXGL: gl.pixelStorei()')) {
    return; // Do nothing, don't print it
  }
  originalLog(...args); // Otherwise, print normally
};

import React, { Suspense } from "react";
import { ActivityIndicator, LogBox, StyleSheet, View } from "react-native";

// 3D Engine Tools
import {
  ContactShadows,
  Environment,
  OrbitControls,
  useGLTF,
} from "@react-three/drei/native";
import { Canvas } from "@react-three/fiber/native";
import { useAssets } from "expo-asset";

// 1. Silence specific warnings
LogBox.ignoreLogs(["EXGL: gl.pixelStorei()"]);

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  return (
    <primitive
      object={scene}
      scale={0.009} // This is correct if your model is huge!
      position={[0, -1.5, 0]}
    />
  );
}

export default function DatiViewer() {
  const [assets, error] = useAssets([require("../../assets/miku_chibi.glb")]);

  if (error) console.log("Model loading error:", error);

  return (
    <View style={styles.container}>
      <Suspense fallback={<ActivityIndicator size="large" color="#7CF205" />}>
        {assets ? (
          <Canvas
            camera={{ position: [0, 1.5, 8], fov: 40 }}
            onCreated={(state) => {
              const _gl = state.gl.getContext();
              const pixelStorei = _gl.pixelStorei.bind(_gl);

              // Rewrite the function to silence the specific Expo/WebGL spam
              _gl.pixelStorei = function (...args) {
                const [parameter] = args;
                // UNPACK_FLIP_Y_WEBGL is the main cause of the log spam
                if (parameter === (_gl.UNPACK_FLIP_Y_WEBGL || 0x9240)) return;
                return pixelStorei(...args);
              };
            }}
          >
            <ambientLight intensity={1.0} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />

            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 1.5}
            />

            {/* Added a key here. This helps React keep the WeakMap stable! */}
            <Model key="miku-chibi" url={assets[0].localUri || assets[0].uri} />

            <Environment preset="city" />

            <ContactShadows
              position={[0, -1.51, 0]} // Just a tiny bit below the feet
              opacity={0.5}
              scale={10}
              blur={2.5}
              far={10}
              /** * frames={1} is the WeakMap fix.
               * It tells the app to bake the shadow ONCE instead of
               * recalculating it every frame, which saves massive RAM.
               */
              frames={1}
            />
          </Canvas>
        ) : null}
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: "100%",
    backgroundColor: "transparent",
  },
});
