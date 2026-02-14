import React, { Suspense, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

// 3D Engine Tools
import { Canvas, useFrame } from '@react-three/fiber/native';
import { ContactShadows, Environment, useGLTF } from '@react-three/drei/native';
import { useAssets } from 'expo-asset';

/**
 * THE MODEL COMPONENT
 * This is the "actor" on your stage.
 */
function Model({ url }: { url: string }) {
  // useGLTF: Unpacks the .glb file. Think of this as "unzipping" the 3D data.
  const { scene } = useGLTF(url);

  // useRef: A "pointer" to the model. We need this to rotate it without 
  // triggering a slow React re-render 60 times a second.
  const modelRef = useRef<any>(null); 

  // useFrame: The "Game Loop." Anything inside here runs every single frame.
  useFrame(() => {
    if (modelRef.current) {
      // Rotate the model slightly on the Y-axis (vertical axis)
      modelRef.current.rotation.y += 0.01;
    }
  });

  /**
   * <primitive />: This takes the "scene" we loaded and puts it in the world.
   * scale: 1.2 -> Since you only saw feet, we shrunk it from 2.5 to fit better.
   * position: [X, Y, Z] -> [Left/Right, Up/Down, Forward/Back]
   * [0, -1.5, 0] moves the model's center down, showing more of the top.
   */
  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      scale={.01} 
      position={[0, -2, 0]} 
    />
  );
}

/**
 * THE MAIN VIEWER
 * This is the "Theater" that contains the stage and lights.
 */
export default function DatiViewer() {
  // useAssets: This tells the phone to grab the file from your assets folder.
  // The 'require' path must use '../' to navigate out of your current folders.
  const [assets, error] = useAssets([require('../../assets/miku_chibi.glb')]);

  // If the file can't be found, this prevents the whole app from crashing.
  if (error) {
    console.log("Model loading error:", error);
  }

  return (
    <View style={styles.container}>
      {/* Suspense: While the model (which is heavy) is loading, show a spinner. */}
      <Suspense fallback={<ActivityIndicator size="large" color="#7CF205" />}>
        
        {/* Only render the Canvas if the assets array is filled. */}
        {assets ? (
          /**
           * <Canvas />: The 3D Universe.
           * camera: [0, 1.5, 8] -> Move the camera UP 1.5 units and BACK 8 units.
           * fov: 40 -> Field of View. Like a zoom lens. Lower = more zoomed in.
           */
          <Canvas camera={{ position: [0, 1.5, 8], fov: 40 }}>
            
            {/* ambientLight: Soft light coming from everywhere so it's not pitch black. */}
            <ambientLight intensity={1.0} />
            
            {/* pointLight: Like a lightbulb in the room to add highlights. */}
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            
            {/* The actual model we defined above. */}
            <Model url={assets[0].localUri || assets[0].uri} />

            {/* Environment: Adds realistic reflections from a "city" background. */}
            <Environment preset="city" />
            
            {/* ContactShadows: Paints a fake shadow on the floor to make it look grounded. */}
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
    height: 400, // Explicit height is required for the 3D world to exist!
    width: '100%',
    backgroundColor: 'transparent',
  },
});