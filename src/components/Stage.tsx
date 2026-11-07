import { useLayoutEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Crystal } from "../scene/Crystal";

gsap.registerPlugin(ScrollTrigger);

const beats = [
  {
    title: "Método simplex",
    copy: "No revisa el interior de la región. Empieza en un vértice factible y, en cada paso, salta a otro vértice que mejora la función objetivo, hasta que ningún vecino la mejora.",
  },
  {
    title: "La figura tiene n+1 vértices",
    copy: "Eso es un símplex. En tres dimensiones es este tetraedro, con cuatro vértices. El ejemplo del informe no vive aquí: tiene dos incógnitas, así que su región factible es un polígono en el plano.",
  },
  {
    title: "El mismo cálculo, otra vez",
    copy: "Entra la columna con el coeficiente más negativo. Sale la fila del menor cociente positivo. El cruce es el pivote: se vuelve 1 y el resto de la columna se vuelve 0. Si la fila ya no tiene negativos, ese vértice es el óptimo.",
  },
];

export function Stage() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [motion, setMotion] = useState(true);

  useLayoutEffect(() => {
    const node = root.current;
    if (!node) return undefined;
    const context = gsap.context(() => {
      const media = gsap.matchMedia();
      media.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
        setMotion(true);
        node.classList.add("is-cinematic");
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: node,
            start: "top top",
            end: "+=190%",
            pin: true,
            scrub: 0.7,
            onUpdate: (self) => {
              progress.current = self.progress;
            },
          },
        });
        timeline
          .to(".beat-0", { autoAlpha: 0, duration: 0.18 }, 0.3)
          .fromTo(".beat-1", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 }, 0.3)
          .to(".beat-1", { autoAlpha: 0, duration: 0.18 }, 0.64)
          .fromTo(".beat-2", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.18 }, 0.64);
        return () => {
          node.classList.remove("is-cinematic");
          progress.current = 0;
        };
      });
      media.add("(prefers-reduced-motion: reduce)", () => {
        setMotion(false);
      });
    }, node);
    const refresh = () => ScrollTrigger.refresh();
    document.fonts.ready.then(refresh).catch(() => undefined);
    return () => context.revert();
  }, []);

  return (
    <section className="stage" ref={root} aria-label="Apertura">
      <div className="beats">
        {beats.map((beat, index) => (
          <article className={`beat beat-${index}`} key={beat.title}>
            {index === 0 ? <h1>{beat.title}</h1> : <h2>{beat.title}</h2>}
            <p>{beat.copy}</p>
          </article>
        ))}
      </div>
      <div className="stage-visual" aria-hidden="true">
        <Canvas
          camera={{ position: [0.2, 0.42, 5.55], fov: 30 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <Crystal progress={progress} motion={motion} />
        </Canvas>
      </div>
    </section>
  );
}
