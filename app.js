const UMBRALES = {
  avance: { verdeMin: 70, ambarMin: 40 },
  cronograma: { ambarMaxDias: 15 },
  riesgo: { altoMin: 15, medioMin: 8 },
  calidad: { verdeMin: 90, ambarMin: 75 },
  presupuesto: { verdeMax: 5, ambarMax: 15 }
};

const charts = {};
let filtroInteresado = "todos";
let filtroFrecuencia = "todos";
let seccionActiva = 0;
let presentacion = false;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function parseFecha(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function fmtFecha(iso) {
  return new Intl.DateTimeFormat("es-PA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(parseFecha(iso));
}

function fmtUSD(n) {
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD"
  }).format(n);
}

function diasEntre(aIso, bIso) {
  const ms = parseFecha(bIso) - parseFecha(aIso);
  return Math.floor(ms / 86400000);
}

function iniciales(nombre) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function semaforo(nivel) {
  if (nivel === "critico") {
    return { nivel, etiqueta: "Crítico", clase: "critico", icono: "●" };
  }
  if (nivel === "en-riesgo") {
    return { nivel, etiqueta: "En riesgo", clase: "en-riesgo", icono: "▲" };
  }
  return { nivel: "en-meta", etiqueta: "En meta", clase: "en-meta", icono: "✓" };
}

function htmlSemaforo(s, extraClass) {
  return `<span class="semaforo ${s.clase} ${extraClass || ""}" aria-label="Semáforo: ${s.etiqueta}">
    <span aria-hidden="true">${s.icono}</span> ${s.etiqueta}
  </span>`;
}

function totalKanban(k) {
  return k.porHacer + k.enProgreso + k.enRevision + k.hecho;
}

function calcAvance(data) {
  const total = totalKanban(data.kanban);
  const pct = total === 0 ? 0 : (data.kanban.hecho / total) * 100;
  let nivel = "critico";
  if (pct >= UMBRALES.avance.verdeMin) nivel = "en-meta";
  else if (pct >= UMBRALES.avance.ambarMin) nivel = "en-riesgo";
  return { pct, total, sem: semaforo(nivel) };
}

function calcCronograma(data) {
  const corte = data.proyecto.fechaCorte;
  let maxRetraso = 0;
  data.cronograma.forEach((mod) => {
    const incompleto = mod.estado !== "completado";
    const finPasada = parseFecha(mod.fin) < parseFecha(corte);
    if (incompleto && finPasada) {
      maxRetraso = Math.max(maxRetraso, diasEntre(mod.fin, corte));
    }
  });
  let nivel = "en-meta";
  if (maxRetraso > UMBRALES.cronograma.ambarMaxDias) nivel = "critico";
  else if (maxRetraso >= 1) nivel = "en-riesgo";
  return { maxRetraso, sem: semaforo(nivel) };
}

function nivelRiesgo(p, i) {
  const score = p * i;
  if (score >= UMBRALES.riesgo.altoMin) return { score, etiqueta: "alto", sem: semaforo("critico") };
  if (score >= UMBRALES.riesgo.medioMin) return { score, etiqueta: "medio", sem: semaforo("en-riesgo") };
  return { score, etiqueta: "bajo", sem: semaforo("en-meta") };
}

function calcRiesgos(data) {
  const detalle = data.riesgos.map((r) => ({ ...r, ...nivelRiesgo(r.probabilidad, r.impacto) }));
  const maxScore = Math.max(...detalle.map((r) => r.score), 0);
  let nivel = "en-meta";
  if (maxScore >= UMBRALES.riesgo.altoMin) nivel = "critico";
  else if (maxScore >= UMBRALES.riesgo.medioMin) nivel = "en-riesgo";
  return { detalle, maxScore, sem: semaforo(nivel) };
}

function calcCalidad(data) {
  const c = data.calidad;
  const total = c.pruebasPasando + c.pruebasFallando;
  const pct = total === 0 ? 0 : (c.pruebasPasando / total) * 100;
  let nivel = "critico";
  if (pct >= UMBRALES.calidad.verdeMin) nivel = "en-meta";
  else if (pct >= UMBRALES.calidad.ambarMin) nivel = "en-riesgo";
  return { pct, total, sem: semaforo(nivel) };
}

function calcPresupuesto(data) {
  const plan = data.presupuesto.reduce((a, r) => a + r.planificado, 0);
  const real = data.presupuesto.reduce((a, r) => a + r.real, 0);
  let desv = 0;
  if (plan === 0) desv = real === 0 ? 0 : 100;
  else desv = ((real - plan) / plan) * 100;
  const abs = Math.abs(desv);
  let nivel = "en-meta";
  if (abs > UMBRALES.presupuesto.ambarMax) nivel = "critico";
  else if (abs > UMBRALES.presupuesto.verdeMax) nivel = "en-riesgo";
  return { plan, real, desv, sem: semaforo(nivel) };
}

function calcUso(data) {
  const u = data.uso.usuariosRegistrados;
  const last = u[u.length - 1] || 0;
  const prev = u.length > 1 ? u[u.length - 2] : last;
  let nivel = "en-meta";
  if (last < prev) nivel = "critico";
  else if (last === prev) nivel = "en-riesgo";
  return { last, sem: semaforo(nivel) };
}

function estadoGeneral(indicadores) {
  const niveles = indicadores.map((i) => i.sem.nivel);
  if (niveles.includes("critico")) return semaforo("critico");
  if (niveles.includes("en-riesgo")) return semaforo("en-riesgo");
  return semaforo("en-meta");
}

function chartDefaults() {
  if (typeof Chart === "undefined") return;
  Chart.defaults.color = "#9BB0C9";
  Chart.defaults.borderColor = "rgba(44, 127, 255, 0.18)";
  Chart.defaults.font.family = "Inter, Segoe UI, sans-serif";
  Chart.defaults.animation = prefersReducedMotion() ? false : { duration: 900 };
}

function makeChart(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas || typeof Chart === "undefined") return;
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(canvas, config);
}

function renderEncabezado(data, general) {
  const p = data.proyecto;
  document.getElementById("encabezado-proyecto").innerHTML = `
    <p class="proposito">
      Este tablero muestra cómo se informa el desempeño de <strong>${p.nombre}</strong>
      a sus interesados. El propósito es comunicar avance, riesgos, calidad, presupuesto y uso
      con indicadores del propio proyecto, no con métricas genéricas.
    </p>
    <div class="meta-proyecto">
      <article class="tarjeta">
        <p>${p.descripcion}</p>
        <div class="chips-meta">
          <span class="chip">Metodología: ${p.metodologia}</span>
          <span class="chip">Período: ${p.periodo}</span>
          <span class="chip">Fecha de corte: ${fmtFecha(p.fechaCorte)}</span>
        </div>
      </article>
      <article class="tarjeta estado-grande">
        <h3>Estado general del proyecto</h3>
        ${htmlSemaforo(general, "semaforo-grande")}
        <p class="meta-linea">Se calcula con los semáforos de la sección B: un crítico pinta el tablero de rojo; si no hay crítico pero hay riesgo, queda en ámbar; si todos están en meta, verde.</p>
      </article>
    </div>
    <div class="equipo" aria-label="Equipo del proyecto">
      ${p.equipo.map((m) => `
        <article class="persona">
          <div class="iniciales" aria-hidden="true">${iniciales(m.nombre)}</div>
          <div>
            <strong>${m.nombre}</strong>
            <span>${m.rol}</span>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderKpis(data, calc) {
  const kpis = [
    {
      nombre: "Avance general",
      valor: `${calc.avance.pct.toFixed(0)} %`,
      meta: `Meta: ≥ ${UMBRALES.avance.verdeMin} % hecho`,
      sem: calc.avance.sem,
      significa: "Porcentaje de tarjetas Kanban que ya están en Hecho respecto al total del tablero."
    },
    {
      nombre: "Cronograma",
      valor: calc.cronograma.maxRetraso === 0 ? "En tiempo" : `${calc.cronograma.maxRetraso} días de retraso`,
      meta: "Meta: ningún módulo vencido sin completar",
      sem: calc.cronograma.sem,
      significa: "Compara la fecha de corte con la fecha fin planificada de cada módulo que aún no está completado."
    },
    {
      nombre: "Riesgos",
      valor: `Mayor puntaje ${calc.riesgos.maxScore}`,
      meta: `Alto si probabilidad × impacto ≥ ${UMBRALES.riesgo.altoMin}`,
      sem: calc.riesgos.sem,
      significa: "El semáforo sigue al riesgo más grave. Sirve para ver si hay amenazas que deban comunicarse ya."
    },
    {
      nombre: "Calidad (PHPUnit)",
      valor: `${calc.calidad.pct.toFixed(0)} % pasando`,
      meta: `Meta: ≥ ${UMBRALES.calidad.verdeMin} % de pruebas en verde`,
      sem: calc.calidad.sem,
      significa: "De todas las pruebas automáticas, cuántas pasan. Complementa bugs abiertos y cobertura."
    },
    {
      nombre: "Presupuesto",
      valor: fmtUSD(calc.presupuesto.real),
      meta: `Plan ${fmtUSD(calc.presupuesto.plan)} · desv. ${calc.presupuesto.desv.toFixed(1)} %`,
      sem: calc.presupuesto.sem,
      significa: "Gasto acumulado real frente a lo planificado al corte por rubro (servidor, dominio y servicios)."
    },
    {
      nombre: "Uso de la plataforma",
      valor: `${calc.uso.last} usuarios`,
      meta: "Última semana del período",
      sem: calc.uso.sem,
      significa: "Tendencia de usuarios registrados. El gráfico debajo suma trabajos publicados y completados."
    }
  ];

  document.getElementById("kpis").innerHTML = kpis.map((k) => `
    <article class="tarjeta kpi col-2">
      <h3>${k.nombre}</h3>
      <div class="valor">${k.valor}</div>
      <div class="meta">${k.meta}</div>
      ${htmlSemaforo(k.sem)}
      <p class="significado">¿Qué significa? ${k.significa}</p>
    </article>
  `).join("");
}

function renderVisualizaciones(data, calc) {
  const k = data.kanban;
  const pct = calc.avance.pct;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const animate = prefersReducedMotion() ? "0s" : "1s";

  document.getElementById("visualizaciones").innerHTML = `
    <article class="tarjeta col-6">
      <h3>1. Avance Kanban</h3>
      <div class="avance-visual">
        <div class="anillo" role="img" aria-label="Avance general ${pct.toFixed(0)} por ciento">
          <svg viewBox="0 0 140 140" width="150" height="150">
            <circle cx="70" cy="70" r="${r}" stroke="#0A1B2E" stroke-width="12" fill="none"/>
            <circle class="progreso" cx="70" cy="70" r="${r}" stroke="#2C7FFF" stroke-width="12" fill="none"
              stroke-dasharray="${circ}" stroke-dashoffset="${circ}" stroke-linecap="round"
              data-offset="${offset}" style="transition: stroke-dashoffset ${animate} ease"/>
            <text class="anillo-texto" x="70" y="76" text-anchor="middle">${pct.toFixed(0)}%</text>
          </svg>
        </div>
        <div class="canvas-wrap" style="flex:1;min-width:220px">
          <canvas id="chart-kanban" aria-label="Tarjetas por columna Kanban"></canvas>
        </div>
      </div>
      <p class="significado">Por hacer ${k.porHacer} · En progreso ${k.enProgreso} · En revisión ${k.enRevision} · Hecho ${k.hecho}</p>
    </article>

    <article class="tarjeta col-6">
      <h3>2. Cronograma (Gantt)</h3>
      <div id="gantt"></div>
    </article>

    <article class="tarjeta col-5">
      <h3>3. Matriz de riesgos (probabilidad × impacto)</h3>
      <div id="matriz-riesgos"></div>
    </article>
    <article class="tarjeta col-7">
      <h3>Registro de riesgos</h3>
      <div class="tabla-wrap" id="tabla-riesgos"></div>
    </article>

    <article class="tarjeta col-6">
      <h3>4. Calidad</h3>
      <div class="grid">
        <div class="col-6">
          <p class="meta">Pruebas PHPUnit</p>
          <div class="canvas-wrap">
            <canvas id="chart-pruebas" aria-label="Pruebas pasando versus fallando"></canvas>
          </div>
        </div>
        <div class="col-6">
          <p class="meta">Bugs</p>
          <div class="canvas-wrap">
            <canvas id="chart-bugs" aria-label="Bugs corregidos versus abiertos"></canvas>
          </div>
        </div>
      </div>
      <p class="meta">Cobertura de pruebas: ${data.calidad.coberturaPorcentaje} %</p>
      <div class="cobertura" aria-label="Cobertura ${data.calidad.coberturaPorcentaje} por ciento">
        <span id="barra-cobertura"></span>
      </div>
    </article>

    <article class="tarjeta col-6">
      <h3>5. Presupuesto acumulado al corte (USD)</h3>
      <p class="meta">Total planificado ${fmtUSD(calc.presupuesto.plan)} · real ${fmtUSD(calc.presupuesto.real)} · desviación ${calc.presupuesto.desv.toFixed(1)} %</p>
      <div class="canvas-wrap alto">
        <canvas id="chart-presupuesto" aria-label="Presupuesto planificado versus real por rubro"></canvas>
      </div>
    </article>

    <article class="tarjeta col-12">
      <h3>6. Uso de la plataforma (tendencia semanal)</h3>
      <div class="canvas-wrap">
        <canvas id="chart-uso" aria-label="Tendencia semanal de usuarios, trabajos publicados y trabajos completados"></canvas>
      </div>
    </article>
  `;

  renderGantt(data);
  renderMatrizRiesgos(calc.riesgos.detalle);
  renderTablaRiesgos(calc.riesgos.detalle);
  requestAnimationFrame(() => {
    const barra = document.getElementById("barra-cobertura");
    if (barra) barra.style.width = `${data.calidad.coberturaPorcentaje}%`;
    const anillo = document.querySelector(".progreso");
    if (anillo) anillo.style.strokeDashoffset = anillo.getAttribute("data-offset");
  });
  renderCharts(data);
}

function renderGantt(data) {
  const items = data.cronograma;
  const min = Math.min(...items.map((i) => parseFecha(i.inicio).getTime()));
  const max = Math.max(...items.map((i) => parseFecha(i.fin).getTime()));
  const rango = Math.max(max - min, 1);
  const corte = parseFecha(data.proyecto.fechaCorte).getTime();
  let hoyPct = ((corte - min) / rango) * 100;
  hoyPct = Math.min(100, Math.max(0, hoyPct));

  const filas = items.map((i) => {
    const ini = parseFecha(i.inicio).getTime();
    const fin = parseFecha(i.fin).getTime();
    const left = ((ini - min) / rango) * 100;
    const width = Math.max(((fin - ini) / rango) * 100, 1.2);
    const cls = i.estado === "en curso" ? "en-curso" : i.estado;
    return `
      <div class="gantt-fila">
        <div class="gantt-nombre">
          <strong>${i.modulo}</strong><br>
          <span class="meta">${fmtFecha(i.inicio)} — ${fmtFecha(i.fin)} · ${i.estado}</span>
        </div>
        <div class="gantt-pista">
          <span class="gantt-hoy" style="left:${hoyPct}%" title="Fecha de corte"></span>
          <span class="gantt-barra ${cls}" style="left:${left}%;width:${width}%"></span>
        </div>
      </div>
    `;
  }).join("");

  document.getElementById("gantt").innerHTML = `
    ${filas}
    <div class="gantt-leyenda">
      <span><i class="punto-leyenda" style="background:#07BE81"></i> Completado</span>
      <span><i class="punto-leyenda" style="background:#2C7FFF"></i> En curso</span>
      <span><i class="punto-leyenda" style="background:#3a4d63"></i> Pendiente</span>
      <span><i class="punto-leyenda" style="background:#FE9A00"></i> Línea de corte (hoy)</span>
    </div>
  `;
}

function renderMatrizRiesgos(detalle) {
  const celdas = {};
  detalle.forEach((r) => {
    const key = `${r.probabilidad}-${r.impacto}`;
    if (!celdas[key]) celdas[key] = [];
    celdas[key].push(r);
  });

  let html = `<div class="eje"></div>`;
  for (let i = 1; i <= 5; i += 1) html += `<div class="eje">I${i}</div>`;
  for (let p = 5; p >= 1; p -= 1) {
    html += `<div class="eje">P${p}</div>`;
    for (let i = 1; i <= 5; i += 1) {
      const score = p * i;
      const nivel = score >= UMBRALES.riesgo.altoMin ? "alto" : score >= UMBRALES.riesgo.medioMin ? "medio" : "bajo";
      const dots = (celdas[`${p}-${i}`] || []).map((r) =>
        `<span class="fichas-riesgo" title="${r.id}: ${r.riesgo}">${r.id.replace("R", "")}</span>`
      ).join("");
      html += `<div class="celda-riesgo ${nivel}">${dots || ""}</div>`;
    }
  }
  document.getElementById("matriz-riesgos").innerHTML = `<div class="matriz-riesgo">${html}</div>
    <p class="significado">Eje vertical: probabilidad 1–5. Eje horizontal: impacto 1–5. Los números son el ID del riesgo.</p>`;
}

function renderTablaRiesgos(detalle) {
  document.getElementById("tabla-riesgos").innerHTML = `
    <table class="tabla">
      <thead>
        <tr>
          <th>ID</th><th>Riesgo</th><th>Tipo</th><th>Nivel</th><th>Respuesta</th><th>Responsable</th>
        </tr>
      </thead>
      <tbody>
        ${detalle.map((r) => `
          <tr>
            <td>${r.id}</td>
            <td>${r.riesgo}</td>
            <td>${r.tipo}</td>
            <td>${htmlSemaforo(r.sem)} ${r.etiqueta} (${r.score})</td>
            <td>${r.respuesta}</td>
            <td>${r.responsable}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderCharts(data) {
  const k = data.kanban;
  makeChart("chart-kanban", {
    type: "bar",
    data: {
      labels: ["Tablero"],
      datasets: [
        { label: "Por hacer", data: [k.porHacer], backgroundColor: "#3a4d63", stack: "k" },
        { label: "En progreso", data: [k.enProgreso], backgroundColor: "#FE9A00", stack: "k" },
        { label: "En revisión", data: [k.enRevision], backgroundColor: "#2C7FFF", stack: "k" },
        { label: "Hecho", data: [k.hecho], backgroundColor: "#07BE81", stack: "k" }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { x: { stacked: true, beginAtZero: true }, y: { stacked: true } }
    }
  });

  makeChart("chart-pruebas", {
    type: "doughnut",
    data: {
      labels: ["Pasando", "Fallando"],
      datasets: [{
        data: [data.calidad.pruebasPasando, data.calidad.pruebasFallando],
        backgroundColor: ["#07BE81", "#EF4444"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });

  makeChart("chart-bugs", {
    type: "doughnut",
    data: {
      labels: ["Corregidos", "Abiertos"],
      datasets: [{
        data: [data.calidad.bugsCorregidos, data.calidad.bugsAbiertos],
        backgroundColor: ["#2C7FFF", "#FE9A00"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });

  makeChart("chart-presupuesto", {
    type: "bar",
    data: {
      labels: data.presupuesto.map((r) => r.rubro),
      datasets: [
        { label: "Planificado", data: data.presupuesto.map((r) => r.planificado), backgroundColor: "#2C7FFF" },
        { label: "Real", data: data.presupuesto.map((r) => r.real), backgroundColor: "#00B3DD" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } }
    }
  });

  makeChart("chart-uso", {
    type: "line",
    data: {
      labels: data.uso.semanas,
      datasets: [
        { label: "Usuarios registrados", data: data.uso.usuariosRegistrados, borderColor: "#2C7FFF", backgroundColor: "rgba(44,127,255,.15)", tension: 0.3, fill: true },
        { label: "Trabajos publicados", data: data.uso.trabajosPublicados, borderColor: "#00B3DD", tension: 0.3, fill: false },
        { label: "Trabajos completados", data: data.uso.trabajosCompletados, borderColor: "#07BE81", tension: 0.3, fill: false }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function claseCanal(canal) {
  const c = canal.toLowerCase();
  if (c.includes("whatsapp")) return "canal-whatsapp";
  if (c.includes("kanban")) return "canal-kanban";
  if (c.includes("presentación") || c.includes("presentacion")) return "canal-presentacion";
  if (c.includes("plataforma")) return "canal-plataforma";
  if (c.includes("correo")) return "canal-correo";
  return "canal-otro";
}

function claseFreq(f) {
  const v = f.toLowerCase();
  if (v.includes("diaria")) return "freq-diaria";
  if (v.includes("entrega")) return "freq-entrega";
  if (v.includes("evento")) return "freq-evento";
  return "freq-otra";
}

function cuadrantePoderInteres(poder, interes) {
  const pAlto = poder === "alto";
  const iAlto = interes === "alto";
  if (pAlto && iAlto) return "cerca";
  if (pAlto && !iAlto) return "satisfechos";
  if (!pAlto && iAlto) return "informados";
  return "monitorear";
}

function renderComunicacion(data) {
  const filas = data.comunicacion;
  const interesados = [...new Set(filas.map((f) => f.interesado))];
  const frecuencias = [...new Set(filas.map((f) => f.frecuencia))];

  const grupos = { cerca: [], satisfechos: [], informados: [], monitorear: [] };
  filas.forEach((f) => {
    grupos[cuadrantePoderInteres(f.poder, f.interes)].push(f.interesado);
  });

  document.getElementById("panel-comunicacion").innerHTML = `
    <article class="tarjeta col-12" style="margin-bottom:16px">
      <h3>Principios de la gestión de comunicaciones</h3>
      <div class="principios">
        <span class="chip chip-principio">Información correcta</span>
        <span class="chip chip-principio">En el momento adecuado</span>
        <span class="chip chip-principio">Al público adecuado</span>
        <span class="chip chip-principio">Por el canal adecuado</span>
      </div>
    </article>
    <div class="grid">
      <article class="tarjeta col-8">
        <div class="filtros">
          <label>Interesado
            <select id="filtro-interesado" aria-label="Filtrar por interesado">
              <option value="todos">Todos</option>
              ${interesados.map((i) => `<option value="${i}">${i}</option>`).join("")}
            </select>
          </label>
          <label>Frecuencia
            <select id="filtro-frecuencia" aria-label="Filtrar por frecuencia">
              <option value="todos">Todas</option>
              ${frecuencias.map((i) => `<option value="${i}">${i}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="tabla-wrap">
          <table class="tabla" id="tabla-com">
            <thead>
              <tr>
                <th>Interesado</th>
                <th>Tipo de información</th>
                <th>Canal</th>
                <th>Frecuencia</th>
                <th>Responsable</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </article>
      <article class="tarjeta col-4">
        <h3>Matriz poder–interés</h3>
        <div class="matriz-poder">
          <div></div>
          <div class="eje-interes" style="grid-column:2 / 4;grid-row:1">Interés alto ← → Interés bajo</div>
          <div class="eje-poder">Poder</div>
          <div class="cuadrante">
            <h4>Gestionar de cerca</h4>
            ${grupos.cerca.map((n) => `<span class="ficha-interesado">${n}</span>`).join("") || "<span class='meta'>Nadie en este cuadrante</span>"}
          </div>
          <div class="cuadrante">
            <h4>Mantener satisfechos</h4>
            ${grupos.satisfechos.map((n) => `<span class="ficha-interesado">${n}</span>`).join("") || "<span class='meta'>Nadie en este cuadrante</span>"}
          </div>
          <div class="cuadrante">
            <h4>Mantener informados</h4>
            ${grupos.informados.map((n) => `<span class="ficha-interesado">${n}</span>`).join("") || "<span class='meta'>Nadie en este cuadrante</span>"}
          </div>
          <div class="cuadrante">
            <h4>Monitorear</h4>
            ${grupos.monitorear.map((n) => `<span class="ficha-interesado">${n}</span>`).join("") || "<span class='meta'>Nadie en este cuadrante</span>"}
          </div>
          <div class="eje-interes">Interés</div>
        </div>
      </article>
    </div>
  `;

  const selI = document.getElementById("filtro-interesado");
  const selF = document.getElementById("filtro-frecuencia");
  selI.value = filtroInteresado;
  selF.value = filtroFrecuencia;
  selI.addEventListener("change", () => {
    filtroInteresado = selI.value;
    pintarTablaCom(data);
  });
  selF.addEventListener("change", () => {
    filtroFrecuencia = selF.value;
    pintarTablaCom(data);
  });
  pintarTablaCom(data);
}

function pintarTablaCom(data) {
  const tbody = document.querySelector("#tabla-com tbody");
  if (!tbody) return;
  const filas = data.comunicacion.filter((f) => {
    const okI = filtroInteresado === "todos" || f.interesado === filtroInteresado;
    const okF = filtroFrecuencia === "todos" || f.frecuencia === filtroFrecuencia;
    return okI && okF;
  });
  tbody.innerHTML = filas.map((f) => `
    <tr>
      <td>${f.interesado}</td>
      <td>${f.informacion}</td>
      <td><span class="etiqueta-canal ${claseCanal(f.canal)}">${f.canal}</span></td>
      <td><span class="etiqueta-freq ${claseFreq(f.frecuencia)}">${f.frecuencia}</span></td>
      <td>${f.responsable}</td>
    </tr>
  `).join("") || `<tr><td colspan="5">No hay filas con esos filtros.</td></tr>`;
}

function renderCierre(data) {
  document.getElementById("cierre").innerHTML = `
    <div class="col-6">
      <article class="tarjeta">
        <h3>Retroalimentación / observaciones</h3>
        <ol class="lista-obs">
          ${data.observaciones.map((o) => `<li>${o}</li>`).join("")}
        </ol>
      </article>
      <article class="tarjeta" style="margin-top:16px">
        <h3>Lecciones aprendidas</h3>
        <p class="significado">Retos reales del proyecto OficiosPro, convertidos en aprendizaje para el plan de comunicación y la siguiente iteración.</p>
        <ul class="lista-obs">
          ${data.observaciones.map((o) => `<li>${o}</li>`).join("")}
        </ul>
      </article>
    </div>
    <div class="col-6">
      <article class="tarjeta">
        <h3>Próximos pasos</h3>
        ${data.proximosPasos.map((a) => `
          <div class="accion">
            <p><strong>${a.accion}</strong></p>
            <p class="meta">Responsable: ${a.responsable} · Fecha objetivo: ${fmtFecha(a.fecha)} ·
              Prioridad: <span class="prio-${a.prioridad}">${a.prioridad}</span></p>
          </div>
        `).join("")}
      </article>
    </div>
  `;
}

function actualizarPresentacion() {
  document.body.classList.toggle("presentacion", presentacion);
  document.getElementById("pista-presentacion").hidden = !presentacion;
  document.getElementById("btn-presentacion").textContent = presentacion
    ? "Salir de presentación"
    : "Modo presentación";
  document.querySelectorAll(".seccion").forEach((sec, i) => {
    sec.classList.toggle("seccion-activa", presentacion && i === seccionActiva);
  });
  if (presentacion) {
    document.querySelectorAll(".seccion")[seccionActiva].scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  }
}

function initControles() {
  document.getElementById("btn-imprimir").onclick = () => window.print();
  document.getElementById("btn-presentacion").onclick = () => {
    presentacion = !presentacion;
    if (presentacion) seccionActiva = 0;
    actualizarPresentacion();
  };
  if (!window.__tableroTeclado) {
    window.__tableroTeclado = true;
    document.addEventListener("keydown", (ev) => {
      if (!presentacion) return;
      if (ev.key === "Escape") {
        presentacion = false;
        actualizarPresentacion();
      }
      if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
        seccionActiva = Math.min(3, seccionActiva + 1);
        actualizarPresentacion();
      }
      if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
        seccionActiva = Math.max(0, seccionActiva - 1);
        actualizarPresentacion();
      }
    });
  }
}

function init() {
  if (typeof DASHBOARD_DATA === "undefined") {
    document.getElementById("contenido").innerHTML = "<p>No se pudo cargar data.js.</p>";
    return;
  }
  const data = DASHBOARD_DATA;
  const calc = {
    avance: calcAvance(data),
    cronograma: calcCronograma(data),
    riesgos: calcRiesgos(data),
    calidad: calcCalidad(data),
    presupuesto: calcPresupuesto(data),
    uso: calcUso(data)
  };
  const general = estadoGeneral([
    calc.avance, calc.cronograma, calc.riesgos, calc.calidad, calc.presupuesto, calc.uso
  ]);

  chartDefaults();
  renderEncabezado(data, general);
  renderKpis(data, calc);
  renderVisualizaciones(data, calc);
  renderComunicacion(data);
  renderCierre(data);
  initControles();
}

document.addEventListener("DOMContentLoaded", init);