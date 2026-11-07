# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Vite, React, TypeScript and Three.js (React Three Fiber). The brief left the stack open and asked for a localhost presentation whose scroll carries a real simplex solid. GSAP ScrollTrigger drives that scroll. The solver is plain TypeScript so the tableau can be tested without a browser.

## Users

Students of Métodos Numéricos MAT 205-SC presenting the simplex method in class, and classmates who clone the repo and run it on their own machine. The job is to explain the mathematical model and then show the same model moving inside software.

## Product Purpose

A local presentation that states the simplex model, walks the report's fully specified example pivot by pivot, and lets the speaker change the model live. Success means a classmate can install it, open localhost, and follow the defense without the authors in the room.

## Positioning

The page solves the course example with the same entering-column rule as the slides (the most negative coefficient in the objective row) and shows the feasible polygon of that two-variable model. The geometric simplex on screen is a tetrahedron, named as the figure, not as a picture of the example's feasible region.

## Operating Context

Classroom defense on one laptop, projector, and localhost. Source material is the course report and the slide deck. Teammate names are edited in `src/credits.ts` because the names printed in those documents are known to be wrong.

## Capabilities and Constraints

- Maximize or minimize a linear objective with `<=`, `>=`, and `=` constraints. Variables are nonnegative.
- Two-phase simplex when an artificial variable is required. The objective row follows the slide convention.
- Step through every pivot. Two-variable models draw the feasible region and the vertex path.
- The furniture example in the report states a production plan and a profit, and does not state inventory limits. The software does not invent those limits or pretend to solve that model.
- Offline after `npm install`. No remote fonts, environments, or accounts.
- Spanish interface.

## Evidence on Hand

The report and the slides in the authors' downloads. Worked example: maximize `100 x1 + 125 x2` subject to `6 x1 + 4 x2 <= 24` and `x1 + x2 <= 800`. The documents give an optimal value of 750 at `x1 = 0`, `x2 = 6`. Their slack for the second row is written as 806; the elimination gives `800 - 6 = 794`. The optimum they publish is unchanged.

## Product Principles

- Show the pivot, do not only name the method.
- Keep the course example intact and correct the arithmetic where the page can show the subtraction.
- The solid explains a simplex. The plot explains this model. They are not the same picture.
- A teammate runs it from the README alone.
- Motion yields to `prefers-reduced-motion`.

## Accessibility & Inclusion

The defense may be given with reduced motion on. The beats, the table, and the laboratory remain in the document flow. The tableau is a real table and the laboratory controls are labeled.

## Session note

The build-path question (image before code, or code first) was not asked as its own round. This session is code-first because the page has to run the algorithm, and that choice is not stored.
