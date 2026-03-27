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


## Conclusiones finales
Una de las tareas subestimadas fue la adaptación de los documentos para trabajar con el marco de trabajo ASDD. Estos documentos necesitaron varias iteraciones de correcciones para adaptarlo al proyecto y la metodología de trabajo que se siguió.

Al utilizar el marco de trabajo ASDD, el foco principal (como DEV) no fue la implementación, ya que esto lo realizaban los agentes, sino la evaluación del resultado de los agentes verificando que cumplieran con las HUs, subtareas y specs definidos previamente.

El MVP se enfoca exactamente en lo solicitado en el reto: "Calcular fechas de devolución y multas acumulativas (Fibonacci o lineal) por retraso", por lo que cada HU tiene valor y todas fueron desarrolladas, aunque si se desarrollaron primero las que se consideraron más valiosas. 