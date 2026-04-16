import React, { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

// Define the type for the GLTF result to satisfy TypeScript
type GLTFResult = {
  nodes: any;
  materials: any;
  animations: THREE.AnimationClip[];
};

function Model({ currentAction }: { currentAction: string }) {
  // FIX 1: Add the type to useRef so useAnimations is happy
  const group = useRef<THREE.Group>(null);
  
  // FIX 2: Explicitly cast the result of useGLTF
  const { nodes, animations } = useGLTF(require('@/assets/test_3dmodel/female_final.glb')) as unknown as GLTFResult;
  
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // FIX 3: Check if action exists to prevent the 'undefined' error
    const action = actions[currentAction];
    if (action) {
      action.reset().fadeIn(0.5).play();
      return () => {
        action.fadeOut(0.5);
      };
    }
  }, [currentAction, actions]);

  return (
    // FIX 4: Ensure the ref is attached to a group
    <group ref={group} dispose={null} scale={2.5} position={[0, -2.5, 0]}>
      {/* Ensure nodes.Female_rig matches your Blender name exactly */}
      <primitive object={nodes.Female_rig} />
    </group>
  );
}

export default function AniView({ action = "female_IDLE" }) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} />
      <Model currentAction={action} />
    </Canvas>
  );
}