## Planificación de Sprints

**Selección Estratégica:**
- Núcleo del negocio (MVP) se vasa en las 6 historias definidas (HU-01 a HU-06). Estas son las historias mínimas necesarias para el funcionamiento del sistema y el cumplimiento de los requerimientos dados

**Duración de cada micro-sprint:** 2 días.

**División de micro-sprints**
- Micro-sprint 1: HU-02, HU-03, HU-04
- Micro-sprint 2: HU-06, HU-01, HU-05

## Resumen de los sprints
### *Primer Micro-Sprint*
**Registro de Tiempos (Time-Tracking) — plantilla:**

| Tarea | Story Points | Tiempo Real (hrs) | Commits / PR | Notas | Día de Sprint |
|----|--------|--------------:|----------:|-------------------------:|------:|
| Planificación de trabajo | - | 2 | - | incluye: planificación de micro-sprints, dockerización, creación de repositorio, configuración de repositorio, creación de commitlint. | 1
| Ajustes de archivos IA (ASDD) | - | 4 | PR: #89 |  | 1
| HU-02 | 5 | 1 | Commit: 302ab56 |  | 2
| HU-03 | 3 | 1 | Commit: aa3cf10 |  | 2
| HU-04 | 8 | 2 | Commit: a07ab5a |  | 2
| Corrección de errores | - | 3 | Commit: d4afc20 | tiempo excedido por razones externar al trabajo | 3 (sprint excedido)

Instrucciones para rellenar la plantilla:
- `Tarea`: Taréa realizada (una historia de usuario o actividad en concreto del sprint)
- `Story Points`: número ya estimado en las historias.
- `Tiempo Real (hrs)`: tiempo acumulado real
- `Commits / PR`: referencias a commits o enlace al PR que implementó el trabajo.
- `Notas`: impedimentos, retrabajos, y causas de desviación.

**Entrega de Valor — plantilla de evidencia (al cierre de cada micro-sprint):**

- Resumen: 
    - Se ideó una planificación de trabajo para los dos micro-sprints a realizar 
    - Se configuró la base para el trabajo (repositorio, docker, commitlint, CONTRIBUTING.md). 
    - Se ajustaron los documentos para el desarrollo ASDD. 
    - Implementación de las HU-02, HU-03 y HU-04 con metodología ASDD; y se realizaron ajustes y correcciones a los resultados obtenidos de la implementación de las HUs.

- Enlaces: 
    - PR: 
        - [#88 ci(commitlint): evaluador de Conventional Commits](https://github.com/TallerS7-Expectativa-vs-Realidad/S7-Sistema-de-Prestamos-y-Multas/pull/88)
        - [#89 Docs/ai](https://github.com/TallerS7-Expectativa-vs-Realidad/S7-Sistema-de-Prestamos-y-Multas/pull/89)
        - [#90 ai: ajustes de agentes, skills y archivos utilizados para el trabajo con ASDD](https://github.com/TallerS7-Expectativa-vs-Realidad/S7-Sistema-de-Prestamos-y-Multas/pull/90)
        - [#91 docs: ajustes y correcciones de documentación en SUBTASKS, USER_STORIES y PRD](https://github.com/TallerS7-Expectativa-vs-Realidad/S7-Sistema-de-Prestamos-y-Multas/pull/91)
        - [#102 feat: implementaciones de HU-02, HU-03 y HU-04 funcionando](https://github.com/TallerS7-Expectativa-vs-Realidad/S7-Sistema-de-Prestamos-y-Multas/pull/102)
    - Branchs
        - ci/github-actions
        - docs/AI
        - docs/asdd-enhanced
        - docs/MVP_documentation
        - feature/implementations


- **Observaciones finales:**

Este micro-sprint tuvo tiempos de retrasos surgidos por eventos externos al propio desarrollo del proyecto.


### *Segundo Micro-Sprint*
**Registro de Tiempos (Time-Tracking) — plantilla:**

| Tarea | Story Points | Tiempo Real (hrs) | Commits / PR | Notas | Día de Sprint |
|----|--------|--------------:|----------:|-------------------------:|------:|
| Documentación de planificación del Sprints | - | 1 | PR: #103 | - | 1
| Actualización de Dashboard (Project) | - | 2 | - | - | 1
| HU-06 | 3 | 1 | Commit: 8c13dd5 | - | 1
| HU-01 | 3 | 1 | Commit: c88d3a8 | - | 1
| HU-05 | 3 | 1 | Commit: b400427 | - | 1
| Corrección de errores | - | 2 | - | - | 1 y 2
| Solución de conflictos de integración (merges) | - | 4 | - | conflictos de código surgidos en los pull request por el trabajo en paralelo de distintas ramas | 2



Instrucciones para rellenar la plantilla:
- `Tarea`: Taréa realizada (una historia de usuario o actividad en concreto del sprint)
- `Story Points`: número ya estimado en las historias.
- `Tiempo Real (hrs)`: tiempo acumulado real
- `Commits / PR`: referencias a commits o enlace al PR que implementó el trabajo.
- `Notas`: impedimentos, retrabajos, y causas de desviación.

**Entrega de Valor — plantilla de evidencia (al cierre de cada micro-sprint):**


- Resumen: 
    - Se actualizó el dashboard (Project) para que representara el flujo y estado actual de desarrollo.
    - Se creó la documentación con el resumen de los micro-sprints
    - Implementación de las HU-06, HU-01 y HU-05 con metodología ASDD.
    - Se realizó el merge de las ramas de trabajo de los micro sprints (feature/micro-sprint2 y feature/implementations)

- Enlaces: 
    - PR: 
        - [#103 docs(README): planificación de los micro-sprints](https://github.com/TallerS7-Expectativa-vs-Realidad/S7-Sistema-de-Prestamos-y-Multas/pull/103)
        - [#104 feat: implementaciones de HU-06, HU-01 y HU-05 funcionando](https://github.com/TallerS7-Expectativa-vs-Realidad/S7-Sistema-de-Prestamos-y-Multas/pull/104)
    - Branchs
        - docs/MVP_documentations
        - feature/micro-sprint2

- **Observaciones finales:** 

Debido a la división de trabajo en distintas ramas para seguir el flujo de trabajo con Git Flow, el marco de trabajo ASDD, tal cual como está construido, genera dificultades a la hora de integrar las implementaciones construidas ya que no se tiene un proceso previo de diseño UI/UX y un armado del esqueleto del proyecto, tanto frontend como backend, que todos los agentes deben seguir.


## Reality Check del trabajo

### Fantasía del backlog vs realidad del ciclo corto

| Supuesto inicial | Realidad observada |
| --- | --- |
| QA podía entrar al final a validar si "funcionaba". | QA tuvo que participar desde antes con plan, matriz, Gherkin, revisión de contratos, datos de prueba, evidencia y re-ejecución. |
| Las historias pequeñas en puntos implicaban validación pequeña. | Historias cortas como HU-04 y HU-06 arrastraron validaciones más costosas por reglas acumulativas, persistencia y dependencia entre flujos. |
| Tener spec aprobada daba suficiente claridad para ejecutar rápido. | Varias validaciones exigieron contrastar spec, comportamiento observable y base de datos porque en un ciclo corto aparecieron ajustes, merges y diferencias de contrato. |
| El esfuerzo fuerte estaba solo en desarrollar. | También hubo trabajo silencioso de QA para sostener trazabilidad, priorizar riesgos y evitar vender como estable algo que todavía pedía revalidación. |

### Qué se subestimó y por qué

- Se subestimó la lógica de multa Fibonacci. El problema no era solo calcular un número; había que validar cortes obligatorios de `1`, `7`, `8`, `15` y `22` días, revisar persistencia en `debt_reader` y confirmar que el préstamo quedara realmente cerrado.
- Se subestimó el costo de preparar datos y ambiente para probar bien. En este proyecto no bastaba con llamar un endpoint: varias validaciones exigían limpiar datos, repetir escenarios y verificar estado real en PostgreSQL.
- Se subestimó la diferencia entre "documentado" y "ejecutable hoy". Parte del trabajo de QA fue precisamente detectar cuándo una historia tenía spec y casos, pero todavía necesitaba estabilización o re-ejecución para sostener la evidencia.
- Se subestimó el costo de la trazabilidad. En dos días parece tentador probar rápido y seguir, pero sin `TEST_PLAN.md`, `TEST_CASES.md`, Gherkin y registro de re-ejecuciones, después nadie puede demostrar qué quedó cubierto y qué no.

### Valor real del MVP

El MVP sí entrega valor real aunque el backlog ideal siempre parezca más elegante en papel. El flujo principal del negocio quedó representado: consultar disponibilidad, registrar préstamo, registrar devolución, calcular mora, generar deuda y cerrar el ciclo con pago y rehabilitación. Eso ya permite demostrar la operación esencial del sistema y responder al reto del taller.

La parte honesta es esta: el valor no vino de cubrir un backlog infinito, sino de cerrar bien el núcleo operativo. Lo que quedó por fuera no invalida el MVP; lo que sí lo habría invalidado era fingir cobertura o dar por estable una regla crítica sin haberla trazado ni retestado.

### Cómo se sostuvo la calidad en un ciclo corto

- QA trabajó con enfoque basado en riesgo y no por volumen. Se priorizaron reglas de negocio capaces de romper el sistema de verdad: disponibilidad por historial, rechazo por deuda, devolución duplicada, cortes Fibonacci y rehabilitación del lector.
- QA sostuvo la calidad con trazabilidad, no con promesas. El trabajo quedó aterrizado en `TEST_PLAN.md`, `TEST_CASES.md`, escenarios Gherkin y documentos de re-ejecución para defectos y validaciones manuales.
- QA también funcionó como control de realidad entre backlog, spec e implementación. Cuando algo no estaba totalmente alineado, el valor fue hacerlo visible para evitar conclusiones falsas sobre el estado del sprint.
- En un ciclo corto, QA no alcanzó a ser una fase final elegante; fue una actividad transversal para decidir qué era demostrable, qué requería revalidación y dónde estaba el riesgo real.

### Aprendizajes accionables

- Si se trabaja con ASDD y agentes en paralelo, el proyecto necesita antes un esqueleto técnico y contratos base más estables; si no, buena parte del tiempo se va en corregir integración en vez de validar valor.
- QA debe estimarse como trabajo de diseño y control, no solo como ejecución al final. Plan, datos, evidencia y re-test también consumen tiempo y deben verse en la planificación.
- En historias con reglas acumulativas o financieras, los casos de borde deben definirse desde el inicio. Si no se fijan temprano, el equipo termina descubriendo demasiado tarde dónde estaba el riesgo.
- La documentación útil no es la que maquilla el sprint, sino la que distingue con claridad entre cobertura planificada, cobertura ejecutada y cobertura pendiente de revalidación.


## Conclusiones finales
Una de las tareas subestimadas fue la adaptación de los documentos para trabajar con el marco de trabajo ASDD. Estos documentos necesitaron varias iteraciones de correcciones para adaptarlo al proyecto y la metodología de trabajo que se siguió.

Desde QA, el trabajo tampoco fue "probar al final". Fue diseñar cobertura útil, priorizar por riesgo, contrastar documento contra comportamiento observable y dejar evidencia suficiente para que el cierre del taller no dependiera de fe sino de trazabilidad.

Al utilizar el marco de trabajo ASDD, el foco principal (como DEV) no fue la implementación, ya que esto lo realizaban los agentes, sino la evaluación del resultado de los agentes verificando que cumplieran con las HUs, subtareas y specs definidos previamente.

El MVP se enfoca exactamente en lo solicitado en el reto: "Calcular fechas de devolución y multas acumulativas (Fibonacci o lineal) por retraso", por lo que cada HU tiene valor y todas fueron desarrolladas, aunque si se desarrollaron primero las que se consideraron más valiosas. 