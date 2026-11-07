import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";

interface CrystalProps {
  progress: React.MutableRefObject<number>;
  motion: boolean;
}

export function Crystal({ progress, motion }: CrystalProps) {
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const aim = useRef({ x: 0, y: 0 });
  const corners = useMemo(() => {
    const geometry = new THREE.TetrahedronGeometry(1.12, 0);
    const position = geometry.getAttribute("position");
    const found: [number, number, number][] = [];
    for (let index = 0; index < position.count; index += 1) {
      const next: [number, number, number] = [
        position.getX(index),
        position.getY(index),
        position.getZ(index),
      ];
      const known = found.some(
        (item) => Math.hypot(item[0] - next[0], item[1] - next[1], item[2] - next[2]) < 1e-4,
      );
      if (!known) found.push(next);
    }
    geometry.dispose();
    return found;
  }, []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      aim.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      aim.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node || !motion) return;
    pointer.current.x += (aim.current.x - pointer.current.x) * Math.min(1, delta * 2.4);
    pointer.current.y += (aim.current.y - pointer.current.y) * Math.min(1, delta * 2.4);
    const scroll = progress.current;
    const idle = state.clock.elapsedTime * 0.12 * (1 - Math.min(1, scroll * 5));
    const targetY = idle + scroll * Math.PI * 1.7 + pointer.current.x * 0.42;
    const targetX = 0.36 + scroll * 0.5 + pointer.current.y * -0.26;
    node.rotation.y = THREE.MathUtils.damp(node.rotation.y, targetY, 4, delta);
    node.rotation.x = THREE.MathUtils.damp(node.rotation.x, targetX, 4, delta);
  });

  return (
    <group ref={group} position={[-0.12, -0.05, 0]} rotation={[0.42, 0.62, 0]}>
      <mesh>
        <tetrahedronGeometry args={[1.12, 0]} />
        <meshBasicMaterial color="#3f8fbe" transparent opacity={0.92} />
        <Edges color="#d7ecf8" threshold={1} />
      </mesh>
      {corners.map((corner, index) => (
        <mesh key={corner.join(",")} position={corner}>
          <sphereGeometry args={[index === 0 ? 0.078 : 0.048, 20, 20]} />
          <meshBasicMaterial color={index === 0 ? "#e4b15a" : "#f4f8fc"} />
        </mesh>
      ))}
    </group>
  );
}
