import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import * as THREE from "three";

const RADIUS = 1.02;

interface CrystalProps {
  progress: React.MutableRefObject<number>;
  motion: boolean;
}

function Studio() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const key = useRef<THREE.PointLight>(null);
  const aim = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      aim.current.x = event.clientX / window.innerWidth - 0.5;
      aim.current.y = event.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useLayoutEffect(() => {
    RectAreaLightUniformsLib.init();
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;
    const pmrem = new THREE.PMREMGenerator(gl);
    const studio = new THREE.Scene();
    const room = new THREE.Mesh(
      new THREE.BoxGeometry(18, 12, 18),
      new THREE.MeshStandardMaterial({ color: "#2a221b", roughness: 1, side: THREE.BackSide }),
    );
    studio.add(room);
    const addCard = (
      color: string,
      intensity: number,
      width: number,
      height: number,
      position: [number, number, number],
      rotationY: number,
    ) => {
      const card = new THREE.Mesh(
        new THREE.PlaneGeometry(width, height),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: intensity,
          roughness: 1,
          side: THREE.DoubleSide,
        }),
      );
      card.position.set(...position);
      card.rotation.y = rotationY;
      studio.add(card);
    };
    addCard("#fff4e4", 7, 7, 1.5, [0, 3.6, -5.5], 0);
    addCard("#ffb15c", 5, 1.8, 4.4, [5.6, 0.3, -0.6], -0.8);
    addCard("#d5e4ff", 3.4, 1.6, 3.6, [-5.7, 1.2, 0.8], 0.7);
    addCard("#ffffff", 9, 0.7, 0.7, [1.4, 1.6, 5], Math.PI);
    const texture = pmrem.fromScene(studio, 0.04).texture;
    scene.environment = texture;
    scene.environmentIntensity = 1.35;
    return () => {
      scene.environment = null;
      texture.dispose();
      pmrem.dispose();
      studio.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
    };
  }, [gl, scene]);

  useFrame(() => {
    const light = key.current;
    if (!light) return;
    light.position.x += (aim.current.x * 3.2 - light.position.x) * 0.08;
    light.position.y += (1.35 - aim.current.y * 1.6 - light.position.y) * 0.08;
  });

  return (
    <>
      <hemisphereLight args={["#f3e2c8", "#2a2118", 0.35]} />
      <directionalLight position={[3.4, 5.2, 2.4]} intensity={2.4} color="#fff6ea" />
      <directionalLight position={[-4.2, 1.4, -2.8]} intensity={1.3} color="#c5d7f2" />
      <pointLight ref={key} position={[0.2, 1.2, 2.5]} intensity={160} distance={9} decay={2} color="#fff1df" />
      <rectAreaLight position={[2.8, 2.6, 2.4]} rotation={[-0.55, 0.4, 0]} width={3.4} height={1.15} intensity={28} color="#fff3e4" />
      <rectAreaLight position={[-2.6, 0.4, -1.8]} rotation={[0.2, -0.9, 0]} width={1.2} height={2.8} intensity={14} color="#9eb6d8" />
    </>
  );
}

function buildSolid() {
  const shell = new THREE.TetrahedronGeometry(RADIUS, 0);
  const core = new THREE.TetrahedronGeometry(RADIUS * 0.58, 0);
  const edges = new THREE.EdgesGeometry(shell);
  const positions = edges.getAttribute("position");
  const tubes: THREE.TubeGeometry[] = [];
  for (let index = 0; index < positions.count; index += 2) {
    const start = new THREE.Vector3().fromBufferAttribute(positions, index);
    const end = new THREE.Vector3().fromBufferAttribute(positions, index + 1);
    tubes.push(new THREE.TubeGeometry(new THREE.LineCurve3(start, end), 1, 0.028, 16, false));
  }
  const frame = mergeGeometries(tubes, false);
  tubes.forEach((tube) => tube.dispose());
  edges.dispose();
  const unique: THREE.Vector3[] = [];
  const shellPosition = shell.getAttribute("position");
  for (let index = 0; index < shellPosition.count; index += 1) {
    const next = new THREE.Vector3().fromBufferAttribute(shellPosition, index);
    if (!unique.some((item) => item.distanceTo(next) < 1e-4)) unique.push(next);
  }
  return { shell, core, frame, corners: unique };
}

export function Crystal({ progress, motion }: CrystalProps) {
  const group = useRef<THREE.Group>(null);
  const aim = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const place = useRef(0);
  const drag = useRef({ active: false, x: 0, y: 0, yaw: 0, pitch: 0 });
  const endDrag = useRef<(() => void) | null>(null);
  const solid = useMemo(buildSolid, []);

  useEffect(() => {
    return () => {
      endDrag.current?.();
      solid.shell.dispose();
      solid.core.dispose();
      solid.frame?.dispose();
    };
  }, [solid]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      aim.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      aim.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 900px)");
    const apply = () => {
      place.current = query.matches ? 0.92 : 0;
      const node = group.current;
      if (node && !motion) node.position.x = place.current;
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [motion]);

  useFrame((state, delta) => {
    const node = group.current;
    if (!node) return;
    if (!motion) {
      node.position.x = place.current;
      node.rotation.x = 0.72 + drag.current.pitch;
      node.rotation.y = 0.85 + drag.current.yaw;
      return;
    }
    const step = Math.min(delta, 0.05);
    const scroll = progress.current;
    const idle = state.clock.elapsedTime * 0.12 * (1 - Math.min(1, scroll * 5));
    const hover = drag.current.active ? 0 : 1;
    const targetY = idle + 0.85 + scroll * Math.PI * 1.85 + aim.current.x * 0.72 * hover + drag.current.yaw;
    const targetX = 0.72 + scroll * 0.22 + aim.current.y * -0.38 * hover + drag.current.pitch;
    const stiffness = 6.4;
    const damping = 2.4;
    velocity.current.y += (targetY - node.rotation.y) * stiffness * step;
    velocity.current.x += (targetX - node.rotation.x) * stiffness * step;
    const decay = Math.exp(-damping * step);
    velocity.current.x *= decay;
    velocity.current.y *= decay;
    node.rotation.x += velocity.current.x * step;
    node.rotation.y += velocity.current.y * step;
    node.position.x += (place.current - node.position.x) * Math.min(1, step * 3);
    node.position.y = 0.16 + Math.sin(state.clock.elapsedTime * 0.55) * 0.028;
  });

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const pointer = event.nativeEvent;
    drag.current.active = true;
    drag.current.x = pointer.clientX;
    drag.current.y = pointer.clientY;
    const move = (next: PointerEvent) => {
      drag.current.yaw += (next.clientX - drag.current.x) * 0.01;
      drag.current.pitch += (next.clientY - drag.current.y) * 0.008;
      drag.current.pitch = Math.max(-1.15, Math.min(1.15, drag.current.pitch));
      drag.current.x = next.clientX;
      drag.current.y = next.clientY;
    };
    const up = () => {
      drag.current.active = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      endDrag.current = null;
    };
    endDrag.current = up;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    document.body.style.cursor = "grabbing";
  };

  return (
    <>
      <Studio />
      <group
        ref={group}
        position={[0, 0.16, 0]}
        rotation={[0.72, 0.85, 0.08]}
        onPointerDown={onPointerDown}
        onPointerOver={() => {
          document.body.style.cursor = "grab";
        }}
        onPointerOut={() => {
          if (!drag.current.active) document.body.style.cursor = "";
        }}
      >
        <mesh geometry={solid.core}>
          <meshPhysicalMaterial
            color="#e7d3b4"
            metalness={1}
            roughness={0.16}
            clearcoat={1}
            clearcoatRoughness={0.12}
            anisotropy={0.35}
          />
        </mesh>
        {solid.frame && (
          <mesh geometry={solid.frame}>
            <meshPhysicalMaterial color="#f0d7a2" metalness={1} roughness={0.2} clearcoat={0.7} clearcoatRoughness={0.18} />
          </mesh>
        )}
        <mesh geometry={solid.shell}>
          <meshPhysicalMaterial
            color="#fffaf4"
            metalness={0}
            roughness={0.035}
            transmission={1}
            thickness={1.7}
            ior={1.5}
            dispersion={0.32}
            attenuationColor="#f0c48a"
            attenuationDistance={2.4}
            iridescence={0.85}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[140, 520]}
            clearcoat={1}
            clearcoatRoughness={0.02}
            specularIntensity={1}
          />
        </mesh>
        {solid.corners.map((corner, index) => (
          <mesh key={corner.toArray().join(",")} position={corner}>
            <sphereGeometry args={[index === 0 ? 0.09 : 0.058, 48, 32]} />
            <meshPhysicalMaterial
              color={index === 0 ? "#e4b15a" : "#f6f1ea"}
              metalness={1}
              roughness={index === 0 ? 0.2 : 0.05}
              clearcoat={1}
              clearcoatRoughness={0.04}
            />
          </mesh>
        ))}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.35, -1.62, 0]}>
        <planeGeometry args={[16, 16]} />
        <MeshReflectorMaterial
          mirror={0.78}
          blur={[220, 70]}
          resolution={512}
          mixBlur={0.35}
          mixStrength={1.4}
          roughness={0.28}
          metalness={0.62}
          color="#241c16"
        />
      </mesh>
    </>
  );
}
