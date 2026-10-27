// Datos del tablero de OficiosPro. Fecha de corte: 26 de octubre de 2026.
// Fuentes: Asignación #3 (acta, cronograma y riesgos) y Plan de calidad preliminar, Grupo #3.
// Los bloques marcados "// CONFIRMAR" son estimaciones coherentes con el estado actual
// (no salen de los PDF): ajústalos con los números reales de tu tablero, de PHPUnit y de GA4.

const DASHBOARD_DATA = {
  proyecto: {
    nombre: "OficiosPro",
    descripcion: "Marketplace de licitaciones para servicios independientes de oficios en Panamá: el cliente publica un trabajo y los trabajadores cotizan",
    metodologia: "Kanban en GitHub Projects",
    fechaCorte: "2026-10-26",
    periodo: "17 ago – 4 dic 2026 (semana 11 de 16)",
    equipo: [
      { nombre: "Gabriela Miranda", rol: "Directora del proyecto" },
      { nombre: "Andrés Morán", rol: "Análisis, marketing y tracción" },
      { nombre: "Roger Millán", rol: "Arquitectura y UI/UX" },
      { nombre: "Benjamín Bartuano", rol: "Desarrollo, líder de módulos" },
      { nombre: "Daniel Nie", rol: "Pruebas, QA y seguridad" },
      { nombre: "Jafeth Jiménez", rol: "Despliegue (Vercel y DigitalOcean)" }
    ]
  },

  // CONFIRMAR: conteo de las 26 tareas e hitos del cronograma según su estado al 26/10.
  // Hecho: tareas 1-14 y 17. En revisión: 15. En progreso: 18, 19 y 24. Por hacer: 16, 20-23, 25 y 26.
  kanban: {
    porHacer: 7, enProgreso: 3, enRevision: 1, hecho: 15
  },

  // Fechas según la lista de hitos y el cronograma detallado del acta.
  // CONFIRMAR: M2 y M3 "en curso". M3 se muestra desde el 19/10 (el plan decía 02/11)
  // porque la integración de PagueloFácil ya está adelantada.
  cronograma: [
    { modulo: "Planificación: alcance, acta, cronograma y riesgos", inicio: "2026-08-17", fin: "2026-09-23", estado: "completado" },
    { modulo: "Análisis y diseño (requerimientos, arquitectura y prototipos)", inicio: "2026-08-31", fin: "2026-10-02", estado: "completado" },
    { modulo: "M1 · Registro y perfiles (cédula, JWT y Google OAuth)", inicio: "2026-10-05", fin: "2026-10-16", estado: "completado" },
    { modulo: "M2 · Publicación y cotizaciones", inicio: "2026-10-19", fin: "2026-10-30", estado: "en curso" },
    { modulo: "M3 · Pago (PagueloFácil) y reputación", inicio: "2026-10-19", fin: "2026-11-13", estado: "en curso" },
    { modulo: "Pruebas integrales y de seguridad", inicio: "2026-11-16", fin: "2026-11-20", estado: "pendiente" },
    { modulo: "Despliegue en producción (piloto)", inicio: "2026-11-23", fin: "2026-11-27", estado: "pendiente" },
    { modulo: "Informe final y sustentación", inicio: "2026-11-30", fin: "2026-12-04", estado: "pendiente" },
    { modulo: "Campaña Instagram, TikTok y SEO local", inicio: "2026-10-19", fin: "2026-12-04", estado: "en curso" }
  ],

  // Los 11 riesgos del acta (4 técnicos, 3 humanos, 4 externos).
  // Probabilidad e impacto de 1 a 5, tal como están en el mapa de calor.
  riesgos: [
    { id: "T1", riesgo: "Sin API pública para validar la cédula (registros falsos y fraude)", tipo: "técnico", probabilidad: 4, impacto: 4, respuesta: "mitigar", responsable: "Benjamín Bartuano" },
    { id: "T2", riesgo: "Fallas al integrar PagueloFácil (documentación limitada y sandbox tardío)", tipo: "técnico", probabilidad: 3, impacto: 5, respuesta: "mitigar", responsable: "Jafeth Jiménez" },
    { id: "T3", riesgo: "Vulnerabilidad en JWT y OAuth (fuga de datos, incumplir Ley 81)", tipo: "técnico", probabilidad: 2, impacto: 5, respuesta: "evitar", responsable: "Daniel Nie" },
    { id: "T4", riesgo: "El servidor básico no soporta picos de uso", tipo: "técnico", probabilidad: 2, impacto: 3, respuesta: "aceptar", responsable: "Jafeth Jiménez" },
    { id: "H1", riesgo: "Poca disponibilidad del equipo por parciales y otras materias", tipo: "humano", probabilidad: 4, impacto: 4, respuesta: "mitigar", responsable: "Gabriela Miranda" },
    { id: "H2", riesgo: "Falta de capacitación en Laravel y pagos", tipo: "humano", probabilidad: 3, impacto: 3, respuesta: "mitigar", responsable: "Roger Millán" },
    { id: "H3", riesgo: "Punto único de falla en desarrollo (el conocimiento está concentrado)", tipo: "humano", probabilidad: 2, impacto: 4, respuesta: "mitigar", responsable: "Gabriela Miranda" },
    { id: "E1", riesgo: "Baja adopción de los trabajadores (poca alfabetización digital)", tipo: "externo", probabilidad: 4, impacto: 4, respuesta: "mitigar", responsable: "Andrés Morán" },
    { id: "E2", riesgo: "Cambios en PagueloFácil o en la Ley 81", tipo: "externo", probabilidad: 2, impacto: 4, respuesta: "mitigar", responsable: "Jafeth Jiménez" },
    { id: "E3", riesgo: "Ventas promete funciones no aprobadas (crecimiento del alcance)", tipo: "externo", probabilidad: 3, impacto: 4, respuesta: "evitar", responsable: "Gabriela Miranda" },
    { id: "E4", riesgo: "Los grupos informales de Facebook y WhatsApp frenan la demanda inicial", tipo: "externo", probabilidad: 3, impacto: 3, respuesta: "diferenciar", responsable: "Andrés Morán" }
  ],

  // CONFIRMAR: pruebas PHPUnit, bugs (registro en GitHub Projects) y cobertura.
  // Los casos manuales P01-P12 del Plan de calidad se reportan aparte, solo con resultados obtenidos.
  calidad: {
    pruebasPasando: 42, pruebasFallando: 3,
    bugsCorregidos: 28, bugsAbiertos: 6,
    coberturaPorcentaje: 55
  },

  // USD acumulados al corte (26/10). Presupuesto total del acta: DigitalOcean $36 + dominio $12
  // + contingencia $5 = ≈ $53 (más 423 h de esfuerzo, que no son gasto en efectivo).
  // CONFIRMAR: 2 de las 3 mensualidades de DigitalOcean ya facturadas; la contingencia no se ha usado.
  presupuesto: [
    { rubro: "DigitalOcean ($12 × 3 meses)", planificado: 24, real: 24 },
    { rubro: "Dominio .com", planificado: 12, real: 12 },
    { rubro: "Vercel, PagueloFácil sandbox, GA4, Meta y Looker", planificado: 0, real: 0 },
    { rubro: "Contingencia 10 % (reserva de $5, sin usar)", planificado: 0, real: 0 }
  ],

  // La plataforma aún no se ha mostrado a usuarios reales (piloto en producción: 27/11),
  // así que el uso real es cero. Cuando empiece el piloto, reemplaza con GA4 o el panel admin.
  // Meta del acta: 50 trabajadores activos.
  uso: {
    semanas: ["S1", "S2", "S3", "S4", "S5", "S6"],
    usuariosRegistrados: [0, 0, 0, 0, 0, 0],
    trabajosPublicados: [0, 0, 0, 0, 0, 0],
    trabajosCompletados: [0, 0, 0, 0, 0, 0]
  },

  comunicacion: [
    { interesado: "Equipo de desarrollo", informacion: "Tareas, bloqueos, errores y avance de los módulos", canal: "Reunión de los lunes y tablero Kanban en GitHub Projects", frecuencia: "Semanal (lunes)", responsable: "Gabriela Miranda", poder: "alto", interes: "alto" },
    { interesado: "Docente (patrocinador)", informacion: "Avance por hito y solicitudes de cambio", canal: "Presentación y revisión en cada hito", frecuencia: "Por entrega (hitos)", responsable: "Gabriela Miranda", poder: "alto", interes: "medio" },
    { interesado: "Trabajadores de oficios", informacion: "Tutoriales cortos, créditos y nuevas solicitudes", canal: "TikTok, correo (Resend) y soporte por WhatsApp", frecuencia: "Por evento", responsable: "Andrés Morán", poder: "medio", interes: "alto" },
    { interesado: "Clientes", informacion: "Cotizaciones recibidas, confirmación y estado del trabajo", canal: "Correo y la plataforma", frecuencia: "Por evento", responsable: "Sistema (notificaciones automáticas)", poder: "bajo", interes: "alto" },
    { interesado: "Proveedor de pagos (PagueloFácil)", informacion: "Acceso al sandbox, cambios de la API y soporte", canal: "Correo y portal del proveedor", frecuencia: "Por evento", responsable: "Jafeth Jiménez", poder: "alto", interes: "bajo" }
  ],

  observaciones: [
    "Integrar la pasarela de pago fue difícil por documentación poco clara (riesgo T2 materializado); se evaluaría otra alternativa.",
    "El equipo funcionó, pero hubo desbalance de carga por choques de horario con otras materias y trabajos (riesgos H1 y H3).",
    "Captar clientes será un reto por ser un servicio nuevo y costar ganar la confianza de los usuarios (riesgo E1); el piloto del 27/11 lo pondrá a prueba.",
    "El cambio de protección de datos (solo corregimiento visible hasta elegir al trabajador) se manejó con solicitud formal y los casos P11 y P12."
  ],

  proximosPasos: [
    { accion: "Cerrar M2: pruebas P04 a P06 y hito de publicación y cotizaciones", responsable: "Daniel Nie", fecha: "2026-10-30", prioridad: "alta" },
    { accion: "Reducir el punto único de falla: revisión cruzada y programación en pareja", responsable: "Gabriela Miranda", fecha: "2026-11-04", prioridad: "alta" },
    { accion: "Completar M3: confirmación, reseñas y pruebas P07 y P08 en sandbox", responsable: "Benjamín Bartuano", fecha: "2026-11-13", prioridad: "alta" },
    { accion: "Pruebas integrales y de seguridad (lista OWASP, P10 y flujo completo)", responsable: "Daniel Nie", fecha: "2026-11-20", prioridad: "alta" },
    { accion: "Evaluar una pasarela de pago alternativa a PagueloFácil", responsable: "Jafeth Jiménez", fecha: "2026-11-20", prioridad: "media" },
    { accion: "Desplegar el piloto en Vercel y DigitalOcean", responsable: "Jafeth Jiménez", fecha: "2026-11-27", prioridad: "alta" },
    { accion: "Plan de captación y confianza: reseñas, verificación de cédula y tutoriales (meta: 50 trabajadores)", responsable: "Andrés Morán", fecha: "2026-12-04", prioridad: "media" }
  ]
};