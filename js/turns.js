/* Solo-turn games: Gym-Zee Dice and Card Draw. Athletes come up one at a time. */
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
  const MULT_FACES = [0, 1, 1, 1, 2, 2];
  const SUITS = [
    { s: "♥", red: true, name: "Hearts" }, { s: "♠", red: false, name: "Spades" },
    { s: "♦", red: true, name: "Diamonds" }, { s: "♣", red: false, name: "Clubs" }
  ];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const INFO = {
    dice: { title: "Gym-Zee Dice", blurb: "Each athlete rolls three dice: the Move die picks an exercise from the 1-20 chart, the How Many die says how many, and the Multiplier die makes it ×0, ×1 or ×2. Keep the dice you like and re-roll the rest. Roll doubles on the two d20s for a GYM-ZEE and double XP!" },
    cards: { title: "Card Draw", blurb: "A real deck of cards. Each suit is a type of move and each card has its own exercise. The card's value is how many: Ace = 1, Jack = 11, Queen = 12, King = 13. Queens are buddy cards, and the two Jokers are wild." }
  };

  /* ---------- setup state ---------- */
  function setup() {
    const s = S();
    s.turnSetup = s.turnSetup || {};
    const st = s.turnSetup;
    st.prog = st.prog || s.teamProgram || "xcel"; st.focus = st.focus || "mix";
    st.time = st.time === undefined ? 0 : st.time; st.rerolls = st.rerolls === undefined ? 1 : st.rerolls;
    st.deck = st.deck || "full"; st.order = st.order || [];
    st.quickTurns = st.quickTurns !== false;
    return st;
  }
  const pick = () => S().gamePick || "board";
  const players = () => X.groupList(setup().prog).filter(a => a.inTeam);
  function lineup() {
    const st = setup(), here = players(), ids = here.map(a => a.id);
    st.order = st.order.filter(id => ids.includes(id)).concat(ids.filter(id => !st.order.includes(id)));
    return st.order.map(id => S().athletes.find(a => a.id === id));
  }
  const focusOf = id => FOCUS.find(f => f.id === id) || FOCUS[0];
  const groupLevels = () => setup().prog === "dev" ? [0, 1] : [2, 3, 4, 5];
  const minLevel = () => setup().quickTurns || !players().length ? groupLevels()[0] : Math.min(...players().map(a => a.level));
  function poolFor(cats) {
    const li = minLevel();
    return EX.filter(e => cats.includes(e.cat) && !e.partner && X.eligible(e, li));
  }
  function buildChart() {
    const st = setup(), pool = X.shuffle(poolFor(focusOf(st.focus).cats));
    const chart = [];
    while (pool.length && chart.length < 20) chart.push(...pool.slice(0, 20 - chart.length));
    st.chart = chart.map(e => e.id); st.chartKey = st.prog + st.focus + minLevel();
    X.save();
  }
  const chartList = () => { const st = setup(); if (!st.chart || st.chartKey !== st.prog + st.focus + minLevel()) buildChart(); return st.chart.map(id => EX.find(e => e.id === id)).filter(Boolean); };

  /* how many: the raw roll or card value, turned into reps or seconds and capped by level */
  /* the roll is the top level's number (Diamond, or Level 2); other levels get the same share of their own normal amount */
  function howMany(ex, li, n) {
    let v = X.isTimed(ex) ? n * 2 : /length/.test(ex.unitLabel || "") ? Math.ceil(n / 4) : n;
    const top = X.LV[li].program === "dev" ? 1 : 5, topStd = X.amountFor(ex, top), myStd = X.amountFor(ex, li);
    if (topStd > 0 && myStd > 0 && li !== top) v = v * (myStd / topStd);
    v = Math.max(n === 0 ? 0 : 1, Math.round(v));
    const cap = Math.max(1, X.amountFor(ex, li) * 2);
    return { v: Math.min(v, cap), raw: v, capped: v > cap, cap };
  }

  /* ---------- setup screen ---------- */
  function seg(el, opts, cur, fn) {
    el.innerHTML = opts.map(o => `<button type="button" data-v="${o.v}" class="${String(o.v) === String(cur) ? "on" : ""}">${o.t}</button>`).join("");
    $$("button", el).forEach(b => b.onclick = () => fn(b.dataset.v));
  }
  function renderPicker() {
    $$("#gamePicker .pick-card").forEach(b => {
      b.classList.toggle("on", b.dataset.game === pick());
      b.setAttribute("aria-selected", b.dataset.game === pick());
      b.onclick = () => { S().gamePick = b.dataset.game; X.save(); window.XGame.renderSetup(); };
    });
    $("#setupBoard").hidden = pick() !== "board";
    $("#setupTurns").hidden = pick() === "board";
  }
  function chartHTML(list, compact) {
    return `<div class="chart${compact ? " compact" : ""}">${list.map((e, i) => `<div class="chart-row" style="--fc:${X.CAT_COLOR[e.cat]}"><b>${i + 1}</b><span>${esc(e.name)}</span></div>`).join("")}</div>`;
  }
  function suitCats() {
    const cats = focusOf(setup().focus).cats.filter(c => poolFor([c]).length);
    const four = cats.length >= 4 ? X.shuffle(cats).slice(0, 4) : [0, 1, 2, 3].map(i => cats[i % cats.length]);
    return four;
  }
  function renderTurnsSetup() {
    const st = setup(), g = pick(), info = INFO[g];
    $("#tTitle").textContent = info.title; $("#tBlurb").textContent = info.blurb;
    $("#tHeroArt").innerHTML = g === "dice"
      ? `<div class="hero-dice">${die("move", 17)}${die("count", 12)}${die("mult", 2)}</div>`
      : `<div class="hero-cards">${cardBack()}${miniFace("Q", SUITS[0])}${miniFace("7", SUITS[1])}</div>`;
    $$("#tProg button").forEach(b => { b.classList.toggle("on", b.dataset.v === st.prog); b.onclick = () => { st.prog = b.dataset.v; X.save(); renderTurnsSetup(); }; });
    const all = X.groupList(st.prog), here = players();
    $("#tGroupNote").innerHTML = all.length
      ? `${here.length} of ${all.length} ${X.PROGRAMS[st.prog].name} athletes checked in. Change who's here on the <a href="#team">Team tab</a>.`
      : `No ${X.PROGRAMS[st.prog].name} athletes yet. Add them on the <a href="#team">Team tab</a>.`;
    $("#tFocus").innerHTML = FOCUS.map(f => `<button type="button" class="chip${f.id === st.focus ? " on" : ""}" data-f="${f.id}">${f.name}</button>`).join("");
    $$("#tFocus .chip").forEach(b => b.onclick = () => { st.focus = b.dataset.f; X.save(); renderTurnsSetup(); });
    seg($("#tTime"), [{ v: 0, t: "Off" }, { v: 15, t: "15 min" }, { v: 20, t: "20 min" }, { v: 30, t: "30 min" }], st.time, v => { st.time = +v; X.save(); renderTurnsSetup(); });
    $("#tRerollField").hidden = g !== "dice"; $("#tDeckField").hidden = g !== "cards";
    seg($("#tRerolls"), [0, 1, 2].map(v => ({ v, t: v })), st.rerolls, v => { st.rerolls = +v; X.save(); renderTurnsSetup(); });
    seg($("#tDeck"), [{ v: "full", t: "Full · 54" }, { v: "half", t: "Half · 27" }], st.deck, v => { st.deck = v; X.save(); renderTurnsSetup(); });
    const quick = st.quickTurns;
    seg($("#tPlayersSeg"), [{ v: "quick", t: "Quick turns (no names)" }, { v: "line", t: "Use my line-up" }], quick ? "quick" : "line", v => { st.quickTurns = v === "quick"; X.save(); renderTurnsSetup(); });
    $("#tLineupBox").hidden = quick;
    if (quick) $("#tGroupNote").innerHTML = `No names needed. Kids walk up one at a time, and every move shows the number for each ${X.PROGRAMS[st.prog].name} level.`;
    const line = lineup();
    $("#tLineup").innerHTML = line.length ? line.map((a, i) => `<button type="button" class="tc-chip" data-id="${a.id}"><span class="order">${i + 1}</span><span class="avatar" style="background:${a.color}">${esc(X.initials(a.name))}</span>${esc(a.name)} <small>${LV[a.level].short}</small></button>`).join("") : '<span class="small">No one checked in yet.</span>';
    $$("#tLineup .tc-chip").forEach(b => b.onclick = () => { st.order = st.order.filter(id => id !== b.dataset.id).concat(b.dataset.id); X.save(); renderTurnsSetup(); });
    if (g === "dice") {
      const list = here.length || quick ? chartList() : [];
      $("#tChartWrap").innerHTML = list.length ? `<div class="teams-head mt"><h2>Dice chart</h2><button type="button" class="btn ghost small" id="tNewChart">New chart</button></div><p class="small">The Move die lands on a number, and this is the move for that number.</p>${chartHTML(list)}` : "";
      const nc = $("#tNewChart"); if (nc) nc.onclick = () => { buildChart(); renderTurnsSetup(); X.toast("Fresh chart!"); };
    } else {
      const sc = here.length || quick ? suitCats() : [];
      $("#tChartWrap").innerHTML = sc.length ? `<h2 class="mt">Suits</h2><div class="suit-key">${SUITS.map((u, i) => `<span class="${u.red ? "red" : ""}"><b>${u.s}</b>${CATS[sc[i]].name}</span>`).join("")}</div><p class="small">Suits are picked fresh each time you start.</p>` : "";
    }
    $("#tStart").disabled = !quick && !here.length;
    $("#tStart").textContent = quick ? `Start ${info.title}` : here.length ? `Start ${info.title} · ${here.length} athlete${here.length > 1 ? "s" : ""}` : "Check in athletes to play";
  }

  /* ---------- art ---------- */
  function die(kind, val, held, rolling) {
    const label = kind === "move" ? "Move" : kind === "count" ? "How many" : "Multiplier";
    const face = kind === "mult" ? "×" + val : val;
    const shape = kind === "mult"
      ? `<rect x="8" y="8" width="84" height="84" rx="20" class="die-body mult"/><rect x="8" y="8" width="84" height="22" rx="12" class="die-shine"/>`
      : `<path d="M50 4 L92 28 L92 72 L50 96 L8 72 L8 28Z" class="die-body ${kind}"/><path d="M50 4 L92 28 L50 36 L8 28Z" class="die-shine"/><path d="M8 28 L50 36 L92 28 M50 36 L50 96 M8 72 L50 36 M92 72 L50 36" class="die-edge"/>`;
    return `<div class="die-wrap${held ? " held" : ""}${rolling ? " rolling" : ""}" data-kind="${kind}">
      <svg viewBox="0 0 100 100" class="die">${shape}<text x="50" y="${kind === "mult" ? 64 : 66}" text-anchor="middle" class="die-num${String(face).length > 2 ? " sm" : ""}">${face}</text></svg>
      <span class="die-label">${label}${kind !== "mult" ? " · d20" : ""}</span>${held ? '<span class="keep">KEEP</span>' : ""}</div>`;
  }
  const cardBack = () => `<div class="pcard back"><div class="back-art"><svg viewBox="0 0 40 40"><path d="M20 4 L24 15 L36 15.5 L26.5 23 L30 35 L20 28 L10 35 L13.5 23 L4 15.5 L16 15Z" fill="#fff" opacity=".85"/></svg></div></div>`;
  const miniFace = (r, u) => `<div class="pcard mini${u.red ? " red" : ""}"><span class="corner tl">${r}<i>${u.s}</i></span><span class="pip">${u.s}</span><span class="corner br">${r}<i>${u.s}</i></span></div>`;

  /* ---------- play ---------- */
  let T = null, clockH = null, tState = null;
  function start() {
    const st = setup(), line = st.quickTurns ? [] : lineup(); if (!st.quickTurns && !line.length) return;
    T = { game: pick(), quick: st.quickTurns, ids: line.map(a => a.id), idx: 0, turns: 0, earned: {}, done: 0,
      endAt: st.time ? Date.now() + st.time * 60000 : null, startedAt: Date.now(), timeUp: false };
    if (T.game === "dice") { T.chart = chartList(); }
    else { T.suits = suitCats(); T.deck = makeDeck(); }
    $("#turns").hidden = false; document.body.style.overflow = "hidden";
    $("#tPlayTitle").textContent = INFO[T.game].title; $("#tQuitConfirm").hidden = true;
    clearInterval(clockH); clockH = setInterval(clock, 1000); clock();
    $("#tMute").classList.toggle("off", S().muted);
    newTurn();
  }
  const current = () => T.quick ? { id: "", name: "Gymnast", level: groupLevels()[0], color: "var(--magenta)" } : S().athletes.find(a => a.id === T.ids[T.idx]);
  function renderLine() {
    if (T.quick) { $("#tLine").innerHTML = ""; return; }
    $("#tLine").innerHTML = T.ids.map((id, i) => { const a = S().athletes.find(x => x.id === id); if (!a) return ""; return `<button type="button" class="ln${i === T.idx ? " now" : ""}" data-i="${i}"><span class="avatar" style="background:${a.color}">${esc(X.initials(a.name))}</span><span>${esc(a.name)}</span></button>`; }).join("");
    $$("#tLine .ln").forEach(b => b.onclick = () => { if (T.phase === "do" || T.rolling) { X.toast("Finish this turn first"); return; } T.idx = +b.dataset.i; newTurn(); });
    const now = $("#tLine .ln.now"); if (now) now.scrollIntoView({ block: "nearest", inline: "center", behavior: X.reduced() ? "auto" : "smooth" });
  }
  function who() {
    if (T.quick) return `<div class="up-now"><span class="avatar big" style="background:var(--magenta)">${T.turns + 1}</span><div><h2>Next gymnast, you're up!</h2><p class="small">Turn ${T.turns + 1} · find your level's number when your move comes up</p></div></div>`;
    const a = current(), next = S().athletes.find(x => x.id === T.ids[(T.idx + 1) % T.ids.length]);
    return `<div class="up-now"><span class="avatar big" style="background:${a.color}">${esc(X.initials(a.name))}</span><div><h2>${esc(a.name)}'s turn!</h2><p class="small">${LV[a.level].name}${T.ids.length > 1 ? ` · Up next: ${esc(next.name)}` : ""}</p></div></div>`;
  }
  function newTurn() {
    stopTimer();
    T.phase = "start"; T.buddy = null;
    renderLine();
    if (T.game === "dice") { T.dice = [null, null, null]; T.held = [false, false, false]; T.rerollsLeft = setup().rerolls; renderDice(); }
    else { T.card = null; renderCards(); }
  }
  function nextTurn() {
    T.turns++;
    if (T.timeUp) { end(); return; }
    T.idx = (T.idx + 1) % T.ids.length;
    newTurn();
  }

  /* dice */
  function renderDice() {
    const st = $("#tStage"), d = T.dice;
    let body = who();
    body += `<div class="dice-row">${die("move", d[0] || "?", T.held[0], T.rolling && !T.held[0])}${die("count", d[1] || "?", T.held[1], T.rolling && !T.held[1])}${die("mult", d[2] === null ? "?" : d[2], T.held[2], T.rolling && !T.held[2])}</div>`;
    if (T.phase === "start") body += `<div class="stage-actions"><button type="button" class="btn big wide roll-btn" id="tRoll">Roll the dice!</button><button type="button" class="btn ghost" id="tChart">See the chart</button></div>`;
    else if (T.phase === "hold") body += `<p class="hint-line">${T.rerollsLeft ? "Tap a die to keep it, then re-roll the rest." : ""} Move ${d[0]} is <b>${esc(T.chart[d[0] - 1].name)}</b>.</p>
      <div class="stage-actions"><button type="button" class="btn ghost" id="tReroll" ${T.rerollsLeft && T.held.includes(false) ? "" : "disabled"}>Re-roll (${T.rerollsLeft} left)</button><button type="button" class="btn big" id="tLock">Lock it in</button></div>`;
    else if (T.phase === "do") body += challengeHTML();
    st.innerHTML = body;
    const r = $("#tRoll"); if (r) r.onclick = () => roll();
    const c = $("#tChart"); if (c) c.onclick = () => showChart();
    const rr = $("#tReroll"); if (rr) rr.onclick = () => { T.rerollsLeft--; roll(); };
    const lk = $("#tLock"); if (lk) lk.onclick = lockDice;
    if (T.phase === "hold") $$("#tStage .die-wrap").forEach((w, i) => w.onclick = () => { if (!T.rerollsLeft) return; T.held[i] = !T.held[i]; X.tick(); renderDice(); });
    wireChallenge();
  }
  function showChart() {
    $("#tStage").insertAdjacentHTML("beforeend", `<div class="chart-pop"><div class="teams-head"><h2>Dice chart</h2><button type="button" class="btn ghost small" id="tChartClose">Close</button></div>${chartHTML(T.chart, true)}</div>`);
    $("#tChartClose").onclick = () => $(".chart-pop").remove();
  }
  function roll() {
    const rnd = n => 1 + Math.floor(Math.random() * n);
    const final = [T.held[0] ? T.dice[0] : rnd(20), T.held[1] ? T.dice[1] : rnd(20), T.held[2] ? T.dice[2] : MULT_FACES[rnd(6) - 1]];
    if (X.reduced()) { T.dice = final; afterRoll(); return; }
    T.rolling = true; let n = 0;
    const iv = setInterval(() => {
      T.dice = [T.held[0] ? T.dice[0] : rnd(20), T.held[1] ? T.dice[1] : rnd(20), T.held[2] ? T.dice[2] : MULT_FACES[rnd(6) - 1]];
      renderDice(); X.tick();
      if (++n >= 10) { clearInterval(iv); T.rolling = false; T.dice = final; X.beep(520, 0.12); afterRoll(); }
    }, 70);
  }
  function afterRoll() {
    T.phase = "hold";
    if (!T.rerollsLeft) { lockDice(); return; }
    renderDice();
  }
  function lockDice() {
    const [e, c, m] = T.dice, ex = T.chart[e - 1], a = current();
    const raw = c * m, h = howMany(ex, a.level, raw);
    T.ex = ex; T.amount = h; T.n = raw; T.golden = e === c; T.free = m === 0;
    T.formula = m === 0 ? `${c} × 0 = 0` : `${c} × ${m} = ${raw}${X.isTimed(ex) ? ` → ${h.raw} sec` : ""}${h.capped && !T.quick ? ` → capped at ${h.v} for ${LV[a.level].name}` : ""}`;
    T.banner = T.golden ? { cls: "zee", t: "GYM-ZEE! Doubles = 2x XP" } : m === 0 ? { cls: "lucky", t: "Lucky zero! Free pass" } : c === 20 ? { cls: "crit", t: "Critical 20!" } : m === 2 ? { cls: "dbl", t: "Times two!" } : null;
    T.phase = "do";
    if (T.golden) X.fanfare(); else if (T.free) X.ding(); else X.beep(700, 0.12);
    renderDice();
  }

  /* cards */
  function makeDeck() {
    const cards = [];
    SUITS.forEach((u, si) => RANKS.forEach((r, ri) => cards.push({ suit: si, rank: r, value: ri + 1 })));
    let deck = X.shuffle(cards);
    if (setup().deck === "half") deck = deck.slice(0, 26).concat([{ joker: "wild" }]);
    else deck = deck.concat([{ joker: "wild" }, { joker: "lucky" }]);
    return X.shuffle(deck);
  }
  function renderCards() {
    const st = $("#tStage");
    let body = who();
    body += `<div class="card-table">
      <button type="button" class="deck-pile" id="tDraw" ${T.phase !== "start" ? "disabled" : ""} aria-label="Draw a card">${cardBack()}${cardBack()}${cardBack()}<span class="deck-count">${T.deck.length} left</span></button>
      <div class="card-slot">${T.card ? faceHTML(T.card) : '<div class="pcard ghost"><span>Tap the deck to draw</span></div>'}</div></div>`;
    if (T.phase === "start") body += `<div class="stage-actions"><button type="button" class="btn big wide roll-btn" id="tDraw2">Draw a card</button></div>
      <div class="suit-key">${SUITS.map((u, i) => `<span class="${u.red ? "red" : ""}"><b>${u.s}</b>${CATS[T.suits[i]].name}</span>`).join("")}</div>`;
    else if (T.phase === "pick") body += wildHTML();
    else if (T.phase === "do") body += challengeHTML();
    st.innerHTML = body;
    const d1 = $("#tDraw"), d2 = $("#tDraw2");
    [d1, d2].forEach(b => { if (b) b.onclick = () => { if (T.phase === "start") draw(); }; });
    $$("#tStage .wild").forEach(b => b.onclick = () => { setCardMove(T.card, EX.find(e => e.id === b.dataset.id), 10); });
    wireChallenge();
  }
  function draw() {
    if (!T.deck.length) { T.deck = makeDeck(); X.toast("New deck shuffled!"); }
    const card = T.deck.pop(), a = current();
    T.card = card;
    X.beep(440, 0.08); setTimeout(() => X.beep(660, 0.1), 80);
    if (card.joker === "lucky") {
      T.ex = null; T.free = true; T.golden = false; T.amount = { v: 0 }; T.formula = "";
      T.banner = { cls: "lucky", t: "Lucky Joker! Free pass, and you still earn XP" };
      T.phase = "do"; X.fanfare(); renderCards(); return;
    }
    if (card.joker === "wild") {
      T.options = X.shuffle(poolFor(focusOf(setup().focus).cats)).slice(0, 3);
      T.phase = "pick"; X.fanfare(); renderCards(); return;
    }
    const cat = T.suits[card.suit], pool = poolFor([cat]);
    const ex = pool[Math.floor(Math.random() * pool.length)];
    setCardMove(card, ex, card.value);
    if (card.rank === "Q" && T.quick) { T.banner = { cls: "dbl", t: "Queen = buddy card! Grab a buddy to do it with you" }; renderCards(); }
    else if (card.rank === "Q" && T.ids.length > 1) { T.banner = { cls: "dbl", t: "Queen = buddy card! Pick a buddy to join you" }; T.buddyPick = true; renderCards(); }
  }
  function setCardMove(card, ex, value) {
    const a = current(), h = howMany(ex, a.level, value);
    card.ex = ex; T.ex = ex; T.amount = h; T.n = value; T.free = false; T.golden = !!card.joker;
    T.formula = `${card.joker ? "Joker" : card.rank === "A" ? "Ace" : card.rank} = ${value}${X.isTimed(ex) ? ` → ${h.raw} sec` : ""}${h.capped && !T.quick ? ` → capped at ${h.v} for ${LV[a.level].name}` : ""}`;
    T.banner = card.joker ? { cls: "zee", t: "Wild Joker! 2x XP" } : card.rank === "K" ? { cls: "crit", t: "King card! The biggest one" } : null;
    T.buddyPick = false;
    T.phase = "do"; renderCards();
  }
  function faceHTML(card) {
    if (card.joker) return `<div class="pcard face joker flip"><span class="corner tl">JOKER</span><div class="joker-mid"><svg viewBox="0 0 40 40"><path d="M20 4 L24 15 L36 15.5 L26.5 23 L30 35 L20 28 L10 35 L13.5 23 L4 15.5 L16 15Z" fill="currentColor"/></svg><b>${card.joker === "wild" ? "Wild" : "Lucky"}</b></div><span class="corner br">JOKER</span></div>`;
    const u = SUITS[card.suit], ex = card.ex;
    return `<div class="pcard face flip${u.red ? " red" : ""}">
      <span class="corner tl">${card.rank}<i>${u.s}</i></span>
      <div class="face-mid"><span class="suit-big">${u.s}</span>${ex ? `<small>${CATS[ex.cat].name}</small><b>${esc(ex.name)}</b>` : ""}</div>
      <span class="corner br">${card.rank}<i>${u.s}</i></span></div>`;
  }
  function wildHTML() {
    return `<div class="banner zee">Wild Joker! Pick any move and do 10 of it for 2x XP</div><div class="choice-grid one">${T.options.map(e => `<button type="button" class="choice wild" data-id="${e.id}"><b>${esc(e.name)}</b><small>${CATS[e.cat].name}</small></button>`).join("")}</div>`;
  }

  /* shared challenge panel */
  function challengeHTML() {
    const a = current(), ex = T.ex;
    let h = T.banner ? `<div class="banner ${T.banner.cls}">${T.banner.t}</div>` : "";
    if (T.buddyPick) {
      h += `<p class="hint-line">Who's your buddy?</p><div class="tg-names buddy-pick">${T.ids.filter(id => id !== a.id).map(id => { const b = S().athletes.find(x => x.id === id); return `<button type="button" class="tcheck${T.buddy === id ? " on" : ""}" data-id="${id}"><span class="avatar" style="background:${b.color}">${esc(X.initials(b.name))}</span><b>${esc(b.name)}</b></button>`; }).join("")}</div>`;
    }
    if (T.free || !ex) {
      return h + `<div class="stage-actions"><button type="button" class="btn big wide done" id="tDone">${T.quick ? "Next gymnast" : "Next athlete"}</button></div>`;
    }
    const kid = a.level < 2 ? X.kidText(ex) : "";
    const buddy = T.buddy ? S().athletes.find(x => x.id === T.buddy) : null;
    h += `<div class="challenge" style="--fc:${X.CAT_COLOR[ex.cat]}">
      <span class="cat-tag">${CATS[ex.cat].name}</span>
      <h3>${esc(ex.name)}</h3>
      ${T.quick ? `<p class="q-find">Find your level:</p><div class="q-levels">${groupLevels().map(li => { const hv = howMany(ex, li, T.n); return `<div class="q-lv" style="--c:var(--${LV[li].id})"><span>${LV[li].name}</span><b>${hv.v}</b><small>${X.isTimed(ex) ? "sec" : X.unitText(ex, hv.v)}${hv.capped ? " (max)" : ""}</small>${X.isTimed(ex) ? `<button type="button" class="q-timer t-bg" data-li="${li}" data-v="${hv.v}">Start timer</button>` : ""}</div>`; }).join("")}</div>`
        : `<div class="target"><span class="big">${T.amount.v}</span><span class="unit">${X.isTimed(ex) ? "seconds" : X.unitText(ex, T.amount.v)}</span>${X.lvChip(a.level)}</div>`}
      ${buddy && buddy.level !== a.level ? `<p class="small">${esc(buddy.name)} does ${howMany(ex, buddy.level, T.n).v} for ${LV[buddy.level].name}.</p>` : ""}
      <p class="formula">${esc(T.formula)}</p>
      ${X.isTimed(ex) && !T.quick ? `<button type="button" class="btn ghost gc-timer t-bg" data-li="${a.level}" data-v="${T.amount.v}">Start ${T.amount.v}s timer</button>` : ""}
      ${X.isTimed(ex) ? `<p class="small">The timer keeps running at the bottom of the screen, so the next person can go.</p>` : ""}
      ${kid ? `<div class="kid-note"><h3>Say it to little gymnasts</h3><p>${esc(kid)}</p></div>` : ""}
      <p class="gc-how">${esc(ex.how)}</p><p class="gc-cue">${esc(ex.cue)}</p>
      ${ex.band && S().band && ex.bandHow ? `<div class="band-note"><strong>Band option</strong><p>${esc(ex.bandHow)}</p></div>` : ""}
      ${ex.safety ? '<div class="safety-note">Coach spot required. Use mats.</div>' : ""}
    </div>
    <div class="stage-actions"><button type="button" class="btn ghost" id="tSkip">${T.quick ? "Skip" : "Couldn't finish"}</button><button type="button" class="btn big done" id="tDone">${T.quick ? "Done! Next gymnast" : "Done!"}</button></div>`;
    return h;
  }
  function wireChallenge() {
    $$("#tStage .buddy-pick .tcheck").forEach(b => b.onclick = () => { T.buddy = T.buddy === b.dataset.id ? null : b.dataset.id; T.game === "dice" ? renderDice() : renderCards(); });
    $$("#tStage .t-bg").forEach(b => b.onclick = () => {
      const li = +b.dataset.li, who = current();
      X.bgTimer({ label: `${T.quick ? "" : who.name + " · "}${T.ex.name} · ${LV[li].short}`, secs: +b.dataset.v, color: X.CAT_COLOR[T.ex.cat] });
      b.textContent = "Running ✓"; b.disabled = true;
    });
    const dn = $("#tDone"); if (dn) dn.onclick = () => finishTurn(true);
    const sk = $("#tSkip"); if (sk) sk.onclick = () => finishTurn(false);
  }
  function finishTurn(done) {
    stopTimer();
    const a = current();
    if (done) {
      [a.id].concat(T.buddy ? [T.buddy] : []).filter(Boolean).forEach(id => X.award(id, T.ex, T.golden, T.earned));
      T.done++; X.save(); X.renderHeader();
      T.golden ? X.fanfare() : X.ding();
      X.toast(T.quick ? "Nice job!" : `Nice, ${a.name}!`);
    }
    nextTurn();
  }
  function stopTimer() { if (tState) { clearInterval(tState.h); tState = null; } }
  function runTimer(btn) {
    if (tState) { stopTimer(); btn.textContent = `Start ${btn.dataset.max}s timer`; return; }
    const max = +btn.dataset.max; let ready = 3, t = 0;
    btn.textContent = "Ready " + ready; X.beep(660, 0.12);
    tState = { h: setInterval(() => {
      if (ready > 1) { ready--; btn.textContent = "Ready " + ready; X.beep(660, 0.12); return; }
      if (ready === 1) { ready = 0; X.beep(990, 0.2); btn.textContent = max + "s"; return; }
      t++; btn.textContent = (max - t) + "s left";
      if (max - t <= 3 && max - t > 0) X.beep(700, 0.08);
      if (t >= max) { stopTimer(); X.ding(); btn.textContent = "Time! Tap Done"; }
    }, 1000) };
  }
  function clock() {
    if (!T) return;
    const el = $("#tClock");
    const extra = `${T.turns} turn${T.turns === 1 ? "" : "s"}`;
    if (!T.endAt) { el.textContent = extra; el.className = ""; return; }
    const left = Math.round((T.endAt - Date.now()) / 1000);
    el.textContent = (left > 0 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} left` : "Time's up!") + " · " + extra;
    el.className = left <= 0 ? "over" : left < 120 ? "low" : "";
    if (left <= 0 && !T.timeUp) {
      T.timeUp = true; X.fanfare();
      if (T.phase === "start") end(); else X.toast("Time's up! Finish this turn.");
    }
  }
  function end() {
    if (!T) return;
    stopTimer(); clearInterval(clockH);
    const ids = Object.keys(T.earned);
    const { lines, badgeWho } = X.wrapUp(ids, T.earned, {});
    const total = Object.values(T.earned).reduce((s, v) => s + v, 0);
    const mins = Math.max(1, Math.round((Date.now() - T.startedAt) / 60000));
    $("#turns").hidden = true; document.body.style.overflow = "";
    $("#finishTitle").textContent = T.done ? (T.game === "dice" ? "What a roll!" : "Deck done!") : "Game ended";
    $("#finishXp").textContent = "+" + total + " XP";
    $("#finishList").innerHTML = `<div class="finish-sum">${T.done} moves done in ${T.turns} turns · ${mins} min</div>` +
      (lines.length ? `<div class="fx-grid">${lines.join("")}</div>` : "<div>No moves finished this time.</div>") + X.badgeLines(badgeWho);
    $("#finishSheet").hidden = false;
    if (T.done) { X.fanfare(); X.confetti(); }
    T = null;
    X.renderAll();
  }

  /* ---------- wiring ---------- */
  $("#tStart").onclick = start;
  $("#tShuffle").onclick = () => { setup().order = X.shuffle(lineup().map(a => a.id)); X.save(); renderTurnsSetup(); X.toast("Line-up shuffled!"); };
  $("#tQuit").onclick = () => $("#tQuitConfirm").hidden = false;
  $("#tKeep").onclick = () => $("#tQuitConfirm").hidden = true;
  $("#tEnd").onclick = () => { $("#tQuitConfirm").hidden = true; end(); };
  $("#tMute").onclick = () => { S().muted = !S().muted; X.save(); $("#tMute").classList.toggle("off", S().muted); };

  const boardSetup = window.XGame.renderSetup;
  window.XGame.renderSetup = function () {
    renderPicker();
    if (pick() === "board") boardSetup(); else renderTurnsSetup();
  };
  if (location.hash === "#game") window.XGame.renderSetup();
})();
