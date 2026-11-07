# Método simplex

Presentación local del método simplex para Métodos Numéricos, MAT 205-SC. Abre con un tetraedro en Three.js, explica el modelo del informe y resuelve la tabla pivote a pivote. También deja cambiar el modelo en vivo.

La página corre en la computadora de quien expone. No hace falta internet después de instalar las dependencias.

## Qué se necesita

- Node.js 20 o más nuevo
- npm, que viene con Node

Para ver la versión:

```bash
node -v
```

## Cómo correrlo

En esta carpeta:

```bash
npm install
npm run dev
```

Abre la dirección que imprime Vite. En esta configuración es [http://127.0.0.1:5173](http://127.0.0.1:5173).

Para parar el servidor, `Ctrl+C` en esa terminal.

Si la defensa es con el proyecto ya compilado:

```bash
npm run build
npm run preview
```

La vista previa queda en [http://127.0.0.1:4173](http://127.0.0.1:4173).

Las pruebas del algoritmo:

```bash
npm test
```

## Qué mostrar

1. El tetraedro es la figura que da nombre al método: n+1 vértices en n dimensiones. No es el dibujo del ejemplo.
2. El scroll cambia el texto de la apertura y gira el sólido. Un clic sostenido sobre el tetraedro lo gira a mano. Si el sistema pide menos movimiento, los tres textos quedan uno debajo del otro y el sólido no gira solo, pero el arrastre sigue funcionando.
3. El modelo cargado al entrar es el del informe: maximizar `100 x1 + 125 x2`, con `6 x1 + 4 x2 ≤ 24` y `x1 + x2 ≤ 800`.
4. En el laboratorio, **Pivote siguiente** avanza una iteración. Entra `x2`, sale `H1`, y el óptimo es `x1 = 0`, `x2 = 6`, `Z = 750`.
5. El informe escribe `H2 = 806`. La resta correcta es `800 − 6 = 794`. El óptimo no cambia. Conviene decirlo si preguntan.
6. **Minimización con fase 1** carga otro modelo, de demostración. No es la fábrica de muebles: el informe no publica las existencias de piezas, y sin eso no se puede armar el simplex.

La página es lo que ve el aula. Este listado no está en la interfaz.

## Nombres del equipo

No van en la página. Los del informe y de las diapositivas estaban mal, así que no se copiaron.

## Stack

Vite, React y TypeScript en el frente. El sólido es Three.js con React Three Fiber. El scroll de la apertura usa GSAP ScrollTrigger. El método simplex está en `src/simplex/engine.ts`, sin interfaz, para poder probarlo solo.
