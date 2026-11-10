(function () {
  "use strict";
  const LV = window.XCEL_LEVELS, CATS = window.XCEL_CATS, EX = window.XCEL_EXERCISES;
  const DEV = window.XCEL_DEV || {}, PROGRAMS = window.XCEL_PROGRAMS;
  const BADGES = window.XCEL_BADGES, RANKS = window.XCEL_RANKS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const CAT_COLOR = {
    upper: "var(--magenta)", lower: "var(--aqua)", core: "var(--plum)", bars: "var(--gold)",
    beam: "var(--diamond)", acro: "var(--magenta)", tumble: "var(--aqua)", partner: "var(--plum)"
  };
  const FOCUS_SPIN = [
    { id: "upper", name: "Upper Body", blurb: "Arms & shoulders", cats: ["upper"], c: "var(--magenta)" },
    { id: "lower", name: "Lower Body", blurb: "Legs & jumps", cats: ["lower"], c: "var(--aqua)" },
    { id: "mix", name: "Mix It Up", blurb: "Upper, lower, core", cats: ["upper", "lower", "core"], c: "var(--platinum)" },
    { id: "core", name: "Body Positions", blurb: "Hollow, arch, tuck, pike", cats: ["core"], c: "var(--plum)" },
    { id: "bars", name: "Bars", blurb: "Pull, cast, swing", cats: ["bars"], c: "var(--gold)" },
    { id: "beam", name: "Beam", blurb: "Balance & sticks", cats: ["beam"], c: "var(--diamond)" }
  ];
  const FOCUS_ACRO = [
    { id: "acro", name: "Solo Acro", blurb: "Flexibility & walkovers", cats: ["acro"], c: "var(--magenta)" },
    { id: "tumble", name: "Tumbling", blurb: "Floor power drills", cats: ["tumble"], c: "var(--aqua)" },
    { id: "partner", name: "Partner Acro", blurb: "Pairs: base & top", cats: ["partner"], c: "var(--plum)" },
    { id: "acromix", name: "Acro Mix", blurb: "Solo, tumbling & partner", cats: ["acro", "tumble", "partner"], c: "var(--gold)" }
  ];
  const SCALES = [{ id: 0.75, name: "Easier" }, { id: 1, name: "Standard" }, { id: 1.25, name: "Harder" }];
  const BLOCKS = [10, 15, 20, 30];
  const TEAM_MAX = 20;
  const AV_COLORS = ["#E0218A", "#0FA7A2", "#5B2A86", "#E3A70B", "#22B5E8", "#F26B38", "#3E9B4F", "#8F86C9"];
  const progOf = li => LV[li].program;

  /* ---------- state ---------- */
  const KEY = "xcelspin.v2", OLD_KEY = "xcelspin.v1";
  const uid = () => Math.random().toString(36).slice(2, 9);
  function freshAthlete(name, level, i) {
    return { id: uid(), name, level, color: AV_COLORS[i % AV_COLORS.length], xp: 0, workouts: 0,
      counts: {}, badges: [], lastDay: "", streak: 0, inTeam: true };
  }
  function defaults(s) {
    s.mode = s.mode || "solo"; s.focusSpin = s.focusSpin || "mix"; s.focusAcro = s.focusAcro || "acro";
    s.minutes = BLOCKS.includes(s.minutes) ? s.minutes : 30; s.scale = s.scale || 1;
    s.band = s.band !== false; s.muted = !!s.muted;
    s.teamProgram = s.teamProgram || "xcel";
    return s;
  }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.athletes && s.athletes.length) return defaults(s); } catch (e) {}
    try { // move saved progress from the first version (levels were Silver-Diamond 0-3)
      const o = JSON.parse(localStorage.getItem(OLD_KEY));
      if (o && o.athletes && o.athletes.length) { o.athletes.forEach(a => a.level = Math.min(5, (a.level || 0) + 2)); return defaults(o); }
    } catch (e) {}
    const a = freshAthlete("Gymnast", 2, 0);
    return defaults({ athletes: [a], activeId: a.id });
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  const active = () => S.athletes.find(a => a.id === S.activeId) || S.athletes[0];
  const teamList = () => S.athletes.filter(a => a.inTeam && progOf(a.level) === S.teamProgram);
  const groupList = prog => S.athletes.filter(a => progOf(a.level) === prog);
  const rankOf = xp => { let r = RANKS[0], next = null; RANKS.forEach((k, i) => { if (xp >= k.xp) { r = k; next = RANKS[i + 1] || null; } }); return { r, next }; };
  const initials = n => n.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const lvChip = li => `<span class="lvl-chip" style="--c:var(--${LV[li].id})">${LV[li].name}</span>`;

  /* ---------- sound ---------- */
  let actx = null;
  function beep(f, d, type, vol) {
    if (S.muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type || "sine"; o.frequency.value = f;
      o.connect(g); g.connect(actx.destination);
      const t = actx.currentTime; g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.start(t); o.stop(t + d);
    } catch (e) {}
  }
  const tick = () => beep(1200, 0.04, "square", 0.03);
  const ding = () => { beep(880, 0.25); setTimeout(() => beep(1320, 0.35), 120); };
  const fanfare = () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.3, "triangle", 0.09), i * 130));

  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2400); }

  /* ---------- amounts ---------- */
  const isTimed = ex => ex.unit === "sec" || /sec/.test(ex.unitLabel || "");
  function baseAmount(ex, li) {
    if (li < 2) { const d = DEV[ex.id]; return d ? d[li] : 0; }
    const x = li - 2;
    if ((ex.minLevel || 0) > x) return 0;
    return ex.n[x] || 0;
  }
  function amountFor(ex, li, mult) {
    const b = baseAmount(ex, li); if (!(b > 0)) return 0;
    let v = b * S.scale * (mult || 1);
    v = isTimed(ex) && v >= 10 ? Math.round(v / 5) * 5 : Math.round(v);
    return Math.max(1, v);
  }
  function unitText(ex, v) {
    if (ex.unitLabel) return ex.unitLabel;
    if (ex.unit === "reps") return v === 1 ? "rep" : "reps";
    if (ex.unit === "sec") return "seconds";
    if (ex.unit === "each") return "each side";
    if (ex.unit === "m") return "meters";
    return ex.unit;
  }
  const shortUnit = ex => isTimed(ex) ? "sec" : ex.unit === "each" ? "each" : ex.unitLabel ? ex.unitLabel : unitText(ex, 2);
  const kidText = ex => (DEV[ex.id] && DEV[ex.id][2]) || "";
  function eligible(ex, li) {
    if (!(baseAmount(ex, li) > 0)) return false;
    if (ex.id === "bandrow" && !S.band) return false;
    return true;
  }
  /* estimated seconds for one move, including getting set and a short rest */
  function estSeconds(ex, levels, team) {
    const v = Math.max(...levels.map(li => amountFor(ex, li)));
    const young = levels.some(li => li < 2);
    const sides = ex.id === "split" ? 3 : ex.unit === "each" ? 2 : 1;
    let work;
    if (isTimed(ex)) work = v * sides;
    else if (ex.unit === "m") work = /length/.test(ex.unitLabel || "") ? v * 20 : v * 1.6;
    else work = v * (young ? 3 : 2.5) * sides;
    if (ex.partner) work *= 2; // partners switch roles
    return Math.round(work + (team ? 45 : 25) + (young ? 10 : 0));
  }

  /* ---------- draw ---------- */
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const trainingLevels = () => S.mode === "team" ? [...new Set(teamList().map(a => a.level))].sort((a, b) => a - b) : [active().level];
  function poolFor(focus) {
    const li = Math.min(...trainingLevels());
    return EX.filter(e => focus.cats.includes(e.cat) && eligible(e, li));
  }
  function makeDraw(focus) {
    const pool = poolFor(focus), levels = trainingLevels(), team = S.mode === "team";
    const budget = S.minutes * 60;
    const cats = focus.cats.filter(c => pool.some(e => e.cat === c));
    const queues = {}, used = new Set();
    const refill = c => { const last = items.length ? items[items.length - 1].ex.id : ""; queues[c] = shuffle(pool.filter(e => e.cat === c && e.id !== last)); };
    const items = [];
    let total = 0, k = 0, misses = 0;
    while (cats.length && items.length < 40 && misses < cats.length * 2) {
      const c = cats[k % cats.length]; k++;
      if (!queues[c] || !queues[c].length) refill(c);
      const ex = queues[c][0]; if (!ex) { misses++; continue; }
      const sec = estSeconds(ex, levels, team);
      if (total + sec > budget + 30) { misses++; queues[c].push(queues[c].shift()); continue; }
      queues[c].shift(); misses = 0;
      items.push({ ex, golden: false, round2: used.has(ex.id), sec }); used.add(ex.id); total += sec;
    }
    const goldens = items.length >= 12 ? 2 : items.length >= 4 ? 1 : 0;
    shuffle(items.map((_, i) => i).slice(1)).slice(0, goldens).forEach(i => items[i].golden = true);
    return { focus, pool, items, total };
  }

  /* ---------- wheel ---------- */
  const wheels = {};
  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#999"; }
  function resolveColor(c) { const m = /var\((--[\w-]+)\)/.exec(c); return m ? cssVar(m[1]) : c; }
  function drawWheel(canvasId, labels, colors) {
    const cv = $("#" + canvasId), ctx = cv.getContext("2d"), W = cv.width, R = W / 2;
    ctx.clearRect(0, 0, W, W);
    const n = labels.length, seg = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * seg;
      ctx.beginPath(); ctx.moveTo(R, R); ctx.arc(R, R, R - 4, a0, a0 + seg); ctx.closePath();
      ctx.fillStyle = resolveColor(colors[i % colors.length]); ctx.globalAlpha = i % 2 ? 0.82 : 1; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 4; ctx.stroke();
      ctx.save(); ctx.translate(R, R); ctx.rotate(a0 + seg / 2);
      ctx.fillStyle = "#fff"; ctx.font = "800 26px 'Baloo 2', 'Trebuchet MS', sans-serif"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 3;
      let t = labels[i]; while (ctx.measureText(t).width > R * 0.58 && t.length > 4) t = t.slice(0, -2) + "…";
      ctx.fillText(t, R - 22, 0); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(R, R, R - 3, 0, Math.PI * 2); ctx.lineWidth = 6; ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.stroke();
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * seg; ctx.beginPath(); ctx.arc(R + Math.cos(a) * (R - 16), R + Math.sin(a) * (R - 16), 6, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); }
    wheels[canvasId] = wheels[canvasId] || { rot: 0 }; wheels[canvasId].n = n;
  }
  function idleWheel(canvasId, focus) {
    const pool = shuffle(poolFor(focus)).slice(0, 8);
    drawWheel(canvasId, pool.length ? pool.map(e => e.name) : ["Spin!"], pool.length ? pool.map(e => CAT_COLOR[e.cat]) : [focus.c]);
  }
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function spinWheel(canvasId, draw, done) {
    const seen = new Set(), items = draw.items.filter(i => !seen.has(i.ex.id) && seen.add(i.ex.id)).slice(0, 8);
    drawWheel(canvasId, items.map(i => i.ex.name), items.map(i => i.golden ? "var(--sun)" : CAT_COLOR[i.ex.cat]));
    const w = wheels[canvasId], seg = 360 / w.n, cv = $("#" + canvasId);
    const want = (((-seg / 2 - w.rot) % 360) + 360) % 360;
    w.rot += (reduced() ? 0 : 360 * 5) + want;
    cv.style.transform = "rotate(" + w.rot + "deg)";
    if (reduced()) { done(); return; }
    let d = 40, t = 0; const tk = () => { tick(); t += d; d *= 1.13; if (t < 2900) setTimeout(tk, d); }; tk();
    setTimeout(() => { ding(); done(); }, 3250);
  }

  /* ---------- render: setup ---------- */
  function levelBtns(container, current, onPick) {
    container.innerHTML = ["dev", "xcel"].map(p => `<div class="lvl-group"><span class="lvl-prog">${PROGRAMS[p].name}<small>${PROGRAMS[p].blurb}</small></span>
      <div class="levels ${p}">${LV.map((l, i) => l.program !== p ? "" : `<button type="button" class="lvl lv-${l.id}${i === current ? " on" : ""}" data-i="${i}" aria-pressed="${i === current}">${l.name}</button>`).join("")}</div></div>`).join("");
    $$("button", container).forEach(b => b.onclick = () => onPick(+b.dataset.i));
  }
  function focusBtns(container, list, current, onPick) {
    container.innerHTML = list.map(f => `<button type="button" class="focus${f.id === current ? " on" : ""}" style="--fc:${f.c}" data-id="${f.id}" aria-pressed="${f.id === current}"><i></i><b>${f.name}</b><small>${f.blurb}</small></button>`).join("");
    $$("button", container).forEach(b => b.onclick = () => onPick(b.dataset.id));
  }
  function segBtns(container, list, current, onPick) {
    container.innerHTML = list.map(o => `<button type="button" data-v="${o.id}" class="${o.id === current ? "on" : ""}">${o.name}</button>`).join("");
    $$("button", container).forEach(b => b.onclick = () => onPick(isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v));
  }
  const focusSpin = () => FOCUS_SPIN.find(f => f.id === S.focusSpin) || FOCUS_SPIN[2];
  const focusAcro = () => FOCUS_ACRO.find(f => f.id === S.focusAcro) || FOCUS_ACRO[0];

  function renderSetup() {
    $$("#modeSeg button").forEach(b => b.classList.toggle("on", b.dataset.mode === S.mode));
    const teamMode = S.mode === "team", team = teamList();
    $("#programSeg").hidden = !teamMode;
    $$("#programSeg button").forEach(b => {
      b.classList.toggle("on", b.dataset.prog === S.teamProgram);
      b.onclick = () => { S.teamProgram = b.dataset.prog; save(); renderSetup(); };
    });
    $("#levelField").hidden = teamMode;
    const note = $("#teamNote");
    note.hidden = !teamMode;
    if (teamMode) {
      const by = {}; team.forEach(a => by[a.level] = (by[a.level] || 0) + 1);
      note.innerHTML = team.length
        ? `<b>${team.length} athletes</b> in the ${PROGRAMS[S.teamProgram].name} group: ${Object.keys(by).map(li => `${by[li]} ${LV[li].name}`).join(", ")}. Everyone gets the number for their own level.` + (team.length < 4 ? " Groups usually have 4 to 20." : "")
        : `No one is in the ${PROGRAMS[S.teamProgram].name} group yet. Add or check athletes on the Team tab.`;
    }
    levelBtns($("#levelPick"), active().level, i => { active().level = i; save(); renderAll(); });
    focusBtns($("#focusSpin"), FOCUS_SPIN, S.focusSpin, id => { S.focusSpin = id; save(); renderSetup(); });
    focusBtns($("#focusAcro"), FOCUS_ACRO, S.focusAcro, id => { S.focusAcro = id; save(); renderSetup(); });
    $("#focusAcro").style.gridTemplateColumns = "repeat(2,1fr)";
    segBtns($("#countSeg"), BLOCKS.map(c => ({ id: c, name: c + " min" })), S.minutes, v => { S.minutes = v; save(); renderSetup(); });
    segBtns($("#scaleSeg"), SCALES, S.scale, v => { S.scale = v; save(); renderSetup(); });
    $("#bandToggle").checked = !!S.band;
    idleWheel("wheelSpin", focusSpin());
    idleWheel("wheelAcro", focusAcro());
  }

  function renderHeader() {
    const a = active(), { r, next } = rankOf(a.xp);
    $("#pillAvatar").textContent = initials(a.name); $("#pillAvatar").style.background = a.color;
    $("#pillName").textContent = a.name; $("#pillRank").textContent = `${r.name} · ${LV[a.level].name}`;
    const pct = next ? ((a.xp - r.xp) / (next.xp - r.xp)) * 100 : 100;
    $("#xpFill").style.width = Math.max(3, pct) + "%";
    $("#xpText").textContent = next ? `${a.xp} XP · ${next.xp - a.xp} to ${next.name}` : `${a.xp} XP · Legend!`;
  }

  /* ---------- team ---------- */
  const rmPending = {};
  function renderTeam() {
    if (!$("#newLevel").options.length) $("#newLevel").innerHTML = LV.map((l, i) => `<option value="${i}" ${i === 2 ? "selected" : ""}>${l.name}</option>`).join("");
    $("#roster").innerHTML = ["dev", "xcel"].map(p => {
      const list = groupList(p), inN = list.filter(a => a.inTeam).length;
      return `<section class="roster-group" data-prog="${p}">
        <div class="rg-head"><span><b>${PROGRAMS[p].name}</b> <small>${PROGRAMS[p].blurb}</small></span>
          <span class="rg-count${inN > TEAM_MAX ? " over" : ""}">${inN} of ${list.length} in group</span>
          <button type="button" class="btn ghost small" data-all="${p}">All</button><button type="button" class="btn ghost small" data-none="${p}">None</button></div>
        <ul class="roster">${list.length ? list.map(a => `
          <li class="${a.id === S.activeId ? "active" : ""}" data-id="${a.id}">
            <input type="checkbox" ${a.inTeam ? "checked" : ""} aria-label="${esc(a.name)} in group" data-act="team">
            <button type="button" class="who" data-act="pick"><span class="avatar" style="background:${a.color}">${esc(initials(a.name))}</span>
              <span><b>${esc(a.name)}</b><small>${rankOf(a.xp).r.name} · ${a.xp} XP</small></span></button>
            <select data-act="level" aria-label="${esc(a.name)} level">${LV.map((l, i) => `<option value="${i}" ${i === a.level ? "selected" : ""}>${l.name}</option>`).join("")}</select>
            <button type="button" class="rm${rmPending[a.id] ? " confirm" : ""}" data-act="rm" aria-label="Remove ${esc(a.name)}">${rmPending[a.id] ? "Remove?" : "✕"}</button>
          </li>`).join("") : `<li class="empty-row">No ${PROGRAMS[p].name} athletes yet.</li>`}</ul></section>`;
    }).join("");
    $$("[data-all]").forEach(b => b.onclick = () => {
      const list = groupList(b.dataset.all); list.forEach((a, i) => a.inTeam = i < TEAM_MAX);
      if (list.length > TEAM_MAX) toast(`Groups hold up to ${TEAM_MAX}. The first ${TEAM_MAX} are checked.`);
      save(); renderAll();
    });
    $$("[data-none]").forEach(b => b.onclick = () => { groupList(b.dataset.none).forEach(a => a.inTeam = false); save(); renderAll(); });
    $$("#roster li[data-id]").forEach(li => {
      const a = S.athletes.find(x => x.id === li.dataset.id);
      $('[data-act="team"]', li).onchange = e => {
        if (e.target.checked && groupList(progOf(a.level)).filter(x => x.inTeam).length >= TEAM_MAX) {
          e.target.checked = false; toast(`A group holds up to ${TEAM_MAX} athletes`); return;
        }
        a.inTeam = e.target.checked; save(); renderAll();
      };
      $('[data-act="pick"]', li).onclick = () => { S.activeId = a.id; S.mode = "solo"; save(); renderAll(); toast(`${a.name} is training solo`); };
      $('[data-act="level"]', li).onchange = e => {
        const was = progOf(a.level); a.level = +e.target.value;
        if (was !== progOf(a.level)) { a.inTeam = groupList(progOf(a.level)).filter(x => x.inTeam && x !== a).length < TEAM_MAX; toast(`${a.name} moved to the ${PROGRAMS[progOf(a.level)].name} group`); }
        save(); renderAll();
      };
      $('[data-act="rm"]', li).onclick = () => {
        if (S.athletes.length === 1) { toast("Keep at least one athlete"); return; }
        if (!rmPending[a.id]) { rmPending[a.id] = true; renderTeam(); setTimeout(() => { delete rmPending[a.id]; renderTeam(); }, 3000); return; }
        S.athletes = S.athletes.filter(x => x.id !== a.id);
        if (S.activeId === a.id) S.activeId = S.athletes[0].id;
        delete rmPending[a.id]; save(); renderAll();
      };
    });
    $("#board").innerHTML = ["dev", "xcel"].map(p => {
      const list = groupList(p).sort((x, y) => y.xp - x.xp);
      if (!list.length) return "";
      return `<li class="board-head">${PROGRAMS[p].name}</li>` + list.map((a, i) => `<li><span class="place">${i + 1}</span><span class="avatar" style="background:${a.color}">${esc(initials(a.name))}</span><span class="nm">${esc(a.name)}</span>${lvChip(a.level)}<span class="xp">${a.xp}</span></li>`).join("");
    }).join("");
    const me = active();
    $("#badgeOwner").textContent = "· " + me.name;
    $("#badges").innerHTML = BADGES.map(b => `<div class="badge${me.badges.includes(b.id) ? " got" : ""}">${medal(me.badges.includes(b.id))}<span><b>${b.name}</b><small>${b.desc}</small></span></div>`).join("");
  }
  function medal(got) {
    return `<svg class="medal" viewBox="0 0 30 30"><path d="M9 1h5l3 9h-5zM21 1h-5l-3 9h5z" fill="${got ? "var(--magenta)" : "var(--line)"}"/><circle cx="15" cy="19" r="9" fill="${got ? "var(--sun)" : "var(--line)"}"/><path d="M15 13.5l1.7 3.5 3.8.5-2.8 2.6.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.6 3.8-.5z" fill="${got ? "#fff" : "var(--surface)"}"/></svg>`;
  }

  /* ---------- library ---------- */
  let libCat = "all", libLevel = 2, libQ = "";
  function renderLibrary() {
    const cats = [["all", "All"]].concat(Object.keys(CATS).map(k => [k, CATS[k].name]));
    $("#libCats").innerHTML = cats.map(([k, n]) => `<button type="button" class="chip${k === libCat ? " on" : ""}" data-k="${k}">${n}</button>`).join("");
    $$("#libCats .chip").forEach(b => b.onclick = () => { libCat = b.dataset.k; renderLibrary(); });
    levelBtns($("#libLevel"), libLevel, i => { libLevel = i; renderLibrary(); });
    const q = libQ.toLowerCase();
    const list = EX.filter(e => (libCat === "all" || e.cat === libCat) && (!q || (e.name + " " + e.how + " " + e.cue + " " + kidText(e)).toLowerCase().includes(q)))
      .sort((a, b) => (baseAmount(b, libLevel) > 0) - (baseAmount(a, libLevel) > 0));
    const dev = libLevel < 2;
    $("#libList").innerHTML = list.length ? list.map(e => {
      const v = amountFor(e, libLevel);
      return `<article class="lib-item${v ? "" : " off"}" style="--fc:${CAT_COLOR[e.cat]}">
        <div class="tags"><span class="tag">${CATS[e.cat].name}</span>${e.band ? '<span class="tag band">Band option</span>' : ""}${e.partner ? '<span class="tag pair">Partner</span>' : ""}${e.safety ? '<span class="tag warn">Coach spot</span>' : ""}</div>
        <h3>${esc(e.name)}</h3>
        <div class="num">${v ? v + " " + unitText(e, v) : `<span class="small">Not used at ${LV[libLevel].name}</span>`}</div>
        ${dev && kidText(e) ? `<p class="kid">${esc(kidText(e))}</p>` : ""}
        <p>${esc(e.how)}</p><p class="cue">${esc(e.cue)}</p>
        ${e.band && e.bandHow ? `<p class="cue"><b>Band:</b> ${esc(e.bandHow)}</p>` : ""}
      </article>`;
    }).join("") : `<p class="empty">No moves match "${esc(libQ)}". Try another word.</p>`;
  }

  /* ---------- tabs / routing ---------- */
  const VIEWS = ["spin", "acro", "game", "team", "library"];
  function route() {
    const v = VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : "spin";
    $$(".view").forEach(el => el.hidden = el.dataset.view !== v);
    $$(".tabs a").forEach(a => a.classList.toggle("on", a.dataset.tab === v));
    if (v === "library") renderLibrary();
    if (v === "game" && window.XGame) window.XGame.renderSetup();
    if (v === "spin" || v === "acro") renderSetup();
    window.scrollTo(0, 0);
  }
  function renderAll() {
    renderHeader(); renderSetup(); renderTeam();
    if (!$("#view-library").hidden) renderLibrary();
    if (!$("#view-game").hidden && window.XGame) window.XGame.renderSetup();
  }

  /* ---------- spin flow ---------- */
  let current = null, spinning = false;
  function startSpin(kind) {
    if (spinning) return;
    if (S.mode === "team" && !teamList().length) { toast(`Add athletes to the ${PROGRAMS[S.teamProgram].name} group first`); location.hash = "#team"; return; }
    const focus = kind === "acro" ? focusAcro() : focusSpin();
    const draw = makeDraw(focus);
    if (!draw.items.length) { toast("No moves for this level and focus. Try another focus."); return; }
    draw.kind = kind;
    spinning = true;
    const btn = kind === "acro" ? $("#spinAcroBtn") : $("#spinBtn"); btn.disabled = true;
    spinWheel(kind === "acro" ? "wheelAcro" : "wheelSpin", draw, () => { spinning = false; btn.disabled = false; showDraw(draw); });
  }
  function amountsLine(ex) {
    const lvls = trainingLevels();
    if (lvls.length > 1) return lvls.map(li => `${LV[li].short} ${amountFor(ex, li)}`).join(" · ") + " " + shortUnit(ex);
    const v = amountFor(ex, lvls[0]); return v + " " + unitText(ex, v);
  }
  const mmss = s => { const neg = s < 0; s = Math.abs(Math.round(s)); return (neg ? "+" : "") + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  function showDraw(draw) {
    current = draw;
    $("#drawTitle").textContent = draw.focus.name + " · " + S.minutes + " min block";
    const who = S.mode === "team" ? `${PROGRAMS[S.teamProgram].name} group of ${teamList().length}` : `${active().name} · ${LV[active().level].name}`;
    $("#drawSub").textContent = `${who} · ${draw.items.length} moves · about ${Math.round(draw.total / 60)} min · ${SCALES.find(s => s.id === S.scale).name}` +
      (draw.items.some(i => i.golden) ? " · Find the golden cards for 2x XP!" : "");
    const multi = trainingLevels().length > 1;
    $("#drawList").classList.toggle("multi", multi);
    $("#drawList").innerHTML = draw.items.map((it, i) => `<li class="${it.golden ? "golden" : ""}" style="--fc:${it.golden ? "var(--sun)" : CAT_COLOR[it.ex.cat]};animation-delay:${Math.min(i, 12) * 60}ms">
      <span class="n">${i + 1}</span><span class="t"><b>${esc(it.ex.name)}</b><small>${CATS[it.ex.cat].name}${it.round2 ? " · Round 2" : ""}${it.golden ? " · Golden" : ""}</small></span><span class="q">${amountsLine(it.ex)}</span></li>`).join("");
    $("#drawSheet").hidden = false;
  }

  /* ---------- player ---------- */
  let P = null, timer = null, wakeLock = null, clockH = null;
  function startWorkout() {
    $("#drawSheet").hidden = true;
    const ids = S.mode === "team" ? teamList().map(a => a.id) : [active().id];
    P = { draw: current, i: 0, ids, swaps: current.items.length >= 12 ? 3 : 2, earned: {}, finished: 0, checks: null,
      endAt: Date.now() + S.minutes * 60000, timeUp: false, minutes: S.minutes };
    ids.forEach(id => P.earned[id] = 0);
    $("#player").hidden = false; $("#quitConfirm").hidden = true;
    document.body.style.overflow = "hidden";
    try { navigator.wakeLock && navigator.wakeLock.request("screen").then(l => wakeLock = l).catch(() => {}); } catch (e) {}
    clearInterval(clockH); clockH = setInterval(updateClock, 1000); updateClock();
    showMove();
  }
  function updateClock() {
    if (!P) return;
    const left = (P.endAt - Date.now()) / 1000, el = $("#blockClock");
    el.textContent = left >= 0 ? mmss(left) + " left" : "Over by " + mmss(-left).replace("+", "");
    el.classList.toggle("low", left < 120 && left >= 0);
    el.classList.toggle("over", left < 0);
    if (left < 0 && !P.timeUp) { P.timeUp = true; fanfare(); toast(`${P.minutes} minutes are up! Finish this move and wrap up.`); }
  }
  function members() { return P.ids.map(id => S.athletes.find(a => a.id === id)).filter(Boolean); }
  function showMove() {
    stopTimer();
    const it = P.draw.items[P.i], ex = it.ex;
    const card = $("#moveCard");
    card.classList.remove("enter"); void card.offsetWidth; card.classList.add("enter");
    card.classList.toggle("golden", it.golden);
    card.style.setProperty("--fc", CAT_COLOR[ex.cat]);
    $("#pCat").textContent = CATS[ex.cat].name + (it.round2 ? " · Round 2" : "") + ` · ${P.i + 1} of ${P.draw.items.length}`;
    $("#pGolden").hidden = !it.golden;
    $("#pName").textContent = ex.name;
    $("#pHow").textContent = ex.how; $("#pCue").textContent = ex.cue;
    const young = members().some(m => m.level < 2), kid = kidText(ex);
    $("#pKid").hidden = !(young && kid); if (young && kid) $("#pKidText").textContent = kid;
    const showBand = ex.band && S.band && ex.bandHow;
    $("#pBand").hidden = !showBand; if (showBand) $("#pBandText").textContent = ex.bandHow;
    $("#pSafety").hidden = !ex.safety;
    $("#dots").innerHTML = P.draw.items.map((x, i) => `<i class="${i < P.i ? "done" : i === P.i ? "now" : ""}${x.golden ? " gold" : ""}"></i>`).join("");
    $("#swapLeft").textContent = `(${P.swaps})`; $("#swapBtn").disabled = P.swaps < 1;
    P.byLevel = {};
    if (S.mode !== "team") {
      const a = active(), v = amountFor(ex, a.level);
      $("#pTarget").innerHTML = `<span class="big">${v}</span><span class="unit">${unitText(ex, v)}</span>${lvChip(a.level)}`;
      $("#pTeam").hidden = true;
      P.byLevel[a.level] = v;
    } else {
      const ms = members();
      P.checks = new Set(ms.map(m => m.id));
      const levels = [...new Set(ms.map(m => m.level))].sort((a, b) => a - b);
      levels.forEach(li => P.byLevel[li] = amountFor(ex, li));
      $("#pTarget").innerHTML = levels.length === 1
        ? `<span class="big">${P.byLevel[levels[0]]}</span><span class="unit">${unitText(ex, P.byLevel[levels[0]])}</span>${lvChip(levels[0])}`
        : `<div class="level-targets">${levels.map(li => `<div class="lt" style="--c:var(--${LV[li].id})"><span>${LV[li].name}</span><b>${P.byLevel[li]}</b><small>${shortUnit(ex)}</small></div>`).join("")}</div>`;
      $("#pTeam").hidden = false;
      $("#pTeam").innerHTML = `<p class="team-hint">Everyone goes! Tap anyone who could not finish.</p>` + levels.map(li => `<div class="tgroup"><span class="tg-label" style="--c:var(--${LV[li].id})">${LV[li].name} · ${P.byLevel[li]} ${shortUnit(ex)}</span><div class="tg-names">` +
        ms.filter(m => m.level === li).map(m => `<button type="button" class="tcheck on" data-id="${m.id}" aria-pressed="true"><span class="avatar" style="background:${m.color}">${esc(initials(m.name))}</span><b>${esc(m.name)}</b></button>`).join("") + `</div></div>`).join("");
      $$("#pTeam .tcheck").forEach(b => b.onclick = () => { const on = !b.classList.contains("on"); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); on ? P.checks.add(b.dataset.id) : P.checks.delete(b.dataset.id); });
    }
    P.targets = [...new Set(Object.values(P.byLevel))].sort((a, b) => a - b);
    $("#pTimer").hidden = !isTimed(ex);
    if (isTimed(ex)) resetTimerFace();
    $("#moveCard").scrollTop = 0;
  }
  function resetTimerFace() { $("#timerBtn").textContent = "Start " + Math.max(...P.targets) + "s"; $("#ring").style.strokeDashoffset = 0; }
  function stopTimer() { if (timer) { clearInterval(timer.h); timer = null; } }
  function toggleTimer() {
    if (timer) { stopTimer(); resetTimerFace(); return; }
    const max = Math.max(...P.targets), countUp = P.targets.length > 1;
    let left = 3;
    const btn = $("#timerBtn"), ring = $("#ring"), C = 326.7;
    btn.textContent = "Ready " + left; beep(660, 0.12);
    timer = { h: setInterval(() => {
      if (left > 1) { left--; btn.textContent = "Ready " + left; beep(660, 0.12); return; }
      if (left === 1) { left = 0; timer.t = 0; beep(990, 0.2); btn.textContent = countUp ? "0s" : max + "s"; return; }
      const t = ++timer.t;
      btn.textContent = countUp ? t + "s" : (max - t) + "s";
      ring.style.strokeDashoffset = C * (t / max);
      if (countUp && P.targets.includes(t) && t < max) {
        ding(); toast(Object.keys(P.byLevel).filter(li => P.byLevel[li] === t).map(li => LV[li].name).join(" & ") + " can stop!");
      } else if (!countUp && max - t <= 3 && max - t > 0) beep(700, 0.08);
      if (t >= max) { stopTimer(); ding(); btn.textContent = "Done!"; }
    }, 1000) };
  }
  function award(id, ex, golden, earned) {
    const a = S.athletes.find(x => x.id === id); if (!a) return 0;
    let xp = 10 + a.level * 2; if (S.scale > 1) xp += 2; if (golden) xp *= 2;
    a.xp += xp; earned[id] = (earned[id] || 0) + xp;
    if (ex) a.counts[ex.cat] = (a.counts[ex.cat] || 0) + 1;
    return xp;
  }
  function doneMove() {
    const it = P.draw.items[P.i];
    const ids = S.mode === "team" ? [...P.checks] : [active().id];
    ids.forEach(id => award(id, it.ex, it.golden, P.earned));
    if (ids.length) P.finished++;
    save(); renderHeader();
    const last = P.i >= P.draw.items.length - 1;
    if (it.golden) { fanfare(); if (!last) toast("Golden card! Double XP"); } else ding();
    if (!last) { P.i++; showMove(); } else finishWorkout();
  }
  function swapMove() {
    if (P.swaps < 1) return;
    const used = new Set(P.draw.items.map(i => i.ex.id)), cur = P.draw.items[P.i];
    const options = P.draw.pool.filter(e => !used.has(e.id) && (P.draw.focus.cats.length === 1 || e.cat === cur.ex.cat));
    const list = options.length ? options : P.draw.pool.filter(e => e.id !== cur.ex.id);
    if (!list.length) { toast("No other moves to swap in"); return; }
    cur.ex = list[Math.floor(Math.random() * list.length)]; cur.round2 = false;
    P.swaps--; tick(); showMove();
  }
  /* end-of-session bonus, streaks and badges; shared with the board game */
  function wrapUp(ids, earned, opts) {
    opts = opts || {};
    const today = dayStr(new Date()), yest = dayStr(new Date(Date.now() - 864e5));
    const lines = [], badgeWho = {};
    ids.forEach(id => {
      const a = S.athletes.find(x => x.id === id); if (!a || (!earned[id] && !opts.all)) return;
      earned[id] = earned[id] || 0;
      a.xp += 25; earned[id] += 25; a.workouts++;
      a.streak = a.lastDay === today ? a.streak : a.lastDay === yest ? a.streak + 1 : 1; a.lastDay = today;
      const c = a.counts, acroN = (c.acro || 0) + (c.tumble || 0) + (c.partner || 0);
      const earn = [];
      const give = (bid, cond) => { if (cond && !a.badges.includes(bid)) { a.badges.push(bid); earn.push(bid); } };
      give("first", a.workouts >= 1); give("five", a.workouts >= 5); give("ten", a.workouts >= 10);
      give("bars", (c.bars || 0) >= 15); give("beam", (c.beam || 0) >= 15); give("hollow", (c.core || 0) >= 15);
      give("acro", acroN >= 15); give("team", !!opts.team); give("streak3", a.streak >= 3); give("diamond", a.level === 5);
      give("podium", !!(opts.winners && opts.winners.includes(id)));
      lines.push(`<span class="fx"><b>${esc(a.name)}</b> +${earned[id]}</span>`);
      earn.forEach(b => (badgeWho[b] = badgeWho[b] || []).push(a.name));
    });
    save();
    return { lines, badgeWho };
  }
  const badgeLines = badgeWho => Object.keys(badgeWho).map(b => `<div class="newbadge">New badge <b>${BADGES.find(x => x.id === b).name}</b>: ${badgeWho[b].length > 6 ? badgeWho[b].length + " athletes" : badgeWho[b].map(esc).join(", ")}</div>`).join("");
  const dayStr = d => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  function finishWorkout() {
    stopTimer(); clearInterval(clockH);
    const usedMin = Math.max(1, Math.round((Date.now() - (P.endAt - P.minutes * 60000)) / 60000));
    const { lines, badgeWho } = wrapUp(P.ids, P.earned, { team: S.mode === "team" });
    try { wakeLock && wakeLock.release(); } catch (e) {} wakeLock = null;
    $("#player").hidden = true; document.body.style.overflow = "";
    const total = Object.values(P.earned).reduce((s, v) => s + v, 0);
    const titles = ["You stuck it!", "Nailed it!", "Perfect 10!", "Superstar work!", "Chalk it up!"];
    $("#finishTitle").textContent = P.finished ? titles[Math.floor(Math.random() * titles.length)] : "Workout ended";
    $("#finishXp").textContent = "+" + total + " XP";
    $("#finishList").innerHTML = `<div class="finish-sum">${P.finished} of ${P.draw.items.length} moves in ${usedMin} min</div>` +
      (lines.length ? `<div class="fx-grid">${lines.join("")}</div>` : "<div>No moves finished this time. Spin again!</div>") +
      badgeLines(badgeWho);
    $("#finishSheet").hidden = false;
    if (P.finished) { fanfare(); confetti(); }
    P = null;
    renderAll();
  }

  /* ---------- confetti ---------- */
  function confetti() {
    if (reduced()) return;
    const cv = $("#confetti"), ctx = cv.getContext("2d");
    const W = cv.width = innerWidth, H = cv.height = innerHeight;
    const cols = ["--magenta", "--aqua", "--sun", "--plum", "--diamond"].map(cssVar);
    const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, s: 6 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)] }));
    let f = 0;
    (function step() {
      ctx.clearRect(0, 0, W, H);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (++f < 220 && !$("#finishSheet").hidden) requestAnimationFrame(step); else ctx.clearRect(0, 0, W, H);
    })();
  }

  /* ---------- picker ---------- */
  function openPicker() {
    $("#pickList").innerHTML = S.athletes.slice().sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)).map(a => `<li class="${a.id === S.activeId ? "active" : ""}"><button type="button" class="who" data-id="${a.id}"><span class="avatar" style="background:${a.color}">${esc(initials(a.name))}</span><span><b>${esc(a.name)}</b><small>${LV[a.level].name} · ${a.xp} XP</small></span></button></li>`).join("") +
      `<li><button type="button" class="who" data-id="__team"><span class="avatar" style="background:var(--muted)">+</span><span><b>Add or edit athletes</b><small>Opens the Team tab</small></span></button></li>`;
    $$("#pickList .who").forEach(b => b.onclick = () => {
      $("#pickSheet").hidden = true;
      if (b.dataset.id === "__team") { location.hash = "#team"; return; }
      S.activeId = b.dataset.id; S.mode = "solo"; save(); renderAll();
    });
    $("#pickSheet").hidden = false;
  }

  /* ---------- wire up ---------- */
  $$("#modeSeg button").forEach(b => b.onclick = () => { S.mode = b.dataset.mode; save(); renderSetup(); });
  $("#bandToggle").onchange = e => { S.band = e.target.checked; save(); renderSetup(); };
  $("#spinBtn").onclick = () => startSpin("spin");
  $("#spinAcroBtn").onclick = () => startSpin("acro");
  $$(".phone-spin").forEach(b => b.onclick = () => { window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" }); setTimeout(() => startSpin(b.dataset.spin), 350); });
  $("#drawAgain").onclick = () => { $("#drawSheet").hidden = true; startSpin(current.kind); };
  $("#drawGo").onclick = startWorkout;
  $("#doneBtn").onclick = doneMove;
  $("#swapBtn").onclick = swapMove;
  $("#timerBtn").onclick = toggleTimer;
  $("#quitBtn").onclick = () => $("#quitConfirm").hidden = false;
  $("#quitNo").onclick = () => $("#quitConfirm").hidden = true;
  $("#quitYes").onclick = () => finishWorkout();
  const setMute = () => { $("#muteBtn").classList.toggle("off", S.muted); $("#muteBtn").setAttribute("aria-label", S.muted ? "Sound off" : "Sound on"); };
  $("#muteBtn").onclick = () => { S.muted = !S.muted; save(); setMute(); };
  $("#finishOk").onclick = () => { $("#finishSheet").hidden = true; };
  $("#athletePill").onclick = openPicker;
  $("#pickClose").onclick = () => $("#pickSheet").hidden = true;
  $("#addForm").addEventListener("submit", e => {
    e.preventDefault();
    const names = $("#newName").value.split(/[,\n;]+/).map(n => n.trim().slice(0, 20)).filter(Boolean);
    if (!names.length) return;
    const lvl = +$("#newLevel").value, prog = progOf(lvl);
    names.forEach(n => {
      const a = freshAthlete(n, lvl, S.athletes.length);
      a.inTeam = groupList(prog).filter(x => x.inTeam).length < TEAM_MAX;
      S.athletes.push(a);
    });
    $("#newName").value = ""; save(); renderAll();
    toast(names.length === 1 ? `${names[0]} joined ${LV[lvl].name}` : `${names.length} athletes joined ${LV[lvl].name}`);
  });
  $("#libSearch").addEventListener("input", e => { libQ = e.target.value; renderLibrary(); });
  window.addEventListener("hashchange", route);
  if (window.matchMedia) { const mq = matchMedia("(prefers-color-scheme: dark)"); mq.addEventListener && mq.addEventListener("change", renderSetup); }
  new MutationObserver(renderSetup).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderSetup);

  window.XS = {
    get S() { return S; }, save, toast, beep, tick, ding, fanfare, confetti, reduced, shuffle, esc, initials, lvChip,
    LV, CATS, EX, PROGRAMS, CAT_COLOR, amountFor, unitText, shortUnit, isTimed, kidText, eligible, award, wrapUp, badgeLines,
    groupList, progOf, rankOf, renderAll, renderHeader, TEAM_MAX
  };
  setMute(); route(); renderAll();

  if ("serviceWorker" in navigator && location.protocol === "https:" && !/claude|claudeusercontent/.test(location.hostname)) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
