import { useAnimations, useGLTF } from "@react-three/drei/native";
import { Canvas, useGraph } from "@react-three/fiber/native";
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

type GLTFResult = {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
};

function CharacterModel({ currentAction }: { currentAction: string }) {
  const group = useRef<THREE.Group>(null);

  const { scene, animations } = useGLTF(
    require("@/assets/test_3dmodel/female_final.glb"),
  ) as unknown as GLTFResult;

  // useGLTF caches one parsed scene for the whole app. A three.js object can
  // only live in one scene, so two <AniView>s sharing it (dashboard + the
  // Customize screen) would steal Ani from each other: going back left the
  // dashboard empty. Each view gets its own copy. SkeletonUtils.clone keeps
  // the skinned mesh bound to its own bones, which a plain .clone() breaks.
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const { nodes, materials } = useGraph(model) as unknown as { nodes: any; materials: any };

  const { actions } = useAnimations(animations, group);

  // Fix for Android "Black Model" - Ensures materials react to scene lighting
  useEffect(() => {
    if (materials) {
      Object.values(materials).forEach((material: any) => {
        if (material) {
          material.roughness = 0.5;
          material.metalness = 0.2;
          material.needsUpdate = true;
        }
      });
    }
  }, [materials]);

  useEffect(() => {
    const action = actions[currentAction];
    if (action) {
      action.reset().fadeIn(0.5).play();
      return () => {
        action.fadeOut(0.5);
      };
    }
  }, [currentAction, actions]);

  return (
    <group ref={group} dispose={null} scale={0.35} position={[0, -1.5, 0]}>
      <primitive object={nodes.Female_rig} />
    </group>
  );
}

interface AniViewProps {
  action?: string;
  /**
   * false pauses rendering (e.g. the screen is hidden behind another one).
   * Saves battery on low-end phones; the model stays loaded.
   */
  active?: boolean;
}

export default function AniView({ action = "Female_rig|female_IDLE", active = true }: AniViewProps) {
  return (
    <Canvas
      camera={{ position: [0, 1, 4.5], fov: 40 }}
      frameloop={active ? "always" : "never"}
      // Note: dpr removed as it is not a valid prop on @react-three/fiber/native
      style={{ backgroundColor: "transparent" }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      <pointLight position={[-5, 2, -2]} intensity={8} color="#7CF205" />
      <pointLight position={[0, -2, 2]} intensity={1} color="#ffffff" />

      <CharacterModel currentAction={action} />
    </Canvas>
  );
}
