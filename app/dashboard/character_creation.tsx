import React, { Suspense } from 'react';
import { ActivityIndicator, LogBox, StyleSheet, View } from 'react-native';

// 3D Engine Tools
import { ContactShadows, Environment, OrbitControls, useGLTF } from '@react-three/drei/native';
import { Canvas } from '@react-three/fiber/native';
import { useAssets } from 'expo-asset';

// Silence the "pixelStorei" spam logs
LogBox.ignoreLogs(['EXGL: gl.pixelStorei()']);

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);

  return (
    <primitive 
      object={scene} 
      scale={0.009} // Adjusted back to a visible size
      position={[0, -1.5, 0]} 
    />
  );
}

export default function DatiViewer() {
  const [assets, error] = useAssets([require('../../assets/miku_chibi.glb')]);

  if (error) console.log("Model loading error:", error);

  return (
    <View style={styles.container}>
      <Suspense fallback={<ActivityIndicator size="large" color="#7CF205" />}>
        {assets ? (
          <Canvas camera={{ position: [0, 1.5, 8], fov: 40 }}>
            <ambientLight intensity={1.0} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            
            {/* OrbitControls adds the swipe-to-rotate!
                enablePan={false} stops the user from sliding her off-screen.
                minPolarAngle/maxPolarAngle prevents them from looking under the floor.
            */}
            <OrbitControls 
              enablePan={false} 
              enableZoom={true} 
              minPolarAngle={Math.PI / 4} 
              maxPolarAngle={Math.PI / 1.5} 
            />

            <Model url={assets[0].localUri || assets[0].uri} />

            <Environment preset="city" />
            
            <ContactShadows 
              position={[0, -1.5, 0]} 
              opacity={0.5} 
              scale={10} 
              blur={2.5} 
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
    width: '100%',
    backgroundColor: 'transparent',
  },
});