/* =====================================================================
   Moj Plan — trening, ishrana, suplementi
   Sve se čuva lokalno na telefonu (localStorage).
   ===================================================================== */
(() => {
"use strict";

// ---------------------------------------------------------------- utils
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const uid = () => Math.random().toString(36).slice(2, 9);

const DAY_FULL = ["Nedelja", "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota"];
const UDAY = ["u nedelju", "u ponedeljak", "u utorak", "u sredu", "u četvrtak", "u petak", "u subotu"];
const DAY_SHORT = ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"];
const MONTHS = ["januara", "februara", "marta", "aprila", "maja", "juna", "jula", "avgusta", "septembra", "oktobra", "novembra", "decembra"];
const serija = (n) => (n % 10 === 1 && n % 100 !== 11 ? "serija" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "serije" : "serija");
const num = (x) => String(x).replace(".", ",");

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
const diffDays = (a, b) => Math.round((a - b) / 86400000);
const sameDay = (a, b) => ymd(a) === ymd(b);
const fmtDate = (d) => `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
const fmtShort = (d) => `${d.getDate()}.${d.getMonth() + 1}.`;
const atTime = (d, hhmm) => { const [h, m] = hhmm.split(":").map(Number); const x = new Date(d); x.setHours(h, m, 0, 0); return x; };

const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

// ---------------------------------------------------------------- store
const KEY = "mojplan.v1";
const NOTIF_DEFAULT = { on: true, lead: 30, meals: true, supps: true, morning: true, morningTime: "07:00", shop: true };
let S;
function freshStore() {
  return { data: clone(DEFAULT_DATA), startDate: null, checks: {}, measures: [], shop: {}, shopExtra: [], notif: clone(NOTIF_DEFAULT) };
}
const isObj = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

// Popravlja plan: sve što nedostaje ili je pogrešnog oblika vraća iz originala.
function repairData(d) {
  if (!isObj(d)) return clone(DEFAULT_DATA);
  for (const [k, v] of Object.entries(DEFAULT_DATA)) {
    const cur = d[k];
    const ok = Array.isArray(v) ? Array.isArray(cur) : isObj(v) ? isObj(cur) : typeof cur === typeof v;
    if (!ok) d[k] = clone(v);
  }
  if (d.mealRotation.length !== 4 || d.mealRotation.some((w) => !Array.isArray(w) || w.length !== 7)) d.mealRotation = clone(DEFAULT_DATA.mealRotation);
  if (!d.months.length || d.months.some((m) => !isObj(m) || typeof m.focus !== "string")) d.months = clone(DEFAULT_DATA.months);
  if (Object.values(d.workouts).some((w) => !isObj(w) || !Array.isArray(w.items) || w.items.some((it) => !isObj(it) || typeof it.ex !== "string"))) d.workouts = clone(DEFAULT_DATA.workouts);
  for (const [id, m] of Object.entries(d.meals)) if (!isObj(m) || !Array.isArray(m.items)) d.meals[id] = { name: String(m && m.name || "Obrok"), items: [] };
  for (const [k, dt] of Object.entries(DEFAULT_DATA.dayTypes)) if (!isObj(d.dayTypes[k])) d.dayTypes[k] = clone(dt);
  for (const k of ["slotsTraining", "slotsRest", "supplements"]) if (d[k].some((x) => !isObj(x) || typeof x.time !== "string")) d[k] = clone(DEFAULT_DATA[k]);
  if (!isObj(d.smoothie) || !Array.isArray(d.smoothie.items) || !Array.isArray(d.smoothie.tips)) d.smoothie = clone(DEFAULT_DATA.smoothie);
  if (!Array.isArray(d.combos.good) || !Array.isArray(d.combos.bad)) d.combos = clone(DEFAULT_DATA.combos);
  for (const [id, e] of Object.entries(d.exercises)) if (!isObj(e) || !Array.isArray(e.tips)) d.exercises[id] = { ...(DEFAULT_DATA.exercises[id] || { name: String(id), en: "", muscles: "" }), tips: (DEFAULT_DATA.exercises[id] || {}).tips || [], ...(isObj(e) && typeof e.name === "string" ? { name: e.name } : {}) };
  // dopuna novih polja iz originalnog plana (za starije kopije)
  d.months.forEach((m, i) => { const o = DEFAULT_DATA.months[i]; if (o && o.reps && !("reps" in m)) m.reps = clone(o.reps); });
  for (const [dow, w] of Object.entries(d.workouts)) {
    const ow = DEFAULT_DATA.workouts[dow]; if (!ow) continue;
    w.items.forEach((it) => { if (it.iso === undefined) { const o = ow.items.find((x) => x.ex === it.ex); if (o && o.iso) it.iso = true; } });
  }
  // v2: priprema za obroke, uputstva za suplemente, koraci za smuti (ne dira tvoje izmene)
  for (const [id, om] of Object.entries(DEFAULT_DATA.meals)) {
    const m = d.meals[id]; if (!m) continue;
    // samo ako polje nikad nije postojalo — ono što si sam obrisao ostaje obrisano
    if (!("prep" in m)) m.prep = clone(om.prep || []);
    if (!("mins" in m) && om.mins) m.mins = om.mins;
  }
  for (const m of Object.values(d.meals)) if (!Array.isArray(m.prep)) m.prep = [];
  for (const s of d.supplements) {
    const o = DEFAULT_DATA.supplements.find((x) => x.id === s.id); if (!o) continue;
    if (!("how" in s) && o.how) s.how = clone(o.how);
    if (!("why" in s) && o.why) s.why = o.why;
    if (/^Svi prahovi/.test(s.note || "")) s.note = o.note;
  }
  // v3: samo ono što je u tvom planu — bez B12 i omega-3 kapsula koje sam ja dodao,
  // jedan šejk posle treninga (protein + kreatin), rastavić i smokve van obroka
  if (!(d.version >= 3)) {
    const def = (id) => DEFAULT_DATA.supplements.find((x) => x.id === id);
    d.supplements = d.supplements.filter((s) => !["b12", "omega", "kreatin"].includes(s.id));
    for (const s of d.supplements) {
      if (s.id === "protein" || s.id === "kreatin_o" || s.id === "k2") Object.assign(s, clone(def(s.id)));
      if (s.id === "rastavic" && s.time === "16:30") s.time = def("rastavic").time;
      if (s.id === "smokve" && s.time === "17:00") Object.assign(s, { time: def("smokve").time, note: def("smokve").note });
    }
    d.smoothie.items = clone(DEFAULT_DATA.smoothie.items);
    d.combos = clone(DEFAULT_DATA.combos);
    d.dailyCore = clone(DEFAULT_DATA.dailyCore);
    const k = d.knowledge.find((x) => x.id === "alternative"); if (k) k.body = k.body.replace("- Laneno seme, chia, orasi (ALA) — za DHA/EPA najbolje ulje iz algi", "- Laneno seme, chia seme, orasi");
    const sh = d.shops.find((x) => /K2 Komplex/.test(x.what) && x.where === "apoteka"); if (sh) sh.where = "";
    d.version = 3;
  }
  // v4: posle nezavisne provere — meseci po planu v2, zamene, pravila, suplementi bez ponavljanja,
  // tahini 2 kašike, Zona 2 i sredom, čaj na dan odmora bez šejka
  if (!(d.version >= 4)) {
    const D0 = DEFAULT_DATA;
    d.months = clone(D0.months);
    d.swaps = clone(D0.swaps);
    d.trainingRules = clone(D0.trainingRules);
    for (const id of ["hiit", "zone2", "toes"]) d.exercises[id] = clone(D0.exercises[id]);
    const wed = d.workouts[3];
    if (wed && Array.isArray(wed.items)) {
      for (const it of wed.items) if (it.ex === "hiit" && it.reps === "8–10 krugova") it.reps = "10 krugova";
      if (!wed.items.some((it) => it.ex === "zone2")) wed.items.push(clone(D0.workouts[3].items.find((it) => it.ex === "zone2")));
    }
    // suplementi: zadrži tvoje (dodate), zameni moje originalne novom, čistijom verzijom
    const mine = new Set(D0.supplements.map((s) => s.id));
    const custom = d.supplements.filter((s) => !mine.has(s.id) && !["b12", "omega", "kreatin"].includes(s.id));
    d.supplements = [...clone(D0.supplements), ...custom];
    d.meals.s_caj = clone(D0.meals.s_caj);
    d.meals.s_caj_o = clone(D0.meals.s_caj_o);
    for (const [k, dt] of Object.entries(d.dayTypes)) if (dt.rest && dt.spav === "s_caj") dt.spav = "s_caj_o";
    const ren = { d_zeleni: ["Zelena ovsena (smoothie/kaša)", "Zelena ovsena (smuti ili kaša)"], p_ovas: ["Ovsene + med + šejk", "Ovsene + džem/med + šejk"] };
    for (const [id, [a, b]] of Object.entries(ren)) if (d.meals[id] && d.meals[id].name === a) d.meals[id].name = b;
    for (const m of Object.values(d.meals)) if (Array.isArray(m.items)) m.items = m.items.map((x) => (x === "Pirinčane galete 5–6" ? "Pirinčane galete 5–6 kom" : x === "Pirinčane galete 3–4" ? "Pirinčane galete 3–4 kom" : x));
    d.nutritionRules = clone(D0.nutritionRules);
    d.dailyCore = clone(D0.dailyCore);
    d.smoothie.tips = clone(D0.smoothie.tips);
    const kp = d.knowledge.find((x) => x.id === "pojmovi"); if (kp) kp.body = kp.body.replace("Zona 2 | Lagan kardio u kome možeš da pričaš (≈60–70% maks. pulsa)", "Zona 2 | Lagan kardio u kome možeš da pričaš, ali ne i da pevaš");
    d.version = 4;
  }
  if (!Array.isArray(d.smoothie.steps)) d.smoothie.steps = clone(DEFAULT_DATA.smoothie.steps);
  // brojevi moraju biti brojevi (zaštita od pokvarene kopije)
  for (const w of Object.values(d.workouts)) for (const it of w.items) it.sets = Math.max(1, Math.min(20, parseInt(it.sets, 10) || 1));
  const COLORS = ["green", "purple", "orange", "blue", "brown", "gray"];
  for (const s of d.supplements) { if (!COLORS.includes(s.color)) s.color = "gray"; if (!/^\d{2}:\d{2}$/.test(s.time)) s.time = "08:00"; }
  return d;
}
function normalize() {
  S.data = repairData(S.data);
  if (!isObj(S.checks)) S.checks = {};
  const MK = ["weight", "waist", "bf", "muscle", "visceral"];
  S.measures = Array.isArray(S.measures) ? S.measures.filter((m) => isObj(m) && YMD_RE.test(m.date)).map((m) => {
    const r = { date: m.date };
    for (const k of MK) { const v = parseFloat(m[k]); if (Number.isFinite(v)) r[k] = v; }
    return r;
  }) : [];
  if (!Array.isArray(S.shopExtra)) S.shopExtra = [];
  S.shopExtra = S.shopExtra.filter((x) => typeof x === "string");
  if (!isObj(S.shop) || Object.values(S.shop).some((v) => !isObj(v))) S.shop = {};
  S.notif = { ...NOTIF_DEFAULT, ...(isObj(S.notif) ? S.notif : {}) };
  if (!(typeof S.startDate === "string" && YMD_RE.test(S.startDate))) S.startDate = null;
}
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); S = raw ? JSON.parse(raw) : null; } catch (e) { S = null; }
  try {
    if (!isObj(S)) S = freshStore();
    normalize();
  } catch (e) {
    // pokvareni podaci: sačuvaj ih sa strane, spasi merenja i start, kreni od originala
    try { if (raw) localStorage.setItem(KEY + ".pokvareno", raw); } catch (_) {}
    const old = isObj(S) ? S : {};
    S = freshStore();
    if (Array.isArray(old.measures)) S.measures = old.measures;
    if (typeof old.startDate === "string") S.startDate = old.startDate;
    normalize();
  }
  const lim = ymd(addDays(today(), -60));
  for (const k of Object.keys(S.checks)) if (k < lim) delete S.checks[k];
  // sačuvaj odmah posle popravke/prelaska na novu verziju podataka (da se ne radi pri svakom otvaranju)
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast("⚠️ Čuvanje nije uspelo"); }
  Notif.later();
}
const D = () => S.data;

// ---------------------------------------------------------------- plan logic
const TOTAL_WEEKS = DEFAULT_DATA.months.length * 4;

// Nedelja 1 počinje u ponedeljak. Start od ponedeljka do srede: računa se tekuća nedelja.
// Start od četvrtka do nedelje: dani do ponedeljka su "uvodni" (raspored kao nedelja 1),
// a Nedelja 1 kreće sledećeg ponedeljka — da prva nedelja ne bude skraćena.
function planBase(start) {
  const dow = start.getDay();
  return dow >= 1 && dow <= 3 ? mondayOf(start) : addDays(mondayOf(start), 7);
}
function planInfo(date) {
  const started = !!S.startDate;
  const start = started ? parseYmd(S.startDate) : today();
  const base = planBase(start);
  const before = started && date < start;
  const intro = date < base;
  let wi = Math.floor(diffDays(date, base) / 7);
  if (wi < 0) wi = 0;
  const finished = wi >= TOTAL_WEEKS;
  const months = D().months;
  const monthIdx = finished ? months.length - 1 : Math.floor(wi / 4);
  const month = months[monthIdx] || months[months.length - 1];
  const next = finished ? null : months[monthIdx + 1];
  const wim = (wi % 4) + 1;
  // deload: 4. nedelja meseca; u mesecima 4, 7 i 10 prva nedelja (a tada nema deloada na kraju prethodnog meseca,
  // da ne budu dve lake nedelje zaredom). Posle 12 meseci ciklus meseca 12 se ponavlja normalno.
  let deload = month.deloadWeek1 ? wim === 1 : wim === 4 && !(next && next.deloadWeek1);
  if (intro) deload = false;
  const dow = date.getDay();
  const mealWeek = wi % 4;
  const dayTypeKey = D().mealRotation[mealWeek][(dow + 6) % 7];
  const workout = D().workouts[dow] || null;
  return { started, before, intro, start, base, week: wi + 1, month, monthNo: monthIdx + 1, wim, deload, finished, dow, mealWeek, dayTypeKey, workout, rest: !workout };
}

function exImg(id) { return DEFAULT_DATA.exercises[id] && !(D().exercises[id] || {}).noImg ? `img/ex/${id}` : null; }

function resolveWorkout(info) {
  const w = info.workout; if (!w) return [];
  const swap = info.month.swap ? D().swaps[info.month.swap] : null;
  const rs = info.month.reps || {};
  return w.items.map((it, idx) => {
    let ex = it.ex, swappedFrom = null;
    if (swap && swap[ex] && D().exercises[swap[ex]]) { swappedFrom = ex; ex = swap[ex]; }
    let sets = it.sets;
    if (info.deload && !it.cardio) sets = Math.max(1, Math.round(sets * 0.6));
    let reps = it.reps;
    if (!it.core && !it.cardio && !info.deload && !info.intro) {
      const kind = it.main ? "main" : it.iso ? "iso" : "sec";
      if (rs[kind]) reps = rs[kind];
      // mesec 7: samo jedan težak set na glavnoj vežbi
      if (it.main && info.month.topSet) reps = `${reps} · 1 težak set ${info.month.topSet}`;
    }
    return { ...it, idx, ex, swappedFrom, sets, reps, origSets: it.sets };
  });
}
function restSeconds(rest) { const m = String(rest || "").match(/\d+/); return m ? Math.min(300, +m[0]) : 60; }

// ---------------------------------------------------------------- ui state
const TABS = ["danas", "trening", "kupovina", "vise"];
const UI = { tab: "danas", sub: null, trainDate: today(), nutDate: today(), suppType: null, shopNext: null };

const toTop = () => { const v = $("#view"); if (v) v.scrollTop = 0; };
let toastT;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2200);
}
function setTop(title, sub, back = false) {
  $("#topbar").innerHTML = `<div class="row">${back ? `<button class="icon-btn back" id="backBtn" aria-label="Nazad">‹</button>` : ""}<h1>${title}</h1><span class="grow"></span></div>${sub ? `<div class="sub">${sub}</div>` : ""}`;
  if (back) $("#backBtn").addEventListener("click", () => navBack());
}

function weekStrip(selDate, name) {
  const mon = mondayOf(selDate), t = today();
  let html = `<div class="weekstrip"><button class="arr" data-ws="${name}" data-shift="-7">‹</button><div class="days">`;
  for (let i = 0; i < 7; i++) {
    const d = addDays(mon, i);
    const tr = !!D().workouts[d.getDay()];
    html += `<button class="d ${sameDay(d, selDate) ? "on" : ""} ${sameDay(d, t) ? "today" : ""}" data-ws="${name}" data-date="${ymd(d)}">${DAY_SHORT[d.getDay()]}<b>${d.getDate()}</b><span class="dot ${tr ? "t" : ""}"></span></button>`;
  }
  return html + `</div><button class="arr" data-ws="${name}" data-shift="7">›</button></div>`;
}
function bindWeekStrip(name, getDate, setDate) {
  $$(`[data-ws="${name}"]`).forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.date) setDate(parseYmd(b.dataset.date)); else setDate(addDays(getDate(), +b.dataset.shift));
    render();
  }));
}
function planLine(info) {
  if (!info.started) return "Plan još nije pokrenut";
  if (info.before) return `Plan počinje ${fmtDate(info.start)}`;
  if (info.intro) return `Uvodni dani · Nedelja 1 kreće u ponedeljak, ${fmtDate(info.base)}`;
  if (info.finished) return `Nedelja ${info.week} · plan od 12 meseci je završen${info.deload ? " · deload" : ""}`;
  return `Nedelja ${info.week} · Mesec ${info.monthNo}${info.deload ? " · deload" : ""}`;
}

// =====================================================================
//  DANAS
// =====================================================================
// koliko grama neke namirnice (npr. bademi, tahini) ima u obrocima tog dana
function gramsInMeals(date, re) {
  const info = planInfo(date), dt = D().dayTypes[info.dayTypeKey] || {};
  let g = 0;
  for (const sl of info.rest ? D().slotsRest : D().slotsTraining) {
    const m = D().meals[dt[sl.key]]; if (!m) continue;
    for (const it of m.items) if (re.test(it)) { const p = parseItem(it); if (p && p.qty && p.unit === "g") g += p.qty; }
  }
  return g;
}
const KASIKA_G = 15; // 1 kašika tahinija ≈ 15 g
function buildDay(date) {
  const info = planInfo(date);
  const dt = D().dayTypes[info.dayTypeKey] || {};
  const slots = info.rest ? D().slotsRest : D().slotsTraining;
  const rows = [];
  for (const sl of slots) {
    if (sl.key === "trening") { rows.push({ type: "train", time: sl.time, id: "t", order: 1 }); continue; }
    rows.push({ type: "meal", time: sl.time, id: "m:" + sl.key, label: sl.label, mealId: dt[sl.key], meal: D().meals[dt[sl.key]], order: 2 });
  }
  for (const s0 of D().supplements) {
    if (s0.days === "train" && info.rest) continue;
    if (s0.days === "rest" && !info.rest) continue;
    // rastavić: 3 meseca piješ, pa 1 mesec pauza (meseci 4, 8 i 12 plana)
    if (s0.cycle && info.started && !info.intro && info.monthNo % 4 === 0) continue;
    let s = s0;
    if (s0.id === "bademi") {
      // potopi onoliko badema koliko treba sutra: smokve (osnova) + bademi iz sutrašnjih obroka
      const base = parseInt(s0.dose, 10) || 20, extra = gramsInMeals(addDays(date, 1), /badem/i);
      s = extra ? { ...s0, dose: `${base + extra} g`, note: `${base} g za smokve + ${extra} g za sutrašnju užinu.` }
                : { ...s0, dose: `${base} g`, note: s0.note || "Za sutrašnje smokve + bademe." };
    }
    if (s0.id === "tahini") {
      // ukupno 2 kašike dnevno: ono što već ima u obrocima se računa, ostatak ide uz večeru
      const inMeals = gramsInMeals(date, /tahini/i), rest = Math.max(0, 2 * KASIKA_G - inMeals);
      if (!rest) continue;
      const k = Math.round(rest / KASIKA_G);
      s = { ...s0, dose: `${k} ${k === 1 ? "kašika" : "kašike"} (≈${rest} g)`, note: inMeals ? `Ukupno 2 kašike dnevno — jedna je već u obroku. ${s0.note || ""}`.trim() : s0.note, shop: [`Tahini ${rest} g`] };
    }
    rows.push({ type: "supp", time: s.time, id: "s:" + s.id, s, order: 0 });
  }
  rows.sort((a, b) => a.time.localeCompare(b.time) || a.order - b.order);
  return { info, rows };
}

function updateBanner() {
  const u = window.__update;
  if (!u) return "";
  return `<a class="card hint ok upd" href="${esc(u.url)}"><b>⬇ Nova verzija aplikacije (${esc(u.tag)})</b><div class="small muted">Tapni da preuzmeš i instaliraš. Tvoji podaci ostaju.</div></a>`;
}

function renderToday() {
  const t = today();
  const { info, rows } = buildDay(t);
  setTop(`${DAY_FULL[t.getDay()]}, ${fmtDate(t)}`, planLine(info));
  const checks = S.checks[ymd(t)] || {};
  let h = updateBanner();

  if (!info.started) {
    h += `<div class="card hero">
      <div class="start-big">Spreman za start? 💪</div>
      <p class="muted" style="margin:4px 0 12px">Izaberi dan kada krećeš. Od tog dana aplikacija sama zna koja je nedelja, koji je trening i šta jedeš${isNative() ? " — i šalje ti podsetnike" : ""}.</p>
      <button class="btn primary big block" id="startNow">▶ Krećem danas</button>
      <div class="field mt"><label>…ili izaberi drugi datum</label><input type="date" id="startPick" value="${ymd(t)}"></div>
      <button class="btn block mt" id="startSet">Postavi početak</button>
    </div>
    <div class="section-title">Pregled: ovako izgleda jedan dan</div>`;
  } else if (info.before) {
    const n = diffDays(info.start, t);
    h += `<div class="card hero"><h2>Start za ${n} ${n === 1 ? "dan" : "dana"} 🚀</h2><p class="muted" style="margin:0">Plan kreće ${UDAY[info.start.getDay()]}, ${fmtDate(info.start)}. Do tada možeš da pregledaš treninge i ishranu.</p></div>
      <div class="section-title">Pregled: ovako izgleda jedan dan</div>`;
  } else if (info.intro) {
    h += `<div class="card hero"><h2>Uvodni dani 👟</h2><p class="muted" style="margin:0">Nedelja 1 kreće u ponedeljak, ${fmtDate(info.base)}. Do tada radi po rasporedu kao u nedelji 1.</p></div>`;
  } else if (info.finished) {
    h += `<div class="card hero"><h2>🏆 12 meseci završeno!</h2><p class="muted" style="margin:0">Plan nastavlja da se vrti kao mesec 12. U podešavanjima možeš da kreneš ispočetka.</p></div>`;
  }
  const preview = !info.started || info.before;

  if (info.started && !info.before && t.getDay() === 1) {
    const last = S.measures.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!last || diffDays(t, parseYmd(last.date)) >= 6)
      h += `<div class="card hint"><div class="row-between"><div><b>⚖️ Danas je merenje</b><div class="small muted">Ujutro, posle toaleta, pre jela i vode.</div></div><button class="btn primary" id="goMeasure">Upiši</button></div></div>`;
  }
  if (info.started && !info.before && info.workout && info.deload)
    h += `<div class="card hint"><b>🔋 Deload nedelja</b><div class="small muted">~40% manje serija, lakše, ne ideš do otkaza. Već je preračunato u treningu.</div></div>`;

  // opciono (npr. magnezijum) se ne računa u ukupno; podsetnici bez kružića takođe ne
  const checkable = rows.filter((r) => !(r.type === "supp" && (r.s.noCheck || r.s.optional)));
  const done = checkable.filter((r) => checks[r.id]).length;
  h += `<div class="row-between small muted"><span>${info.rest ? "🧘 Dan odmora" : `🏋️ Trening dan · ${esc(info.workout.title)}`}</span>${preview ? "" : `<span>Urađeno ${done}/${checkable.length}</span>`}</div>
        ${preview ? `<div style="margin-bottom:12px"></div>` : `<div class="progress" style="margin-bottom:14px"><i style="width:${checkable.length ? (done / checkable.length) * 100 : 0}%"></i></div>`}`;

  if (info.rest) {
    const r = D().restDays[info.dow] || { title: "Odmor", text: "" };
    h += `<div class="card"><h3>🧘 ${esc(r.subtitle || r.title)}</h3><div class="small muted">${esc(r.text)}</div></div>`;
  }

  h += `<div class="tl">`;
  for (const r of rows) {
    const on = !!checks[r.id];
    if (r.type === "train") {
      const w = info.workout;
      h += `<div class="tl-train-wrap ${on ? "done" : ""}"><button class="tl-train" id="openTrain">
        <div class="small muted">${esc(r.time)}–13:00 · ${esc(w.duration)}</div>
        <div class="big">${esc(w.title)} <span class="more">›</span></div>
        <div class="small muted">${esc(w.subtitle)} · ${w.items.length} vežbi${info.deload ? " · deload" : ""}</div>
      </button>${preview ? "" : `<button class="check ${on ? "on" : ""}" data-check="t" aria-label="Označi trening">✓</button>`}</div>`;
      continue;
    }
    let title, sub, kind;
    if (r.type === "meal") {
      title = `${esc(r.label)}${r.meal ? " — " + esc(r.meal.name) : ""}`;
      sub = r.meal ? esc(r.meal.items.join(" · ")) : "";
      kind = "c-meal";
    } else {
      title = esc(r.s.name) + (r.s.optional ? ' <span class="badge">opciono</span>' : "");
      sub = [r.s.dose, r.s.note].filter(Boolean).map(esc).join(" · ");
      kind = "c-" + (r.s.color || "gray");
    }
    const can = !preview && !(r.type === "supp" && r.s.noCheck);
    h += `<div class="tl-row ${on ? "done" : ""}">
      <div class="time">${esc(r.time)}</div>
      <button class="what" data-open="${esc(r.id)}"><div class="t"><span class="kind ${kind}"></span>${title}<span class="more">›</span></div>${sub ? `<div class="s">${sub}</div>` : ""}</button>
      ${can ? `<button class="check ${on ? "on" : ""}" data-check="${esc(r.id)}" aria-label="Označi">✓</button>` : "<span></span>"}
    </div>`;
  }
  h += `</div>`;
  const rowById = Object.fromEntries(rows.map((r) => [r.id, r]));

  const tm = addDays(t, 1), ti = planInfo(tm);
  h += `<div class="card mt small"><b>Sutra (${DAY_SHORT[tm.getDay()]}):</b> ${ti.workout ? `🏋️ ${esc(ti.workout.title)} — ${esc(ti.workout.subtitle)}` : "🧘 odmor"}.</div>`;

  $("#view").innerHTML = h;
  $$("[data-check]").forEach((b) => b.addEventListener("click", () => { toggleCheck(ymd(t), b.dataset.check); render(); }));
  $$("[data-open]").forEach((b) => b.addEventListener("click", () => {
    const r = rowById[b.dataset.open]; if (!r) return;
    if (r.type === "meal") openDetail({ kind: "meal", id: r.mealId, time: r.time, label: r.label, date: t, rowId: preview ? null : r.id });
    else openDetail({ kind: "supp", id: r.s.id, s: r.s, time: r.time, date: t, rowId: preview || r.s.noCheck ? null : r.id });
  }));
  $("#openTrain")?.addEventListener("click", () => { UI.trainDate = today(); go("trening"); });
  $("#goMeasure")?.addEventListener("click", () => { pushNav(); UI.tab = "vise"; UI.sub = "napredak"; render("left"); toTop(); });
  $("#startNow")?.addEventListener("click", () => setStart(ymd(today())));
  $("#startSet")?.addEventListener("click", () => { const v = $("#startPick").value; if (v) setStart(v); });
}

async function setStart(v) {
  S.startDate = v; save();
  const d = parseYmd(v);
  toast(sameDay(d, today()) ? "🚀 Plan je pokrenut — srećno!" : `📅 Start postavljen: ${fmtDate(d)}`);
  render();
  if (isNative() && S.notif.on) { await Notif.ensurePermission(); Notif.reschedule(); }
}

// =====================================================================
//  TRENING
// =====================================================================
function exCardHtml(it, i, opts = {}) {
  const ex = D().exercises[it.ex] || { name: it.ex, tips: [] };
  const img = exImg(it.ex);
  const from = it.swappedFrom ? D().exercises[it.swappedFrom] : null;
  return `<div class="ex">
    <div class="ex-img">${img ? `<img class="a" src="${img}-0.jpg" alt="" loading="lazy"><img class="b" src="${img}-1.jpg" alt="" loading="lazy">` : `<div class="noimg">${it.cardio ? "🏃" : "🏋️"}</div>`}<span class="num">${i + 1}</span></div>
    <div class="ex-body">
      <div class="ex-head"><div><div class="ex-name">${esc(ex.name)}</div><div class="ex-en">${esc(ex.en || "")}${ex.muscles ? " · " + esc(ex.muscles) : ""}</div>
      ${from ? `<div class="swapnote">↺ Zamena ovog meseca (umesto: ${esc(from.name)})</div>` : ""}</div>
      ${opts.edit ? `<button class="icon-btn" data-edit-item="${it.idx}" aria-label="Izmeni">✏️</button>` : ""}</div>
      <div class="ex-stats">
        <div><b>${it.cardio ? "1×" : it.sets}</b><span>${it.cardio ? "" : serija(it.sets)}</span></div>
        <div><b>${esc(it.reps)}</b><span>${it.cardio ? "trajanje" : "ponavljanja"}</span></div>
        <div><b>${esc(it.rest)}</b><span>pauza</span></div>
      </div>
      ${it.main ? `<span class="badge green">Glavna vežba</span>` : ""}${it.core ? `<span class="badge purple">Trbušnjaci</span>` : ""}${it.cardio ? `<span class="badge blue">Kardio</span>` : ""}${opts.deload && !it.cardio && it.origSets !== it.sets ? `<span class="badge orange">Deload: ${it.origSets}→${it.sets} ${serija(it.sets)}</span>` : ""}
      ${(ex.tips || []).length ? `<ul>${ex.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
    </div>
  </div>`;
}

function renderTraining() {
  const d = UI.trainDate, info = planInfo(d);
  setTop("Trening", `${DAY_FULL[d.getDay()]}, ${fmtDate(d)} · ${planLine(info)}`);
  let h = weekStrip(d, "tr");

  if (!info.workout) {
    const r = D().restDays[info.dow] || { title: "Odmor", text: "" };
    let next = null;
    for (let i = 1; i <= 7 && !next; i++) { const nd = addDays(d, i); if (D().workouts[nd.getDay()]) next = nd; }
    h += `<div class="card hero"><h2>🧘 ${esc(r.subtitle || r.title)}</h2><p class="muted" style="margin:6px 0 0">${esc(r.text)}</p></div>`;
    if (next) { const nw = D().workouts[next.getDay()]; h += `<div class="card small"><b>Sledeći trening:</b> ${DAY_FULL[next.getDay()]} — ${esc(nw.title)} (${esc(nw.subtitle)})</div>`; }
    $("#view").innerHTML = h;
    bindWeekStrip("tr", () => UI.trainDate, (x) => (UI.trainDate = x));
    return;
  }

  const w = info.workout, items = resolveWorkout(info);
  h += `<div class="card hero">
    <div class="row-between"><div><div class="small muted">${esc(w.duration)} · ${items.length} vežbi${info.deload ? " · 🔋 deload" : ""}</div><h2 style="font-size:24px;margin:2px 0">${esc(w.title)}</h2><div class="muted">${esc(w.subtitle)}</div></div>
    <button class="icon-btn" id="editWorkout" aria-label="Izmeni trening">✏️</button></div>
    ${items.length ? `<button class="btn primary big block mt" id="startFocus">▶ Započni trening</button>` : ""}
  </div>
  ${items.length ? `<div class="card small"><b>🔥 Zagrevanje:</b> ${esc(D().warmup)}</div>` : `<div class="empty">Nema vežbi za ovaj dan. Dodaj ih dugmetom ispod.</div>`}`;
  items.forEach((it, i) => (h += exCardHtml(it, i, { edit: true, deload: info.deload })));
  h += `<button class="btn block" id="addEx">＋ Dodaj vežbu</button>`;
  $("#view").innerHTML = h;

  bindWeekStrip("tr", () => UI.trainDate, (x) => (UI.trainDate = x));
  $("#editWorkout").addEventListener("click", () => editWorkoutHead(info.dow));
  $("#startFocus")?.addEventListener("click", () => openFocus(items, 0));
  $("#addEx").addEventListener("click", () => editItem(info.dow, -1));
  $$("[data-edit-item]").forEach((b) => b.addEventListener("click", () => editItem(info.dow, +b.dataset.editItem)));
}

// ---------- focus mode (jedna vežba po ekranu, bez upisivanja)
let timerInt = null;
function openFocus(items, idx) {
  if (!items || !items.length) return;
  const f = $("#focus");
  const done = {};
  let cur = idx, endAt = 0;
  // pauza se računa po satu (ne po otkucajima), pa radi i kad je ekran zaključan;
  // u Android aplikaciji na kraju pauze stiže obaveštenje sa zvukom/vibracijom
  const left = () => (endAt ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : 0);
  const stopTimer = (keepNotif) => { clearInterval(timerInt); timerInt = null; endAt = 0; if (!keepNotif) Notif.cancelRest(); };
  const mm = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const hide = () => { stopTimer(); f.hidden = true; document.body.style.overflow = ""; };
  const close = () => { hide(); closeLayer(); };
  // pauza se NE gasi kad pređeš na sledeću vežbu (posle poslednje serije i dalje teče)
  const move = (n) => { if (n < 0 || n >= items.length) return; cur = n; draw(); f.scrollTop = 0; };
  const finish = () => {
    if (sameDay(UI.trainDate, today())) { const k = ymd(today()); S.checks[k] ||= {}; S.checks[k].t = true; save(); }
    close(); toast("💪 Trening završen!"); render();
  };
  function draw() {
    const it = items[cur], ex = D().exercises[it.ex] || { name: it.ex }, img = exImg(it.ex);
    const n = it.cardio ? 0 : it.sets;
    f.innerHTML = `<div class="fh"><button class="btn ghost" id="fClose">✕ Zatvori</button><b>${cur + 1} / ${items.length}</b></div>
      <div class="fbody">
        <div class="ex-img">${img ? `<img class="a" src="${img}-0.jpg" alt=""><img class="b" src="${img}-1.jpg" alt="">` : `<div class="noimg">${it.cardio ? "🏃" : "🏋️"}</div>`}</div>
        <div class="fname">${esc(ex.name)}</div>
        <div class="muted small">${esc(ex.en || "")}${ex.muscles ? " · " + esc(ex.muscles) : ""}</div>
        ${cur === 0 ? `<div class="card small" style="margin:10px 0"><b>🔥 Prvo zagrevanje:</b> ${esc(D().warmup)}</div>` : ""}
        ${it.cardio
          ? `<div class="ex-stats" style="grid-template-columns:1fr"><div><b>${esc(it.reps)}</b><span>trajanje</span></div></div>`
          : `<div class="ex-stats"><div><b>${it.sets}</b><span>${serija(it.sets)}</span></div><div><b>${esc(it.reps)}</b><span>ponavljanja</span></div><div><b>${esc(it.rest)}</b><span>pauza</span></div></div>`}
        ${n ? `<div class="small muted">Tapni seriju kad je završiš — kreće pauza:</div><div class="sets">${Array.from({ length: n }, (_, k) => `<button class="${done[cur + ":" + k] ? "on" : ""}" data-set="${k}">${k + 1}</button>`).join("")}</div>` : ""}
        ${it.cardio && !timerInt ? "" : `<div class="timer ${timerInt ? "run" : ""}"><div class="small muted">Pauza</div><div class="tt" id="fTT">${mm(timerInt ? left() : restSeconds(it.rest))}</div>
          <div class="btn-row" style="justify-content:center"><button class="btn" id="fT">${timerInt ? "■ Stop" : "▶ Pauza " + restSeconds(it.rest) + " s"}</button><button class="btn" id="fT30">+30 s</button></div></div>`}
        ${(ex.tips || []).length ? `<ul class="bul small" style="color:#cbd3d9">${ex.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
        <div class="small muted" style="text-align:center;margin:8px 0">← prevuci za sledeću / prethodnu vežbu →</div>
      </div>
      <div class="fnav"><button class="btn big" id="fPrev" ${cur === 0 ? "disabled" : ""}>‹ Prethodna</button>
      <button class="btn primary big" id="fNext">${cur === items.length - 1 ? "✓ Gotovo" : "Sledeća ›"}</button></div>`;
    const exName = ex.name;
    const tick = () => {
      const l = left(); const tt = $("#fTT"); if (tt) tt.textContent = mm(l);
      if (l <= 0) { stopTimer(true); try { navigator.vibrate?.([300, 150, 300]); } catch (e) {} draw(); }
    };
    const startTimer = (secs) => {
      stopTimer(); endAt = Date.now() + secs * 1000;
      Notif.scheduleRest(endAt, `Sledeća serija: ${exName}`);
      timerInt = setInterval(tick, 500);
      draw();
    };
    $("#fClose").onclick = close;
    $("#fPrev").onclick = () => move(cur - 1);
    $("#fNext").onclick = () => (cur === items.length - 1 ? finish() : move(cur + 1));
    if (!$("#fT")) { /* kardio bez pauze */ }
    else $("#fT").onclick = () => { if (timerInt) { stopTimer(); draw(); } else startTimer(restSeconds(it.rest)); };
    if ($("#fT30")) $("#fT30").onclick = () => {
      if (!timerInt) return startTimer(restSeconds(it.rest) + 30);
      endAt += 30000; Notif.scheduleRest(endAt, `Sledeća serija: ${exName}`); tick();
    };
    $$("[data-set]", f).forEach((b) => (b.onclick = () => {
      const k = cur + ":" + b.dataset.set; done[k] = !done[k];
      if (done[k]) startTimer(restSeconds(it.rest)); else draw();
    }));
  }
  f._swipe = (dir) => move(cur + (dir === "left" ? 1 : -1));
  f.hidden = false; document.body.style.overflow = "hidden"; draw();
  openLayer(hide);
}

// =====================================================================
//  KUPOVINA (sabrano iz jelovnika za celu nedelju)
// =====================================================================
const FOODS = [
  // [regex, naziv, kategorija, konverzija]
  [/galet/i, "Pirinčane galete", "Žitarice i skrob"],
  [/protein/i, "Vege protein (prah)", "Proteini"],
  [/tofu/i, "Tofu", "Proteini"],
  [/tempeh/i, "Tempeh", "Proteini"],
  [/tvp|sojin/i, "TVP (sojine mrvice)", "Proteini"],
  [/jaj/i, "Jaja", "Proteini"],
  [/mladi sir/i, "Mladi sir", "Proteini"],
  [/feta/i, "Feta", "Proteini"],
  [/sočiv|sociv/i, "Sočivo (suvo)", "Mahunarke", "dry"],
  [/beli pasulj/i, "Beli pasulj (suvi)", "Mahunarke", "dry"],
  [/crni pasulj/i, "Crni pasulj (suvi)", "Mahunarke", "dry"],
  [/pasulj/i, "Pasulj — bilo koji (suvi)", "Mahunarke", "dry"],
  [/humus/i, "Humus", "Mahunarke"],
  [/ovsen/i, "Ovsene pahuljice", "Žitarice i skrob"],
  [/heljd/i, "Heljda", "Žitarice i skrob"],
  [/proso/i, "Proso", "Žitarice i skrob"],
  [/kinoa/i, "Kinoa", "Žitarice i skrob"],
  [/integralni pirinač/i, "Integralni pirinač", "Žitarice i skrob"],
  [/pirinač|pirinac/i, "Pirinač", "Žitarice i skrob"],
  [/bulgur/i, "Bulgur", "Žitarice i skrob"],
  [/testenin/i, "Integralna testenina", "Žitarice i skrob"],
  [/hleb/i, "Integralni hleb", "Žitarice i skrob"],
  [/krompir/i, "Krompir", "Žitarice i skrob"],
  [/banan/i, "Banane", "Voće", "banana"],
  [/jabuk/i, "Jabuke", "Voće", "jabuka"],
  [/bobič|bobic/i, "Bobičasto voće", "Voće"],
  [/sok od narand/i, "Sok od narandže", "Voće"],
  [/avokado/i, "Avokado", "Voće"],
  [/smokv/i, "Suve smokve", "Semenke i orašasto"],
  [/^voće|^voce/i, "Voće (po izboru)", "Voće"],
  [/spanać|spanac/i, "Spanać", "Povrće"],
  [/tikvic|paprik/i, "Tikvice / paprika", "Povrće"],
  [/pečurk|pecurk/i, "Pečurke", "Povrće"],
  [/šargarep|sargarep/i, "Šargarepa / krastavac", "Povrće"],
  [/paradajz sos/i, "Paradajz sos", "Ostalo"],
  [/paradajz/i, "Paradajz", "Povrće"],
  [/salat/i, "Salata", "Povrće"],
  [/povrće|povrce/i, "Povrće: brokoli, paprika, tikvice, šargarepa (mešano)", "Povrće"],
  [/salsa/i, "Salsa", "Ostalo"],
  [/lan\b|lan$|^mleveni lan/i, "Mleveni lan (ili chia)", "Semenke i orašasto"],
  [/bundev/i, "Bundeva semenke", "Semenke i orašasto"],
  [/tahini/i, "Tahini", "Semenke i orašasto"],
  [/susam/i, "Susam", "Semenke i orašasto"],
  [/badem/i, "Bademi", "Semenke i orašasto"],
  [/mleko/i, "Biljno mleko", "Ostalo"],
  [/ulje/i, "Maslinovo ulje", "Ostalo"],
  [/džem|dzem|med\b/i, "Džem / med", "Ostalo"],
  [/kakao/i, "Kakao", "Ostalo"],
  [/cimet/i, "Cimet", "Ostalo"],
  [/čaj|caj/i, "Čaj (kamilica / nana)", "Ostalo"],
];
const CAT_ORDER = ["Proteini", "Mahunarke", "Žitarice i skrob", "Voće", "Povrće", "Semenke i orašasto", "Ostalo"];
const SKIP = /^(voda|so|opciono)(\s|:|$)/i;

// jedinice: g, kg, ml, l, dl, kom — sve se svodi na g / ml / kom
function normUnit(qty, unit) {
  const u = (unit || "kom").toLowerCase();
  if (u === "kg") return { qty: qty * 1000, unit: "g" };
  if (u === "l") return { qty: qty * 1000, unit: "ml" };
  if (u === "dl") return { qty: qty * 100, unit: "ml" };
  return { qty, unit: u };
}
const NUM = "(\\d+(?:[.,]\\d+)?)";
function parseItem(line) {
  let s = String(line).replace(/\(.*?\)/g, " ").replace(/\s+/g, " ").trim();
  if (!s || SKIP.test(s)) return null;
  const n = (x) => +String(x).replace(",", ".");
  // "200 g tofu", "0,5 kg banana"
  let m = s.match(new RegExp(`^${NUM}\\s*(g|kg|ml|l|dl)\\s+(.+)$`, "i"));
  if (m) return { name: m[3], ...normUnit(n(m[1]), m[2]) };
  // "2 jaja"
  m = s.match(/^(\d+)\s+(.+)$/);
  if (m) return { name: m[2], qty: +m[1], unit: "kom" };
  // "Tofu 200 g", "Galete 5–6 kom", "Mleko 1 l"
  m = s.match(new RegExp(`^(.+?)\\s+${NUM}(?:\\s*[–-]\\s*${NUM})?\\s*(g|kg|ml|l|dl|kom)?(?:\\s|$)`, "i"));
  if (m) return { name: m[1].trim(), ...normUnit(n(m[3] || m[2]), m[4]) };
  return { name: s, qty: null, unit: "" };
}
// začini i osnovno iz koraka pripreme — za proveru da imaš kod kuće
const PANTRY = ["Jodirana so", "Biber", "Aleva paprika", "Kim", "Beli luk", "Crni luk", "Limun", "Soja sos", "Lovor"];
function shoppingFor(from, days = 7) {
  const acc = {};
  const add = (raw) => {
    for (const part of String(raw).split(/\s\+\s/)) {
      const p = parseItem(part); if (!p) continue;
      const f = FOODS.find((x) => x[0].test(p.name));
      const name = f ? f[1] : p.name.charAt(0).toUpperCase() + p.name.slice(1);
      const cat = f ? f[2] : "Ostalo";
      let { qty, unit } = p;
      if (f && qty != null) {
        if (f[3] === "dry" && unit === "g") qty = qty * 0.4;
        if (f[3] === "banana" && unit === "g") { qty = qty / 120; unit = "kom"; }
        if (f[3] === "jabuka" && unit === "g") { qty = qty / 180; unit = "kom"; }
      }
      const k = name + "|" + (qty != null ? unit : "");
      acc[k] ||= { name, cat, unit: qty != null ? unit : "", qty: 0, has: qty != null };
      if (qty != null) acc[k].qty += qty;
    }
  };
  for (let i = 0; i < days; i++) {
    const d = addDays(from, i), { rows } = buildDay(d);
    for (const r of rows) {
      if (r.type === "meal" && r.meal) r.meal.items.forEach(add);
      // suplementi/hrana koji se kupuju (npr. protein za šejk, tahini koji nije u obrocima)
      if (r.type === "supp" && Array.isArray(r.s.shop)) r.s.shop.forEach(add);
    }
    (D().shopDaily || []).forEach(add);
  }
  // stavka bez količine (npr. "Spanać") uz istu sa količinom → "+ po potrebi"
  const list = Object.values(acc);
  for (const x of list) if (x.has && list.some((y) => y !== x && y.name === x.name && !y.has)) x.plus = true;
  return list.filter((x) => x.has || !list.some((y) => y !== x && y.name === x.name && y.has));
}
function fmtQty(x) {
  if (!x.has) return "po potrebi";
  const up = (v, step) => Math.ceil(v / step - 1e-9) * step; // zaokruživanje NAVIŠE
  let s;
  if (x.unit === "g") s = x.qty >= 1000 ? `${num(up(x.qty, 100) / 1000)} kg` : `${Math.max(10, up(x.qty, 10))} g`;
  else if (x.unit === "ml") s = x.qty >= 1000 ? `${num(up(x.qty, 100) / 1000)} L` : `${up(x.qty, 10)} ml`;
  else s = `${Math.ceil(x.qty - 1e-9)} kom`;
  return x.plus ? `${s} + po potrebi` : s;
}

function renderShopping() {
  const t = today();
  if (UI.shopNext === null) UI.shopNext = t.getDay() === 6 || t.getDay() === 0;
  // "Ova nedelja" = od danas do nedelje (prošli dani se ne kupuju); "Sledeća" = ceo naredni ponedeljak–nedelja
  const mon = UI.shopNext ? addDays(mondayOf(t), 7) : mondayOf(t);
  const from = UI.shopNext ? mon : t;
  const sun = addDays(mon, 6);
  const wk = ymd(mon);
  const got = (S.shop[wk] ||= {});
  setTop("Kupovina", `${fmtShort(from)} – ${fmtShort(sun)} · sabrano iz jelovnika`);
  const list = shoppingFor(from, diffDays(sun, from) + 1);
  const total = list.length + S.shopExtra.length;
  const doneN = list.filter((x) => got[x.name]).length + S.shopExtra.filter((x) => got["+" + x]).length;
  let h = `<div class="seg"><button data-sn="0" class="${!UI.shopNext ? "on" : ""}">Ova nedelja</button><button data-sn="1" class="${UI.shopNext ? "on" : ""}">Sledeća nedelja</button></div>
    <div class="row-between small muted"><span>Kupljeno</span><span>${doneN}/${total}</span></div>
    <div class="progress" style="margin-bottom:14px"><i style="width:${total ? (doneN / total) * 100 : 0}%"></i></div>`;
  for (const cat of CAT_ORDER) {
    const items = list.filter((x) => x.cat === cat).sort((a, b) => a.name.localeCompare(b.name, "sr"));
    if (!items.length) continue;
    h += `<div class="section-title">${esc(cat)}</div><div class="card shop">`;
    for (const x of items) {
      const on = !!got[x.name];
      h += `<button class="shop-row ${on ? "on" : ""}" data-got="${esc(x.name)}"><span class="check ${on ? "on" : ""}">✓</span><span class="nm">${esc(x.name)}</span><span class="q">${fmtQty(x)}</span></button>`;
    }
    h += `</div>`;
  }
  h += `<div class="section-title">Dodato ručno</div><div class="card shop">`;
  for (const x of S.shopExtra) {
    const on = !!got["+" + x];
    h += `<div class="shop-row-wrap"><button class="shop-row ${on ? "on" : ""}" data-got="+${esc(x)}"><span class="check ${on ? "on" : ""}">✓</span><span class="nm">${esc(x)}</span></button><button class="icon-btn" data-xdel="${esc(x)}" aria-label="Ukloni">✕</button></div>`;
  }
  h += `<div class="add-row"><input id="xNew" placeholder="npr. kesice za zamrzivač"><button class="btn" id="xAdd">Dodaj</button></div></div>`;
  h += `<div class="section-title">Začini i osnovno — proveri da imaš</div><div class="card shop">`;
  for (const p of PANTRY) {
    const on = !!got["z:" + p];
    h += `<button class="shop-row ${on ? "on" : ""}" data-got="z:${esc(p)}"><span class="check ${on ? "on" : ""}">✓</span><span class="nm">${esc(p)}</span></button>`;
  }
  h += `</div><div class="small muted" style="margin:8px 2px">Mahunarke su preračunate na suve (kuvano ≈ 2,5× teže od suvog). Količine su zaokružene naviše. Prahovi i suplementi traju duže, pa ih ovde nema (osim proteina za šejk).</div>`;
  $("#view").innerHTML = h;
  $$("[data-sn]").forEach((b) => b.addEventListener("click", () => { UI.shopNext = b.dataset.sn === "1"; render(); }));
  $$("[data-got]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.got; got[k] = !got[k]; if (!got[k]) delete got[k];
    for (const w of Object.keys(S.shop)) if (w < ymd(addDays(mondayOf(t), -14))) delete S.shop[w];
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    render();
  }));
  $$("[data-xdel]").forEach((b) => b.addEventListener("click", () => { S.shopExtra = S.shopExtra.filter((x) => x !== b.dataset.xdel); save(); render(); }));
  const addX = () => { const v = $("#xNew").value.trim(); if (!v) return; if (!S.shopExtra.includes(v)) S.shopExtra.push(v); save(); render(); };
  $("#xAdd").addEventListener("click", addX);
  $("#xNew").addEventListener("keydown", (e) => { if (e.key === "Enter") addX(); });
}

// =====================================================================
//  VIŠE — meni i podstrane
// =====================================================================
const MORE_ITEMS = [
  { id: "napredak", icon: "⚖️", t: "Merenje i napredak", s: "Težina, struk, body fat, mišići" },
  { id: "jelovnik", icon: "🍽️", t: "Jelovnik", s: "Obroci za bilo koji dan, izmene obroka" },
  { id: "suplementi", icon: "💊", t: "Suplementi i smuti", s: "Raspored, recept, pravila, kombinacije" },
  { id: "saveti", icon: "📖", t: "Plan i saveti", s: "12 meseci, pravila, proteini, recepti" },
  { id: "podesavanja", icon: "⚙️", t: "Podešavanja", s: "Obaveštenja, start plana, rezervna kopija" },
];
function renderMore() {
  if (UI.sub) return ({ napredak: renderProgress, jelovnik: renderNutrition, suplementi: renderSupps, saveti: renderTips, podesavanja: renderSettings })[UI.sub]();
  setTop("Više", "");
  let h = updateBanner() + `<div class="card menu">`;
  for (const m of MORE_ITEMS) h += `<button class="menu-row" data-sub="${m.id}"><span class="mi">${m.icon}</span><span><b>${m.t}</b><span class="small muted">${m.s}</span></span><span class="chev">›</span></button>`;
  h += `</div><div class="small muted" style="text-align:center;margin-top:10px">Moj Plan${window.APP_BUILD ? " · verzija " + window.APP_BUILD : ""}</div>`;
  $("#view").innerHTML = h;
  $$("[data-sub]").forEach((b) => b.addEventListener("click", () => openSub(b.dataset.sub)));
}

// ---------- jelovnik
function renderNutrition() {
  const d = UI.nutDate, info = planInfo(d);
  const dt = D().dayTypes[info.dayTypeKey] || {};
  setTop("Jelovnik", `${DAY_FULL[d.getDay()]}, ${fmtDate(d)} · nedelja jelovnika ${info.mealWeek + 1}/4`, true);
  let h = weekStrip(d, "nu");
  const slots = info.rest ? D().slotsRest : D().slotsTraining;
  h += `<div class="card"><h2>${info.rest ? "🧘 Dan odmora" : `🏋️ Trening dan · ${esc(info.workout.title)}`}</h2>`;
  for (const sl of slots) {
    if (sl.key === "trening") {
      h += `<div class="meal train"><div class="time">${esc(sl.time)}</div><div><div class="lbl">Trening</div><div class="nm">${esc(info.workout?.title || "")} · voda tokom treninga</div></div><span></span></div>`;
      continue;
    }
    const m = D().meals[dt[sl.key]];
    h += `<div class="meal"><div class="time">${esc(sl.time)}</div><button class="what" data-open-meal="${esc(dt[sl.key] || "")}" data-time="${esc(sl.time)}" data-label="${esc(sl.label)}"><div class="lbl">${esc(sl.label)}</div>
      <div class="nm">${m ? esc(m.name) : "—"}<span class="more">›</span></div>${m ? `<ul>${m.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}</button>
      <button class="icon-btn" data-meal-slot="${esc(sl.key)}" aria-label="Izmeni">✏️</button></div>`;
  }
  h += `</div><details class="acc"><summary>📋 Svi obroci (${Object.keys(D().meals).length})</summary><div class="acc-body">`;
  for (const [id, m] of Object.entries(D().meals)) h += `<div class="kv"><span><b>${esc(m.name)}</b><br><span class="small muted">${esc(m.items.join(" · "))}</span></span><span><button class="icon-btn" data-meal-id="${esc(id)}">✏️</button></span></div>`;
  h += `</div></details>`;
  $("#view").innerHTML = h;
  bindWeekStrip("nu", () => UI.nutDate, (x) => (UI.nutDate = x));
  $$("[data-open-meal]").forEach((b) => b.addEventListener("click", () => { if (b.dataset.openMeal) openDetail({ kind: "meal", id: b.dataset.openMeal, time: b.dataset.time, label: b.dataset.label, date: d }); }));
  $$("[data-meal-slot]").forEach((b) => b.addEventListener("click", () => editMealSlot(info.dayTypeKey, b.dataset.mealSlot)));
  $$("[data-meal-id]").forEach((b) => b.addEventListener("click", () => editMeal(b.dataset.mealId)));
}

// ---------- suplementi
function renderSupps() {
  const ti = planInfo(today());
  if (!UI.suppType) UI.suppType = ti.rest ? "rest" : "train";
  setTop("Suplementi", "Šta, koliko i kada", true);
  const isRest = UI.suppType === "rest";
  let h = `<div class="seg"><button data-st="train" class="${!isRest ? "on" : ""}">🏋️ Trening dan</button><button data-st="rest" class="${isRest ? "on" : ""}">🧘 Dan odmora</button></div><div class="card">`;
  const list = D().supplements.filter((s) => s.days === "all" || (s.days === "rest") === isRest).sort((a, b) => a.time.localeCompare(b.time));
  for (const s of list) {
    h += `<div class="supp"><div class="time">${esc(s.time)}</div><button class="what" data-open-supp="${esc(s.id)}"><div class="nm"><span class="kind c-${s.color || "gray"}"></span>${esc(s.name)} ${s.optional ? '<span class="badge">opciono</span>' : ""}<span class="more">›</span></div>
      ${s.dose ? `<div class="dose">${esc(s.dose)}</div>` : ""}<div class="note">${esc(s.note || "")}</div></button>
      <button class="icon-btn" data-supp="${esc(s.id)}">✏️</button></div>`;
  }
  h += `<button class="btn block mt" id="addSupp">＋ Dodaj suplement</button></div>`;
  const sm = D().smoothie;
  h += `<div class="section-title">Recept <button class="icon-btn" id="editSmoothie">✏️</button></div>
  <div class="card"><h2>🥤 ${esc(sm.title)}</h2><div class="small muted" style="margin-bottom:6px">${esc(sm.subtitle)}</div>`;
  for (const i of sm.items) h += `<div class="ing"><div>${esc(i.name)}<div class="w">${esc(i.why)}</div></div><div class="q">${esc(i.dose)}</div></div>`;
  if ((sm.steps || []).length) h += `<div class="sh-sec">Priprema</div><ol class="sh-ol">${sm.steps.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>`;
  h += `<ul class="bul small muted">${sm.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`;
  h += `<div class="section-title">5 zlatnih pravila <button class="icon-btn" id="editGolden">✏️</button></div><div class="card">`;
  D().golden.forEach((g, i) => (h += `<div class="kv one"><span><b>${i + 1}. ${esc(g.t)}</b><br><span class="small muted">${esc(g.d)}</span></span></div>`));
  h += `<div class="small mt" style="color:var(--accent)">⏳ ${esc(D().results)}</div></div>`;
  h += `<div class="section-title">Kombinacije <button class="icon-btn" id="editCombos">✏️</button></div><div class="combo">`;
  for (const c of D().combos.good) h += `<div class="c good"><b>✅ ${esc(c.t)}</b>${esc(c.d)}</div>`;
  for (const c of D().combos.bad) h += `<div class="c bad"><b>❌ ${esc(c.t)}</b>${esc(c.d)}</div>`;
  h += `</div><div class="section-title">Šta mora u hrani svaki dan <button class="icon-btn" id="editCore">✏️</button></div><div class="card">`;
  for (const c of D().dailyCore) h += `<div class="kv one"><span><b>${esc(c.t)}</b><br><span class="small muted">${esc(c.d)}</span></span></div>`;
  h += `</div><div class="section-title">Gde kupujem <button class="icon-btn" id="editShops">✏️</button></div><div class="card">`;
  for (const s of D().shops) h += `<div class="kv"><span>${esc(s.what)}${s.where ? `<br><span class="small muted">${esc(s.where)}</span>` : ""}</span><span>${esc(s.price)}</span></div>`;
  h += `</div><div class="small muted" style="margin:6px 2px">Ako imaš neku dijagnozu ili terapiju, doze uskladi sa lekarom.</div>`;
  $("#view").innerHTML = h;
  $$("[data-st]").forEach((b) => b.addEventListener("click", () => { UI.suppType = b.dataset.st; render(); }));
  $$("[data-supp]").forEach((b) => b.addEventListener("click", () => editSupp(b.dataset.supp)));
  $$("[data-open-supp]").forEach((b) => b.addEventListener("click", () => openDetail({ kind: "supp", id: b.dataset.openSupp })));
  $("#addSupp").addEventListener("click", () => editSupp(null));
  $("#editSmoothie").addEventListener("click", editSmoothie);
  $("#editGolden").addEventListener("click", () => editPairs("5 zlatnih pravila", D().golden, (v) => (D().golden = v), "Naslov | objašnjenje"));
  $("#editCombos").addEventListener("click", editCombos);
  $("#editCore").addEventListener("click", () => editPairs("Šta mora u hrani", D().dailyCore, (v) => (D().dailyCore = v), "Naslov | objašnjenje"));
  $("#editShops").addEventListener("click", () => editTriples("Gde kupujem", D().shops, (v) => (D().shops = v)));
}

// ---------- plan i saveti
function bodyToHtml(body) {
  const lines = String(body || "").split("\n");
  let h = "", inList = false;
  const close = () => { if (inList) { h += "</ul>"; inList = false; } };
  for (const raw of lines) {
    const l = raw.trim(); if (!l) { close(); continue; }
    if (l.startsWith("## ")) { close(); h += `<h4>${esc(l.slice(3))}</h4>`; }
    else if (l.startsWith("- ")) { if (!inList) { h += `<ul class="bul">`; inList = true; } h += `<li>${esc(l.slice(2))}</li>`; }
    else if (l.includes(" | ")) { close(); const [a, ...b] = l.split(" | "); h += `<div class="kv"><span>${esc(a)}</span><span>${esc(b.join(" | "))}</span></div>`; }
    else { close(); h += `<p>${esc(l)}</p>`; }
  }
  close(); return h;
}
function renderTips() {
  setTop("Plan i saveti", "Sve beleške na jednom mestu", true);
  const cur = planInfo(today());
  let h = `<details class="acc"><summary><span>🗓️</span>Plan po mesecima (12)</summary><div class="acc-body">`;
  D().months.forEach((m, i) => {
    const now = cur.started && !cur.before && cur.monthNo === i + 1;
    h += `<div class="kv one ${now ? "now" : ""}"><span><b>Mesec ${i + 1}: ${esc(m.focus)}</b>${now ? ' <span class="badge green">sada</span>' : ""}<br><span class="small muted">${esc(m.text)}</span></span><button class="icon-btn" data-month="${i}">✏️</button></div>`;
  });
  h += `<p class="small muted">Svaki mesec: 3 nedelje napred + 1 deload (4. nedelja; u mesecima 4, 7 i 10 prva nedelja — nikad dve lake nedelje zaredom). Broj ponavljanja u treningu se sam menja po mesecu.</p></div></details>`;
  h += `<details class="acc"><summary><span>🏋️</span>Pravila treninga</summary><div class="acc-body"><ul class="bul">${D().trainingRules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul><div class="btn-row"><button class="btn" id="editRules">✏️ Izmeni</button></div></div></details>`;
  h += `<details class="acc"><summary><span>🍽️</span>Pravila ishrane i dnevni cilj</summary><div class="acc-body">`;
  for (const t of D().nutritionTargets) h += `<div class="kv"><span><b>${esc(t.label)}</b><br><span class="small muted">${esc(t.macro)}</span></span><span>${esc(t.kcal)}</span></div>`;
  h += `<ul class="bul">${D().nutritionRules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul><div class="btn-row"><button class="btn" id="editNRules">✏️ Izmeni</button></div></div></details>`;
  for (const k of D().knowledge) h += `<details class="acc"><summary><span>${esc(k.icon || "📄")}</span>${esc(k.title)}</summary><div class="acc-body">${bodyToHtml(k.body)}<div class="btn-row"><button class="btn" data-kedit="${esc(k.id)}">✏️ Izmeni</button></div></div></details>`;
  h += `<button class="btn block" id="kAdd">＋ Nova beleška</button>`;
  $("#view").innerHTML = h;
  $$("[data-month]").forEach((b) => b.addEventListener("click", () => editMonth(+b.dataset.month)));
  $("#editRules").addEventListener("click", () => editLines("Pravila treninga", D().trainingRules, (v) => (D().trainingRules = v)));
  $("#editNRules").addEventListener("click", () => editLines("Pravila ishrane", D().nutritionRules, (v) => (D().nutritionRules = v)));
  $$("[data-kedit]").forEach((b) => b.addEventListener("click", () => editKnowledge(b.dataset.kedit)));
  $("#kAdd").addEventListener("click", () => editKnowledge(null));
}

// ---------- napredak
const METRICS = [
  { k: "weight", label: "Težina", unit: "kg", goodUp: true },
  { k: "waist", label: "Struk", unit: "cm", goodUp: false },
  { k: "bf", label: "Body fat", unit: "%", goodUp: false },
  { k: "muscle", label: "Mišići", unit: "kg", goodUp: true },
  { k: "visceral", label: "Visceralna mast", unit: "", goodUp: false },
];
const sortedMeasures = () => S.measures.slice().sort((a, b) => a.date.localeCompare(b.date));
function nearestBefore(list, date, days) {
  const target = addDays(parseYmd(date), -days);
  let best = null;
  for (const m of list) if (parseYmd(m.date) <= target) best = m;
  return best;
}
function adviceHtml() {
  const L = sortedMeasures().filter((m) => m.weight);
  if (L.length < 2) return `<div class="card hint ok small">Posle 2–3 nedeljna merenja ovde dobijaš savet da li treba dodati ili skinuti kalorije.</div>`;
  const last = L[L.length - 1], ref = nearestBefore(L, last.date, 13), out = [];
  if (ref && ref !== last) {
    // cilj iz tvog plana: +0,2 do +0,4 kg nedeljno; korekcija ±150 kcal
    const rate = (last.weight - ref.weight) / (diffDays(parseYmd(last.date), parseYmd(ref.date)) / 7);
    const r = (rate > 0 ? "+" : "") + num(rate.toFixed(2));
    const plus = "Dodaj +150 kcal iz ugljenih hidrata — npr. +40 g ovsa ili +1 banana i 2 galete dnevno.";
    if (rate < 0) out.push({ ok: false, t: `Težina pada (${r} kg nedeljno), a cilj je da raste.`, d: plus });
    else if (rate < 0.2) out.push({ ok: false, t: `Težina raste sporo (${r} kg nedeljno).`, d: plus });
    else if (rate > 0.4) out.push({ ok: false, t: `Težina raste brže od cilja (${r} kg nedeljno).`, d: "Skini −150 kcal (manje ugljenih hidrata na danima odmora)." });
    else out.push({ ok: true, t: `Tempo je dobar (${r} kg nedeljno).`, d: "Ništa ne menjaj — cilj je +0,2 do +0,4 kg nedeljno." });
  } else out.push({ ok: true, t: "Treba još malo podataka.", d: "Savet za kalorije se računa na 2 nedelje merenja." });
  const W = sortedMeasures().filter((m) => m.waist);
  if (W.length >= 2) {
    const lw = W[W.length - 1], rw = nearestBefore(W, lw.date, 27);
    if (rw && rw !== lw && lw.waist - rw.waist >= 1) out.push({ ok: false, t: `Struk +${num((lw.waist - rw.waist).toFixed(1))} cm za mesec.`, d: "To je brže nego što treba — skini −150 kcal." });
  }
  return out.map((o) => `<div class="card hint ${o.ok ? "ok" : ""}"><b>${o.ok ? "✅" : "⚠️"} ${esc(o.t)}</b><div class="small muted">${esc(o.d)}</div></div>`).join("");
}
function sparkline(vals) {
  if (vals.length < 2) return "";
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1, W = 300, H = 60, p = 6;
  const pts = vals.map((v, i) => [p + (i * (W - 2 * p)) / (vals.length - 1), H - p - ((v - min) / span) * (H - 2 * p)]);
  const dpath = pts.map((q, i) => (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)).join(" ");
  const last = pts[pts.length - 1];
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path d="${dpath}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/><circle cx="${last[0]}" cy="${last[1]}" r="4" fill="var(--accent)"/></svg></div>`;
}
function renderProgress() {
  setTop("Merenje i napredak", "Jednom nedeljno — isti dan, isto vreme", true);
  const t = ymd(today());
  const ex = S.measures.find((m) => m.date === t) || {};
  let h = `<div class="card"><h3>⚖️ Novo merenje</h3><div class="small muted" style="margin-bottom:10px">Ujutro, posle toaleta, pre jela i vode. Prazno polje = preskoči.</div>
    <div class="mgrid">
      <div class="field" style="grid-column:1/-1"><label>Datum</label><input type="date" id="mDate" value="${t}"></div>
      ${METRICS.map((m) => `<div class="field"><label>${m.label}${m.unit ? " (" + m.unit + ")" : ""}</label><input type="text" inputmode="decimal" id="m_${m.k}" value="${esc(ex[m.k] != null ? num(ex[m.k]) : "")}"></div>`).join("")}
    </div><button class="btn primary block mt" id="mSave">Sačuvaj merenje</button></div>`;
  h += adviceHtml();
  const L = sortedMeasures();
  if (!L.length) h += `<div class="empty">Još nema merenja. Prvo merenje uradi danas ili prvog ponedeljka ujutro — posle toga svakog ponedeljka.</div>`;
  else {
    h += `<div class="section-title">Grafikoni</div>`;
    for (const m of METRICS) {
      const vals = L.filter((x) => x[m.k] != null && x[m.k] !== "");
      if (!vals.length) continue;
      const last = vals[vals.length - 1][m.k], diff = +(last - vals[0][m.k]).toFixed(1);
      const cls = diff === 0 ? "flat" : (diff > 0) === m.goodUp ? "up" : "down";
      h += `<div class="card"><div class="metric"><span class="muted small">${m.label}</span><span class="d ${cls}">${diff > 0 ? "+" : ""}${num(diff)} ${m.unit} od prvog merenja</span></div>
        <div class="v">${esc(num(last))} <span class="small muted">${m.unit}</span></div>${sparkline(vals.map((x) => +x[m.k]))}</div>`;
    }
    h += `<div class="section-title">Istorija</div><div class="card hist-wrap noswipe"><table class="hist" style="width:100%;border-collapse:collapse"><tr><th>Datum</th><th>kg</th><th>struk</th><th>BF%</th><th>mišići</th><th>visc.</th><th></th></tr>`;
    for (const m of L.slice().reverse()) h += `<tr><td>${fmtShort(parseYmd(m.date))}</td>${METRICS.map((x) => `<td>${m[x.k] != null ? esc(num(m[x.k])) : "–"}</td>`).join("")}<td><button class="icon-btn" data-mdel="${esc(m.date)}">🗑</button></td></tr>`;
    h += `</table></div>`;
  }
  $("#view").innerHTML = h;
  $("#mDate").addEventListener("change", (e) => {
    const r = S.measures.find((m) => m.date === e.target.value) || {};
    METRICS.forEach((m) => ($("#m_" + m.k).value = r[m.k] ?? ""));
  });
  $("#mSave").addEventListener("click", () => {
    const date = $("#mDate").value; if (!date) return;
    const rec = { date }; let any = false;
    METRICS.forEach((m) => { const v = $("#m_" + m.k).value.replace(",", "."); if (v !== "" && !isNaN(+v)) { rec[m.k] = +v; any = true; } });
    if (!any) { toast("Upiši bar jednu vrednost"); return; }
    S.measures = S.measures.filter((m) => m.date !== date); S.measures.push(rec); save();
    toast("✅ Merenje sačuvano"); render();
  });
  $$("[data-mdel]").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Obrisati ovo merenje?")) return;
    S.measures = S.measures.filter((m) => m.date !== b.dataset.mdel); save(); render();
  }));
}

// ---------- podešavanja
function renderSettings() {
  setTop("Podešavanja", "", true);
  const info = planInfo(today()), n = S.notif;
  const chk = (k, label, sub) => `<label class="tog"><span><b>${label}</b>${sub ? `<span class="small muted">${sub}</span>` : ""}</span><input type="checkbox" data-nk="${k}" ${n[k] ? "checked" : ""}></label>`;
  let h = `<div class="card"><h3>🔔 Obaveštenja</h3>`;
  if (!isNative()) {
    h += `<div class="small muted">Obaveštenja rade u Android aplikaciji (APK). U browseru nisu dostupna.</div>`;
  } else {
    h += chk("on", "Uključena", "Glavni prekidač") +
      `<div class="field mt"><label>Koliko ranije da te podseti</label><select id="nLead">${[15, 30, 45, 60].map((x) => `<option value="${x}" ${+n.lead === x ? "selected" : ""}>${x} min ranije</option>`).join("")}</select></div>` +
      chk("meals", "Obroci", "Šta jedeš i koliko") +
      chk("supps", "Suplementi", "Smuti, kapsule, kreatin, magnezijum…") +
      chk("morning", "Jutarnja poruka", "Da li je danas trening ili odmor i šta se trenira") +
      `<div class="field"><label>Vreme jutarnje poruke</label><input type="time" id="nMorning" value="${esc(n.morningTime)}"></div>` +
      chk("shop", "Kupovina", "Subotom u 10:00 — lista za narednu nedelju") +
      `<div class="btn-row"><button class="btn" id="nTest">Pošalji probno obaveštenje</button><button class="btn" id="nExact">Tačno vreme (alarmi)</button></div>
       <div class="small muted mt" id="nStatus"></div>`;
  }
  h += `</div>
    <div class="card"><h3>📅 Početak plana</h3>
    <div class="small muted" style="margin-bottom:10px">${S.startDate ? `Pokrenut: <b style="color:var(--text)">${fmtDate(parseYmd(S.startDate))} ${parseYmd(S.startDate).getFullYear()}.</b> · ${planLine(info)}` : "Plan još nije pokrenut."}</div>
    <div class="field"><label>Datum početka</label><input type="date" id="sDate" value="${S.startDate || ymd(today())}"></div>
    <div class="btn-row"><button class="btn primary" id="sSave">Sačuvaj datum</button><button class="btn" id="sToday">Krećem danas</button>${S.startDate ? `<button class="btn danger" id="sClear">Poništi start</button>` : ""}</div>
    <div class="small muted mt">Nedelja 1 počinje od ponedeljka u nedelji starta. Trening dani: Pon, Uto, Sre, Pet, Sub.</div></div>

    <div class="card"><h3>💾 Rezervna kopija</h3><div class="small muted">Podaci su samo na ovom telefonu. Povremeno sačuvaj kopiju (npr. na Google Drive).</div>
    <div class="btn-row"><button class="btn" id="bExport">⬇ Sačuvaj kopiju</button><label class="btn">⬆ Učitaj kopiju<input type="file" id="bImport" accept="application/json,.json" hidden></label></div></div>

    <div class="card"><h3>↺ Vrati originalni plan</h3><div class="small muted">Vraća trening, ishranu, suplemente i beleške na početnu verziju. Merenja i datum starta ostaju.</div>
    <div class="btn-row"><button class="btn danger" id="bReset">Vrati original</button></div></div>
    <div class="card small muted">Slike vežbi: free-exercise-db (javno vlasništvo).${window.APP_BUILD ? " Verzija " + window.APP_BUILD + "." : ""}</div>`;
  $("#view").innerHTML = h;

  if (isNative()) {
    $$("[data-nk]").forEach((c) => c.addEventListener("change", async () => {
      S.notif[c.dataset.nk] = c.checked; save();
      if (c.dataset.nk === "on" && c.checked) await Notif.ensurePermission();
      Notif.reschedule().then(showStatus);
    }));
    $("#nLead").addEventListener("change", (e) => { S.notif.lead = +e.target.value; save(); Notif.reschedule().then(showStatus); });
    $("#nMorning").addEventListener("change", (e) => { if (e.target.value) { S.notif.morningTime = e.target.value; save(); Notif.reschedule().then(showStatus); } });
    $("#nTest").addEventListener("click", async () => { if (await Notif.ensurePermission()) { await Notif.test(); toast("Stiže za 5 sekundi…"); } else toast("Dozvoli obaveštenja u podešavanjima telefona"); });
    $("#nExact").addEventListener("click", () => Notif.openExact());
    showStatus();
  }
  $("#sSave").addEventListener("click", () => { const v = $("#sDate").value; if (v) setStart(v); });
  $("#sToday").addEventListener("click", () => setStart(ymd(today())));
  $("#sClear")?.addEventListener("click", () => { if (confirm("Poništiti start plana?")) { S.startDate = null; save(); render(); } });
  $("#bExport").addEventListener("click", exportBackup);
  $("#bImport").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    e.target.value = "";
    let obj;
    try {
      obj = JSON.parse(await f.text());
      if (!isObj(obj) || !isObj(obj.data) || !isObj(obj.data.workouts)) throw new Error("bad");
    } catch (err) { toast("⚠️ Fajl nije ispravna kopija"); return; }
    if (!confirm("Zameniti trenutne podatke ovom kopijom?")) return;
    const prev = S;
    try {
      S = obj; normalize();
      // proba da se sve iscrta pre nego što se sačuva
      planInfo(today()); buildDay(today()); shoppingFor(mondayOf(today()));
    } catch (err) { S = prev; toast("⚠️ Kopija je oštećena — ništa nije promenjeno"); return; }
    save(); toast("✅ Kopija učitana"); render();
    if (isNative() && S.startDate && S.notif.on) { await Notif.ensurePermission(); Notif.reschedule(true); }
  });
  $("#bReset").addEventListener("click", () => {
    if (!confirm("Vratiti plan na original? Tvoje izmene u planu će biti obrisane.")) return;
    S.data = clone(DEFAULT_DATA); save(); toast("Plan vraćen na original"); render();
  });
}
async function showStatus() {
  const el = $("#nStatus"); if (!el) return;
  const st = await Notif.status();
  el.textContent = st;
}
async function exportBackup() {
  const json = JSON.stringify(S, null, 1), name = `mojplan-kopija-${ymd(today())}.json`;
  if (isNative()) {
    try {
      const P = window.Capacitor.Plugins;
      const r = await P.Filesystem.writeFile({ path: name, data: json, directory: "CACHE", encoding: "utf8" });
      await P.Share.share({ title: "Moj Plan — kopija", text: "Rezervna kopija podataka (Moj Plan)", url: r.uri, dialogTitle: "Sačuvaj kopiju (npr. Google Drive)" });
    } catch (e) {
      if (!/cancel/i.test(String(e && e.message))) toast("⚠️ Kopija nije sačuvana");
    }
    return;
  }
  try {
    const file = new File([json], name, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Moj Plan — kopija" }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([json], { type: "application/json" })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// =====================================================================
//  OBAVEŠTENJA (samo u Android aplikaciji)
// =====================================================================
const DAY0 = new Date(2024, 0, 1);
const minOf = (hhmm) => { const [h, m] = String(hhmm).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const REST_ID = 900;
const TEST_ID = 999;
const Notif = {
  timer: null, lastRun: 0, busy: false, again: false, _ch: false,
  plugin() { return isNative() ? window.Capacitor.Plugins.LocalNotifications : null; },
  later(delay = 1500) { if (!isNative()) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.reschedule(), delay); },
  async ensurePermission() {
    const p = this.plugin(); if (!p) return false;
    try {
      let r = await p.checkPermissions();
      if (r.display !== "granted") r = await p.requestPermissions();
      return r.display === "granted";
    } catch (e) { return false; }
  },
  async channel() {
    if (this._ch) return;
    try { await this.plugin().createChannel({ id: "plan", name: "Podsetnici", description: "Obroci, suplementi, trening i pauza", importance: 4, visibility: 1, vibration: true }); this._ch = true; } catch (e) {}
  },
  // Lista željenih podsetnika (stabilni ID-jevi: isti dan + isto vreme = isti ID)
  build() {
    const n = S.notif, out = [];
    if (!S.startDate || !n.on) return out;
    const now = new Date(), t0 = today(), startD = parseYmd(S.startDate), DAYS = 21;
    let lastDay = null;
    for (let i = 0; i < DAYS; i++) {
      const d = addDays(t0, i);
      if (d < startD) continue;
      lastDay = d;
      const base = diffDays(d, DAY0) * 3000;
      const checks = S.checks[ymd(d)] || {};
      const { info, rows } = buildDay(d);
      const groups = {};
      for (const r of rows) {
        if (checks[r.id]) continue; // već urađeno — bez podsetnika
        if (r.type === "supp" && (r.s.noCheck || !n.supps)) continue;
        if (r.type === "meal" && !n.meals) continue;
        if (r.type === "train" && !n.meals && !n.morning) continue;
        (groups[r.time] ||= []).push(r);
      }
      const items = [];
      for (const [time, rs] of Object.entries(groups)) {
        const names = [], details = [];
        for (const r of rs) {
          if (r.type === "train") { names.push(`Trening: ${info.workout.title}`); details.push(info.workout.subtitle); }
          else if (r.type === "meal") { names.push(r.label); if (r.meal) details.push(r.meal.items.join(", ")); }
          else { names.push(r.s.name); if (r.s.dose) details.push(`${r.s.name}: ${r.s.dose}`); }
        }
        items.push({ time, names, details, at: new Date(atTime(d, time).getTime() - n.lead * 60000) });
      }
      if (n.morning) {
        let title, body;
        if (info.workout) {
          const w = info.workout;
          title = `Danas: ${w.title} 💪`;
          body = `${w.subtitle} · ${w.items.length} vežbi · trening u 11:00${info.deload ? " · deload nedelja (lakše)" : ""}`;
        } else {
          const r = D().restDays[info.dow] || {};
          let next = null; for (let k = 1; k <= 7 && !next; k++) if (D().workouts[addDays(d, k).getDay()]) next = addDays(d, k);
          title = "Danas je dan odmora 🧘";
          body = `${r.text || "Odmor i šetnja."}${next ? ` Sledeći trening: ${DAY_FULL[next.getDay()]} — ${D().workouts[next.getDay()].title}.` : ""}`;
        }
        if (d.getDay() === 1) body += " ⚖️ Danas je merenje (pre doručka).";
        const m = { id: base + 1500 + minOf(n.morningTime), at: atTime(d, n.morningTime), title, body };
        // podsetnik koji pada u isto vreme (±10 min) spaja se u jutarnju poruku
        // spaja se samo ako jutarnja poruka tek treba da stigne (inače bi se podsetnik izgubio)
        for (const it of items) if (m.at > now && Math.abs(it.at - m.at) <= 10 * 60000) {
          m.body += `\n${it.time} · ${it.names.join(" + ")}${it.details.length ? " — " + it.details.join(" | ") : ""}`;
          it.merged = true;
        }
        out.push(m);
      }
      for (const it of items) if (!it.merged)
        out.push({ id: base + minOf(it.time), at: it.at, title: `${it.time} · ${it.names.join(" + ")}`, body: `Za ${n.lead} min. ${it.details.join(" | ")}` });
      if (n.shop && d.getDay() === 6) out.push({ id: base + 2950, at: atTime(d, "10:00"), title: "🛒 Danas je kupovina", body: "Lista za narednu nedelju je spremna u aplikaciji (tab Kupovina)." });
    }
    if (lastDay) {
      const rd = addDays(lastDay, -1);
      out.push({ id: diffDays(rd, DAY0) * 3000 + 2960, at: atTime(rd, "20:00"), title: "🔔 Otvori Moj Plan", body: "Podsetnici ističu za 2 dana — samo otvori aplikaciju i sami se produže." });
    }
    return out.filter((x) => x.at > now);
  },
  // Menja samo ono što se promenilo (ne briše i ne pravi sve iznova)
  // force = zakaži sve iznova (posle pokretanja aplikacije i posle uključivanja tačnog vremena):
  // Android briše alarme kad se aplikacija nasilno zatvori, a spisak u memoriji ostaje.
  async reschedule(force = false) {
    const p = this.plugin(); if (!p) return;
    if (this.busy) { this.again = true; this.againForce = this.againForce || force; return; }
    this.busy = true;
    try {
      const perm = await p.checkPermissions();
      const want = perm.display === "granted" ? this.build() : [];
      const sig = (x) => `${x.title}|${x.body}|${x.at.getTime()}`;
      const wantMap = new Map(want.map((x) => [x.id, x]));
      const pend = ((await p.getPending()).notifications) || [];
      const keep = new Set(), cancel = [];
      for (const q of pend) {
        if (q.id === REST_ID || q.id === TEST_ID) continue; // pauza i probno obaveštenje se ne diraju
        const w = wantMap.get(q.id);
        if (!force && w && q.extra && q.extra.sig === sig(w)) keep.add(q.id); else cancel.push({ id: q.id });
      }
      if (cancel.length) await p.cancel({ notifications: cancel });
      const add = want.filter((x) => !keep.has(x.id));
      if (add.length) {
        await this.channel();
        const list = add.map((x) => ({ id: x.id, title: x.title, body: x.body, largeBody: x.body, channelId: "plan", smallIcon: "ic_stat_notify", iconColor: "#3DDC84", schedule: { at: x.at, allowWhileIdle: true }, extra: { sig: sig(x) } }));
        for (let i = 0; i < list.length; i += 60) await p.schedule({ notifications: list.slice(i, i + 60) });
      }
      this.lastRun = Date.now();
    } catch (e) { console.warn("notif", e); }
    finally {
      this.busy = false;
      if (this.again) { const f = this.againForce; this.again = false; this.againForce = false; setTimeout(() => this.reschedule(f), 300); }
    }
  },
  async scheduleRest(at, body) {
    const p = this.plugin(); if (!p) return;
    try {
      await this.channel();
      await p.schedule({ notifications: [{ id: REST_ID, title: "⏱ Pauza je gotova", body, channelId: "plan", smallIcon: "ic_stat_notify", iconColor: "#3DDC84", schedule: { at: new Date(at), allowWhileIdle: true } }] });
    } catch (e) {}
  },
  async cancelRest() {
    const p = this.plugin(); if (!p) return;
    try { await p.cancel({ notifications: [{ id: REST_ID }] }); } catch (e) {}
  },
  async test() {
    await this.channel();
    await this.plugin().schedule({ notifications: [{ id: TEST_ID, title: "10:15 · Pre treninga", body: "Ovako izgleda podsetnik. Za 30 min: galete, džem, šejk.", channelId: "plan", smallIcon: "ic_stat_notify", iconColor: "#3DDC84", schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true } }] });
  },
  async openExact() {
    const p = this.plugin();
    try { await p.changeExactNotificationSetting(); } catch (e) { toast("Na ovom telefonu nije potrebno"); }
    this.reschedule(true); // postojeći podsetnici dobijaju tačno vreme tek kad se ponovo zakažu
  },
  async status() {
    const p = this.plugin(); if (!p) return "";
    try {
      const perm = await p.checkPermissions();
      if (perm.display !== "granted") return "⚠️ Obaveštenja nisu dozvoljena — uključi ih u podešavanjima telefona.";
      const pend = await p.getPending();
      let ex = "";
      try { const e = await p.checkExactNotificationSetting(); ex = e.exact_alarm === "granted" ? " · tačno vreme uključeno" : " · tačno vreme isključeno (mogu kasniti par minuta)"; } catch (e) {}
      if (!S.startDate) return "Obaveštenja kreću kad pokreneš plan.";
      return `✅ Zakazano ${pend.notifications.filter((x) => x.id !== REST_ID && x.id !== TEST_ID).length} podsetnika (21 dan unapred)${ex}.`;
    } catch (e) { return ""; }
  },
  async init() {
    const p = this.plugin(); if (!p) return;
    try {
      p.addListener("localNotificationActionPerformed", (a) => {
        if (a && a.notification && a.notification.id === REST_ID) return;
        if (UI.tab !== "danas" || UI.sub) { NAV.length = 0; UI.sub = null; go("danas", null, true); }
      });
    } catch (e) {}
    if (S.startDate && S.notif.on) await this.ensurePermission();
    this.reschedule(true); // pri svakom pokretanju sve iznova (alarmi su možda obrisani)
  },
};

// =====================================================================
//  PROVERA NOVE VERZIJE (Android)
// =====================================================================
async function checkUpdate() {
  if (!isNative() || !window.APP_BUILD) return;
  try {
    const r = await fetch("https://api.github.com/repos/tomileeyo-collab/moj-plan/releases/latest", { cache: "no-store" });
    if (!r.ok) return;
    const j = await r.json();
    const num = parseInt(String(j.tag_name || "").replace(/\D/g, ""), 10);
    const asset = (j.assets || []).find((a) => /\.apk$/i.test(a.name));
    if (num > window.APP_BUILD && asset) { window.__update = { tag: j.tag_name, url: asset.browser_download_url }; if (UI.tab === "danas" || (UI.tab === "vise" && !UI.sub)) render(); }
  } catch (e) {}
}

// =====================================================================
//  PROZORI + DUGME „NAZAD“ NA TELEFONU (zatvara prozor umesto da izađe iz aplikacije)
// =====================================================================
// U Android aplikaciji povratak (dugme ili prevlačenje sa ivice) hvata handleBack();
// u browseru se koristi istorija browsera samo za prozore.
let layerClose = null;
function openLayer(fn) {
  const first = !layerClose; layerClose = fn;
  if (first && !isNative()) { try { history.pushState({ layer: 1 }, ""); } catch (e) {} }
}
function closeLayer() { if (!layerClose) return; layerClose = null; if (!isNative()) { try { history.back(); } catch (e) {} } }
window.addEventListener("popstate", () => { if (layerClose) { const f = layerClose; layerClose = null; f(); } });
function showDialog() { const dlg = $("#dlg"); if (!dlg.open) dlg.showModal(); openLayer(() => { if (dlg.open) dlg.close(); }); }
function closeDialog() { const dlg = $("#dlg"); if (dlg.open) dlg.close(); closeLayer(); }
$("#dlg").addEventListener("close", () => { if (layerClose) closeLayer(); });

function toggleCheck(dk, id) {
  S.checks[dk] ||= {};
  S.checks[dk][id] = !S.checks[dk][id];
  if (!S.checks[dk][id]) delete S.checks[dk][id];
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  Notif.later(800);
}

// =====================================================================
//  DETALJI STAVKE — šta ti treba, priprema, uz šta ide
// =====================================================================
function splitQty(line) {
  const s = String(line).trim();
  if (/^opciono/i.test(s)) return [s, ""]; // "Opciono: …" se čita kao cela rečenica
  let m = s.match(/^(\d+)\s+(.+)$/);
  if (m) return [m[2].charAt(0).toUpperCase() + m[2].slice(1), m[1] + " kom"];
  m = s.match(/^(.*?)\s+(\d[\d.,]*(?:\s*[–-]\s*\d[\d.,]*)?\s*(?:g|ml|kom)?(?:\s.*)?)$/i);
  if (m && m[1]) return [m[1], m[2]];
  return [s, ""];
}
const DAYS_LABEL = { all: "svaki dan", train: "trening dan", rest: "dan odmora" };
const KIND_BADGE = { Suplement: ["💊 Suplement", "purple"], Hrana: ["🥄 Hrana", "orange"], "Užina": ["🥜 Užina", "orange"], "Čaj": ["🍵 Čaj", "blue"], Podsetnik: ["⏰ Podsetnik", ""] };
function openDetail({ kind, id, s: sOverride, time, label, date, rowId }) {
  const dlg = $("#dlg");
  const dk = date ? ymd(date) : null;
  const done = !!(dk && rowId && (S.checks[dk] || {})[rowId]);
  const sec = (t) => `<div class="sh-sec">${esc(t)}</div>`;
  const ol = (a) => `<ol class="sh-ol">${a.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`;
  const row = (a, b, w) => `<div class="ing"><div>${esc(a)}${w ? `<div class="w">${esc(w)}</div>` : ""}</div><div class="q">${esc(b)}</div></div>`;
  let h = "", edit = null;
  if (kind === "meal") {
    const m = D().meals[id]; if (!m) return;
    edit = () => editMeal(id);
    h += `<div class="sh-head"><span class="badge">🍽️ Obrok</span><span class="small muted">${esc([time, label].filter(Boolean).join(" · "))}</span><span class="grow"></span><button class="icon-btn" data-sedit aria-label="Izmeni">✏️</button></div>
      <h2 class="sh-title">${esc(m.name)}</h2>`;
    h += sec("Šta ti treba") + m.items.map((x) => { const [a, b] = splitQty(x); return row(a, b); }).join("");
    if ((m.prep || []).length) h += sec(`Priprema${m.mins ? ` · oko ${m.mins} min` : ""}`) + ol(m.prep);
  } else {
    // sOverride = verzija iz liste Danas (npr. izračunata količina badema/tahinija za taj dan)
    const s = sOverride || D().supplements.find((x) => x.id === id); if (!s) return;
    const sm = D().smoothie, isSm = s.id === "smuti";
    edit = isSm ? editSmoothie : () => editSupp(id);
    const [bLabel, bColor] = KIND_BADGE[s.kind] || KIND_BADGE.Suplement;
    h += `<div class="sh-head"><span class="badge ${bColor}">${bLabel}</span><span class="small muted">${esc([time || s.time, DAYS_LABEL[s.days]].filter(Boolean).join(" · "))}</span><span class="grow"></span><button class="icon-btn" data-sedit aria-label="Izmeni">✏️</button></div>
      <h2 class="sh-title">${esc(isSm ? sm.title : s.name)}</h2>`;
    // svaki podatak samo jednom: napomena ispod naslova, pa Doza, Kako, Zašto
    if (s.note && !isSm) h += `<div class="small muted">${esc(s.note)}</div>`;
    if (isSm) {
      h += sec("Šta ti treba") + sm.items.map((i) => row(i.name, i.dose, i.why)).join("");
      if ((sm.steps || []).length) h += sec("Priprema · 2 min") + ol(sm.steps);
      if ((sm.tips || []).length) h += sec("Saveti") + `<ul class="bul small">${sm.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
    } else {
      if (s.dose) h += sec("Doza") + `<p class="sh-dose">${esc(s.dose)}</p>`;
      if ((s.how || []).length) h += sec("Kako") + ol(s.how);
      if (s.why) h += sec("Zašto") + `<p class="small">${esc(s.why)}</p>`;
    }
  }
  h += `<div class="sh-btns"><button class="btn" data-sx>Zatvori</button>${dk && rowId ? `<button class="btn ${done ? "" : "primary"}" data-sdone>${done ? "↺ Poništi" : "✓ Urađeno"}</button>` : ""}</div>`;
  dlg.innerHTML = `<div class="sheet"><div class="grab"></div>${h}</div>`;
  $("[data-sx]", dlg).onclick = closeDialog;
  $("[data-sedit]", dlg).onclick = () => edit();
  const bd = $("[data-sdone]", dlg);
  if (bd) bd.onclick = () => { toggleCheck(dk, rowId); closeDialog(); render(); if (!done) toast("✅ Urađeno"); };
  showDialog();
  dlg.scrollTop = 0;
}

// =====================================================================
//  DIALOG / FORME ZA IZMENE
// =====================================================================
function openForm({ title, fields, onSave, onDelete, extra = [] }) {
  const dlg = $("#dlg");
  let h = `<div class="dh"><h2>${esc(title)}</h2><button class="icon-btn" data-x>✕</button></div><div class="db">`;
  for (const f of fields) {
    if (f.type === "info") { h += `<div class="small muted">${f.html}</div>`; continue; }
    h += `<div class="field"${f.showIf ? ` data-showif="${esc(f.showIf[0])}" data-showval="${esc(f.showIf[1])}"` : ""}><label>${esc(f.label)}</label>`;
    if (f.type === "textarea") h += `<textarea name="${f.key}" rows="${f.rows || 6}">${esc(f.value)}</textarea>`;
    else if (f.type === "select") h += `<select name="${f.key}">${f.options.map((o) => `<option value="${esc(o.v)}" ${o.v === f.value ? "selected" : ""}>${esc(o.l)}</option>`).join("")}</select>`;
    else h += `<input name="${f.key}" type="${f.type || "text"}" ${f.type === "number" ? 'inputmode="numeric"' : ""} value="${esc(f.value)}">`;
    if (f.help) h += `<div class="small muted">${esc(f.help)}</div>`;
    h += `</div>`;
  }
  h += `</div><div class="df">`;
  if (onDelete) h += `<button class="btn danger" data-del>🗑 Obriši</button>`;
  extra.forEach((e, i) => (h += `<button class="btn" data-extra="${i}">${esc(e.label)}</button>`));
  h += `<span class="grow"></span><button class="btn" data-x>Otkaži</button><button class="btn primary" data-ok>Sačuvaj</button></div>`;
  dlg.innerHTML = h;
  const vals = () => { const o = {}; fields.forEach((f) => { if (f.key) o[f.key] = $(`[name="${f.key}"]`, dlg).value; }); return o; };
  const close = closeDialog;
  $$("[data-x]", dlg).forEach((b) => (b.onclick = close));
  $("[data-ok]", dlg).onclick = () => { if (onSave(vals()) !== false) { save(); close(); render(); toast("✅ Sačuvano"); } };
  if (onDelete) $("[data-del]", dlg).onclick = () => { if (confirm("Sigurno obrisati?")) { onDelete(); save(); close(); render(); } };
  $$("[data-extra]", dlg).forEach((b) => (b.onclick = () => { const r = extra[+b.dataset.extra].fn(vals()); if (r !== false) { save(); close(); render(); } }));
  // polja koja se vide samo uz određeni izbor (npr. "Naziv nove vežbe")
  const sync = () => $$("[data-showif]", dlg).forEach((el) => { const src = $(`[name="${el.dataset.showif}"]`, dlg); el.hidden = !src || src.value !== el.dataset.showval; });
  $$("select", dlg).forEach((s) => s.addEventListener("change", sync)); sync();
  showDialog();
  dlg.scrollTop = 0;
}
const lines = (s) => String(s).split("\n").map((x) => x.trim()).filter(Boolean);
const toPairs = (s) => lines(s).map((l) => { const [t, ...d] = l.split("|"); return { t: t.trim(), d: d.join("|").trim() }; });

function editLines(title, arr, set) {
  openForm({ title, fields: [{ key: "t", label: "Jedna stavka po redu", type: "textarea", rows: 10, value: arr.join("\n") }], onSave: (v) => set(lines(v.t)) });
}
function editPairs(title, arr, set, help) {
  openForm({ title, fields: [{ key: "t", label: "Jedna stavka po redu", help, type: "textarea", rows: 10, value: arr.map((x) => `${x.t} | ${x.d}`).join("\n") }], onSave: (v) => set(toPairs(v.t)) });
}
function editTriples(title, arr, set) {
  openForm({ title, fields: [{ key: "t", label: "Šta | gde | cena", type: "textarea", rows: 8, value: arr.map((x) => `${x.what} | ${x.where} | ${x.price}`).join("\n") }],
    onSave: (v) => set(lines(v.t).map((l) => { const [a = "", b = "", c = ""] = l.split("|").map((s) => s.trim()); return { what: a, where: b, price: c }; })) });
}
function editCombos() {
  const c = D().combos;
  openForm({ title: "Kombinacije", fields: [
    { key: "g", label: "✅ Pojačavaju (Naslov | opis)", type: "textarea", value: c.good.map((x) => `${x.t} | ${x.d}`).join("\n") },
    { key: "b", label: "❌ Izbegavaj (Naslov | opis)", type: "textarea", value: c.bad.map((x) => `${x.t} | ${x.d}`).join("\n") }],
    onSave: (v) => { D().combos = { good: toPairs(v.g), bad: toPairs(v.b) }; } });
}
function editMonth(i) {
  const m = D().months[i];
  openForm({ title: `Mesec ${m.m}`, fields: [
    { key: "focus", label: "Fokus", value: m.focus },
    { key: "text", label: "Uputstvo", type: "textarea", rows: 4, value: m.text }],
    onSave: (v) => { m.focus = v.focus; m.text = v.text; } });
}
function editWorkoutHead(dow) {
  const w = D().workouts[dow];
  openForm({ title: `${DAY_FULL[dow]} — trening`, fields: [
    { key: "title", label: "Naziv", value: w.title },
    { key: "subtitle", label: "Opis", value: w.subtitle },
    { key: "duration", label: "Trajanje", value: w.duration }],
    onSave: (v) => Object.assign(w, v) });
}
function exOptions() {
  const opts = Object.entries(D().exercises).map(([id, e]) => ({ v: id, l: e.name })).sort((a, b) => a.l.localeCompare(b.l, "sr"));
  return [...opts, { v: "__new", l: "＋ Nova vežba…" }];
}
function editItem(dow, idx) {
  const w = D().workouts[dow], isNew = idx < 0;
  const it = isNew ? { ex: "bench", sets: 3, reps: "8–12", rest: "60 s" } : w.items[idx];
  const extra = [];
  // ↑/↓ prvo sačuvaju ono što si upisao, pa pomere vežbu
  const applied = (v) => { const r = build(v); if (r === false) return false; w.items[idx] = r; return true; };
  if (!isNew) {
    if (idx > 0) extra.push({ label: "↑", fn: (v) => { if (!applied(v)) return false; w.items.splice(idx - 1, 0, w.items.splice(idx, 1)[0]); } });
    if (idx < w.items.length - 1) extra.push({ label: "↓", fn: (v) => { if (!applied(v)) return false; w.items.splice(idx + 1, 0, w.items.splice(idx, 1)[0]); } });
    extra.push({ label: "📝 Opis vežbe", fn: () => { editExercise(it.ex); return false; } });
  }
  function build(v) {
    let ex = v.ex;
    if (ex === "__new") {
      if (!v.newname.trim()) { toast("Upiši naziv nove vežbe"); return false; }
      ex = "c_" + uid(); D().exercises[ex] = { name: v.newname.trim(), en: "", muscles: "", tips: [], noImg: true };
    }
    const rec = { ...it, ex, sets: Math.max(1, Math.min(20, parseInt(v.sets, 10) || 1)), reps: v.reps, rest: v.rest };
    if (ex !== it.ex) delete rec.iso; // nova vežba ne nasleđuje "izolacija" od stare
    return rec;
  }
  openForm({
    title: isNew ? "Nova vežba u treningu" : "Izmeni vežbu",
    fields: [
      { key: "ex", label: "Vežba", type: "select", value: it.ex, options: exOptions() },
      { key: "newname", label: "Naziv nove vežbe", value: "", showIf: ["ex", "__new"] },
      { key: "sets", label: "Serije", type: "number", value: it.sets },
      { key: "reps", label: "Ponavljanja / trajanje", value: it.reps },
      { key: "rest", label: "Pauza", value: it.rest },
      { type: "info", html: "Izmena važi za ovaj dan u svim nedeljama. U deload nedeljama serije se smanjuju, a u nekim mesecima se ponavljanja menjaju po planu." },
    ],
    onSave: (v) => {
      const rec = build(v); if (rec === false) return false;
      if (isNew) w.items.push(rec); else w.items[idx] = rec;
    },
    onDelete: isNew ? null : () => w.items.splice(idx, 1),
    extra,
  });
}
function editExercise(id) {
  const e = D().exercises[id]; if (!e) return;
  openForm({ title: "Opis vežbe", fields: [
    { key: "name", label: "Naziv", value: e.name },
    { key: "en", label: "Drugi naziv (engleski)", value: e.en || "" },
    { key: "muscles", label: "Mišići", value: e.muscles || "" },
    { key: "tips", label: "Saveti (jedan po redu)", type: "textarea", rows: 5, value: (e.tips || []).join("\n") },
    { type: "info", html: "Opis se menja svuda gde se ova vežba pojavljuje." }],
    onSave: (v) => { e.name = v.name; e.en = v.en; e.muscles = v.muscles; e.tips = lines(v.tips); } });
}
const mealFields = (m) => [
  { key: "name", label: "Naziv obroka", value: m.name },
  { key: "items", label: "Namirnice (jedna po redu, sa količinom — npr. „Tofu 200 g“)", type: "textarea", rows: 7, value: m.items.join("\n") },
  { key: "prep", label: "Priprema (jedan korak po redu)", type: "textarea", rows: 6, value: (m.prep || []).join("\n") },
  { key: "mins", label: "Vreme pripreme (min)", type: "number", value: m.mins ?? "" },
];
const saveMeal = (m, v) => { m.name = v.name; m.items = lines(v.items); m.prep = lines(v.prep); m.mins = parseInt(v.mins, 10) || null; };
function editMealSlot(dtKey, slot) {
  const dt = D().dayTypes[dtKey], curId = dt[slot], m = D().meals[curId];
  const opts = Object.entries(D().meals).map(([id, x]) => ({ v: id, l: x.name }));
  const sl = [...D().slotsTraining, ...D().slotsRest].find((x) => x.key === slot);
  openForm({
    title: `${sl ? sl.label : "Obrok"} — izmena`,
    fields: [
      { key: "pick", label: "Obrok u ovom terminu", type: "select", value: curId, options: opts },
      { type: "info", html: "Izbor važi za sve dane sa istim jelovnikom (jelovnik se ponavlja na 4 nedelje)." },
      ...(m ? mealFields(m) : []),
      { type: "info", html: "Izmena naziva i namirnica važi svuda gde se ovaj obrok javlja. Kupovina se sama preračuna." },
    ],
    onSave: (v) => {
      if (m && v.pick === curId) saveMeal(m, v);
      else if (m && v.pick !== curId && (v.name !== m.name || lines(v.items).join("\n") !== m.items.join("\n")))
        if (!confirm("Izabrao si drugi obrok, a menjao si i tekst starog. Tekst starog obroka neće biti sačuvan. Nastavi?")) return false;
      dt[slot] = v.pick;
    },
    // novi obrok se pravi tek kad ga sačuvaš (Otkaži ništa ne menja)
    extra: [{ label: "＋ Novi obrok", fn: () => { editMeal(null, (id) => { dt[slot] = id; }); return false; } }],
  });
}
function editMeal(id, onCreate) {
  const isNew = !id;
  const m = isNew ? { name: "", items: [], prep: [] } : D().meals[id];
  openForm({ title: isNew ? "Novi obrok" : "Izmeni obrok", fields: mealFields(m), onSave: (v) => {
    if (isNew && !v.name.trim()) { toast("Upiši naziv obroka"); return false; }
    saveMeal(m, v);
    if (isNew) { const nid = "c_" + uid(); D().meals[nid] = m; onCreate && onCreate(nid); }
  } });
}
function editSupp(id) {
  const isNew = !id;
  const s = isNew ? { id: "c_" + uid(), time: "08:00", days: "all", name: "", dose: "", note: "", color: "purple" } : D().supplements.find((x) => x.id === id);
  openForm({
    title: isNew ? "Novi suplement" : "Izmeni suplement",
    fields: [
      { key: "name", label: "Naziv", value: s.name },
      { key: "dose", label: "Doza", value: s.dose },
      { key: "time", label: "Vreme", type: "time", value: s.time },
      { key: "days", label: "Kada", type: "select", value: s.days, options: [{ v: "all", l: "Svaki dan" }, { v: "train", l: "Samo trening dan" }, { v: "rest", l: "Samo dan odmora" }] },
      { key: "note", label: "Napomena", type: "textarea", rows: 3, value: s.note },
      { key: "how", label: "Kako se uzima (jedan korak po redu)", type: "textarea", rows: 4, value: (s.how || []).join("\n") },
      { key: "why", label: "Zašto", type: "textarea", rows: 2, value: s.why || "" },
      { key: "color", label: "Boja", type: "select", value: s.color, options: [{ v: "green", l: "Zelena (prah/smuti)" }, { v: "purple", l: "Ljubičasta (kapsule)" }, { v: "orange", l: "Narandžasta (sport)" }, { v: "blue", l: "Plava (uveče/čaj)" }, { v: "brown", l: "Braon (hrana)" }, { v: "gray", l: "Siva (podsetnik)" }] },
      { key: "optional", label: "Opciono?", type: "select", value: s.optional ? "1" : "0", options: [{ v: "0", l: "Ne" }, { v: "1", l: "Da" }] },
    ],
    onSave: (v) => {
      if (!v.name.trim()) { toast("Upiši naziv"); return false; }
      Object.assign(s, { name: v.name.trim(), dose: v.dose, time: v.time || "08:00", days: v.days, note: v.note, how: lines(v.how), why: v.why.trim(), color: v.color, optional: v.optional === "1" });
      if (isNew) D().supplements.push(s);
    },
    onDelete: isNew ? null : () => { D().supplements = D().supplements.filter((x) => x.id !== id); },
  });
}
function editSmoothie() {
  const sm = D().smoothie;
  openForm({ title: "Recept smutija", fields: [
    { key: "title", label: "Naziv", value: sm.title },
    { key: "subtitle", label: "Kratko uputstvo", value: sm.subtitle },
    { key: "items", label: "Sastojci: naziv | količina | zašto", type: "textarea", rows: 10, value: sm.items.map((i) => `${i.name} | ${i.dose} | ${i.why}`).join("\n") },
    { key: "steps", label: "Priprema (jedan korak po redu)", type: "textarea", rows: 6, value: (sm.steps || []).join("\n") },
    { key: "tips", label: "Saveti (jedan po redu)", type: "textarea", rows: 4, value: sm.tips.join("\n") }],
    onSave: (v) => {
      sm.title = v.title; sm.subtitle = v.subtitle; sm.tips = lines(v.tips); sm.steps = lines(v.steps);
      sm.items = lines(v.items).map((l) => { const [a = "", b = "", c = ""] = l.split("|").map((x) => x.trim()); return { name: a, dose: b, why: c }; });
    } });
}
function editKnowledge(id) {
  const isNew = !id;
  const k = isNew ? { id: "c_" + uid(), icon: "📝", title: "", body: "" } : D().knowledge.find((x) => x.id === id);
  openForm({ title: isNew ? "Nova beleška" : "Izmeni belešku", fields: [
    { key: "icon", label: "Ikonica (emoji)", value: k.icon },
    { key: "title", label: "Naslov", value: k.title },
    { key: "body", label: "Tekst", type: "textarea", rows: 12, value: k.body, help: "## Podnaslov · - stavka liste · Levo | Desno = red tabele" }],
    onSave: (v) => { if (!v.title.trim()) { toast("Upiši naslov"); return false; } Object.assign(k, { icon: v.icon, title: v.title.trim(), body: v.body }); if (isNew) D().knowledge.push(k); },
    onDelete: isNew ? null : () => { D().knowledge = D().knowledge.filter((x) => x.id !== id); } });
}

// =====================================================================
//  ROUTER + PREVLAČENJE
// =====================================================================
// Istorija kretanja: povratak vraća tačno tamo gde si bio.
const NAV = [];
function pushNav() {
  const top = NAV[NAV.length - 1];
  if (top && top.tab === UI.tab && top.sub === UI.sub) return;
  NAV.push({ tab: UI.tab, sub: UI.sub, y: $("#view").scrollTop });
  if (NAV.length > 30) NAV.shift();
}
function go(tab, anim, noHistory) {
  if (tab !== UI.tab && !noHistory) pushNav();
  if (tab !== UI.tab) UI.sub = null;
  UI.tab = tab; render(anim); toTop();
}
function openSub(sub) { pushNav(); UI.sub = sub; render("left"); toTop(); }
function navBack() {
  const prev = NAV.pop();
  if (prev) {
    UI.tab = prev.tab; UI.sub = prev.sub;
    if (UI.tab === "trening") UI.trainDate = UI.trainDate || today();
    render("right"); $("#view").scrollTop = prev.y || 0; return true;
  }
  if (UI.tab === "vise" && UI.sub) { UI.sub = null; render("right"); toTop(); return true; }
  if (UI.tab !== "danas") { go("danas", "right", true); return true; }
  return false;
}
// Povratak: prvo zatvori prozor/vežbu, pa vrati prethodni ekran, a izlaz tek sa početnog ekrana.
window.__back = () => handleBack();
function handleBack() {
  if (layerClose) { const f = layerClose; layerClose = null; f(); return true; }
  return navBack();
}
function render(anim) {
  $$("#tabbar button").forEach((b) => b.classList.toggle("on", b.dataset.tab === UI.tab));
  try {
    ({ danas: renderToday, trening: renderTraining, kupovina: renderShopping, vise: renderMore })[UI.tab]();
  } catch (e) {
    console.error(e);
    setTop("Ups", "Nešto u planu nije u redu");
    $("#view").innerHTML = `<div class="card hint"><b>⚠️ Ovaj ekran ne može da se prikaže</b><div class="small muted">Verovatno je neka izmena plana oštećena. Merenja i datum starta ostaju sačuvani.</div>
      <div class="btn-row"><button class="btn primary" id="errReset">Vrati originalni plan</button></div><div class="small muted mt">${esc(e && e.message)}</div></div>`;
    $("#errReset").addEventListener("click", () => { S.data = clone(DEFAULT_DATA); normalize(); save(); toast("Plan vraćen na original"); render(); });
  }
  if (anim) { const v = $("#view"); v.classList.remove("slide-l", "slide-r"); void v.offsetWidth; v.classList.add(anim === "left" ? "slide-l" : "slide-r"); }
}
$$("#tabbar button").forEach((b) => b.addEventListener("click", () => {
  const t = b.dataset.tab;
  if (t === "trening" && UI.tab !== "trening") UI.trainDate = today();
  if (t === "vise" && UI.tab === "vise") {
    // tap na Više dok si u podstrani = povratak na meni (bez dodatnog koraka u istoriji)
    const top = NAV[NAV.length - 1];
    if (top && top.tab === "vise" && !top.sub) NAV.pop();
    UI.sub = null; render("right"); toTop(); return;
  }
  if (t === "danas") { NAV.length = 0; return go(t, null, true); } // Danas je početak: odatle povratak izlazi
  go(t);
}));

function swipe(el, handler) {
  let sx = null, sy = 0, st = 0, ok = true;
  el.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) { sx = null; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
    ok = !e.target.closest("input,textarea,select,.weekstrip,.noswipe");
  }, { passive: true });
  el.addEventListener("touchend", (e) => {
    if (sx === null || !ok) return;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > 1.8 * Math.abs(dy) && Date.now() - st < 700) handler(dx < 0 ? "left" : "right");
  }, { passive: true });
}
swipe(document.body, (dir) => {
  if (!$("#focus").hidden) return $("#focus")._swipe?.(dir);
  if ($("#dlg").open) return;
  if (UI.tab === "vise" && UI.sub && dir === "right") { navBack(); return; }
  const i = TABS.indexOf(UI.tab), j = i + (dir === "left" ? 1 : -1);
  if (j < 0 || j >= TABS.length) return;
  if (TABS[j] === "trening") UI.trainDate = today();
  if (TABS[j] === "danas") { NAV.length = 0; return go("danas", dir, true); } // na Danas istorija kreće iz početka
  go(TABS[j], dir);
});

// novi dan: osveži sve (i kad je aplikacija ostala otvorena preko ponoći)
let lastDay = ymd(today());
function checkNewDay() {
  if (ymd(today()) === lastDay) return false;
  lastDay = ymd(today()); UI.trainDate = today(); UI.nutDate = today(); UI.shopNext = null;
  if (!$("#dlg").open && $("#focus").hidden) render();
  return true;
}
setInterval(checkNewDay, 60000);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  checkNewDay();
  Notif.later(); // jeftino (menja samo razlike); hvata i dozvolu uključenu u podešavanjima telefona
});

load();
render();
try { navigator.storage?.persist?.(); } catch (e) {}
if (isNative()) {
  Notif.init(); checkUpdate();
  try {
    const App = window.Capacitor.Plugins.App;
    App.addListener("backButton", () => { if (!handleBack()) App.exitApp(); });
  } catch (e) {}
}
else if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
})();
