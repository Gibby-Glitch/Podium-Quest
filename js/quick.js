/* Quick Spin: no names, one big wheel. Each gymnast (or team) spins, reads the number for their level, and the next one goes. */
(function () {
  "use strict";
  const X = window.XS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = X.esc, LV = X.LV, CATS = X.CATS, EX = X.EX;
  const S = () => X.S;

  const FOCUS = [
    { id: "mix", name: "Conditioning mix", cats: ["upper", "lower", "core"] },
    { id: "upper", name: "Upper body", cats: ["upper"] },
    { id: "lower", name: "Lower body", cats: ["lower"] },
    { id: "core", name: "Body positions", cats: ["core"] },
    { id: "bars", name: "Bars", cats: ["bars"] },
    { id: "beam", name: "Beam", cats: ["beam"] },
    { id: "acro", name: "Acro & tumbling", cats: ["acro", "tumble"] },
    { id: "all", name: "Everything", cats: ["upper", "lower", "core", "bars", "beam", "acro", "tumble"] }
  ];
  const TEAMS = [
    { name: "Sparkles", color: "#E0218A" }, { name: "Flippers", color: "#0FA7A2" }, { name: "Twisters", color: "#D99A00" },
    { name: "Stick-Its", color: "#6A35A0" }, { name: "High Flyers", color: "#1C9ED8" }, { name: "Chalk Dust", color: "#E85D2A" }
  ];
  const SLICES = 15, GOLD = "gold", REST_SECS = 15;

  function st() {
    const s = S(); s.quick = s.quick || {};
    const q = s.quick;
    q.mode = q.mode || "quick"; q.prog = q.prog || "xcel"; q.play = q.play || "solo"; q.teams = q.teams || 3;
    q.focus = q.focus || "mix"; q.points = q.points || [0, 0, 0, 0, 0, 0]; q.turn = q.turn || 0; q.spins = q.spins || 0;
    return q;
  }
  const levels = () => st().prog === "dev" ? [0, 1] : [2, 3, 4, 5];
  const focus = () => FOCUS.find(f => f.id === st().focus) || FOCUS[0];
  function pool() {
    const li = Math.min(...levels());
    return EX.filter(e => focus().cats.includes(e.cat) && !e.partner && X.eligible(e, li));
  }
  function buildWheel() {
    const q = st(), p = X.shuffle(pool()), moves = [];
    while (p.length && moves.length < SLICES - 1) moves.push(...p.slice(0, SLICES - 1 - moves.length));
    moves.splice(1 + Math.floor(Math.random() * (moves.length - 1)), 0, { id: GOLD });
    q.wheel = moves.map(m => m.id); q.wheelKey = q.prog + q.focus;
    X.save();
  }
  const wheelItems = () => { const q = st(); if (!q.wheel || q.wheelKey !== q.prog + q.focus) buildWheel(); return q.wheel.map(id => id === GOLD ? GOLD : EX.find(e => e.id === id)).filter(Boolean); };

  /* ---------- wheel ---------- */
  let rot = 0, spinning = false;
  const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#999";
  const col = c => { const m = /var\((--[\w-]+)\)/.exec(c); return m ? cssVar(m[1]) : c; };
  function drawWheel() {
    const items = wheelItems(), cv = $("#wheelQuick"), ctx = cv.getContext("2d"), W = cv.width, R = W / 2;
    const n = items.length, seg = (Math.PI * 2) / n;
    ctx.clearRect(0, 0, W, W);
    items.forEach((it, i) => {
      const a0 = -Math.PI / 2 + i * seg, gold = it === GOLD;
      ctx.beginPath(); ctx.moveTo(R, R); ctx.arc(R, R, R - 6, a0, a0 + seg); ctx.closePath();
      if (gold) { const g = ctx.createRadialGradient(R, R, R * 0.2, R, R, R); g.addColorStop(0, "#FFE58A"); g.addColorStop(1, "#F2A900"); ctx.fillStyle = g; }
      else { ctx.fillStyle = col(X.CAT_COLOR[it.cat]); ctx.globalAlpha = i % 2 ? 0.8 : 1; }
      ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 5; ctx.stroke();
      ctx.save(); ctx.translate(R, R); ctx.rotate(a0 + seg / 2);
      ctx.textAlign = "right"; ctx.textBaseline = "middle";
      ctx.font = "800 30px 'Baloo 2', 'Trebuchet MS', sans-serif";
      ctx.fillStyle = gold ? "#5A3B00" : "#fff";
      ctx.shadowColor = gold ? "transparent" : "rgba(0,0,0,.35)"; ctx.shadowBlur = 3;
      let t = gold ? "★ GOLD CARD" : it.name;
      while (ctx.measureText(t).width > R * 0.6 && t.length > 4) t = t.slice(0, -2) + "…";
      ctx.fillText(t, R - 34, 0); ctx.restore();
    });
    ctx.beginPath(); ctx.arc(R, R, R - 4, 0, Math.PI * 2); ctx.lineWidth = 8; ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.stroke();
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * seg; ctx.beginPath(); ctx.arc(R + Math.cos(a) * (R - 22), R + Math.sin(a) * (R - 22), 8, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); }
  }
  function spin() {
    if (spinning) return;
    const items = wheelItems(), n = items.length, seg = 360 / n;
    const idx = Math.floor(Math.random() * n);
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const want = ((-(idx * seg + seg / 2) - jitter - rot) % 360 + 360) % 360;
    const reduce = X.reduced();
    rot += (reduce ? 0 : 360 * 6) + want;
    $("#wheelQuick").style.transform = `rotate(${rot}deg)`;
    spinning = true; $("#qSpinBtn").disabled = true;
    if (!reduce) { let d = 35, t = 0; const tk = () => { X.tick(); t += d; d *= 1.12; if (t < 3000) setTimeout(tk, d); }; tk(); }
    setTimeout(() => { spinning = false; $("#qSpinBtn").disabled = false; X.ding(); showResult(items[idx]); }, reduce ? 50 : 3350);
  }

  /* ---------- result ---------- */
  const teamOn = () => st().play === "teams";
  const curTeam = () => TEAMS[st().turn % st().teams];
  function teamTag() {
    if (!teamOn()) return "";
    const t = curTeam();
    return `<span class="team-pill" style="--tc:${t.color}"><i></i>Team ${esc(t.name)}</span>`;
  }
  function showResult(it) {
    const q = st(); q.spins++; X.save();
    const sheet = $("#qSheet"), card = $("#qCard");
    if (it === GOLD) {
      X.fanfare();
      card.style.setProperty("--pc", "#F2A900");
      card.innerHTML = `<div class="gold-card">
        ${teamTag()}
        <div class="gold-star">★</div>
        <h2>Gold card!</h2>
        <p>Water or rest station. Take 15 seconds.</p>
        <p class="small">Your 15-second timer is already running.</p></div>
        <div class="sheet-actions">${teamOn() ? `<button type="button" class="btn big done wide" id="qYes">+1 for Team ${esc(curTeam().name)} · Next team</button>` : `<button type="button" class="btn big done wide" id="qNext">Next spinner!</button>`}</div>`;
      X.bgTimer({ label: (teamOn() ? curTeam().name + " · " : "") + "Water / rest", secs: REST_SECS, color: "#F2A900" });
    } else {
      const ex = it, lv = levels(), dev = st().prog === "dev", kid = dev ? X.kidText(ex) : "";
      card.style.setProperty("--pc", X.CAT_COLOR[ex.cat]);
      card.innerHTML = `${teamTag()}
        <span class="cat-tag" style="background:${X.CAT_COLOR[ex.cat]}">${CATS[ex.cat].name}</span>
        <h2 class="q-move">${esc(ex.name)}</h2>
        <p class="q-find">Find your level:</p>
        <div class="q-levels">${lv.map(li => { const v = X.amountFor(ex, li); return `<div class="q-lv" style="--c:var(--${LV[li].id})"><span>${LV[li].name}</span><b>${v}</b><small>${X.isTimed(ex) ? "sec" : X.unitText(ex, v)}</small>${X.isTimed(ex) ? `<button type="button" class="q-timer" data-li="${li}" data-v="${v}">Start timer</button>` : ""}</div>`; }).join("")}</div>
        ${X.isTimed(ex) ? `<p class="small">Tap your level's timer. It keeps running at the bottom of the screen so the next person can spin.</p>` : ""}
        ${kid ? `<div class="kid-note"><h3>Say it to little gymnasts</h3><p>${esc(kid)}</p></div>` : ""}
        <p class="gc-how">${esc(ex.how)}</p><p class="gc-cue">${esc(ex.cue)}</p>
        ${ex.band && S().band && ex.bandHow ? `<div class="band-note"><strong>Band option</strong><p>${esc(ex.bandHow)}</p></div>` : ""}
        ${ex.safety ? '<div class="safety-note">Coach spot required. Use mats.</div>' : ""}
        <div class="sheet-actions">${teamOn()
          ? `<button type="button" class="btn ghost" id="qNo">Skip</button><button type="button" class="btn big done" id="qYes">Done! +1 for ${esc(curTeam().name)}</button>`
          : `<button type="button" class="btn big done wide" id="qNext">Next spinner!</button>`}</div>`;
      $$("#qCard .q-timer").forEach(b => b.onclick = () => {
        const li = +b.dataset.li;
        X.bgTimer({ label: `${teamOn() ? curTeam().name + " · " : ""}${ex.name} · ${LV[li].short}`, secs: +b.dataset.v, color: X.CAT_COLOR[ex.cat] });
        b.textContent = "Running ✓"; b.disabled = true;
      });
    }
    sheet.hidden = false;
    card.classList.remove("deal"); void card.offsetWidth; card.classList.add("deal");
    const close = () => { sheet.hidden = true; render(); };
    const nx = $("#qNext"); if (nx) nx.onclick = close;
    const y = $("#qYes"); if (y) y.onclick = () => { const q2 = st(); q2.points[q2.turn % q2.teams]++; q2.turn = (q2.turn + 1) % q2.teams; X.save(); X.ding(); close(); };
    const no = $("#qNo"); if (no) no.onclick = () => { const q2 = st(); q2.turn = (q2.turn + 1) % q2.teams; X.save(); close(); };
  }

  /* ---------- controls ---------- */
  function seg(el, opts, cur, fn) {
    el.innerHTML = opts.map(o => `<button type="button" data-v="${o.v}" class="${String(o.v) === String(cur) ? "on" : ""}">${o.t}</button>`).join("");
    $$("button", el).forEach(b => b.onclick = () => fn(b.dataset.v));
  }
  function render() {
    const q = st();
    $$("#spinMode button").forEach(b => { b.classList.toggle("on", b.dataset.v === q.mode); b.onclick = () => { q.mode = b.dataset.v; X.save(); render(); }; });
    $("#quickWrap").hidden = q.mode !== "quick";
    $("#builderWrap").hidden = q.mode === "quick";
    if (q.mode !== "quick") return;
    $$("#qProg button").forEach(b => { b.classList.toggle("on", b.dataset.v === q.prog); b.onclick = () => { q.prog = b.dataset.v; X.save(); render(); }; });
    $$("#qPlay button").forEach(b => { b.classList.toggle("on", b.dataset.v === q.play); b.onclick = () => { q.play = b.dataset.v; X.save(); render(); }; });
    $("#qTeamsWrap").hidden = q.play !== "teams";
    seg($("#qTeams"), [2, 3, 4, 5, 6].map(v => ({ v, t: v })), q.teams, v => { q.teams = +v; q.turn = 0; q.points = [0, 0, 0, 0, 0, 0]; X.save(); render(); });
    $("#qFocus").innerHTML = FOCUS.map(f => `<button type="button" class="chip${f.id === q.focus ? " on" : ""}" data-f="${f.id}">${f.name}</button>`).join("");
    $$("#qFocus .chip").forEach(b => b.onclick = () => { q.focus = b.dataset.f; X.save(); render(); });
    const turn = $("#qTurn");
    turn.hidden = q.play !== "teams";
    if (q.play === "teams") {
      const t = curTeam();
      turn.style.setProperty("--tc", t.color);
      turn.innerHTML = `<div class="tt-now"><span class="dot"></span><span><b>Team ${esc(t.name)}</b>, you're up!</span></div>
        <div class="q-score">${TEAMS.slice(0, q.teams).map((x, i) => `<span class="${i === q.turn % q.teams ? "now" : ""}" style="--tc:${x.color}"><i></i>${esc(x.name)} <b>${q.points[i]}</b></span>`).join("")}<button type="button" class="btn ghost small" id="qReset">Reset</button></div>`;
      $("#qReset").onclick = () => { q.points = [0, 0, 0, 0, 0, 0]; q.turn = 0; q.spins = 0; X.save(); render(); X.toast("Scores reset"); };
    }
    $("#qCount").textContent = q.spins ? `${q.spins} spin${q.spins === 1 ? "" : "s"} so far` : "Ready for the first spin!";
    drawWheel();
  }

  $("#qSpinBtn").onclick = spin;
  $("#qNewWheel").onclick = () => { buildWheel(); drawWheel(); X.toast("New wheel!"); };
  if (window.matchMedia) { const mq = matchMedia("(prefers-color-scheme: dark)"); mq.addEventListener && mq.addEventListener("change", drawWheel); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawWheel);
  window.XQuick = { render };
  render();
})();
