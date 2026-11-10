/* Road to the Podium: team head-to-head board game */
(function () {
  "use strict";
  const X = window.XS;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = X.esc, LV = X.LV, CATS = X.CATS, EX = X.EX;
  const S = () => X.S;

  /* ---------- constants ---------- */
  const TEAM_PRESETS = [
    { name: "Sparkles", color: "#E0218A", shape: "star" },
    { name: "Flippers", color: "#0FA7A2", shape: "bolt" },
    { name: "Twisters", color: "#D99A00", shape: "heart" },
    { name: "Stick-Its", color: "#6A35A0", shape: "diamond" },
    { name: "High Flyers", color: "#1C9ED8", shape: "moon" },
    { name: "Chalk Dust", color: "#E85D2A", shape: "ring" }
  ];
  const SHAPES = {
    star: "M0 -9 L2.6 -3 L9 -2.8 L4 1.4 L5.6 8 L0 4.4 L-5.6 8 L-4 1.4 L-9 -2.8 L-2.6 -3Z",
    bolt: "M2 -10 L-6 1 L-1 1 L-3 10 L6 -2 L1 -2Z",
    heart: "M0 8 C-9 1 -9 -6 -4.5 -7.5 C-2 -8.3 0 -6.5 0 -4.5 C0 -6.5 2 -8.3 4.5 -7.5 C9 -6 9 1 0 8Z",
    diamond: "M0 -9 L7 0 L0 9 L-7 0Z",
    moon: "M3 -9 A9 9 0 1 0 3 9 A7 7 0 1 1 3 -9Z",
    ring: "M0 -8 A8 8 0 1 1 -0.01 -8Z M0 -4 A4 4 0 1 0 0.01 -4Z"
  };
  const PILES = {
    c: { name: "Conditioning", color: "var(--magenta)" },
    s: { name: "Skill", color: "var(--aqua)" },
    k: { name: "Chance", color: "var(--sun)" }
  };
  const LENGTHS = { short: { rows: 4, name: "Short" }, standard: { rows: 5, name: "Standard" }, long: { rows: 6, name: "Long" } };
  const COLS = 8;
  const ZONES = {
    chalk: { name: "Chalk Bowl Lane", cats: ["core", "acro"], color: "var(--plum)" },
    bars: { name: "Bar Jungle", cats: ["bars"], color: "var(--gold)" },
    beam: { name: "Beam Bridge", cats: ["beam"], color: "var(--diamond)" },
    tumble: { name: "Tumble Track", cats: ["tumble", "acro", "partner"], color: "var(--aqua)" },
    vault: { name: "Vault Runway", cats: ["lower", "tumble"], color: "var(--magenta)" },
    peak: { name: "Podium Peak", cats: ["bars", "beam", "tumble", "acro"], color: "var(--sun)" }
  };
  const ZONE_ORDER = { 4: ["chalk", "bars", "beam", "peak"], 5: ["chalk", "bars", "beam", "tumble", "peak"], 6: ["chalk", "vault", "bars", "beam", "tumble", "peak"] };
  const PATTERN = "cskcscksccsk";
  const CHANCE = [
    { id: "coach", w: 3 }, { id: "spring", w: 2 }, { id: "spill", w: 2 }, { id: "swap", w: 1 },
    { id: "everybody", w: 2 }, { id: "dare", w: 2 }, { id: "stick", w: 2 }, { id: "judge", w: 1 }, { id: "free", w: 1 }
  ];

  /* ---------- board ---------- */
  function buildBoard(lenKey) {
    const rows = LENGTHS[lenKey].rows, N = rows * COLS, sq = [];
    for (let i = 0; i < N; i++) sq.push({ type: i === 0 ? "start" : i === N - 1 ? "podium" : PATTERN[(i - 1) % PATTERN.length] });
    const add = (from, to, kind) => {
      from = Math.round(from); to = Math.round(to);
      if (from < 2 || from > N - 3 || to < 1 || to > N - 2 || sq[from].special || sq[to].special || sq[to].target) return;
      sq[from].special = kind; sq[from].to = to; sq[to].target = true;
    };
    [0.1, 0.42, 0.7].forEach((f, k) => add(f * N, f * N + 6 + (k % 2), "spring"));
    [0.3, 0.58, 0.9].forEach((f, k) => add(f * N, f * N - 6 - (k % 2), "pit"));
    return { len: lenKey, rows, N, sq, zones: ZONE_ORDER[rows] };
  }
  /* ---------- board art ----------
     The road is a winding serpentine path; spaces sit evenly along it.
     The board keeps its own colors in light and dark mode, like a printed game board. */
  const BW = 1000, XL = 200, XR = 800, ROWGAP = 170, TOP = 245, BOTTOM = 105;
  const TILE = { c: "#EE3F98", s: "#16AFA8", k: "#FFC12E" }, TILE_DARK = { c: "#B8226F", s: "#0C7F7A", k: "#D99A00" };
  const ZONE_TINT = { chalk: "#EDE3FB", vault: "#FFE3EF", bars: "#FFF1CF", beam: "#DDF3FB", tumble: "#DDF6EA", peak: "#FFF4D6" };
  let LAY = null;
  function rowY(B, r) { return TOP + (B.rows - 1 - r) * ROWGAP; }
  function layout(B) {
    if (LAY && LAY.key === B.len) return LAY;
    const pts = [], R = B.rows, rad = ROWGAP / 2;
    for (let r = 0; r < R; r++) {
      const y = rowY(B, r), ltr = r % 2 === 0;
      for (let t = 0; t <= 1; t += 0.004) {
        const x = ltr ? XL + (XR - XL) * t : XR - (XR - XL) * t;
        pts.push({ x, y: y + 16 * Math.sin(2 * Math.PI * ((x - XL) / ((XR - XL) / 2))) });
      }
      if (r < R - 1) {
        const cx = ltr ? XR : XL, cy = y - rad;
        for (let a = 0; a <= Math.PI; a += 0.03) {
          const ang = ltr ? Math.PI / 2 - a : Math.PI / 2 + a;
          pts.push({ x: cx + rad * Math.cos(ang), y: cy + rad * Math.sin(ang) });
        }
      }
    }
    const acc = [0];
    for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const L = acc[acc.length - 1], step = L / (B.N - 1), spots = [];
    let j = 0;
    for (let i = 0; i < B.N; i++) {
      const s = i * step;
      while (j < acc.length - 2 && acc[j + 1] < s) j++;
      const f = (s - acc[j]) / ((acc[j + 1] - acc[j]) || 1);
      const a = pts[j], b = pts[j + 1];
      spots.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, ang: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI });
    }
    LAY = { key: B.len, pts, spots, H: TOP + (R - 1) * ROWGAP + BOTTOM };
    return LAY;
  }
  function center(B, i) { const p = layout(B).spots[i]; return { x: p.x, y: p.y }; }
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* scenery pieces, each drawn around (0,0) roughly 130 x 90 */
  const ART = {
    chalk: `<ellipse cx="0" cy="38" rx="52" ry="8" fill="#000" opacity=".08"/>
      <path d="M-10 36 L-6 0 L6 0 L10 36Z" fill="#8C6BB1"/><rect x="-16" y="32" width="32" height="7" rx="3" fill="#6E4F96"/>
      <path d="M-34 -6 Q0 22 34 -6 Z" fill="#B794E6"/><ellipse cx="0" cy="-6" rx="34" ry="8" fill="#F7F3FF"/>
      <circle cx="-14" cy="-20" r="11" fill="#fff"/><circle cx="2" cy="-28" r="14" fill="#fff"/><circle cx="18" cy="-19" r="10" fill="#fff"/>
      <circle cx="-26" cy="-34" r="4" fill="#fff" opacity=".8"/><circle cx="28" cy="-36" r="3" fill="#fff" opacity=".8"/>`,
    bars: `<ellipse cx="0" cy="40" rx="62" ry="8" fill="#000" opacity=".08"/>
      <rect x="-60" y="30" width="120" height="10" rx="4" fill="#4FA3E0"/>
      <path d="M-44 36 L-40 -36 M-36 36 L-40 -36 M36 36 L40 -6 M44 36 L40 -6" stroke="#7A8594" stroke-width="5" stroke-linecap="round"/>
      <path d="M-50 36 L-30 36 M30 36 L50 36" stroke="#5C6573" stroke-width="5" stroke-linecap="round"/>
      <path d="M-44 -36 L44 -36" stroke="#E8C48A" stroke-width="6" stroke-linecap="round" transform="translate(0,0)"/>
      <path d="M-44 -6 L44 -6" stroke="#E8C48A" stroke-width="6" stroke-linecap="round" transform="translate(0,0)"/>
      <path d="M40 -36 L40 -6" stroke="#7A8594" stroke-width="5"/>`,
    beam: `<ellipse cx="0" cy="38" rx="64" ry="8" fill="#000" opacity=".08"/>
      <rect x="-62" y="28" width="124" height="10" rx="4" fill="#F28AB8"/>
      <path d="M-40 30 L-34 2 M-28 30 L-34 2 M28 30 L34 2 M40 30 L34 2" stroke="#7A8594" stroke-width="5" stroke-linecap="round"/>
      <rect x="-60" y="-6" width="120" height="10" rx="5" fill="#D9B07A"/><rect x="-60" y="-6" width="120" height="4" rx="2" fill="#EFD2A8"/>`,
    vault: `<ellipse cx="0" cy="38" rx="64" ry="8" fill="#000" opacity=".08"/>
      <rect x="-66" y="30" width="80" height="8" rx="3" fill="#6FC3A7"/>
      <path d="M-22 34 L6 34 L6 26 Z" fill="#F2A33A"/><path d="M-18 33 l3 -4 l3 4 l3 -4 l3 4" stroke="#fff" stroke-width="1.5" fill="none"/>
      <path d="M26 36 L32 6 L50 6 L56 36Z" fill="#5C6573"/><rect x="22" y="-8" width="38" height="16" rx="8" fill="#4A7BD0"/>
      <rect x="20" y="36" width="44" height="5" rx="2" fill="#3F4753"/>`,
    tumble: `<ellipse cx="0" cy="34" rx="66" ry="8" fill="#000" opacity=".08"/>
      <rect x="-64" y="2" width="128" height="26" rx="8" fill="#3F8EDB"/>
      <path d="M-56 15 h14 M-34 15 h14 M-12 15 h14 M10 15 h14 M32 15 h14" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <path d="M50 9 l8 6 l-8 6" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
    peak: ""
  };
  /* one quote per station, from women's Olympic gymnastics champions */
  const QUOTES = {
    chalk: { q: "Each of us has a fire in our hearts for something. It's our goal in life to find it and keep it lit.", who: "Mary Lou Retton", note: "1984 Olympic all-around champion" },
    vault: { q: "Practice like you have never won. Perform like you have never lost.", who: "Kyla Ross", note: "2012 Olympic team champion" },
    bars: { q: "Hard days are best because that's when champions are made.", who: "Gabby Douglas", note: "2012 Olympic all-around champion" },
    beam: { q: "Hard work has made it easy. That is my secret. That is why I win.", who: "Nadia Comăneci", note: "First perfect 10, 1976 Olympics" },
    tumble: { q: "You are the only one that can stop you from being all you can be.", who: "Nastia Liukin", note: "2008 Olympic all-around champion" },
    peak: { q: "I'm not the next Usain Bolt or Michael Phelps. I'm the first Simone Biles.", who: "Simone Biles", note: "Rio 2016" }
  };
  function wrapText(t, max) {
    const words = t.split(" "), lines = [""];
    words.forEach(w => { const cur = lines[lines.length - 1]; if ((cur + " " + w).trim().length > max) lines.push(w); else lines[lines.length - 1] = (cur + " " + w).trim(); });
    return lines;
  }
  function plaque(z, x, y, w) {
    const Q = QUOTES[z]; if (!Q) return "";
    const lines = wrapText("\u201C" + Q.q + "\u201D", Math.floor(w / 7.4));
    const h = lines.length * 15 + 22;
    return `<g class="plaque" transform="translate(${x},${y})">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="#FFFDF7" stroke="${["#EE3F98", "#16AFA8", "#FFC12E", "#8B5CF6", "#22B5E8"][Object.keys(QUOTES).indexOf(z) % 5]}" stroke-width="3"/>
      ${lines.map((l, i) => `<text class="quote-text" x="0" y="${-h / 2 + 17 + i * 15}" text-anchor="middle">${esc(l)}</text>`).join("")}
      <text class="quote-who" x="0" y="${h / 2 - 7}" text-anchor="middle">${esc(Q.who.toUpperCase())} · ${esc(Q.note)}</text></g>`;
  }
  const sign = (text, x, y, flip) => `<g transform="translate(${x},${y})">
      <rect x="-3" y="-4" width="6" height="16" fill="#9A6B3F"/>
      <g transform="rotate(${flip ? 3 : -3})"><rect x="${-(text.length * 4 + 12)}" y="-21" width="${text.length * 8 + 24}" height="24" rx="6" fill="#C98B4E" stroke="#8C5A2B" stroke-width="2"/>
      <text x="0" y="-4" text-anchor="middle" class="sign-text">${text.toUpperCase()}</text></g></g>`;
  function podiumArt(x, y) {
    return `<g transform="translate(${x},${y})">
      <ellipse cx="0" cy="34" rx="92" ry="10" fill="#000" opacity=".1"/>
      <rect x="-26" y="-34" width="52" height="66" rx="4" fill="#F5B700"/><rect x="-26" y="-34" width="52" height="8" rx="3" fill="#FFD84D"/>
      <rect x="-80" y="-8" width="54" height="40" rx="4" fill="#B8C2D0"/><rect x="-80" y="-8" width="54" height="7" rx="3" fill="#D8DEE7"/>
      <rect x="26" y="6" width="54" height="26" rx="4" fill="#D08A4F"/><rect x="26" y="6" width="54" height="7" rx="3" fill="#E9A86F"/>
      <text x="0" y="14" text-anchor="middle" class="pod-num">1</text><text x="-53" y="24" text-anchor="middle" class="pod-num">2</text><text x="53" y="28" text-anchor="middle" class="pod-num sm">3</text>
      <g transform="translate(0,-58)"><path d="M-14 -16 h28 v8 a14 14 0 0 1 -28 0z" fill="#FFC12E" stroke="#C98A00" stroke-width="2"/>
        <path d="M-14 -12 h-7 a7 7 0 0 0 7 9 M14 -12 h7 a7 7 0 0 1 -7 9" fill="none" stroke="#C98A00" stroke-width="2.5"/>
        <rect x="-4" y="5" width="8" height="8" fill="#C98A00"/><rect x="-11" y="12" width="22" height="5" rx="2" fill="#8C5A2B"/>
        <path d="M0 -12 l2 4 l4.5 .5 l-3.3 3 l.9 4.5 l-4.1 -2.2 l-4.1 2.2 l.9 -4.5 l-3.3 -3 l4.5 -.5z" fill="#fff"/></g>
    </g>`;
  }
  const tileIcon = t => t === "c" ? '<path d="M3 -10 L-6 1 L0 1 L-3 10 L7 -2 L1 -2Z" fill="#fff"/>'
    : t === "s" ? `<path d="${SHAPES.star}" fill="#fff" transform="scale(1.1)"/>`
    : '<text y="8" text-anchor="middle" class="q">?</text>';
  function pawn(t, k, n) {
    const s = n <= 2 ? 1.7 : n <= 4 ? 1.45 : 1.25;
    return `<g class="token" data-k="${k}"><g class="tk-in" transform="scale(${s})">
      <ellipse cx="0" cy="12" rx="13" ry="4.5" fill="#000" opacity=".25"/>
      <path d="M-12 11 Q-12 5 -6 3 L-4 -6 Q0 -9 4 -6 L6 3 Q12 5 12 11 Z" fill="${t.color}" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="0" cy="-12" r="8.5" fill="${t.color}" stroke="#fff" stroke-width="2.5"/>
      <path d="${SHAPES[t.shape]}" fill="#fff" transform="translate(0,-12) scale(.55)"/>
      <ellipse cx="-3" cy="-15" rx="2.5" ry="1.6" fill="#fff" opacity=".55"/></g></g>`;
  }

  function renderBoard() {
    const G = S().game, B = G.board, Lo = layout(B), H = Lo.H;
    const svg = $("#gBoard");
    svg.setAttribute("viewBox", `0 0 ${BW} ${H}`);
    svg.style.aspectRatio = BW + " / " + H;
    const rand = rng(B.N * 7 + 3);
    let h = `<defs>
      <linearGradient id="gFrame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7B3FB0"/><stop offset="1" stop-color="#4E2177"/></linearGradient>
      <radialGradient id="gFelt" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#FBF7FF"/><stop offset="1" stop-color="#EFE4FA"/></radialGradient>
      <marker id="arSpring" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#25A866"/></marker>
      <marker id="arPit" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#E8572A"/></marker></defs>`;
    // frame and play surface
    h += `<rect x="4" y="4" width="${BW - 8}" height="${H - 8}" rx="42" fill="url(#gFrame)"/>
      <rect x="18" y="18" width="${BW - 36}" height="${H - 36}" rx="30" fill="url(#gFelt)" stroke="#F5C243" stroke-width="4"/>`;
    // zone patches
    B.zones.forEach((z, r) => {
      const y = rowY(B, r);
      h += `<rect x="40" y="${y - ROWGAP / 2 + 8}" width="${BW - 80}" height="${ROWGAP - 16}" rx="60" fill="${ZONE_TINT[z]}"/>`;
    });
    // confetti sprinkles in the gaps between rows
    for (let r = 0; r < B.rows - 1; r++) {
      const gy = rowY(B, r) - ROWGAP / 2;
      for (let d = 0; d < 7; d++) {
        const x = 260 + rand() * 480, y = gy + (rand() - 0.5) * 26, col = ["#EE3F98", "#16AFA8", "#FFC12E", "#8B5CF6"][d % 4];
        h += d % 3 === 0 ? `<path d="${SHAPES.star}" fill="${col}" opacity=".45" transform="translate(${x},${y}) scale(.7) rotate(${rand() * 60})"/>`
          : `<rect x="${x}" y="${y}" width="9" height="4" rx="2" fill="${col}" opacity=".45" transform="rotate(${rand() * 180},${x},${y})"/>`;
      }
    }
    // scenery and signposts in the free side of each row gap (and beside the last row)
    B.zones.forEach((z, r) => {
      if (z === "peak") return;
      const turnRight = r % 2 === 0, x = turnRight ? 108 : BW - 108, y = rowY(B, r) - ROWGAP / 2 - 18;
      h += `<g transform="translate(${x},${y})">${ART[z]}</g>`;
      h += sign(ZONES[z].name, x, y + 64, !turnRight);
    });
    // road
    const d = "M" + Lo.pts.map(p => p.x.toFixed(1) + " " + p.y.toFixed(1)).join(" L");
    h += `<path d="${d}" class="road-edge"/><path d="${d}" class="road"/><path d="${d}" class="road-line"/>`;
    // bunting and title ribbon (kept clear of the podium)
    const fin0 = Lo.spots[B.N - 1], ribX = fin0.x > BW / 2 ? 400 : 600;
    h += `<path d="M40 30 Q270 62 500 30 Q730 62 960 30" fill="none" stroke="#C98B4E" stroke-width="2"/>`;
    for (let f = 0; f < 18; f++) { const fx = 60 + f * 50, fy = 30 + 16 * Math.sin(Math.PI * ((fx - 40) / 460)) ** 2; h += `<path d="M${fx - 10} ${fy} l10 20 l10 -20z" fill="${["#EE3F98", "#16AFA8", "#FFC12E", "#8B5CF6", "#22B5E8"][f % 5]}"/>`; }
    h += plaque("peak", ribX, 160, 500);
    h += `<g transform="translate(${ribX},96)"><path d="M-250 -26 L250 -26 L232 0 L250 26 L-250 26 L-232 0Z" fill="#EE3F98"/><path d="M-250 26 L-232 36 L-232 26Z M250 26 L232 36 L232 26Z" fill="#9E1F5F"/>
      <text y="10" text-anchor="middle" class="title-text">ROAD TO THE PODIUM</text></g>`;
    // podium beside the finish
    const fin = Lo.spots[B.N - 1];
    h += podiumArt(fin.x, fin.y - 108);
    // springboard trails and foam pit slides (under the spaces)
    B.sq.forEach((q, i) => {
      if (!q.special) return;
      const a = Lo.spots[i], b = Lo.spots[q.to];
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, bow = Math.min(110, len * 0.35) * (q.special === "spring" ? 1 : -1);
      const mx = (a.x + b.x) / 2 - (dy / len) * bow, my = (a.y + b.y) / 2 + (dx / len) * bow;
      if (q.special === "spring") h += `<path class="trail spring" d="M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}" marker-end="url(#arSpring)"/>`;
      else h += `<path class="trail pit-under" d="M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}"/><path class="trail pit" d="M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}" marker-end="url(#arPit)"/>`;
    });
    // station quotes sit over the trails so they stay readable
    B.zones.forEach((z, r) => { if (z !== "peak") h += plaque(z, BW / 2 + (r % 2 === 0 ? 20 : -20), rowY(B, r) - ROWGAP / 2, 540); });
    // spaces
    B.sq.forEach((q, i) => {
      const p = Lo.spots[i];
      if (q.type === "start") {
        h += `<g class="sq sq-start" data-i="${i}" transform="translate(${p.x},${p.y})">
          <circle r="48" fill="#5B2A86" stroke="#fff" stroke-width="5"/><circle r="40" fill="none" stroke="#F5C243" stroke-width="3" stroke-dasharray="6 6"/>
          <text y="7" text-anchor="middle" class="start-text">START</text></g>`;
        return;
      }
      if (q.type === "podium") {
        h += `<g class="sq sq-finish" data-i="${i}" transform="translate(${p.x},${p.y})">
          <path d="M0 -50 L12 -18 L46 -16 L20 6 L29 40 L0 21 L-29 40 L-20 6 L-46 -16 L-12 -18Z" fill="#FFC12E" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>
          <text y="12" text-anchor="middle" class="finish-text">FINISH</text></g>`;
        return;
      }
      h += `<g class="sq t-${q.type}" data-i="${i}" transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})">
        <g transform="rotate(${p.ang.toFixed(1)})">
          <rect class="glow" x="-44" y="-34" width="88" height="68" rx="20"/>
          <rect x="-36" y="-22" width="72" height="52" rx="15" fill="${TILE_DARK[q.type]}"/>
          <rect x="-36" y="-27" width="72" height="52" rx="15" fill="${TILE[q.type]}" stroke="#fff" stroke-width="4"/>
          <rect x="-26" y="-21" width="30" height="7" rx="3.5" fill="#fff" opacity=".35"/></g>
        <text class="num" x="0" y="-31" text-anchor="middle">${i}</text>
        <g transform="translate(${q.special ? 9 : 0},-1)">${tileIcon(q.type)}</g>
        ${q.special === "spring" ? `<g transform="translate(-15,4)"><path d="M-11 6 L11 6 L11 1 Z" fill="#FF8A1F" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M-7 6 l2 -5 l2 5 l2 -5 l2 5" stroke="#fff" stroke-width="1.6" fill="none"/></g>` : ""}
        ${q.special === "pit" ? `<g transform="translate(-16,2)"><rect x="-12" y="-9" width="24" height="18" rx="4" fill="#5DC8F5" stroke="#fff" stroke-width="2"/><rect x="-9" y="-6" width="7" height="7" rx="1" fill="#FF6FB1" transform="rotate(-10,-5,-2)"/><rect x="1" y="-6" width="7" height="7" rx="1" fill="#FFD166" transform="rotate(12,4,-2)"/><rect x="-4" y="1" width="7" height="6" rx="1" fill="#fff"/></g>` : ""}
      </g>`;
    });
    h += `<g id="tokens"></g>`;
    svg.innerHTML = h;
    const n = G.teams.length;
    $("#tokens").innerHTML = G.teams.map((t, k) => pawn(t, k, n)).join("");
    G.teams.forEach((t, k) => placeToken(k, t.pos, true));
    $$("#gBoard .sq").forEach(g => g.addEventListener("click", () => onSquareTap(+g.dataset.i)));
    $$("#gBoard .token").forEach(g => g.addEventListener("click", () => onSquareTap(-1)));
  }
  function slot(k, n) {
    if (n === 1) return [0, -10];
    if (n === 2) return [k ? 18 : -18, -10];
    const col = k % 3, row = Math.floor(k / 3);
    return [(col - 1) * 24, row ? 10 : -16];
  }
  function placeToken(k, pos, instant) {
    const G = S().game, c = center(G.board, pos), [dx, dy] = slot(k, G.teams.length);
    const el = $(`#tokens .token[data-k="${k}"]`); if (!el) return;
    if (instant) el.style.transition = "none";
    el.style.transform = `translate(${c.x + dx}px, ${c.y + dy}px)`;
    if (instant) { void el.getBoundingClientRect(); el.style.transition = ""; }
  }

  /* ---------- movement ---------- */
  let busy = false;
  function hop(k, dest, done) {
    const G = S().game, t = G.teams[k], last = G.board.N - 1;
    dest = Math.max(0, Math.min(last, dest));
    const el = $(`#tokens .token[data-k="${k}"]`);
    if (el) el.parentNode.appendChild(el);
    if (X.reduced() || t.pos === dest) { t.pos = dest; placeToken(k, dest); X.save(); renderScore(); setTimeout(done, 200); return; }
    busy = true;
    const step = dest > t.pos ? 1 : -1;
    const iv = setInterval(() => {
      t.pos += step; placeToken(k, t.pos); X.tick();
      if (el) { el.classList.remove("hopping"); void el.getBoundingClientRect(); el.classList.add("hopping"); }
      if (t.pos === dest) { clearInterval(iv); busy = false; X.save(); renderScore(); setTimeout(done, 350); }
    }, 300);
  }
  /* springboards and foam pits fire when a team lands on them */
  function landing(k, done) {
    const G = S().game, q = G.board.sq[G.teams[k].pos];
    if (q.special === "spring") {
      X.fanfare(); X.toast(`Springboard! ${G.teams[k].name} bounce ahead to ${q.to}`);
      setTimeout(() => hop(k, q.to, () => done(true)), 700);
    } else if (q.special === "pit") {
      X.beep(300, 0.4, "sawtooth", 0.05); X.toast(`Foam pit! ${G.teams[k].name} sink back to ${q.to}`);
      setTimeout(() => hop(k, q.to, () => done(true)), 700);
    } else done(false);
  }
  function moveBy(k, delta, done) {
    const G = S().game;
    hop(k, G.teams[k].pos + delta, () => {
      if (checkWin(k)) return;
      if (delta > 0) landing(k, () => { if (!checkWin(k)) done(); }); else done();
    });
  }
  function checkWin(k) {
    const G = S().game;
    if (G.teams[k].pos >= G.board.N - 1) { setTimeout(() => endGame("podium", k), 500); return true; }
    return false;
  }

  /* ---------- people and cards ---------- */
  const athlete = id => S().athletes.find(a => a.id === id);
  const membersOf = k => S().game.teams[k].members.map(athlete).filter(Boolean);
  const levelsOf = list => [...new Set(list.map(m => m.level))].sort((a, b) => a - b);
  function pickMove(cats, k, avoid) {
    const G = S().game, mem = k === "all" ? allMembers() : membersOf(k);
    const li = Math.min(...mem.map(m => m.level));
    let pool = EX.filter(e => cats.includes(e.cat) && X.eligible(e, li) && !(e.partner && mem.length < 2));
    const fresh = pool.filter(e => !G.recent.includes(e.id) && (!avoid || !avoid.includes(e.id)));
    if (fresh.length) pool = fresh;
    if (!pool.length) pool = EX.filter(e => ["core", "lower"].includes(e.cat) && X.eligible(e, li));
    const ex = pool[Math.floor(Math.random() * pool.length)];
    G.recent = [ex.id].concat(G.recent).slice(0, 10);
    return ex;
  }
  const allMembers = () => S().game.teams.flatMap((t, k) => membersOf(k));
  const zoneOf = pos => {
    const B = S().game.board, y = layout(B).spots[pos].y;
    const r = Math.max(0, Math.min(B.rows - 1, Math.round((rowY(B, 0) - y) / ROWGAP)));
    return ZONES[B.zones[r]];
  };

  let cardState = null;
  function teamBadge(k) {
    const t = S().game.teams[k];
    return `<span class="team-badge" style="--tc:${t.color}"><svg viewBox="-14 -14 28 28"><circle r="13" fill="${t.color}"/><path d="${SHAPES[t.shape]}" fill="#fff"/></svg>${esc(t.name)}</span>`;
  }
  function moveCardHTML(ex, people, opts) {
    opts = opts || {};
    const levels = levelsOf(people), mult = opts.mult || 1;
    const young = people.some(m => m.level < 2), kid = X.kidText(ex);
    const nums = levels.map(li => `<div class="lt" style="--c:var(--${LV[li].id})"><span>${LV[li].name}</span><b>${X.amountFor(ex, li, mult)}</b><small>${X.shortUnit(ex)}</small></div>`).join("");
    const names = levels.map(li => `<div class="tg-names">${people.filter(m => m.level === li).map(m => `<button type="button" class="tcheck on" data-id="${m.id}" aria-pressed="true"><span class="avatar" style="background:${m.color}">${esc(X.initials(m.name))}</span><b>${esc(m.name)}</b></button>`).join("")}</div>`).join("");
    const max = Math.max(...levels.map(li => X.amountFor(ex, li, mult)));
    return `<h3 class="gc-move">${esc(ex.name)}</h3>
      <div class="level-targets">${nums}</div>
      ${X.isTimed(ex) ? `<button type="button" class="btn ghost gc-timer" data-max="${max}" data-targets="${levels.map(li => X.amountFor(ex, li, mult)).join(",")}">Start ${max}s timer</button>` : ""}
      ${young && kid ? `<div class="kid-note"><h3>Say it to little gymnasts</h3><p>${esc(kid)}</p></div>` : ""}
      <p class="gc-how">${esc(ex.how)}</p><p class="gc-cue">${esc(ex.cue)}</p>
      ${ex.band && S().band && ex.bandHow ? `<div class="band-note"><strong>Band option</strong><p>${esc(ex.bandHow)}</p></div>` : ""}
      ${ex.safety ? `<div class="safety-note">Coach spot required. Use mats.</div>` : ""}
      <p class="team-hint">Tap anyone who could not finish.</p>
      <div class="team-checks">${names}</div>`;
  }
  function openCard(pileKey, title, body, actions) {
    const p = PILES[pileKey] || { name: pileKey, color: "var(--plum)" };
    $("#gCard").style.setProperty("--pc", p.color);
    $("#gCard").innerHTML = `<div class="gc-strip"><span>${p.name} card</span>${title}</div>${body}<div class="sheet-actions gc-actions">${actions}</div>`;
    $("#gCardSheet").hidden = false;
    $("#gCard").scrollTop = 0;
    $$("#gCard .tcheck").forEach(b => b.onclick = () => { const on = !b.classList.contains("on"); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); });
    const tb = $("#gCard .gc-timer"); if (tb) tb.onclick = () => runTimer(tb);
    $("#gCard").classList.remove("deal"); void $("#gCard").offsetWidth; $("#gCard").classList.add("deal");
  }
  function closeCard() { stopTimer(); $("#gCardSheet").hidden = true; }
  const checkedIds = () => $$("#gCard .tcheck.on").map(b => b.dataset.id);
  function giveXP(ids, ex, golden) {
    const G = S().game;
    ids.forEach(id => X.award(id, ex, golden, G.earned));
    X.save(); X.renderHeader();
  }

  /* card timer */
  let tState = null;
  function stopTimer() { if (tState) { clearInterval(tState.h); tState = null; } }
  function runTimer(btn) {
    if (tState) { stopTimer(); btn.textContent = `Start ${btn.dataset.max}s timer`; return; }
    const max = +btn.dataset.max, targets = btn.dataset.targets.split(",").map(Number);
    let ready = 3, t = 0;
    btn.textContent = "Ready " + ready; X.beep(660, 0.12);
    tState = { h: setInterval(() => {
      if (ready > 1) { ready--; btn.textContent = "Ready " + ready; X.beep(660, 0.12); return; }
      if (ready === 1) { ready = 0; X.beep(990, 0.2); btn.textContent = "Go! 0s"; return; }
      t++; btn.textContent = `${t}s of ${max}s`;
      if (targets.includes(t) && t < max) { X.ding(); X.toast(`${t} seconds: some levels can stop!`); }
      if (t >= max) { stopTimer(); X.ding(); btn.textContent = "Time! Done"; }
    }, 1000) };
  }

  /* ---------- turn flow ---------- */
  function drawMoveCard() {
    if (busy || cardState) return;
    const G = S().game, k = G.turn;
    const r = Math.random(), type = r < 0.45 ? "c" : r < 0.8 ? "s" : "k";
    const count = Math.random() < 0.2 ? 2 : 1;
    let dest = -1, seen = 0;
    for (let j = G.teams[k].pos + 1; j < G.board.N - 1; j++) if (G.board.sq[j].type === type && ++seen === count) { dest = j; break; }
    if (dest < 0) dest = G.board.N - 1;
    G.pending = { type, count, dest };
    X.save();
    X.beep(520, 0.1); setTimeout(() => X.beep(780, 0.12), 90);
    renderTurn();
    if (G.auto) setTimeout(doMove, 1100);
  }
  function onSquareTap(i) {
    const G = S().game; if (!G || !G.pending || G.auto || busy) return;
    if (i === -1 || i === G.pending.dest) doMove();
    else X.toast("Tap the glowing square!");
  }
  function doMove() {
    const G = S().game, k = G.turn, p = G.pending; if (!p || busy) return;
    G.pending = null; renderTurn(true);
    hop(k, p.dest, () => {
      if (checkWin(k)) return;
      landing(k, () => {
        if (checkWin(k)) return;
        const q = G.board.sq[G.teams[k].pos];
        if (q.type === "k") chanceCard(k); else pileCard(q.type, k);
      });
    });
  }
  function pileCard(type, k) {
    const G = S().game, zone = zoneOf(G.teams[k].pos);
    const ex = pickMove(type === "c" ? ["upper", "lower", "core"] : zone.cats, k);
    const golden = Math.random() < 0.12;
    cardState = { kind: "pile", k, ex, golden };
    openCard(type, `<h2>${teamBadge(k)}</h2>${golden ? '<span class="gold-tag">Golden card · 2x XP</span>' : ""}${type === "s" ? `<p class="small">Skill from ${zone.name}</p>` : ""}`,
      moveCardHTML(ex, membersOf(k)),
      `<button type="button" class="btn ghost" id="gcNo">Not this time (back 1)</button><button type="button" class="btn big done" id="gcYes">We did it!</button>`);
    $("#gcYes").onclick = () => { giveXP(checkedIds(), ex, golden); golden ? X.fanfare() : X.ding(); closeCard(); cardState = null; nextTurn(); };
    $("#gcNo").onclick = () => { giveXP(checkedIds(), ex, false); closeCard(); cardState = null; moveBy(k, -1, nextTurn); };
  }

  function weightedChance(n) {
    const deck = CHANCE.filter(c => !(c.id === "swap" && n < 2));
    let r = Math.random() * deck.reduce((s, c) => s + c.w, 0);
    for (const c of deck) { r -= c.w; if (r <= 0) return c.id; }
    return deck[0].id;
  }
  function chanceCard(k) {
    const G = S().game, n = G.teams.length, id = weightedChance(n);
    cardState = { kind: "chance", k, id };
    const head = `<h2>${teamBadge(k)}</h2>`;
    const simple = (title, text, btn, fn) => {
      openCard("k", head, `<h3 class="gc-move">${title}</h3><p class="gc-how">${text}</p>`, `<button type="button" class="btn big" id="gcOk">${btn}</button>`);
      $("#gcOk").onclick = () => { closeCard(); cardState = null; fn(); };
    };
    if (id === "spring") return simple("Springboard!", "Your team bounces ahead 3 squares. Everyone do 3 straight jumps to celebrate!", "Bounce!", () => moveBy(k, 3, nextTurn));
    if (id === "spill") return simple("Chalk spill!", "Oops, someone spilled the chalk bowl. Slide back 2 squares.", "Slide back", () => moveBy(k, -2, nextTurn));
    if (id === "free") return simple("Water break", "Free pass! Grab a sip of water. No challenge this turn.", "Ahh, thanks", nextTurn);
    if (id === "judge") return simple("Judge's bonus", "Strike your best finish pose together and hold it for 5 seconds. The judges love it: move ahead 1!", "Salute the judges", () => moveBy(k, 1, nextTurn));
    if (id === "stick") {
      const ex = EX.find(e => e.id === "stick");
      openCard("k", head, `<h3 class="gc-move">Stick the landing!</h3><p class="gc-how">Everyone on your team does one straight jump and sticks it for 3 seconds. If every single person sticks it, move ahead 2!</p>`,
        `<button type="button" class="btn ghost" id="gcNo">Some wobbles</button><button type="button" class="btn big done" id="gcYes">Everyone stuck it!</button>`);
      $("#gcYes").onclick = () => { giveXP(membersOf(k).map(m => m.id), ex); X.fanfare(); closeCard(); cardState = null; moveBy(k, 2, nextTurn); };
      $("#gcNo").onclick = () => { giveXP(membersOf(k).map(m => m.id), ex); closeCard(); cardState = null; nextTurn(); };
      return;
    }
    if (id === "everybody") {
      const ex = EX.find(e => e.id === "hollow");
      openCard("k", head, `<h3 class="gc-move">Everybody up!</h3><p class="gc-how">Every team does this one together. ${esc(G.teams[k].name)} moves ahead 1 when it's done.</p>` + moveCardHTML(ex, allMembers()),
        `<button type="button" class="btn big done" id="gcYes">All done!</button>`);
      $("#gcYes").onclick = () => { giveXP(checkedIds(), ex); X.ding(); closeCard(); cardState = null; moveBy(k, 1, nextTurn); };
      return;
    }
    if (id === "dare") {
      const ex = pickMove(["upper", "lower", "core"], k);
      openCard("k", head + `<span class="gold-tag">Double dare · Harder numbers</span>`, `<p class="gc-how">Take the dare at harder numbers. Finish it and move ahead 2!</p>` + moveCardHTML(ex, membersOf(k), { mult: 1.25 }),
        `<button type="button" class="btn ghost" id="gcNo">Not this time</button><button type="button" class="btn big done" id="gcYes">Dare done!</button>`);
      $("#gcYes").onclick = () => { giveXP(checkedIds(), ex, true); X.fanfare(); closeCard(); cardState = null; moveBy(k, 2, nextTurn); };
      $("#gcNo").onclick = () => { giveXP(checkedIds(), ex); closeCard(); cardState = null; nextTurn(); };
      return;
    }
    if (id === "swap") {
      openCard("k", head, `<h3 class="gc-move">Switcheroo!</h3><p class="gc-how">Trade places with any team on the board. Choose wisely!</p><div class="choice-grid">${G.teams.map((t, j) => j === k ? "" : `<button type="button" class="choice" data-j="${j}">${teamBadge(j)}<small>Square ${t.pos}</small></button>`).join("")}</div>`,
        `<button type="button" class="btn ghost" id="gcNo">Stay put</button>`);
      $$("#gCard .choice").forEach(b => b.onclick = () => {
        const j = +b.dataset.j, a = G.teams[k].pos; G.teams[k].pos = G.teams[j].pos; G.teams[j].pos = a;
        placeToken(k, G.teams[k].pos); placeToken(j, G.teams[j].pos); X.save(); renderScore(); X.fanfare();
        closeCard(); cardState = null; setTimeout(nextTurn, 500);
      });
      $("#gcNo").onclick = () => { closeCard(); cardState = null; nextTurn(); };
      return;
    }
    if (id === "coach") return coachForADay(k);
  }

  /* Coach for a Day: the team picks a conditioning card for another team */
  function coachForADay(k) {
    const G = S().game, n = G.teams.length;
    const head = `<h2>${teamBadge(k)}</h2>`;
    const chooseCard = target => {
      const opts = []; for (let i = 0; i < 3; i++) opts.push(pickMove(["upper", "lower", "core"], target, opts.map(o => o.id)));
      const lv = levelsOf(membersOf(target));
      openCard("k", head, `<h3 class="gc-move">${n > 1 ? `Coach for a Day: pick a card for ${esc(G.teams[target].name)}` : "Coach's choice: pick your own card"}</h3>
        <div class="choice-grid one">${opts.map((ex, i) => `<button type="button" class="choice" data-i="${i}"><b>${esc(ex.name)}</b><small>${lv.map(li => `${LV[li].short} ${X.amountFor(ex, li)}`).join(" · ")} ${X.shortUnit(ex)}</small></button>`).join("")}</div>`, "");
      $$("#gCard .choice").forEach(b => b.onclick = () => assign(target, opts[+b.dataset.i]));
    };
    const assign = (target, ex) => {
      openCard("c", `<h2>${teamBadge(target)}</h2><p class="small">${n > 1 ? `Coach ${esc(G.teams[k].name)} chose this for you!` : "Finish it and move ahead 1."}</p>`, moveCardHTML(ex, membersOf(target)),
        `<button type="button" class="btn ghost" id="gcNo">Not this time${n > 1 ? " (back 1)" : ""}</button><button type="button" class="btn big done" id="gcYes">We did it!</button>`);
      $("#gcYes").onclick = () => { giveXP(checkedIds(), ex); X.ding(); closeCard(); cardState = null; if (n === 1) moveBy(k, 1, nextTurn); else nextTurn(); };
      $("#gcNo").onclick = () => { giveXP(checkedIds(), ex); closeCard(); cardState = null; if (n > 1) moveBy(target, -1, nextTurn); else nextTurn(); };
    };
    if (n === 1) return chooseCard(k);
    openCard("k", head, `<h3 class="gc-move">Coach for a Day!</h3><p class="gc-how">Your team gets to be the coach. Pick a team, then choose their conditioning card.</p>
      <div class="choice-grid">${G.teams.map((t, j) => j === k ? "" : `<button type="button" class="choice" data-j="${j}">${teamBadge(j)}<small>Square ${t.pos}</small></button>`).join("")}</div>`, "");
    $$("#gCard .choice").forEach(b => b.onclick = () => chooseCard(+b.dataset.j));
  }

  function nextTurn() {
    const G = S().game; if (!G || G.over) return;
    if (G.timeUp) { endGame("time"); return; }
    G.turn = (G.turn + 1) % G.teams.length;
    if (G.turn === 0) G.round++;
    X.save(); renderTurn(); renderScore();
  }

  /* ---------- side panel ---------- */
  function turnQuote(pos) {
    const zone = zoneOf(pos), key = Object.keys(ZONES).find(k => ZONES[k] === zone), Q = QUOTES[key];
    return Q ? `<blockquote class="turn-quote">\u201C${esc(Q.q)}\u201D<cite>${esc(Q.who)}, ${esc(Q.note)}</cite></blockquote>` : "";
  }
  function renderTurn(moving) {
    const G = S().game, k = G.turn, t = G.teams[k], p = G.pending;
    const mem = membersOf(k);
    $$("#gBoard .sq.target").forEach(e => e.classList.remove("target"));
    $$("#gBoard .token").forEach(e => e.classList.toggle("current", +e.dataset.k === k));
    let inner;
    if (p) {
      const pc = p.dest === G.board.N - 1 ? "var(--gold)" : PILES[p.type].color;
      inner = `<div class="move-draw" style="--pc:${pc}"><b>${p.count === 2 ? "Double!" : "Move to"}</b><span>${p.dest === G.board.N - 1 ? "The Podium!" : (p.count === 2 ? "2nd " : "next ") + PILES[p.type].name + " square"}</span></div>
        <p class="move-hint">${G.auto ? "Here we go..." : "Tap the glowing square to move your piece!"}</p>`;
      const sqEl = $(`#gBoard .sq[data-i="${p.dest}"]`); if (sqEl) sqEl.classList.add("target");
      $("#gBoard").style.setProperty("--tc", t.color);
    } else if (moving) {
      inner = `<p class="move-hint">Moving...</p>`;
    } else {
      inner = `<button type="button" class="btn big wide draw-btn" id="gDraw">Draw a move card</button>`;
    }
    $("#gTurn").style.setProperty("--tc", t.color);
    $("#gTurn").innerHTML = `<div class="turn-head">${teamBadge(k)}<span class="turn-of">'s turn · Round ${G.round}</span></div>
      <p class="small">${mem.map(m => esc(m.name)).join(", ")} · ${zoneOf(t.pos).name}</p>${inner}${turnQuote(t.pos)}`;
    const d = $("#gDraw"); if (d) d.onclick = drawMoveCard;
  }
  function renderScore() {
    const G = S().game; if (!G) return;
    const last = G.board.N - 1, lead = Math.max(...G.teams.map(t => t.pos));
    $("#gScore").innerHTML = G.teams.map((t, k) => `<div class="score-row${k === G.turn ? " now" : ""}">
      ${teamBadge(k)}<span class="score-bar"><i style="width:${(t.pos / last) * 100}%;background:${t.color}"></i></span>
      <span class="score-pos">${t.pos}<small>/${last}</small></span>${t.pos === lead && lead > 0 && G.teams.length > 1 ? '<span class="lead">Lead</span>' : ""}</div>`).join("");
  }
  let clockH = null;
  function updateClock() {
    const G = S().game, el = $("#gClock"); if (!G) return;
    if (!G.endAt) { el.textContent = `${Math.floor((Date.now() - G.startedAt) / 60000)} min played`; el.className = ""; return; }
    const left = Math.round((G.endAt - Date.now()) / 1000);
    el.textContent = left > 0 ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} left` : "Time's up!";
    el.className = left <= 0 ? "over" : left < 120 ? "low" : "";
    if (left <= 0 && !G.timeUp) {
      G.timeUp = true; X.save(); X.fanfare();
      if (!cardState && !busy) endGame("time"); else X.toast("Time's up! Finish this card to see who wins.");
    }
  }

  /* ---------- start / end ---------- */
  function openGame() {
    $("#game").hidden = false; document.body.style.overflow = "hidden";
    $("#gQuitConfirm").hidden = true;
    renderBoard(); renderTurn(); renderScore();
    clearInterval(clockH); clockH = setInterval(updateClock, 1000); updateClock();
    setMuteBtn();
  }
  function closeGame() { $("#game").hidden = true; document.body.style.overflow = ""; clearInterval(clockH); closeCard(); cardState = null; }
  function startGame() {
    const st = setup(), teams = teamGroups();
    if (teams.some(t => !t.length)) { X.toast("Every team needs at least one athlete"); return; }
    S().game = {
      prog: st.prog, auto: st.auto, board: buildBoard(st.len),
      teams: teams.map((ids, k) => ({ name: st.names[k] || TEAM_PRESETS[k].name, color: TEAM_PRESETS[k].color, shape: TEAM_PRESETS[k].shape, members: ids, pos: 0 })),
      turn: Math.floor(Math.random() * teams.length), round: 1, recent: [], earned: {}, pending: null,
      startedAt: Date.now(), endAt: st.time ? Date.now() + st.time * 60000 : null, timeUp: false, over: false
    };
    X.save(); openGame();
    X.toast(`${S().game.teams[S().game.turn].name} go first!`);
  }
  function endGame(reason, winnerK) {
    const G = S().game; if (!G || G.over) return;
    G.over = true; closeCard(); cardState = null; clearInterval(clockH);
    const order = G.teams.map((t, k) => ({ t, k })).sort((a, b) => (b.k === winnerK) - (a.k === winnerK) || b.t.pos - a.t.pos);
    const topPos = order[0].t.pos;
    const winners = order.filter(o => o.k === winnerK || (winnerK === undefined && o.t.pos === topPos));
    const ids = G.teams.flatMap(t => t.members);
    const winIds = winners.flatMap(w => w.t.members);
    winIds.forEach(id => { const a = athlete(id); if (a) { a.xp += 50; G.earned[id] += 50; } });
    const { lines, badgeWho } = X.wrapUp(ids, G.earned, { team: true, winners: winIds, all: true });
    const solo = G.teams.length === 1;
    const mins = Math.max(1, Math.round((Date.now() - G.startedAt) / 60000));
    const podium = order.slice(0, 3);
    const placeCls = ["first", "second", "third"];
    $("#gOver").innerHTML = `<p class="eyebrow">${reason === "time" ? "Time's up!" : "We have a winner!"}</p>
      <h2>${solo ? (reason === "podium" ? `${esc(G.teams[0].name)} reached the podium!` : `${esc(G.teams[0].name)} made it to square ${G.teams[0].pos}`) : winners.map(w => esc(w.t.name)).join(" & ") + (winners.length > 1 ? " tie!" : " win!")}</h2>
      ${solo ? "" : `<div class="podium-stand">${[1, 0, 2].filter(i => podium[i]).map(i => `<div class="stand ${placeCls[i]}"><svg viewBox="-14 -14 28 28"><circle r="13" fill="${podium[i].t.color}"/><path d="${SHAPES[podium[i].t.shape]}" fill="#fff"/></svg><b>${esc(podium[i].t.name)}</b><div class="block">${i + 1}</div></div>`).join("")}</div>`}
      ${order.length > 3 ? `<p class="small">${order.slice(3).map((o, i) => `${i + 4}. ${esc(o.t.name)} (square ${o.t.pos})`).join(" · ")}</p>` : ""}
      <div class="finish-list"><div class="finish-sum">${mins} min · ${G.round} rounds · winners +50 XP bonus</div>
      ${lines.length ? `<div class="fx-grid">${lines.join("")}</div>` : ""}${X.badgeLines(badgeWho)}</div>
      <div class="sheet-actions"><button type="button" class="btn ghost" id="gOverDone">Done</button><button type="button" class="btn big" id="gAgain">Play again</button></div>`;
    S().game = null; X.save();
    $("#game").hidden = true; document.body.style.overflow = "";
    $("#gOverSheet").hidden = false;
    X.fanfare(); confettiOn($("#gConfetti"));
    $("#gOverDone").onclick = () => { $("#gOverSheet").hidden = true; renderSetup(); X.renderAll(); };
    $("#gAgain").onclick = () => { $("#gOverSheet").hidden = true; X.renderAll(); startGame(); };
  }
  function confettiOn(cv) {
    if (X.reduced()) return;
    const ctx = cv.getContext("2d"), W = cv.width = innerWidth, H = cv.height = innerHeight;
    const cols = TEAM_PRESETS.map(t => t.color);
    const ps = Array.from({ length: 160 }, () => ({ x: Math.random() * W, y: -20 - Math.random() * H * 0.5, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, s: 6 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)] }));
    let f = 0;
    (function step() {
      ctx.clearRect(0, 0, W, H);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (++f < 240 && !$("#gOverSheet").hidden) requestAnimationFrame(step); else ctx.clearRect(0, 0, W, H);
    })();
  }

  /* ---------- setup ---------- */
  function setup() {
    const s = S();
    s.gameSetup = s.gameSetup || {};
    const st = s.gameSetup;
    st.prog = st.prog || s.teamProgram || "xcel"; st.n = st.n || 2; st.len = st.len || "standard";
    st.time = st.time === undefined ? 30 : st.time; st.auto = st.auto !== false;
    st.names = st.names || TEAM_PRESETS.map(t => t.name); st.assign = st.assign || {};
    return st;
  }
  const players = () => X.groupList(setup().prog).filter(a => a.inTeam);
  function balance() {
    const st = setup(), list = players().slice().sort((a, b) => b.level - a.level || a.name.localeCompare(b.name));
    const n = Math.min(st.n, Math.max(1, list.length));
    const shuffled = [];
    // shuffle within each level so teams change between games, then snake-draft
    levelsOf(list).reverse().forEach(li => shuffled.push(...X.shuffle(list.filter(a => a.level === li))));
    st.assign = {};
    shuffled.forEach((a, i) => { const r = Math.floor(i / n), c = i % n; st.assign[a.id] = r % 2 === 0 ? c : n - 1 - c; });
    X.save();
  }
  function teamGroups() {
    const st = setup(), list = players(), n = st.n;
    if (list.some(a => st.assign[a.id] === undefined || st.assign[a.id] >= n)) balance();
    const groups = Array.from({ length: n }, () => []);
    list.forEach(a => groups[st.assign[a.id]].push(a.id));
    return groups;
  }
  function seg(el, opts, cur, fn) {
    el.innerHTML = opts.map(o => `<button type="button" data-v="${o.v}" class="${String(o.v) === String(cur) ? "on" : ""}">${o.t}</button>`).join("");
    $$("button", el).forEach(b => b.onclick = () => fn(b.dataset.v));
  }
  function renderSetup() {
    const st = setup(), list = players();
    $$("#gProg button").forEach(b => { b.classList.toggle("on", b.dataset.v === st.prog); b.onclick = () => { st.prog = b.dataset.v; st.assign = {}; X.save(); renderSetup(); }; });
    const all = X.groupList(st.prog);
    $("#gGroupNote").innerHTML = all.length
      ? `${list.length} of ${all.length} ${X.PROGRAMS[st.prog].name} athletes checked in. Change who's here on the <a href="#team">Team tab</a>.`
      : `No ${X.PROGRAMS[st.prog].name} athletes yet. Add them on the <a href="#team">Team tab</a>.`;
    seg($("#gTeamsSeg"), [1, 2, 3, 4, 5, 6].map(v => ({ v, t: v })), st.n, v => { st.n = +v; st.assign = {}; X.save(); renderSetup(); });
    seg($("#gLenSeg"), Object.keys(LENGTHS).map(v => ({ v, t: LENGTHS[v].name })), st.len, v => { st.len = v; X.save(); renderSetup(); });
    seg($("#gTimeSeg"), [{ v: 0, t: "Off" }, { v: 20, t: "20 min" }, { v: 30, t: "30 min" }], st.time, v => { st.time = +v; X.save(); renderSetup(); });
    seg($("#gAutoSeg"), [{ v: "auto", t: "Move by themselves" }, { v: "tap", t: "Team taps to move" }], st.auto ? "auto" : "tap", v => { st.auto = v === "auto"; X.save(); renderSetup(); });
    const groups = teamGroups();
    $("#gTeams").innerHTML = groups.map((ids, k) => `<div class="team-col" style="--tc:${TEAM_PRESETS[k].color}">
      <div class="tc-head"><svg viewBox="-14 -14 28 28"><circle r="13" fill="${TEAM_PRESETS[k].color}"/><path d="${SHAPES[TEAM_PRESETS[k].shape]}" fill="#fff"/></svg>
        <input type="text" id="gName${k}" maxlength="16" value="${esc(st.names[k])}" aria-label="Team ${k + 1} name"><small>${ids.length}</small></div>
      <div class="tc-names">${ids.map(id => { const a = athlete(id); return `<button type="button" class="tc-chip" data-id="${id}"><span class="avatar" style="background:${a.color}">${esc(X.initials(a.name))}</span>${esc(a.name)} <small>${LV[a.level].short}</small></button>`; }).join("") || '<span class="small">Empty</span>'}</div></div>`).join("");
    $$("#gTeams input").forEach((inp, k) => inp.onchange = () => { st.names[k] = inp.value.trim() || TEAM_PRESETS[k].name; X.save(); });
    $$("#gTeams .tc-chip").forEach(b => b.onclick = () => { st.assign[b.dataset.id] = (st.assign[b.dataset.id] + 1) % st.n; X.save(); renderSetup(); });
    const short = list.length < st.n;
    $("#gStart").disabled = !list.length || short;
    $("#gStart").textContent = !list.length ? "Add athletes to play" : short ? `Need at least ${st.n} athletes` : `Start the game · ${st.n} team${st.n > 1 ? "s" : ""}`;
    const G = S().game;
    $("#gResume").hidden = !(G && !G.over);
    if (G && !G.over) $("#gResume").textContent = `Resume game: ${G.teams.map(t => t.name).join(" vs ")}`;
  }

  /* ---------- wiring ---------- */
  const setMuteBtn = () => { $("#gMute").classList.toggle("off", S().muted); };
  $("#gShuffle").onclick = () => { balance(); renderSetup(); X.toast("Fresh fair teams!"); };
  $("#gStart").onclick = () => { if (S().game && !S().game.over) { X.toast("Finish or end the current game first"); return; } startGame(); };
  $("#gResume").onclick = () => { const G = S().game; G.pending = null; openGame(); };
  $("#gQuit").onclick = () => { $("#gQuitConfirm").hidden = false; };
  $("#gKeep").onclick = () => { $("#gQuitConfirm").hidden = true; };
  $("#gPause").onclick = () => { S().game.pending = null; X.save(); closeGame(); renderSetup(); X.toast("Game saved. Resume it from the Game tab."); };
  $("#gEnd").onclick = () => { $("#gQuitConfirm").hidden = true; endGame("time"); };
  $("#gMute").onclick = () => { S().muted = !S().muted; X.save(); setMuteBtn(); };

  window.XGame = { renderSetup };
  if (location.hash === "#game") renderSetup();
})();
