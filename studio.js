/* Studio: every graph on Channel Crossings, drawn the way the visitor chooses, for a one-off £1.99.
   Loaded the first time the Studio tab opens. Visitors have a simple account (their email, signed in with a link
   sent to it), so a purchase follows them to any device. The account and the payment are handled by a small
   Cloudflare Worker, scripts/studio-worker.js, which talks to Stripe and sends the sign-in emails; nothing about
   the visitor is kept on this site. */
(function(){
  "use strict";

  // The address of the Studio worker (scripts/studio-worker.js), set in index.html. Until it is set, the tab only
  // appears on devices that opened the preview link, where Studio is unlocked so it can be looked over.
  const API = window.CC_STUDIO_API || "";
  const PRICE = "£1.99";

  const $ = id => document.getElementById(id), host = $("studioApp");
  if(!host || host.dataset.ready) return;
  host.dataset.ready = "1";
  const docEl = document.documentElement, reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {   // localStorage, which can be missing or blocked
    get(k){ try{ return JSON.parse(localStorage.getItem("cc-studio-" + k)); }catch(e){ return null; } },
    set(k, v){ try{ localStorage.setItem("cc-studio-" + k, JSON.stringify(v)); }catch(e){} },
    del(k){ try{ localStorage.removeItem("cc-studio-" + k); }catch(e){} }
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
  const fmt = n => n == null || !isFinite(n) ? "–" : (Math.abs(n) < 100 && n % 1 ? n.toFixed(1) : Math.round(n).toLocaleString("en-GB"));
  const kfmt = n => n >= 1e4 ? Math.round(n / 1e3) + "k" : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k" : fmt(n);
  // a colour part-way from one hex colour to another, as a hex colour (so a saved picture keeps it)
  const mix = (a, b, t) => "#" + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t).toString(16).padStart(2, "0")).join("");
  const sum = (a, f) => a.reduce((s, x) => s + (f(x) || 0), 0);
  const parse = s => new Date(s + "T12:00:00Z");
  const iso = d => d.toISOString().slice(0, 10);
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DOW = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const dLong = new Intl.DateTimeFormat("en-GB", {day:"numeric", month:"short", year:"numeric", timeZone:"UTC"});
  const dShort = new Intl.DateTimeFormat("en-GB", {day:"numeric", month:"short", timeZone:"UTC"});
  const ic = {
    bars:'<path d="M5 20v-7M10 20V6M15 20v-9M20 20V9"/>', line:'<path d="M3 17l5-6 4 3 4-7 5 5"/>', area:'<path d="M3 19V15l5-5 4 3 4-6 5 4v8z"/>',
    steps:'<path d="M3 18h4v-5h5v-4h4V5h5"/>', dots:'<circle cx="5" cy="16" r="1.6"/><circle cx="10" cy="9" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="20" cy="5" r="1.6"/>',
    lolly:'<path d="M6 20v-9M12 20V6M18 20v-6"/><circle cx="6" cy="9.5" r="1.8"/><circle cx="12" cy="4.5" r="1.8"/><circle cx="18" cy="12.5" r="1.8"/>',
    table:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M3.5 9.5h17M3.5 14.5h17M10 9.5v10"/>',
    hbars:'<path d="M4 6h12M4 12h16M4 18h8"/>', rose:'<path d="M12 12V3a9 9 0 0 1 7 3.5zM12 12l6 6.5A9 9 0 0 1 6 19zM12 12L5 9a9 9 0 0 1 3-4z"/>',
    donut:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/>', grid:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    tree:'<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M12 4v16M12 13h8.5M16 13v7"/>', radial:'<circle cx="12" cy="12" r="3"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    stripes:'<path d="M5 4v16M9 4v16M13 4v16M17 4v16"/>', multi:'<rect x="3.5" y="4" width="7" height="7" rx="1.5"/><rect x="13.5" y="4" width="7" height="7" rx="1.5"/><rect x="3.5" y="13" width="7" height="7" rx="1.5"/><rect x="13.5" y="13" width="7" height="7" rx="1.5"/><path d="M5 9l2-2 2 1M15 9l2-3 2 2M5 18l2-1 2-2M15 18l2-2 2 1"/>',
    people:'<circle cx="7" cy="7" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="7" cy="16" r="2"/><circle cx="17" cy="16" r="2"/><circle cx="12" cy="11.5" r="2"/>',
    mirror:'<path d="M3 12h18M6 12V6M10 12V8M14 12V5M18 12V7M6 12v4M10 12v6M14 12v3M18 12v5"/>',
    save:'<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>'
  };
  const svgI = k => '<svg viewBox="0 0 24 24" aria-hidden="true">' + ic[k] + "</svg>";

  /* ------------------------------------------------------------ the styles: only the marks change, the page stays the site's own */
  const STYLES = [
    {id:"standard", name:"Standard", r:4, lw:2, light:["#007AFF","#FF9500","#5856D6","#30B0C7","#FF2D55","#34C759"], dark:["#0A84FF","#FF9F0A","#5E5CE6","#40C8E0","#FF375F","#30D158"],
      seqL:["#DCEBFF","#A7CDFF","#5EA6FF","#007AFF","#0053B3"], seqD:["#0D2A4D","#11457F","#1767C0","#0A84FF","#7DBBFF"]},
    {id:"sober", name:"Sober", r:3, lw:2, light:["#2F4B6E","#A8763C","#4D7A82","#8F4F5E","#7590B1","#C9A06A"], dark:["#8BA6C7","#CFA46E","#86B2B8","#C4909C","#58779C","#9A6F3E"],
      seqL:["#D3DBE5","#9FB1C6","#6681A2","#2F4B6E","#1B2D45"], seqD:["#26364A","#3B5472","#5E7FA6","#9DB6D3","#D2DEEC"]},
    {id:"graphite", name:"Graphite", r:1.5, lw:1.6, light:["#1C1C1E","#FF3B30","#8E8E93","#48484A","#C7C7CC","#636366"], dark:["#F2F2F7","#FF453A","#8E8E93","#C7C7CC","#48484A","#AEAEB2"],
      seqL:["#E5E5EA","#C7C7CC","#8E8E93","#48484A","#1C1C1E"], seqD:["#2C2C2E","#48484A","#8E8E93","#C7C7CC","#F2F2F7"]},
    {id:"glass", name:"Glass", r:7, lw:2.4, glass:true, light:["#3D8BFF","#FF8A3D","#7A6CF0","#2EC4D6","#FF4F7B","#3CCB7F"], dark:["#5AA2FF","#FFA052","#8E82FF","#4FD8E8","#FF6B92","#4FE08F"],
      seqL:["#DCE8FF","#B0CBFF","#7DA6FF","#4D7FFF","#3A4FD9"], seqD:["#1A2550","#26388A","#3A56C4","#5A82FF","#9DB8FF"]},
    {id:"vivid", name:"Vivid", r:999, lw:3, glow:true, light:["#E5004A","#4DB300","#00A8C6","#FF8A00","#A23BEC","#0A84FF"], dark:["#FA114F","#92E82A","#1EEAEF","#FF9F0A","#BF5AF2","#64D2FF"],
      seqL:["#FFE0E9","#FFA3BE","#FF5C8A","#E5004A","#9E0033"], seqD:["#3A0716","#7A0D2E","#C40F45","#FA114F","#FF7DA3"]},
    {id:"ocean", name:"Ocean", r:4, lw:2.2, light:["#0B3C5D","#F28C28","#328CC1","#8A9BA8","#B5523B","#1D7874"], dark:["#5AA9E6","#FF9F0A","#7FC8F8","#A7B4BF","#E07A5F","#4FB3A9"],
      seqL:["#D5E5F0","#9EC3DD","#5A97C2","#22689A","#0B3C5D"], seqD:["#0E2A40","#164466","#236B9C","#4A9BD1","#9CCDF0"]}
  ];

  /* ------------------------------------------------------------ what the visitor chose, remembered on this device */
  const prefs = Object.assign({style:"standard", measure:"people", range:"365", group:"week", ot:"bars", avg:true, rt:"lines", cal:"calendar", calY:null,
    pat:"dow", patF:"bars", yr:"bars", who:"lastYear", whoF:"waffle", nat:"hbars", ret:"bars", pb:"line"}, store.get("prefs") || {});
  const save = () => store.set("prefs", prefs);

  const isDark = () => docEl.dataset.theme === "dark" || (docEl.dataset.theme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  function theme(){
    const s = STYLES.find(x => x.id === prefs.style) || STYLES[0], dk = isDark(), cs = getComputedStyle(docEl);
    const v = n => cs.getPropertyValue(n).trim();
    return Object.assign({}, s, {dark:dk, c:dk ? s.dark : s.light, seq:dk ? s.seqD : s.seqL,
      ink:v("--label") || (dk ? "#fff" : "#000"), ink2:v("--label2") || "#888", grid:v("--sep") || "rgba(128,128,128,.25)",
      muted:dk ? "rgba(235,235,245,.28)" : "rgba(60,60,67,.24)", surface:dk ? "#1C1C1E" : "#FFFFFF", font:'Inter,"Helvetica Neue",Helvetica,Arial,sans-serif'});
  }

  /* ------------------------------------------------------------ the data */
  let D = [], gender = null, nats = null, rets = null, perBoat = null, last = null;
  const getJSON = u => fetch(u, {cache:"no-cache"}).then(r => { if(!r.ok) throw r.status; return r.json(); });
  function measureOf(rows){   // people, boats, or people per boat (the year's people over its boats, not an average of averages)
    const m = sum(rows, r => r.migrants), b = sum(rows, r => r.boats);
    return prefs.measure === "boats" ? b : prefs.measure === "perboat" ? (b ? m / b : null) : m;
  }
  const mName = () => ({people:"people", boats:"boats", perboat:"people a boat"})[prefs.measure];
  function inRange(){
    if(!D.length) return [];
    const r = prefs.range;
    if(r === "all") return D;
    if(r === "ytd") return D.filter(d => d.date.slice(0, 4) === last.slice(0, 4));
    const from = new Date(parse(last).getTime() - (+r - 1) * 864e5);
    return D.filter(d => parse(d.date) >= from);
  }
  function weekStart(s){ const d = parse(s), w = (d.getUTCDay() + 6) % 7; return iso(new Date(d.getTime() - w * 864e5)); }
  function bucket(rows, g){
    const key = g === "day" ? r => r.date : g === "week" ? r => weekStart(r.date) : g === "month" ? r => r.date.slice(0, 7) : r => r.date.slice(0, 4);
    const out = [], idx = {};
    rows.forEach(r => { const k = key(r); if(!(k in idx)){ idx[k] = out.length; out.push({k, rows:[]}); } out[idx[k]].rows.push(r); });
    out.forEach(b => b.v = measureOf(b.rows));
    return out;
  }
  function bLabel(k, g, long){
    if(g === "day") return long ? dLong.format(parse(k)) : dShort.format(parse(k));
    if(g === "week") return (long ? "Week of " : "") + (long ? dLong : dShort).format(parse(k));
    if(g === "month") return MON[+k.slice(5) - 1] + " " + (long ? k.slice(0, 4) : "’" + k.slice(2, 4));
    return k;
  }

  /* ------------------------------------------------------------ drawing: plain SVG with the colours written in, so a chart can be saved as a picture */
  let uid = 0;
  function Svg(W, H, T){ this.W = W; this.H = H; this.T = T; this.defs = []; this.g = []; this.id = "st" + (++uid); this.n = 0; }
  Svg.prototype.add = function(s){ this.g.push(s); return this; };
  Svg.prototype.text = function(x, y, s, o){ o = o || {};
    return this.add('<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" fill="' + (o.c || this.T.ink2) + '" font-family=\'' + this.T.font + '\' font-size="' + (o.size || 11) + '" font-weight="' + (o.w || 500)
      + '" text-anchor="' + (o.a || "start") + '"' + (o.cls ? ' class="' + o.cls + '"' : "") + (o.base ? ' dominant-baseline="' + o.base + '"' : "") + ">" + esc(s) + "</text>"); };
  // a fill for one mark: flat, or for Glass and Vivid a gradient of the colour, Vivid with a soft glow
  Svg.prototype.fill = function(c, vertical){
    const T = this.T; if(!T.glass && !T.glow) return 'fill="' + c + '"';
    const id = this.id + "f" + (++this.n), v = vertical !== false;
    this.defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (v ? 0 : 1) + '" y2="' + (v ? 1 : 0) + '"><stop offset="0" stop-color="' + c + '" stop-opacity="' + (T.glass ? .95 : 1) + '"/><stop offset="1" stop-color="' + c + '" stop-opacity="' + (T.glass ? .45 : .7) + '"/></linearGradient>');
    return 'fill="url(#' + id + ')"' + (T.glass ? ' stroke="rgba(255,255,255,' + (T.dark ? .35 : .7) + ')" stroke-width="1"' : "") + (T.glow ? ' filter="url(#' + this.glowId() + ')"' : "");
  };
  Svg.prototype.glowId = function(){
    if(!this.glow){ this.glow = this.id + "glow"; this.defs.push('<filter id="' + this.glow + '" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur in="SourceGraphic" stdDeviation="' + (this.T.dark ? 3.5 : 2.5) + '" result="b"/><feColorMatrix in="b" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ' + (this.T.dark ? .7 : .45) + ' 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>'); }
    return this.glow;
  };
  Svg.prototype.stroke = function(c, w){ return 'class="st-l" pathLength="1" fill="none" stroke="' + c + '" stroke-width="' + (w || this.T.lw) + '" stroke-linecap="round" stroke-linejoin="round"' + (this.T.glow ? ' filter="url(#' + this.glowId() + ')"' : ""); };
  // a bar with rounded ends away from the baseline (bars that go down are rounded at the bottom)
  Svg.prototype.bar = function(x, y, w, h, c, o){
    o = o || {}; if(h <= 0 || w <= 0) return this;
    const r = Math.min(this.T.r, w / 2, h), hor = o.hor, a = 'class="st-b' + (hor ? " h" : o.down ? " d" : "") + '"' + this.delay(hor ? y / this.H : x / this.W) + " ";
    if(r < .6) return this.add('<rect ' + a + 'x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '" ' + this.fill(c, !hor) + "/>");
    let d;
    if(hor) d = "M" + x + " " + y + "h" + (w - r) + "a" + r + " " + r + " 0 0 1 " + r + " " + r + "v" + (h - 2 * r) + "a" + r + " " + r + " 0 0 1 " + -r + " " + r + "h" + -(w - r) + "z";
    else if(o.down) d = "M" + x + " " + y + "h" + w + "v" + (h - r) + "a" + r + " " + r + " 0 0 1 " + -r + " " + r + "h" + -(w - 2 * r) + "a" + r + " " + r + " 0 0 1 " + -r + " " + -r + "z";
    else d = "M" + x + " " + (y + h) + "v" + -(h - r) + "a" + r + " " + r + " 0 0 1 " + r + " " + -r + "h" + (w - 2 * r) + "a" + r + " " + r + " 0 0 1 " + r + " " + r + "v" + (h - r) + "z";
    return this.add('<path ' + a + 'd="' + d.replace(/(\d\.\d\d)\d+/g, "$1") + '" ' + this.fill(c, !hor) + "/>");
  };
  // how long a mark waits before it animates in: a sweep across the chart, from where it sits (0 to 1)
  Svg.prototype.delay = function(f){ return ' style="animation-delay:' + Math.round(Math.max(0, Math.min(1, f || 0)) * 420) + 'ms"'; };
  Svg.prototype.out = function(label){
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + this.W + " " + this.H + '" width="' + this.W + '" height="' + this.H + '" role="img" aria-label="' + esc(label) + '">'
      + (this.defs.length ? "<defs>" + this.defs.join("") + "</defs>" : "") + this.g.join("") + '<circle class="st-mk" r="5" cx="-99" cy="-99" fill="' + this.T.surface + '" stroke="' + this.T.ink + '" stroke-width="2" opacity="0"/></svg>';
  };
  function niceTicks(max, n){
    if(!(max > 0)) max = 1;
    const raw = max / (n || 4), p = Math.pow(10, Math.floor(Math.log10(raw))), step = [1, 2, 2.5, 5, 10].map(x => x * p).find(s => s >= raw);
    const top = Math.ceil(max / step - 1e-9) * step, list = [];
    for(let v = 0; v <= top + 1e-9; v += step) list.push(v);
    return {top, list};
  }
  // the plot area with its horizontal grid and the values up the left
  function frame(s, max, o){
    o = o || {}; const t = niceTicks(max, o.n || 4), L = o.left != null ? o.left : 38, R = o.right || 8, Tp = o.top || 10, B = o.bottom || 24;
    const f = {x0:L, x1:s.W - R, y0:s.H - B, y1:Tp, top:t.top}; f.y = v => f.y0 - (v / t.top) * (f.y0 - f.y1);
    t.list.forEach(v => { const y = f.y(v); s.add('<path d="M' + f.x0 + " " + y.toFixed(1) + "H" + f.x1 + '" stroke="' + s.T.grid + '" stroke-width="' + (v ? .6 : 1) + '"' + (v && s.T.id === "graphite" ? ' stroke-dasharray="2 3"' : "") + "/>"); s.text(f.x0 - 8, y + 3.5, kfmt(v), {a:"end"}); });
    return f;
  }
  // a smooth line through points that never overshoots them (monotone cubic), as Apple's charts draw trends
  function smooth(p){
    if(p.length < 3) return p.map((q, i) => (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)).join("");
    const n = p.length, m = [], dx = [], dy = [];
    for(let i = 0; i < n - 1; i++){ dx[i] = p[i + 1][0] - p[i][0]; dy[i] = (p[i + 1][1] - p[i][1]) / (dx[i] || 1); }
    m[0] = dy[0]; m[n - 1] = dy[n - 2];
    for(let i = 1; i < n - 1; i++) m[i] = dy[i - 1] * dy[i] <= 0 ? 0 : 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / dy[i - 1] + (dx[i] + 2 * dx[i - 1]) / dy[i]);
    let d = "M" + p[0][0].toFixed(1) + " " + p[0][1].toFixed(1);
    for(let i = 0; i < n - 1; i++){ const h = dx[i] / 3; d += "C" + (p[i][0] + h).toFixed(1) + " " + (p[i][1] + m[i] * h).toFixed(1) + " " + (p[i + 1][0] - h).toFixed(1) + " " + (p[i + 1][1] - m[i + 1] * h).toFixed(1) + " " + p[i + 1][0].toFixed(1) + " " + p[i + 1][1].toFixed(1); }
    return d;
  }
  const lin = p => p.map((q, i) => (i ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)).join("");
  const stepP = p => p.map((q, i) => i ? "H" + q[0].toFixed(1) + "V" + q[1].toFixed(1) : "M" + q[0].toFixed(1) + " " + q[1].toFixed(1)).join("");
  // x labels spread evenly along the bottom, never crowded
  function xLabels(s, f, items, xOf, lab){
    const maxN = Math.max(2, Math.floor((f.x1 - f.x0) / 64)), step = Math.max(1, Math.ceil(items.length / maxN));
    for(let i = 0; i < items.length; i += step){ const x = xOf(i); s.text(x, f.y0 + 16, lab(items[i], i), {a:i === 0 && items.length > 1 && step > 1 ? "start" : "middle"}); }
  }
  function arc(cx, cy, r0, r1, a0, a1){   // a ring segment, angles from 12 o'clock clockwise
    const P = (r, a) => [cx + r * Math.sin(a), cy - r * Math.cos(a)], big = a1 - a0 > Math.PI ? 1 : 0, A = P(r1, a0), B = P(r1, a1), C = P(r0, a1), E = P(r0, a0);
    return "M" + A[0].toFixed(2) + " " + A[1].toFixed(2) + "A" + r1 + " " + r1 + " 0 " + big + " 1 " + B[0].toFixed(2) + " " + B[1].toFixed(2)
      + (r0 ? "L" + C[0].toFixed(2) + " " + C[1].toFixed(2) + "A" + r0 + " " + r0 + " 0 " + big + " 0 " + E[0].toFixed(2) + " " + E[1].toFixed(2) : "L" + cx + " " + cy) + "Z";
  }
  function table(head, rows){
    return '<div class="st-tbl-wrap"><table class="st-tbl"><thead><tr>' + head.map(h => "<th>" + esc(h) + "</th>").join("") + "</tr></thead><tbody>"
      + rows.map(r => "<tr>" + r.map(c => "<td>" + esc(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
  }
  const legend = items => '<div class="st-legend">' + items.map(i => '<span><i style="background:' + i[1] + '"></i>' + esc(i[0]) + "</span>").join("") + "</div>";

  /* ------------------------------------------------------------ the cards */
  const CARDS = [];
  function card(o){ CARDS.push(o); return o; }
  const width = el => Math.max(240, Math.round(el.clientWidth || 600));
  const hFor = (w, base) => Math.round(Math.min(base, Math.max(190, w * .55)));

  // 1. Over time: every day, week, month or year, in six forms
  card({id:"ot", full:true, title:"Crossings over time", forms:[["bars","Bars"],["line","Line"],["area","Area"],["steps","Steps"],["dots","Dots"],["lolly","Lollipop"],["table","Table"]], key:"ot",
    opts(){ return (prefs.group === "year" ? "" : seg("range", [["30","1M"],["90","3M"],["365","1Y"],["ytd","This year"],["all","All"]], "Range"))
      + seg("group", [["day","Day"],["week","Week"],["month","Month"],["year","Year"]], "Group by") + (prefs.group === "year" ? "" : seg("avg", [[true,"Average"],[false,"No average"]], "Average")); },
    draw(el, T){
      const rows = prefs.group === "year" ? D : inRange(), B = bucket(rows, prefs.group);
      this.read = [fmt(measureOf(rows)), mName() + " · " + (rows.length ? bLabel(rows[0].date, "day", true) + " – " + bLabel(rows[rows.length - 1].date, "day", true) : "")];
      if(prefs.ot === "table") return table([prefs.group === "day" ? "Day" : prefs.group[0].toUpperCase() + prefs.group.slice(1), mName()[0].toUpperCase() + mName().slice(1)], B.slice().reverse().map(b => [bLabel(b.k, prefs.group, true), fmt(b.v)]));
      const W = width(el), H = hFor(W, 300), s = new Svg(W, H, T), max = Math.max(1, ...B.map(b => b.v || 0)), f = frame(s, max, {top:24});
      const n = B.length, bw = (f.x1 - f.x0) / Math.max(n, 1), xc = i => f.x0 + bw * (i + .5), c = T.c[0];
      const pts = B.map((b, i) => [xc(i), f.y(b.v || 0)]);
      const form = prefs.ot;
      if(form === "bars"){ const gap = bw > 6 ? Math.min(bw * .25, 3) : bw > 2.5 ? .6 : 0; B.forEach((b, i) => s.bar(f.x0 + bw * i + gap / 2, f.y(b.v || 0), Math.max(.6, bw - gap), f.y0 - f.y(b.v || 0), c)); }
      else if(form === "lolly"){ B.forEach((b, i) => { if(!b.v) return; s.add('<path d="M' + xc(i).toFixed(1) + " " + f.y0 + "V" + f.y(b.v).toFixed(1) + '" stroke="' + c + '" stroke-width="' + Math.min(2, Math.max(.6, bw * .3)) + '" opacity=".65"/>'); if(bw > 3) s.add('<circle cx="' + xc(i).toFixed(1) + '" cy="' + f.y(b.v).toFixed(1) + '" r="' + Math.min(4.5, bw * .4).toFixed(1) + '" ' + s.fill(c) + "/>"); }); }
      else if(form === "dots"){ const r = Math.max(1.4, Math.min(4.5, bw * .38)); B.forEach((b, i) => s.add('<circle cx="' + xc(i).toFixed(1) + '" cy="' + f.y(b.v || 0).toFixed(1) + '" r="' + r.toFixed(1) + '" fill="' + c + '" fill-opacity="' + (n > 300 ? .55 : .9) + '"/>')); }
      else {
        const d = form === "steps" ? stepP(pts) : form === "line" && n > 200 ? lin(pts) : smooth(pts);
        if(form === "area" || T.glass){ const id = s.id + "a"; s.defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c + '" stop-opacity="' + (form === "area" ? .4 : .14) + '"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></linearGradient>');
          s.add('<path class="st-a" d="' + d + "L" + pts[n - 1][0].toFixed(1) + " " + f.y0 + "L" + pts[0][0].toFixed(1) + " " + f.y0 + 'Z" fill="url(#' + id + ')"/>'); }
        s.add('<path d="' + d + '" ' + s.stroke(c, n > 400 ? Math.min(T.lw, 1.4) : T.lw) + "/>");
        // the latest value, with a soft halo, where the eye ends up
        const e = pts[n - 1]; if(n > 1) s.add('<circle class="st-d" style="animation-delay:1s" cx="' + e[0].toFixed(1) + '" cy="' + e[1].toFixed(1) + '" r="8" fill="' + c + '" fill-opacity=".18"/><circle class="st-d" style="animation-delay:1s" cx="' + e[0].toFixed(1) + '" cy="' + e[1].toFixed(1) + '" r="3.8" fill="' + c + '" stroke="' + T.surface + '" stroke-width="1.6"/>');
      }
      // the peak, labelled
      if(n > 2){ let pk = 0; B.forEach((b, i) => { if((b.v || 0) > (B[pk].v || 0)) pk = i; });
        if(B[pk].v){ const px = xc(pk), py = f.y(B[pk].v); if(form !== "bars" && form !== "lolly") s.add('<circle class="st-d" style="animation-delay:.9s" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="4.2" fill="' + T.surface + '" stroke="' + c + '" stroke-width="2"/>');
          s.text(Math.max(f.x0 + 34, Math.min(f.x1 - 34, px)), py - 10, "Peak " + fmt(B[pk].v), {a:"middle", c:T.ink, w:700, size:10.5, cls:"st-t"}); } }
      // the average: a rolling mean over a week of days, a month of weeks, a quarter of months
      if(prefs.avg && prefs.group !== "year"){
        const k = {day:7, week:4, month:3}[prefs.group], av = B.map((b, i) => { const w = B.slice(Math.max(0, i - k + 1), i + 1); return measureOf(w.flatMap(x => x.rows)) / (prefs.measure === "perboat" ? 1 : w.length); });
        s.add('<path d="' + smooth(av.map((v, i) => [xc(i), f.y(v || 0)])) + '" ' + s.stroke(T.c[1], Math.max(1.6, T.lw - .4)) + "/>");
        this.legend = legend([[mName()[0].toUpperCase() + mName().slice(1) + " each " + prefs.group, c], ["Average over " + {day:"7 days", week:"4 weeks", month:"3 months"}[prefs.group] + ", now " + fmt(av[n - 1]), T.c[1]]]);
      } else this.legend = "";
      xLabels(s, f, B, xc, b => bLabel(b.k, prefs.group));
      this.pts = B.map((b, i) => ({x:xc(i), y:f.y(b.v || 0), tip:"<b>" + fmt(b.v) + " " + esc(mName()) + "</b>" + esc(bLabel(b.k, prefs.group, true)) + (prefs.measure !== "boats" && b.rows.length ? "<br>" + fmt(sum(b.rows, r => r.boats)) + " boats" : "")}));
      this.mode = "x";
      return s.out("Crossings over time");
    }});

  // 2. Running total by year
  card({id:"rt", full:true, title:"Running total by year", forms:[["lines","Lines"],["vs","This year vs last"],["multi","Small multiples"],["rank","By this date"],["table","Table"]], key:"rt",
    draw(el, T){
      const years = [...new Set(D.map(d => d.date.slice(0, 4)))], cur = last.slice(0, 4), prev = String(+cur - 1), doyLast = doy(last);
      const runs = years.map(y => { const rows = D.filter(d => d.date.slice(0, 4) === y); let acc = [], r = []; rows.forEach(d => { acc.push(d); r.push([doy(d.date), measureOf(acc)]); }); return {y, r, rows}; });
      const atDate = run => { const p = run.r.filter(q => q[0] <= doyLast); return p.length ? p[p.length - 1][1] : 0; };
      const curRun = runs.find(r => r.y === cur), prevRun = runs.find(r => r.y === prev);
      this.read = [fmt(atDate(curRun)), mName() + " in " + cur + " by " + dShort.format(parse(last)) + (prevRun ? " · " + fmt(atDate(prevRun)) + " in " + prev : "")];
      const form = prefs.rt, colY = y => y === cur ? T.c[0] : y === prev ? T.c[1] : T.muted;
      this.legend = form === "table" || form === "multi" ? "" : legend([[cur + " so far", T.c[0]], [prev, T.c[1]]].concat(form === "lines" ? [["2018–" + String(+prev - 1).slice(2), T.muted]] : []));
      if(form === "table") return table(["Year", "By " + dShort.format(parse(last)), "Whole year"], runs.slice().reverse().map(r => [r.y, fmt(atDate(r)), r.y === cur ? "–" : fmt(r.r[r.r.length - 1][1])]));
      const W = width(el);
      if(form === "rank"){
        const rk = runs.map(r => ({y:r.y, v:atDate(r)})).sort((a, b) => b.v - a.v), rowH = 24, H = rk.length * rowH + 8, s = new Svg(W, H, T), max = Math.max(...rk.map(r => r.v), 1), L = 44, R = 60;
        rk.forEach((r, i) => { const y = 4 + i * rowH, w = (W - L - R) * r.v / max; s.text(L - 8, y + rowH / 2 + 4, r.y, {a:"end", c:r.y === cur ? T.ink : T.ink2, w:r.y === cur ? 700 : 500}); s.bar(L, y + 4, w, rowH - 8, r.y === cur ? T.c[0] : r.y === prev ? T.c[1] : T.muted, {hor:true}); s.text(L + w + 6, y + rowH / 2 + 4, fmt(r.v), {c:T.ink, w:600}); });
        this.pts = rk.map((r, i) => ({x:W / 2, y:4 + i * rowH + rowH / 2, tip:"<b>" + fmt(r.v) + " " + esc(mName()) + "</b>" + r.y + " by " + esc(dShort.format(parse(last))) + (r.y === cur ? "" : ", #" + (i + 1))}));
        this.mode = "y"; return s.out("Each year by this date");
      }
      if(form === "multi"){
        const cols = W > 640 ? 3 : 2, cw = W / cols, ch = 92, rws = Math.ceil(runs.length / cols), H = rws * (ch + 12), s = new Svg(W, H, T), max = Math.max(...runs.map(r => r.r.length ? Math.max(...r.r.map(q => q[1] || 0)) : 0), 1);
        this.pts = [];
        runs.slice().reverse().forEach((run, i) => {
          const ox = (i % cols) * cw, oy = Math.floor(i / cols) * (ch + 12), x = d => ox + 6 + (cw - 16) * (d - 1) / 365, y = v => oy + ch - 6 - (ch - 34) * (v || 0) / max, c = colY(run.y) === T.muted ? T.c[3] : colY(run.y);
          s.add('<rect x="' + (ox + 2) + '" y="' + oy + '" width="' + (cw - 6) + '" height="' + ch + '" rx="12" fill="' + T.grid + '" fill-opacity=".25"/>');
          s.text(ox + 12, oy + 18, run.y, {c:T.ink, w:700, size:12}); const tot = run.r.length ? run.r[run.r.length - 1][1] : 0; s.text(ox + cw - 12, oy + 18, kfmt(tot), {a:"end", size:11});
          const p = run.r.map(q => [x(q[0]), y(q[1])]);
          if(p.length){ s.add('<path d="' + lin(p) + "L" + p[p.length - 1][0].toFixed(1) + " " + (oy + ch - 6) + "L" + p[0][0].toFixed(1) + " " + (oy + ch - 6) + 'Z" fill="' + c + '" fill-opacity=".14"/>'); s.add('<path d="' + lin(p) + '" ' + s.stroke(c, 1.6) + "/>"); }
          this.pts.push({x:ox + cw / 2, y:oy + ch / 2, tip:"<b>" + fmt(tot) + " " + esc(mName()) + "</b>" + run.y + (run.y === cur ? " so far" : "")});
        });
        this.mode = "xy"; return s.out("Running total, one panel a year");
      }
      const H = hFor(W, 300), s = new Svg(W, H, T);
      const show = form === "vs" ? runs.filter(r => r.y === cur || r.y === prev) : runs;
      const max = Math.max(1, ...show.map(r => Math.max(...r.r.map(q => q[1] || 0)))), f = frame(s, max, {right:44});
      const x = d => f.x0 + (f.x1 - f.x0) * (d - 1) / 365;
      MON.forEach((m, i) => { if(W < 420 && i % 2) return; s.text(x(doy("2001-" + String(i + 1).padStart(2, "0") + "-15")), f.y0 + 16, m, {a:"middle"}); });
      const ends = [];
      show.slice().sort((a, b) => (a.y === cur) - (b.y === cur) || (a.y === prev) - (b.y === prev)).forEach(run => {
        const p = run.r.map(q => [x(q[0]), f.y(q[1] || 0)]); if(!p.length) return; const c = colY(run.y), hi = run.y === cur || run.y === prev;
        if(form === "vs"){ const id = s.id + "v" + run.y; s.defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c + '" stop-opacity=".3"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></linearGradient>');
          s.add('<path class="st-a" d="' + stepP(p) + "V" + f.y0 + "H" + p[0][0].toFixed(1) + 'Z" fill="url(#' + id + ')"/>'); }
        s.add('<path d="' + stepP(p) + '" ' + (hi ? s.stroke(c, T.lw + (run.y === cur ? .6 : 0)) : 'class="st-l" pathLength="1" fill="none" stroke="' + c + '" stroke-width="1"') + "/>");
        const e = p[p.length - 1]; ends.push({x:e[0], y:e[1], run, hi, c});
      });
      // the year at the end of each line, nudged apart so none print on top of each other
      ends.sort((a, b) => a.y - b.y);
      ends.forEach((e, i) => { e.ly = Math.max(e.y, i ? ends[i - 1].ly + 11 : f.y1); });
      for(let i = ends.length - 1, lim = f.y0 + 2; i >= 0; i--){ ends[i].ly = Math.min(ends[i].ly, lim); lim = ends[i].ly - 11; }
      ends.forEach(e => { if(e.run.y === cur) s.add('<circle class="st-d" style="animation-delay:1s" cx="' + e.x.toFixed(1) + '" cy="' + e.y.toFixed(1) + '" r="4" fill="' + e.c + '" stroke="' + T.surface + '" stroke-width="1.6"/>');
        s.text(Math.min(e.x + 6, f.x1 + 4), e.ly + 3.5, e.run.y, {c:e.hi ? T.ink : T.ink2, w:e.hi ? 700 : 500, size:10, cls:"st-t"}); });
      this.pts = []; for(let d = 1; d <= 366; d += 3){ const vals = show.map(r => { const p = r.r.filter(q => q[0] <= d); return [r.y, p.length ? p[p.length - 1][1] : 0]; });
        const cv = vals.find(v => v[0] === cur); this.pts.push({x:x(d), y:f.y(cv && d <= doyLast ? cv[1] : (vals.find(v => v[0] === prev) || [0, 0])[1]), tip:"<b>" + esc(dShort.format(new Date(Date.UTC(2001, 0, d, 12)))) + "</b>" + vals.filter(v => v[0] === cur || v[0] === prev || form === "vs").slice().reverse().map(v => esc(v[0]) + ": " + fmt(v[0] === cur && d > doyLast ? null : v[1])).join("<br>")}); }
      this.mode = "x"; return s.out("Running total by year");
    }});
  function doy(s){ const d = parse(s); return Math.round((d - Date.UTC(d.getUTCFullYear(), 0, 1, 12)) / 864e5) + 1; }

  // 3. A year, day by day
  card({id:"cal", full:true, title:"A year, day by day", forms:[["calendar","Calendar"],["radial","Clock"],["stripes","Stripes"],["table","By month"]], key:"cal",
    opts(){ const ys = [...new Set(D.map(d => d.date.slice(0, 4)))].reverse(); return '<div class="seg" role="group" aria-label="Year">' + ys.slice(0, 6).map(y => '<button type="button" data-k="calY" data-v="' + y + '" aria-pressed="' + (String(prefs.calY || ys[0]) === y) + '">' + y + "</button>").join("") + "</div>"; },
    draw(el, T){
      const y = String(prefs.calY || last.slice(0, 4)), rows = D.filter(d => d.date.slice(0, 4) === y), val = r => measureOf([r]);
      const br = {people:[1, 100, 300, 600], boats:[1, 3, 8, 15], perboat:[1, 45, 55, 65]}[prefs.measure];
      const lvl = v => v == null || !v ? -1 : br.filter(b => v >= b).length - 1, col = v => { const l = lvl(v); return l < 0 ? T.grid : T.seq[Math.min(4, l + 1)]; };
      this.read = [fmt(measureOf(rows)), mName() + " in " + y + (y === last.slice(0, 4) ? " so far" : "")];
      this.legend = legend([["None", T.grid]].concat(br.map((b, i) => [(i === 3 ? b + "+" : b + "–" + (br[i + 1] - 1)), T.seq[i + 1]])));
      if(prefs.cal === "table"){ const ms = bucket(rows, "month"); return table(["Month", mName()[0].toUpperCase() + mName().slice(1), "Busiest day"], ms.map(m => { const top = m.rows.reduce((a, b) => (val(b) || 0) > (val(a) || 0) ? b : a); return [bLabel(m.k, "month", true), fmt(m.v), val(top) ? dShort.format(parse(top.date)) + " (" + fmt(val(top)) + ")" : "–"]; })); }
      const W = width(el), tip = r => "<b>" + (val(r) ? fmt(val(r)) + " " + esc(mName()) : "None detected") + "</b>" + esc(dLong.format(parse(r.date))) + (prefs.measure === "people" && r.boats ? "<br>" + fmt(r.boats) + " boats" : "");
      this.pts = [];
      if(prefs.cal === "stripes"){
        const H = 150, s = new Svg(W, H, T), w = (W - 4) / 366;
        rows.forEach(r => { const x = 2 + (doy(r.date) - 1) * w; s.add('<rect x="' + x.toFixed(2) + '" y="0" width="' + (w + .4).toFixed(2) + '" height="' + (H - 22) + '" fill="' + col(val(r)) + '"/>'); this.pts.push({x:x + w / 2, y:(H - 22) / 2, tip:tip(r)}); });
        MON.forEach((m, i) => s.text(2 + (doy(y + "-" + String(i + 1).padStart(2, "0") + "-01") - 1) * w, H - 6, W < 420 && i % 2 ? "" : m));
        this.mode = "x"; return s.out(y + ", one stripe a day");
      }
      if(prefs.cal === "radial"){
        const S = Math.min(W, 420), s = new Svg(W, S, T), cx = W / 2, cy = S / 2, r0 = S * .18, r1 = S / 2 - 22, mx = Math.max(1, ...rows.map(r => val(r) || 0)), da = 2 * Math.PI / 366;
        s.add('<circle cx="' + cx + '" cy="' + cy + '" r="' + r0 + '" fill="none" stroke="' + T.grid + '"/>');
        rows.forEach(r => { const a = (doy(r.date) - 1) * da, v = val(r) || 0, len = v ? 4 + (r1 - r0 - 4) * Math.sqrt(v / mx) : 1.5;
          s.add('<path d="M' + (cx + r0 * Math.sin(a)).toFixed(1) + " " + (cy - r0 * Math.cos(a)).toFixed(1) + "L" + (cx + (r0 + len) * Math.sin(a)).toFixed(1) + " " + (cy - (r0 + len) * Math.cos(a)).toFixed(1) + '" stroke="' + (v ? col(v) : T.grid) + '" stroke-width="' + Math.max(1, S / 300).toFixed(1) + '" stroke-linecap="round"/>');
          this.pts.push({x:cx + (r0 + len) * Math.sin(a), y:cy - (r0 + len) * Math.cos(a), tip:tip(r)}); });
        MON.forEach((m, i) => { const a = (doy(y + "-" + String(i + 1).padStart(2, "0") + "-15") - 1) * da; s.text(cx + (r1 + 12) * Math.sin(a), cy - (r1 + 12) * Math.cos(a) + 4, m, {a:"middle", size:10}); });
        s.text(cx, cy - 2, kfmt(measureOf(rows)), {a:"middle", c:T.ink, w:700, size:Math.round(S / 16)}); s.text(cx, cy + 16, y, {a:"middle"});
        this.mode = "xy"; return s.out(y + ", the year as a clock");
      }
      if(W < 560){
        const cols = W < 280 ? 2 : 3, mw = W / cols, pitch = Math.min(18, (mw - 10) / 7), cell = pitch - (pitch > 10 ? 2 : 1.5), mh = 18 + 6 * pitch + 10, rr = Math.min(T.r, cell * .3);
        const s = new Svg(W, Math.ceil(12 / cols) * mh, T), byDate = {}; rows.forEach(r => byDate[r.date] = r);
        MON.forEach((m, i) => {
          const ox = (i % cols) * mw, oy = Math.floor(i / cols) * mh, mm = String(i + 1).padStart(2, "0"), f = parse(y + "-" + mm + "-01"), o = (f.getUTCDay() + 6) % 7, days = new Date(Date.UTC(+y, i + 1, 0)).getUTCDate();
          s.text(ox, oy + 11, m, {c:T.ink, w:600, size:11});
          for(let d = 1; d <= days; d++){ const n = d - 1 + o, x = ox + (n % 7) * pitch, yy = oy + 18 + Math.floor(n / 7) * pitch, r = byDate[y + "-" + mm + "-" + String(d).padStart(2, "0")];
            s.add('<rect class="st-d"' + s.delay(i / 12) + ' x="' + x.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + cell.toFixed(1) + '" height="' + cell.toFixed(1) + '" rx="' + rr.toFixed(1) + '" fill="' + (r ? col(val(r)) : T.grid) + '"' + (r ? "" : ' fill-opacity=".35"') + "/>");
            if(r) this.pts.push({x:x + cell / 2, y:yy + cell / 2, tip:tip(r)}); }
        });
        this.mode = "xy"; return s.out(y + ", month by month");
      }
      const first = parse(y + "-01-01"), off = (first.getUTCDay() + 6) % 7, wk = Math.ceil((366 + off) / 7), L = 30, cell = Math.max(6, Math.min(24, (W - L) / wk - (W > 900 ? 4 : 2))), gap = cell > 18 ? 4 : cell > 9 ? 2.5 : 1.5;
      const H = 7 * (cell + gap) + 22, s = new Svg(W, H, T), rr = Math.min(T.r, cell * .3);
      ["Mon","","Wed","","Fri","","Sun"].forEach((d, i) => d && s.text(0, 18 + i * (cell + gap) + cell / 2 + 3.5, d, {size:9.5}));
      // the days still to come this year, as faint empty squares, so the year reads as a whole
      const days = new Date(Date.UTC(+y, 1, 29)).getUTCMonth() === 1 ? 366 : 365;
      for(let d = rows.length ? doy(rows[rows.length - 1].date) + 1 : 1; d <= days; d++){ const n = d - 1 + off; s.add('<rect x="' + (L + Math.floor(n / 7) * (cell + gap)).toFixed(1) + '" y="' + (18 + (n % 7) * (cell + gap)).toFixed(1) + '" width="' + cell.toFixed(1) + '" height="' + cell.toFixed(1) + '" rx="' + rr.toFixed(1) + '" fill="' + T.grid + '" fill-opacity=".3"/>'); }
      rows.forEach(r => { const n = doy(r.date) - 1 + off, x = L + Math.floor(n / 7) * (cell + gap), yy = 18 + (n % 7) * (cell + gap);
        s.add('<rect class="st-d"' + s.delay(x / W) + ' x="' + x.toFixed(1) + '" y="' + yy.toFixed(1) + '" width="' + cell.toFixed(1) + '" height="' + cell.toFixed(1) + '" rx="' + rr.toFixed(1) + '" fill="' + col(val(r)) + '"/>'); this.pts.push({x:x + cell / 2, y:yy + cell / 2, tip:tip(r)}); });
      MON.forEach((m, i) => { const n = doy(y + "-" + String(i + 1).padStart(2, "0") + "-01") - 1 + off; if(W < 420 && i % 2) return; s.text(L + Math.floor(n / 7) * (cell + gap), 10, m, {size:10}); });
      this.mode = "xy"; return s.out(y + ", in squares");
    }});

  // 4. Patterns: the week and the year
  card({id:"pat", title:"Patterns", forms:[["bars","Bars"],["rose","Rose"],["lolly","Dot plot"],["table","Table"]], key:"patF",
    opts(){ return seg("pat", [["dow","Day of week"],["month","Month"]]); },
    draw(el, T){
      const rows = D.filter(d => d.date >= "2020-01-01"), byDow = prefs.pat === "dow", names = byDow ? DOW : MON;
      const groups = names.map(() => []); rows.forEach(r => { const d = parse(r.date); groups[byDow ? (d.getUTCDay() + 6) % 7 : d.getUTCMonth()].push(r); });
      const vals = groups.map(g => g.length ? measureOf(g) / (prefs.measure === "perboat" ? 1 : g.length) : 0), mi = vals.indexOf(Math.max(...vals));
      this.read = [byDow ? ["Mondays","Tuesdays","Wednesdays","Thursdays","Fridays","Saturdays","Sundays"][mi] : ["January","February","March","April","May","June","July","August","September","October","November","December"][mi], "busiest, " + fmt(vals[mi]) + " " + mName() + (prefs.measure === "perboat" ? "" : " a day") + " on average since 2020"];
      this.legend = "";
      if(prefs.patF === "table") return table([byDow ? "Day" : "Month", (prefs.measure === "perboat" ? "People a boat" : mName()[0].toUpperCase() + mName().slice(1) + " a day")], names.map((n, i) => [n, fmt(vals[i])]));
      const W = width(el), cAt = i => i === mi ? T.c[1] : T.c[0];
      if(prefs.patF === "rose"){
        const S = Math.min(W, 340), s = new Svg(W, S, T), cx = W / 2, cy = S / 2, R = S / 2 - 24, mx = Math.max(...vals, 1), da = 2 * Math.PI / names.length;
        [.5, 1].forEach(k => s.add('<circle cx="' + cx + '" cy="' + cy + '" r="' + (R * Math.sqrt(k)).toFixed(1) + '" fill="none" stroke="' + T.grid + '"/>'));
        this.pts = vals.map((v, i) => { const r = R * Math.sqrt(v / mx), a0 = i * da + .02, a1 = (i + 1) * da - .02;
          s.add('<path class="st-d"' + s.delay(i / names.length) + ' d="' + arc(cx, cy, 0, Math.max(r, 1), a0, a1) + '" ' + s.fill(cAt(i)) + "/>");
          s.text(cx + (R + 13) * Math.sin(i * da + da / 2), cy - (R + 13) * Math.cos(i * da + da / 2) + 4, names[i], {a:"middle", size:10.5, c:i === mi ? T.ink : T.ink2, w:i === mi ? 700 : 500});
          return {x:cx + r * .7 * Math.sin(i * da + da / 2), y:cy - r * .7 * Math.cos(i * da + da / 2), tip:"<b>" + fmt(v) + "</b>" + esc(names[i]) + ", on average"}; });
        this.mode = "xy"; return s.out("Patterns as a rose");
      }
      const H = hFor(W, 240), s = new Svg(W, H, T), f = frame(s, Math.max(...vals, 1), {left:34}), bw = (f.x1 - f.x0) / names.length, xc = i => f.x0 + bw * (i + .5);
      vals.forEach((v, i) => {
        if(prefs.patF === "lolly"){ s.add('<path d="M' + xc(i).toFixed(1) + " " + f.y0 + "V" + f.y(v).toFixed(1) + '" stroke="' + T.grid + '" stroke-width="2"/>'); s.add('<circle cx="' + xc(i).toFixed(1) + '" cy="' + f.y(v).toFixed(1) + '" r="6" ' + s.fill(cAt(i)) + "/>"); }
        else s.bar(xc(i) - bw * .32, f.y(v), bw * .64, f.y0 - f.y(v), cAt(i));
        s.text(xc(i), f.y(v) - 9, fmt(v), {a:"middle", c:i === mi ? T.ink : T.ink2, w:i === mi ? 700 : 500, size:10.5});
        s.text(xc(i), f.y0 + 16, names[i], {a:"middle"});
      });
      this.pts = vals.map((v, i) => ({x:xc(i), y:f.y(v), tip:"<b>" + fmt(v) + "</b>" + esc(names[i]) + ", on average since 2020"})); this.mode = "x";
      return s.out("Patterns");
    }});

  // 5. Year by year
  card({id:"yr", title:"Year by year", forms:[["bars","Columns"],["hbars","Bars"],["people","Pictogram"],["table","Table"]], key:"yr",
    draw(el, T){
      const cur = last.slice(0, 4), B = bucket(D, "year"), prevB = B.find(b => b.k === String(+cur - 1)), curB = B.find(b => b.k === cur);
      this.read = [fmt(curB && curB.v), mName() + " in " + cur + " so far" + (prevB ? ", against " + fmt(prevB.v) + " in all of " + prevB.k : "")];
      this.legend = legend([["Whole year", T.c[0]], [cur + " so far", T.c[1]]]);
      if(prefs.yr === "table") return table(["Year", mName()[0].toUpperCase() + mName().slice(1), "Change"], B.slice().reverse().map((b, i, a) => [b.k + (b.k === cur ? " (so far)" : ""), fmt(b.v), a[i + 1] && b.k !== cur && a[i + 1].v ? (b.v >= a[i + 1].v ? "+" : "") + Math.round((b.v / a[i + 1].v - 1) * 100) + "%" : "–"]));
      const W = width(el), col = b => b.k === cur ? T.c[1] : T.c[0], max = Math.max(...B.map(b => b.v || 0), 1);
      if(prefs.yr === "hbars" || prefs.yr === "people"){
        const pic = prefs.yr === "people", unit = prefs.measure === "perboat" ? 1 : niceTicks(max / 40, 1).list[1] || 1, rowH = pic ? 30 : 26, L = 42, s = new Svg(W, B.length * rowH + (pic ? 24 : 6), T);
        this.pts = B.map((b, i) => { const y = 3 + i * rowH;
          s.text(L - 8, y + rowH / 2 + 4, b.k, {a:"end", c:b.k === cur ? T.ink : T.ink2, w:b.k === cur ? 700 : 500});
          if(pic){ const n = Math.round((b.v || 0) / unit), per = Math.floor((W - L - 50) / 11), sz = Math.min(9, (W - L - 50) / Math.max(per, 1) - 2);
            for(let j = 0; j < Math.min(n, per * 2); j++) s.add('<circle cx="' + (L + 5 + (j % per) * (sz + 2.2)).toFixed(1) + '" cy="' + (y + (j < per ? 9 : 19)).toFixed(1) + '" r="' + (sz / 2).toFixed(1) + '" fill="' + col(b) + '"/>');
            s.text(L + 5 + Math.min(n, per) * (sz + 2.2) + 4, y + 13, fmt(b.v), {c:T.ink, w:600, size:10.5}); }
          else { const w = (W - L - 56) * (b.v || 0) / max; s.bar(L, y + 4, w, rowH - 8, col(b), {hor:true}); s.text(L + w + 6, y + rowH / 2 + 4, fmt(b.v), {c:T.ink, w:600}); }
          return {x:W / 2, y:y + rowH / 2, tip:"<b>" + fmt(b.v) + " " + esc(mName()) + "</b>" + b.k + (b.k === cur ? " so far" : "")}; });
        if(pic) s.text(L, B.length * rowH + 18, "Each dot is " + fmt(unit) + " " + (prefs.measure === "boats" ? (unit === 1 ? "boat" : "boats") : unit === 1 ? "person" : "people"), {size:10.5});
        this.mode = "y"; return s.out("Year by year");
      }
      const H = hFor(W, 260), s = new Svg(W, H, T), f = frame(s, max), bw = (f.x1 - f.x0) / B.length, xc = i => f.x0 + bw * (i + .5);
      B.forEach((b, i) => { s.bar(xc(i) - bw * .32, f.y(b.v || 0), bw * .64, f.y0 - f.y(b.v || 0), col(b)); s.text(xc(i), f.y0 + 16, W < 420 ? "’" + b.k.slice(2) : b.k, {a:"middle"}); if(W > 380) s.text(xc(i), f.y(b.v || 0) - 7, kfmt(b.v), {a:"middle", size:10, c:T.ink, w:600}); });
      this.pts = B.map((b, i) => ({x:xc(i), y:f.y(b.v || 0), tip:"<b>" + fmt(b.v) + " " + esc(mName()) + "</b>" + b.k + (b.k === cur ? " so far" : "")})); this.mode = "x";
      return s.out("Year by year");
    }});

  // 6. People per boat, year by year: the year's people over its boats (perboat.json)
  card({id:"pb", title:"People per boat", forms:[["line","Line"],["bars","Columns"],["seats","One boat"],["table","Table"]], key:"pb", people:true,
    draw(el, T){
      if(!perBoat) return '<p class="st-note">These figures are still loading.</p>';
      const Y = perBoat.years, part = perBoat.partialYear, l90 = perBoat.last90, first = Y[0], lab = y => y.y + (y.y === part ? " so far" : "");
      this.read = [fmt(l90.avg), "people a boat over the last 90 days, against " + fmt(first.avg) + " in " + first.y];
      this.legend = prefs.pb === "table" ? "" : legend([["Whole year", T.c[0]], [part + " so far", T.c[1]]].concat(prefs.pb === "line" ? [["Last 90 days", T.ink2]] : []));
      if(prefs.pb === "table") return table(["Year", "People a boat", "People", "Boats"], Y.slice().reverse().map(y => [lab(y), fmt(y.avg), fmt(y.people), fmt(y.boats)]));
      const W = width(el), col = y => y.y === part ? T.c[1] : T.c[0], tip = y => "<b>" + fmt(y.avg) + " people a boat</b>" + esc(lab(y)) + "<br>" + fmt(y.people) + " people in " + fmt(y.boats) + " boats";
      if(prefs.pb === "seats"){   // each year as one boat: a dot for every person in the average boat, in rows of ten
        const L = 48, gap = 2.5, sz = W < 420 ? 6 : 7.5, step = sz + gap, across = Math.max(5, Math.min(20, Math.floor((W - L - 34) / step / 5) * 5));
        let y0 = 2; const rows = Y.map(y => { const n = Math.ceil(y.avg / across), r = {y, top:y0, h:n * step - gap}; y0 += r.h + 12; return r; });
        const s = new Svg(W, y0, T); this.pts = [];
        rows.forEach(r => { s.text(L - 10, r.top + Math.min(r.h, sz) / 2 + 4, r.y.y, {a:"end", c:r.y.y === part ? T.ink : T.ink2, w:r.y.y === part ? 700 : 500});
          for(let j = 0; j < r.y.avg; j++) s.add('<circle cx="' + (L + (j % across) * step + sz / 2).toFixed(1) + '" cy="' + (r.top + Math.floor(j / across) * step + sz / 2).toFixed(1) + '" r="' + (sz / 2).toFixed(1) + '" fill="' + col(r.y) + '"/>');
          s.text(L + Math.min(r.y.avg, across) * step + 6, r.top + Math.min(r.h, sz) / 2 + 4, fmt(r.y.avg), {c:T.ink, w:600});
          this.pts.push({x:W / 2, y:r.top + r.h / 2, tip:tip(r.y)}); });
        this.mode = "y"; return s.out("People per boat, a dot a person");
      }
      const H = hFor(W, 260), s = new Svg(W, H, T), max = Math.max(...Y.map(y => y.avg), l90.avg, 1), f = frame(s, max), bw = (f.x1 - f.x0) / Y.length, xc = i => f.x0 + bw * (i + .5);
      if(prefs.pb === "bars") Y.forEach((y, i) => { s.bar(xc(i) - bw * .32, f.y(y.avg), bw * .64, f.y0 - f.y(y.avg), col(y)); s.text(xc(i), f.y(y.avg) - 7, fmt(y.avg), {a:"middle", size:10, c:T.ink, w:600}); });
      else {
        const p = Y.map((y, i) => [xc(i), f.y(y.avg)]), id = s.id + "pa";
        s.defs.push('<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + T.c[0] + '" stop-opacity=".22"/><stop offset="1" stop-color="' + T.c[0] + '" stop-opacity="0"/></linearGradient>');
        s.add('<path class="st-a" d="' + smooth(p) + "L" + p[p.length - 1][0].toFixed(1) + " " + f.y0 + "L" + p[0][0].toFixed(1) + " " + f.y0 + 'Z" fill="url(#' + id + ')"/>');
        s.add('<path d="' + smooth(p) + '" ' + s.stroke(T.c[0]) + "/>");
        const y90 = f.y(l90.avg); s.add('<path d="M' + f.x0 + " " + y90.toFixed(1) + "H" + f.x1 + '" stroke="' + T.ink2 + '" stroke-width="1" stroke-dasharray="3 4"/>');
        s.text(f.x0 + 4, y90 - 6, "Last 90 days: " + fmt(l90.avg), {size:10});
        Y.forEach((y, i) => { s.add('<circle class="st-d"' + s.delay(i / Y.length + .5) + ' cx="' + p[i][0].toFixed(1) + '" cy="' + p[i][1].toFixed(1) + '" r="' + (y.y === part ? 5 : 3.5) + '" fill="' + col(y) + '" stroke="' + T.surface + '" stroke-width="1.5"/>'); if(W > 380 || i % 2 === 0 || i === Y.length - 1) s.text(p[i][0], p[i][1] - 10, fmt(y.avg), {a:"middle", size:10, c:T.ink, w:600}); });
      }
      Y.forEach((y, i) => s.text(xc(i), f.y0 + 16, W < 420 ? "’" + y.y.slice(2) : y.y, {a:"middle"}));
      this.pts = Y.map((y, i) => ({x:xc(i), y:f.y(y.avg), tip:tip(y)})); this.mode = "x";
      return s.out("People per boat, year by year");
    }});

  // 7. Who is crossing: sex and age
  card({id:"who", title:"Sex and age", forms:[["waffle","Squares"],["hbars","Bars"],["donut","Rings"],["table","Table"]], key:"whoF", people:true,
    opts(){ return seg("who", [["lastYear","Last 12 months"],["since2018","Since 2018"]]); },
    draw(el, T){
      if(!gender) return '<p class="st-note">These figures are still loading.</p>';
      const g = gender[prefs.who] || gender.lastYear, sx = [["Men and boys", g.sex.Male, T.c[0]], ["Women and girls", g.sex.Female, T.c[1]], ["Not recorded", g.sex.Unknown, T.muted]];
      const ages = Object.entries(g.age).map(([k, v], i) => [k, v, k === "Unknown" ? T.muted : mix(T.surface, T.c[2], [.4, .6, .8, 1][Math.min(3, i)])]);
      this.read = [Math.round(g.adultMen / g.total * 100) + "%", "were adult men, " + (prefs.who === "lastYear" ? gender.period : "since 2018") + " (" + fmt(g.total) + " people)"];
      this.legend = prefs.whoF === "table" ? "" : legend(sx.map(x => [x[0], x[2]])) + legend(ages.map(x => [x[0] === "Unknown" ? "Age not recorded" : x[0], x[2]]));
      if(prefs.whoF === "table") return table(["Group", "People", "Share"], sx.concat(ages).map(x => [x[0], fmt(x[1]), (x[1] / g.total * 100).toFixed(1) + "%"]));
      return parts(el, T, [["By sex", sx], ["By age", ages]], g.total, prefs.whoF, this);
    }});

  // 8. Nationalities
  card({id:"nat", title:"Nationalities", forms:[["hbars","Bars"],["tree","Treemap"],["donut","Ring"],["waffle","Squares"],["table","Table"]], key:"nat", people:true,
    draw(el, T){
      if(!nats) return '<p class="st-note">These figures are still loading.</p>';
      const items = nats.top.map((n, i) => [n.name, n.n, T.c[i % 6]]).concat(nats.other ? [["Everyone else", nats.other, T.muted]] : []);
      this.read = [nats.top[0].name, "the largest group, " + nats.top[0].pc + "% of " + fmt(nats.total) + " people, " + nats.period];
      this.legend = prefs.nat === "table" || prefs.nat === "hbars" ? "" : legend(items.map(x => [x[0], x[2]]));
      if(prefs.nat === "table") return table(["Nationality", "People", "Share"], items.map(x => [x[0], fmt(x[1]), (x[1] / nats.total * 100).toFixed(1) + "%"]));
      return parts(el, T, [[null, items]], nats.total, prefs.nat, this);
    }});

  // 9. The UK–France returns deal, month by month
  card({id:"ret", title:"UK–France returns deal", forms:[["bars","Side by side"],["mirror","Mirror"],["line","Lines"],["table","Table"]], key:"ret", people:true,
    draw(el, T){
      if(!rets) return '<p class="st-note">These figures are still loading.</p>';
      const M = rets.months, lab = m => MON[+m.month.slice(5) - 1] + " ’" + m.month.slice(2, 4);
      this.read = [fmt(rets.out), "returned to France and " + fmt(rets.in) + " transferred to the UK, to " + dLong.format(parse(rets.to))];
      this.legend = prefs.ret === "table" ? "" : legend([["Returned to France", T.c[0]], ["Transferred to the UK", T.c[1]]]);
      if(prefs.ret === "table") return table(["Month", "Returned", "Transferred"], M.slice().reverse().map(m => [lab(m), fmt(m.out), fmt(m.in)]));
      const W = width(el), H = hFor(W, 260), s = new Svg(W, H, T), max = Math.max(...M.map(m => Math.max(m.in, m.out)), 1), mir = prefs.ret === "mirror";
      let f, xc, bw;
      if(mir){ const mid = (H - 22) / 2, t = niceTicks(max, 2); f = {x0:36, x1:W - 6, y0:H - 22}; bw = (f.x1 - f.x0) / M.length; xc = i => f.x0 + bw * (i + .5);
        const ys = v => (mid - 6) * v / t.top;
        [-t.top, -t.top / 2, 0, t.top / 2, t.top].forEach(v => { const y = mid - ys(v); s.add('<path d="M' + f.x0 + " " + y.toFixed(1) + "H" + f.x1 + '" stroke="' + T.grid + '" stroke-width="' + (v ? .6 : 1) + '"/>'); s.text(f.x0 - 8, y + 3.5, kfmt(Math.abs(v)), {a:"end"}); });
        M.forEach((m, i) => { s.bar(xc(i) - bw * .3, mid - ys(m.out), bw * .6, ys(m.out), T.c[0]); s.bar(xc(i) - bw * .3, mid, bw * .6, ys(m.in), T.c[1], {down:true}); });
        s.text(f.x1, 12, "Returned ↑", {a:"end", size:10}); s.text(f.x1, H - 28, "Transferred ↓", {a:"end", size:10});
        M.forEach((m, i) => { if(i % Math.ceil(M.length / Math.max(2, Math.floor(W / 64)))) return; s.text(xc(i), H - 6, lab(m), {a:"middle", size:10}); });
      } else {
        f = frame(s, max); bw = (f.x1 - f.x0) / M.length; xc = i => f.x0 + bw * (i + .5);
        if(prefs.ret === "line") [["out", T.c[0]], ["in", T.c[1]]].forEach(([k, c]) => { const p = M.map((m, i) => [xc(i), f.y(m[k])]); s.add('<path d="' + smooth(p) + '" ' + s.stroke(c) + "/>"); p.forEach(q => s.add('<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="3" fill="' + c + '"/>')); });
        else M.forEach((m, i) => { const w = bw * .32; s.bar(xc(i) - w - 1, f.y(m.out), w, f.y0 - f.y(m.out), T.c[0]); s.bar(xc(i) + 1, f.y(m.in), w, f.y0 - f.y(m.in), T.c[1]); });
        xLabels(s, f, M, xc, lab);
      }
      this.pts = M.map((m, i) => ({x:xc(i), y:H / 2, tip:"<b>" + esc(lab(m)) + "</b>Returned: " + fmt(m.out) + "<br>Transferred: " + fmt(m.in)})); this.mode = "x";
      return s.out("UK–France returns, month by month");
    }});

  // shares of a whole, as squares, bars, rings or a treemap
  function parts(el, T, groups, total, form, cardO){
    const W = width(el); cardO.pts = []; cardO.mode = "xy";
    if(form === "hbars"){
      const rowH = W > 520 ? 36 : 26, L = Math.min(150, W * .36), n = groups.reduce((a, g) => a + g[1].length + (g[0] ? 1 : 0), 0), s = new Svg(W, n * rowH + 4, T); let y = 2;
      groups.forEach(([h, items]) => { if(h){ s.text(0, y + 17, h, {c:T.ink, w:600, size:11.5}); y += rowH; } const mx = Math.max(...items.map(x => x[1]));
        items.forEach(([k, v, c]) => { const w = (W - L - 56) * v / mx; s.text(L - 8, y + rowH / 2 + 4, k, {a:"end"}); const bh = Math.min(rowH - 10, 20); s.bar(L, y + (rowH - bh) / 2, w, bh, c, {hor:true}); s.text(L + w + 6, y + rowH / 2 + 4, (v / total * 100).toFixed(0) + "%", {c:T.ink, w:600});
          cardO.pts.push({x:L + w / 2, y:y + rowH / 2, tip:"<b>" + fmt(v) + "</b>" + esc(k) + ", " + (v / total * 100).toFixed(1) + "%"}); y += rowH; }); });
      cardO.mode = "y"; return s.out("Shares as bars");
    }
    if(form === "donut"){
      const per = Math.min(W / groups.length, 300), S = per, s = new Svg(W, S + (groups[0][0] ? 18 : 0), T);
      groups.forEach(([h, items], gi) => { const cx = (W - per * groups.length) / 2 + per * (gi + .5), cy = S / 2, r1 = S / 2 - 12, r0 = r1 * .62, tot = sum(items, x => x[1]); let a = 0;
        items.forEach(([k, v, c]) => { const da = 2 * Math.PI * v / tot; if(da > .002){ s.add('<path class="st-d"' + s.delay(a / 2 / Math.PI) + ' d="' + arc(cx, cy, r0, r1, a + .012, a + da - .012) + '" ' + s.fill(c) + "/>"); cardO.pts.push({x:cx + (r0 + r1) / 2 * Math.sin(a + da / 2), y:cy - (r0 + r1) / 2 * Math.cos(a + da / 2), tip:"<b>" + fmt(v) + "</b>" + esc(k) + ", " + (v / tot * 100).toFixed(1) + "%"}); } a += da; });
        s.text(cx, cy + 2, (items[0][1] / tot * 100).toFixed(0) + "%", {a:"middle", c:T.ink, w:700, size:Math.round(r0 / 2.6)}); s.text(cx, cy + r0 / 2.6, items[0][0], {a:"middle", size:10});
        if(h) s.text(cx, S + 12, h, {a:"middle", c:T.ink, w:600}); });
      return s.out("Shares as rings");
    }
    if(form === "tree"){
      const items = groups[0][1].slice().sort((a, b) => b[1] - a[1]), H = Math.round(Math.min(340, W * .62)), s = new Svg(W, H, T);
      let x = 0, y = 0, w = W, h = H, rest = sum(items, i => i[1]);
      items.forEach(([k, v, c], i) => { const fr = v / rest, horiz = w >= h; let rw, rh;   // slice off each piece along the longer side
        if(i === items.length - 1){ rw = w; rh = h; } else if(horiz){ rw = w * fr; rh = h; } else { rw = w; rh = h * fr; }
        s.add('<rect class="st-d"' + s.delay(i / items.length) + ' x="' + (x + 1.5).toFixed(1) + '" y="' + (y + 1.5).toFixed(1) + '" width="' + Math.max(0, rw - 3).toFixed(1) + '" height="' + Math.max(0, rh - 3).toFixed(1) + '" rx="' + Math.min(T.r === 999 ? 14 : T.r * 2, 14) + '" ' + s.fill(c) + "/>");
        if(rw > 70 && rh > 40){ s.text(x + 12, y + 22, k, {c:"#fff", w:600, size:12}); s.text(x + 12, y + 38, (v / sum(groups[0][1], q => q[1]) * 100).toFixed(1) + "%", {c:"rgba(255,255,255,.85)", size:11}); }
        cardO.pts.push({x:x + rw / 2, y:y + rh / 2, tip:"<b>" + fmt(v) + "</b>" + esc(k)});
        if(horiz){ x += rw; w -= rw; } else { y += rh; h -= rh; } rest -= v; });
      return s.out("Shares as a treemap");
    }
    // squares: 100 of them, each one person in a hundred
    const cols = 20, gap = 3, size = Math.min(16, (Math.min(W, 520) - gap * (cols - 1)) / cols), gh = 5 * (size + gap), hasH = !!groups[0][0], s = new Svg(W, groups.length * (gh + (hasH ? 22 : 0) + 8), T);
    groups.forEach(([h, items], gi) => { const oy = gi * (gh + (hasH ? 22 : 0) + 8) + (hasH ? 18 : 0), tot = sum(items, x => x[1]); if(h) s.text(0, oy - 6, h + ", every 100 people", {c:T.ink, w:600, size:11.5});
      let cum = 0, j = 0; items.forEach(([k, v, c]) => { cum += v; const upto = Math.round(cum / tot * 100);
        for(; j < upto; j++){ const x = (j % cols) * (size + gap), y = oy + Math.floor(j / cols) * (size + gap); s.add('<rect class="st-d"' + s.delay(j / 100) + ' x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + size.toFixed(1) + '" height="' + size.toFixed(1) + '" rx="' + Math.min(T.r === 999 ? size / 2 : T.r, size / 2).toFixed(1) + '" ' + s.fill(c) + "/>");
          cardO.pts.push({x:x + size / 2, y:y + size / 2, tip:"<b>" + Math.round(v / tot * 100) + " in 100</b>" + esc(k) + " (" + fmt(v) + ")"}); } }); });
    return s.out("Shares as squares");
  }

  function seg(key, opts, label){
    return '<div class="seg" role="group"' + (label ? ' aria-label="' + label + '"' : "") + ">" + opts.map(([v, l]) => '<button type="button" data-k="' + key + '" data-v="' + v + '" aria-pressed="' + (String(prefs[key]) === String(v)) + '">' + l + "</button>").join("") + "</div>";
  }

  /* ------------------------------------------------------------ the welcome, in the manner of an iPhone lock screen: a wallpaper of the
     Channel's water, this year's total in large glass numerals, and four widgets on Liquid Glass */
  // the wallpaper: soft light behind, then ribbons of water, each with a bright edge along its crest, as Apple's own wallpapers are drawn
  function wallpaper(W, H, dk){
    const P = dk ? {top:"#03061A", mid:"#0B1640", low:"#132A6B", glow:[["#5B3DF5", .55], ["#0A84FF", .5], ["#FF7A59", .18]],
        bands:[["#1A2F86", "#3B2A9C", .9], ["#0C47B8", "#1C6FE0", .85], ["#0B7FD1", "#3DC2E8", .55], ["#2346C7", "#6E4BEF", .75], ["#081A55", "#0E2F86", .95]], rim:.32}
      : {top:"#2F7BF5", mid:"#5AA9FF", low:"#9ED3FF", glow:[["#F2F8FF", .75], ["#7EE1FF", .6], ["#8C7BFF", .45]],
        bands:[["#BFE6FF", "#FFFFFF", .7], ["#4FA6FF", "#7FD3FF", .85], ["#1E7BF0", "#33B6F5", .9], ["#1561D8", "#4A8BFF", .9], ["#0B3FA8", "#1A63D6", .95]], rim:.55};
    const id = "wp" + (++uid), band = (i, y0, amp, ph) => {   // a ribbon across the width, its crest a smooth wave
      const n = 4, pts = [];
      for(let k = 0; k <= n; k++){ const x = W * k / n; pts.push([x, y0 + amp * Math.sin(ph + k * 1.7) + amp * .45 * Math.cos(ph * 1.3 + k * 2.9)]); }
      let d = "M" + (-4) + " " + pts[0][1].toFixed(1);
      for(let k = 1; k <= n; k++){ const a = pts[k - 1], b = pts[k], cx = (a[0] + b[0]) / 2; d += "C" + cx.toFixed(1) + " " + a[1].toFixed(1) + " " + cx.toFixed(1) + " " + b[1].toFixed(1) + " " + (k === n ? W + 4 : b[0]).toFixed(1) + " " + b[1].toFixed(1); }
      return d;
    };
    let g = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true"><defs>'
      + '<linearGradient id="' + id + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.top + '"/><stop offset=".55" stop-color="' + P.mid + '"/><stop offset="1" stop-color="' + P.low + '"/></linearGradient>'
      + '<filter id="' + id + 'b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="' + Math.round(Math.max(W, H) / 14) + '"/></filter>'
      + '<filter id="' + id + 'r" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>'
      + P.bands.map((b, i) => '<linearGradient id="' + id + "g" + i + '" x1="0" y1="0" x2="1" y2=".35"><stop offset="0" stop-color="' + b[0] + '"/><stop offset="1" stop-color="' + b[1] + '"/></linearGradient>').join("")
      + "</defs>" + '<rect width="100%" height="100%" fill="url(#' + id + 's)"/>'
      + '<g filter="url(#' + id + 'b)">' + [[.82, .12, .34], [.12, .3, .3], [.55, .7, .38]].map((c, i) => '<circle cx="' + (W * c[0]).toFixed(0) + '" cy="' + (H * c[1]).toFixed(0) + '" r="' + (Math.max(W, H) * c[2]).toFixed(0) + '" fill="' + P.glow[i][0] + '" opacity="' + P.glow[i][1] + '"/>').join("") + "</g>";
    // five ribbons, from the far water to the near, each a little lower and a little deeper
    P.bands.forEach((b, i) => {
      const y0 = H * (.34 + i * .13), amp = H * (.035 + i * .012), d = band(i, y0, amp, i * 2.1 + .6);
      g += '<path d="' + d + "V" + (H + 4) + "H-4Z" + '" fill="url(#' + id + "g" + i + ')" opacity="' + b[2] + '"/>'
        + '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="' + (1.2 + i * .3).toFixed(1) + '" opacity="' + (P.rim * (1 - i * .14)).toFixed(2) + '" filter="url(#' + id + 'r)"/>';
    });
    return g + "</svg>";
  }
  // small pictures for the widgets
  function spark(vals, w, h){   // a bar sparkline, newest on the right
    const mx = Math.max(1, ...vals), bw = w / vals.length;
    return '<svg class="st-w-spark" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" aria-hidden="true">' + vals.map((v, i) => { const bh = Math.max(1.5, h * v / mx);
      return '<rect x="' + (i * bw + bw * .18).toFixed(1) + '" y="' + (h - bh).toFixed(1) + '" width="' + (bw * .64).toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="' + Math.min(1.6, bw * .3).toFixed(1) + '"' + (i === vals.length - 1 ? ' class="on"' : "") + "/>"; }).join("") + "</svg>";
  }
  function line(vals, w, h){   // a smooth line with a dot at the end
    const mx = Math.max(...vals), mn = Math.min(...vals), p = vals.map((v, i) => [3 + (w - 6) * i / Math.max(1, vals.length - 1), h - 3 - (h - 6) * (v - mn) / Math.max(1e-9, mx - mn)]), e = p[p.length - 1];
    return '<svg class="st-w-line" viewBox="0 0 ' + w + " " + h + '" aria-hidden="true"><path d="' + smooth(p) + '"/><circle cx="' + e[0].toFixed(1) + '" cy="' + e[1].toFixed(1) + '" r="3"/></svg>';
  }
  const ICON = {
    compare:'<path d="M4 7h11M4 12h16M4 17h7"/>', cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="3.2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    wave:'<path d="M2.5 9c1.6-1.4 3.2-1.4 4.8 0s3.2 1.4 4.7 0 3.2-1.4 4.7 0 3.2 1.4 4.8 0M2.5 15c1.6-1.4 3.2-1.4 4.8 0s3.2 1.4 4.7 0 3.2-1.4 4.7 0 3.2 1.4 4.8 0"/>',
    boat:'<path d="M3 14h18l-2.2 4.2a2 2 0 0 1-1.8 1.1H7a2 2 0 0 1-1.8-1.1z"/><circle cx="8" cy="10.5" r="1.6"/><circle cx="12" cy="10" r="1.6"/><circle cx="16" cy="10.5" r="1.6"/>'
  };
  function drawHero(){
    const el = $("stHero"); if(!el || !D.length) return;
    const cur = last.slice(0, 4), prev = String(+cur - 1), dl = doy(last), m = r => r.migrants || 0;
    const yRows = D.filter(d => d.date.slice(0, 4) === cur), ytd = sum(yRows, m), pYtd = sum(D.filter(d => d.date.slice(0, 4) === prev && doy(d.date) <= dl), m);
    const top = yRows.reduce((a, b) => m(b) > m(a) ? b : a, yRows[0] || D[D.length - 1]), td = parse(top.date);
    const from = iso(new Date(parse(last).getTime() - 29 * 864e5)), l30 = D.filter(d => d.date >= from), ch = pYtd ? Math.round((ytd / pYtd - 1) * 100) : null;
    const fmtDay = o => new Intl.DateTimeFormat("en-GB", Object.assign({timeZone:"UTC"}, o));
    const widget = (cls, icon, label, body) => '<div class="st-w ' + cls + '"><div class="st-w-h"><span class="st-w-ic"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[icon] + "</svg></span>" + esc(label) + "</div>" + body + "</div>";
    const mx = Math.max(ytd, pYtd, 1);
    el.innerHTML = '<div class="st-hero-art"></div><div class="st-hero-in">'
      + '<p class="st-hero-date">' + esc(fmtDay({weekday:"long", day:"numeric", month:"long"}).format(parse(last))) + "</p>"
      + '<p class="st-hero-big" aria-label="' + fmt(ytd) + " people have crossed in " + cur + ' so far"><b>' + fmt(ytd) + "</b></p>"
      + '<p class="st-hero-sub">people have crossed the Channel in small boats in ' + cur + " so far</p>"
      + '<div class="st-hero-tiles">'
      + widget("w-cmp", "compare", "This year and last", '<div class="st-w-v">' + (ch == null ? "–" : (ch > 0 ? "+" : ch < 0 ? "−" : "") + Math.abs(ch) + "%") + "</div>"
        + '<div class="st-w-bars"><span><em>' + cur + "</em><b>" + fmt(ytd) + '</b><i style="--w:' + (ytd / mx).toFixed(3) + '"></i></span><span class="p"><em>' + prev + "</em><b>" + fmt(pYtd) + '</b><i style="--w:' + (pYtd / mx).toFixed(3) + '"></i></span></div>')
      + widget("w-cal", "cal", "Busiest day", '<div class="st-w-calrow"><div class="st-w-date"><small>' + esc(fmtDay({weekday:"short"}).format(td).toUpperCase()) + "</small><b>" + td.getUTCDate() + "</b><small>" + esc(fmtDay({month:"short"}).format(td)) + '</small></div><div><div class="st-w-v">' + fmt(m(top)) + '</div><div class="st-w-f">people in one day</div></div></div>')
      + widget("w-30", "wave", "Last 30 days", '<div class="st-w-v">' + fmt(sum(l30, m)) + '</div><div class="st-w-f">' + fmt(sum(l30, r => r.boats)) + " boats</div>" + spark(l30.map(m), 120, 30))
      + widget("w-pb", "boat", "People a boat", '<div class="st-w-v">' + (perBoat ? fmt(perBoat.last90.avg) : "–") + '</div><div class="st-w-f">' + (perBoat ? "last 90 days, up from " + fmt(perBoat.years[0].avg) + " in " + perBoat.years[0].y : "last 90 days") + "</div>"
        + (perBoat ? line(perBoat.years.map(y => y.avg), 120, 30) : ""))
      + "</div></div>";
    el.querySelector(".st-hero-art").innerHTML = wallpaper(el.clientWidth || 360, el.clientHeight || 520, isDark());
  }

  /* ------------------------------------------------------------ the page */
  const wrap = document.createElement("div"); wrap.className = "st-wrap";
  function controls(){
    return '<div class="st-bar" id="stBar"><div class="st-styles" role="group" aria-label="Style">' + STYLES.map(s => { const c = isDark() ? s.dark : s.light;
      return '<button type="button" class="st-sw" data-style="' + s.id + '" aria-pressed="' + (prefs.style === s.id) + '"><i aria-hidden="true">' + c.slice(0, 3).map(x => '<b style="background:' + x + '"></b>').join("") + "</i>" + s.name + "</button>"; }).join("") + "</div>"
      + '<div class="st-row"><span class="st-lab">Show</span>' + seg("measure", [["people","People"],["boats","Boats"],["perboat","People a boat"]], "Show")
      + "</div></div>";
  }
  const FORM_ICON = {calendar:"grid", waffle:"grid", vs:"area", rank:"hbars", lines:"line", seats:"people"};
  // on a wide screen the cards sit in pairs, so pairs of a similar height go together; the tall ones get a row of their own
  const ORDER = ["ot", "rt", "pat", "yr", "cal", "pb", "ret", "who", "nat"];
  CARDS.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  function shell(){
    let h = '<section class="st-hero" id="stHero" aria-label="The latest figures"></section>' + controls() + '<div class="st-grid">', head = false;
    CARDS.forEach(c => {
      if(c.people && !head){ head = true; h += '</div><div class="section-h" style="margin-bottom:-10px"><h2>Who is crossing</h2></div><div class="st-grid">'; }
      h += '<article class="card st-card' + (c.full ? " st-full" : "") + '" data-card="' + c.id + '"><div class="st-top"><div><h3>' + esc(c.title) + '</h3><div class="st-read"><b>–</b><span>&nbsp;</span></div></div>'
        + '<div class="st-acts"><button type="button" class="st-act" data-save="' + c.id + '" aria-label="Save ' + esc(c.title) + ' as a picture" title="Save as a picture">' + svgI("save") + "</button></div></div>"
        + (c.opts ? '<div class="st-opts" data-opts></div>' : "")
        + '<div class="st-forms" role="group" aria-label="Chart form">' + c.forms.map(([v, l]) => '<button type="button" data-k="' + c.key + '" data-v="' + v + '" aria-pressed="' + (prefs[c.key] === v) + '">' + svgI(FORM_ICON[v] || (ic[v] ? v : "bars")) + l + "</button>").join("") + "</div>"
        + '<div class="st-chart" data-chart></div><div data-legend></div></article>';
    });
    return h + "</div>" + '<p class="foot">Home Office figures, provisional and sometimes revised. Who is crossing, people per boat and the returns deal don’t change with Show and Range. Contains public sector information licensed under the Open Government Licence v3.0.</p>';
  }
  function drawAll(){
    if(!D.length || locked) return;
    const T = theme(); wrap.dataset.style = T.id;
    drawHero();
    CARDS.forEach(c => drawCard(c, T));
    watchCards(); fadeRows();
  }
  // a chart animates in the first time it scrolls into view, and again whenever the visitor changes it; never on a resize or a live update
  function play(c){
    if(reduced) return; const ch = wrap.querySelector('[data-card="' + c.id + '"] [data-chart]'); if(!ch) return;
    ch.classList.remove("st-anim"); void ch.offsetWidth; ch.classList.add("st-anim");
    clearTimeout(ch._anim); ch._anim = setTimeout(() => ch.classList.remove("st-anim"), 1800);
  }
  // a row of buttons wider than its space fades at whichever end has more to scroll to
  const ROWS = ".st-forms,.st-styles,.st-row,.st-opts .seg";
  function fadeRow(el){ const more = el.scrollWidth - el.clientWidth > 2; el.classList.toggle("st-more-l", more && el.scrollLeft > 2); el.classList.toggle("st-more-r", more && el.scrollLeft < el.scrollWidth - el.clientWidth - 2); }
  const fadeRows = () => wrap.querySelectorAll(ROWS).forEach(fadeRow);
  wrap.addEventListener("scroll", e => { if(e.target.matches && e.target.matches(ROWS)) fadeRow(e.target); }, {capture:true, passive:true});
  let io = null;
  function watchCards(){
    if(io || !("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(es => es.forEach(e => { if(!e.isIntersecting) return; io.unobserve(e.target); const c = CARDS.find(x => x.id === e.target.dataset.card); if(c) play(c); }), {threshold:.25});
    wrap.querySelectorAll("[data-card]").forEach(el => io.observe(el));
  }
  function drawCard(c, T){
    const el = wrap.querySelector('[data-card="' + c.id + '"]'); if(!el) return;
    const ch = el.querySelector("[data-chart]"), op = el.querySelector("[data-opts]");
    if(op) op.innerHTML = c.opts();
    c.pts = null; c.legend = "";
    ch.innerHTML = c.draw(ch, T || theme()); c.svg = ch.querySelector("svg");
    el.querySelector("[data-legend]").innerHTML = c.legend || "";
    const r = el.querySelector(".st-read"); if(c.read){ r.firstChild.textContent = c.read[0]; r.lastChild.textContent = c.read[1]; }
    el.querySelectorAll(".st-forms button").forEach(b => b.setAttribute("aria-pressed", prefs[c.key] === b.dataset.v));
  }
  const affects = {measure:"*", range:["ot"], style:"*", group:["ot"], avg:["ot"], ot:["ot"], rt:["rt"], cal:["cal"], calY:["cal"], pat:["pat"], patF:["pat"], yr:["yr"], who:["who"], whoF:["who"], nat:["nat"], ret:["ret"], pb:["pb"]};
  wrap.addEventListener("click", e => {
    const sw = e.target.closest(".st-sw");
    if(sw){ prefs.style = sw.dataset.style; save(); wrap.querySelectorAll(".st-sw").forEach(b => b.setAttribute("aria-pressed", b === sw)); drawAll(); CARDS.forEach(play); return; }
    const sv = e.target.closest("[data-save]"); if(sv){ savePicture(CARDS.find(c => c.id === sv.dataset.save)); return; }
    const b = e.target.closest("button[data-k]"); if(!b) return;
    const k = b.dataset.k, v = b.dataset.v; prefs[k] = v === "true" ? true : v === "false" ? false : v; save();
    b.parentElement.querySelectorAll("button[data-k]").forEach(x => x.setAttribute("aria-pressed", x === b));
    const which = affects[k] === "*" ? CARDS : CARDS.filter(c => (affects[k] || []).includes(c.id)); const T = theme(); which.forEach(c => { drawCard(c, T); play(c); }); fadeRows();
  });

  /* the tooltip: the nearest point to the pointer, along the chart (or in both directions for squares, rings and bars) */
  const tip = document.createElement("div"); tip.className = "st-tip"; tip.setAttribute("aria-hidden", "true"); document.body.appendChild(tip);
  function hover(e){
    const ch = e.target.closest && e.target.closest("[data-chart]"); if(!ch) return;
    const c = CARDS.find(x => x.id === ch.closest("[data-card]").dataset.card), svg = ch.querySelector("svg");
    if(!c || !c.pts || !c.pts.length || !svg){ hideTip(); return; }
    const r = svg.getBoundingClientRect(), k = (+svg.getAttribute("width")) / r.width, px = (e.clientX - r.left) * k, py = (e.clientY - r.top) * k;
    let best = null, bd = Infinity;
    c.pts.forEach(p => { const d = c.mode === "x" ? Math.abs(p.x - px) : c.mode === "y" ? Math.abs(p.y - py) : Math.hypot(p.x - px, p.y - py); if(d < bd){ bd = d; best = p; } });
    if(!best || (c.mode === "xy" && bd > 40)){ hideTip(); return; }
    tip.innerHTML = best.tip; tip.classList.add("on");
    const mk = svg.querySelector(".st-mk"); if(mk && c.mode === "x"){ mk.setAttribute("cx", best.x); mk.setAttribute("cy", best.y); mk.setAttribute("opacity", 1); }
    const tw = tip.offsetWidth, th = tip.offsetHeight, sx = r.left + best.x / k, sy = r.top + best.y / k;
    tip.style.left = Math.max(8, Math.min(innerWidth - tw - 8, sx - tw / 2)) + "px"; tip.style.top = Math.max(8, sy - th - 14) + "px";
  }
  function hideTip(){ tip.classList.remove("on"); wrap.querySelectorAll(".st-mk").forEach(m => m.setAttribute("opacity", 0)); }
  wrap.addEventListener("pointermove", hover); wrap.addEventListener("pointerdown", hover);
  // a finger lifting counts as leaving, so on phones the tip stays until the next tap elsewhere or a scroll
  wrap.addEventListener("pointerleave", e => { if(e.pointerType !== "touch") hideTip(); });
  document.addEventListener("pointerdown", e => { if(!(e.target.closest && e.target.closest("[data-chart]"))) hideTip(); }, {passive:true});
  addEventListener("scroll", hideTip, {passive:true});

  /* save a chart as a picture: the chart on the card's colour, with its title and where the figures come from */
  function savePicture(c){
    if(!c || !c.svg){ return; }
    const T = theme(), svg = c.svg, W = +svg.getAttribute("width"), H = +svg.getAttribute("height"), P = 28, top = 70, bot = 44, el = wrap.querySelector('[data-card="' + c.id + '"]');
    const inner = svg.outerHTML.replace("<svg ", '<svg x="' + P + '" y="' + top + '" ');
    const ff = T.font.replace(/"/g, "'");
    const doc = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (W + P * 2) + '" height="' + (H + top + bot) + '"><rect width="100%" height="100%" fill="' + T.surface + '"/>'
      + '<text x="' + P + '" y="' + (P + 6) + '" font-family="' + ff + '" font-size="15" font-weight="600" fill="' + T.ink2 + '">' + esc(c.title) + "</text>"
      + '<text x="' + P + '" y="' + (P + 32) + '" font-family="' + ff + '" font-size="24" font-weight="700" fill="' + T.ink + '">' + esc((c.read || [""])[0]) + '<tspan font-size="13" font-weight="500" fill="' + T.ink2 + '" dx="8">' + esc((c.read || ["", ""])[1]) + "</tspan></text>"
      + inner + '<text x="' + P + '" y="' + (H + top + bot - 16) + '" font-family="' + ff + '" font-size="11" fill="' + T.ink2 + '">channelcrossings.world · Home Office figures, Open Government Licence v3.0</text></svg>';
    const img = new Image(), url = URL.createObjectURL(new Blob([doc], {type:"image/svg+xml"}));
    img.onload = () => {
      const k = 2, cv = document.createElement("canvas"); cv.width = (W + P * 2) * k; cv.height = (H + top + bot) * k;
      const x = cv.getContext("2d"); x.scale(k, k); x.drawImage(img, 0, 0); URL.revokeObjectURL(url);
      cv.toBlob(b => { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "channel-crossings-" + c.id + ".png"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }, "image/png");
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
    if(el){ const b = el.querySelector("[data-save]"); b.animate && !reduced && b.animate([{transform:"scale(.85)"}, {transform:"scale(1)"}], {duration:260, easing:"cubic-bezier(.3,1.4,.5,1)"}); }
  }

  /* ------------------------------------------------------------ the account and the unlock
     An account is just an email address. Paying makes one (Stripe records the email with the payment) and signs this
     device in straight away; on another device the visitor asks for a sign-in link, which the worker emails them. The
     worker signs a token saying who they are; this page keeps it, and asks the worker whether that email has paid. */
  let acct = store.get("acct");   // {token, email, studio}
  let locked = true;   // only the worker's answer unlocks Studio, never what this device remembers
  const offer = document.createElement("div"); offer.className = "st-offer";
  const tick = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function api(path, body, token){
    return fetch(API + path, {method:body ? "POST" : "GET", headers:Object.assign({"Content-Type":"application/json"}, token ? {Authorization:"Bearer " + token} : {}), body:body ? JSON.stringify(body) : undefined})
      .then(r => r.json().catch(() => ({})).then(j => { if(!r.ok) throw new Error(j.error || "Something went wrong. Please try again."); return j; }));
  }
  function renderOffer(mode, msg, err){
    const signedIn = acct && acct.token;
    let body;
    if(mode === "key") body = '<h3>Enter your password</h3><p>This account signs in with its password.</p>'
      + '<form data-form="key"><input class="st-field" type="password" name="key" required autocomplete="current-password" placeholder="Password" aria-label="Password"><button class="st-buy" type="submit">Sign in</button></form>'
      + '<p class="st-msg' + (err ? " err" : "") + '" role="status">' + (msg ? esc(msg) : "") + "</p>"
      + '<button type="button" class="st-link" data-act="back">Back</button>';
    else if(mode === "sent") body = '<h3>Check your email</h3><p>We’ve sent a sign-in link to <b>' + esc(msg) + '</b>. Open it on this device to unlock Studio here. If it isn’t in your inbox within a minute, check your junk folder.</p><button type="button" class="st-link" data-act="back">Use a different email</button>';
    else if(mode === "signin") body = '<h3>Sign in</h3><p>Already unlocked Studio? Enter the email you paid with and we’ll send you a link to sign in on this device.</p>'
      + '<form data-form="signin"><input class="st-field" type="email" name="email" required autocomplete="email" placeholder="Email address" aria-label="Email address"><button class="st-buy" type="submit">Email me a sign-in link</button></form>'
      + '<p class="st-msg' + (err ? " err" : "") + '" role="status">' + (msg ? esc(msg) : "") + "</p>"
      + '<button type="button" class="st-link" data-act="back">Back</button>';
    else body = '<div class="st-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 19.5h16M6.5 16V11M11 16V6M15.5 16v-7M20 16V4" stroke-width="2.4"/></svg></div>'
      + "<h3>Studio</h3><p>Every chart on Channel Crossings, and new ones, drawn the way you want to see them.</p>"
      + '<p class="st-free"><b>The figures are free, and always will be.</b> They are published by the Home Office on GOV.UK, and everything on Today, Trends and People stays free. Studio is what you pay for: the same figures in more depth, in forms that are easier to understand.</p>'
      + '<ul class="st-list"><li>' + tick + "<span>Every graph in six styles, from Standard to Graphite</span></li><li>" + tick + "<span>Each chart in its own forms: lines, areas, rings, roses, calendars and more</span></li><li>"
      + tick + "<span>People, boats or people a boat, over any range</span></li><li>" + tick + "<span>Save any chart as a picture, or read it as a table</span></li><li>" + tick + "<span>Live updates: new figures, weather, news and boats appear on the page without reloading</span></li></ul>"
      + (signedIn ? '<button type="button" class="st-buy" data-act="buy"' + (API ? "" : " disabled") + ">Unlock for " + PRICE + "</button>"
        : '<form data-form="buy"><input class="st-field" type="email" name="email" required autocomplete="email" placeholder="Email address" aria-label="Email address, for your account and receipt"><button class="st-buy" type="submit"' + (API ? "" : " disabled") + ">Unlock for " + PRICE + "</button></form>")
      + '<p class="st-msg' + (err ? " err" : "") + '" role="status">' + (msg ? esc(msg) : API ? "" : "Payments open soon.") + "</p>"
      + (signedIn ? '<p class="st-fine">Signed in as ' + esc(acct.email) + ' · <button type="button" class="st-link" style="padding:0;font-size:inherit" data-act="out">Sign out</button></p>'
        : '<button type="button" class="st-link" data-act="signin">Already paid? Sign in</button>')
      + '<p class="st-fine">One payment, no subscription. Your email is your account: it unlocks Studio on any device you sign in on. Payment is handled securely by Stripe. Figures: Home Office, Open Government Licence v3.0.</p>';
    offer.innerHTML = body;
  }
  let keyFor = "";   // the email of an account that signs in with a password
  offer.addEventListener("submit", e => {
    e.preventDefault(); const f = e.target, btn = f.querySelector("button");
    btn.disabled = true;
    if(f.dataset.form === "key"){ api("/login", {email:keyFor, key:f.key.value}).then(signIn).catch(x => renderOffer("key", x.message, true)); return; }
    const email = f.email.value.trim();
    const fail = mode => x => { renderOffer(mode, x.message, true); const i = offer.querySelector("input"); if(i) i.value = email; };   // keep what they typed
    if(f.dataset.form === "signin") api("/login", {email}).then(j => { if(j.key){ keyFor = email; renderOffer("key"); } else renderOffer("sent", email); }).catch(fail("signin"));
    else checkout({email}).catch(fail("offer"));
  });
  offer.addEventListener("click", e => {
    const a = e.target.closest("[data-act]"); if(!a) return;
    if(a.dataset.act === "signin") renderOffer("signin");
    if(a.dataset.act === "back") renderOffer("offer");
    if(a.dataset.act === "out"){ store.del("acct"); acct = null; renderOffer("offer"); if(window.ccLive) window.ccLive(false); }
    if(a.dataset.act === "buy"){ a.disabled = true; checkout({}).catch(x => renderOffer("offer", x.message, true)); }
  });
  function checkout(body){
    return api("/checkout", body, acct && acct.token).then(j => {
      if(j.url){ location.href = j.url; return; }
      if(j.paid && j.sent) renderOffer("sent", body.email || (acct && acct.email));   // already paid: the worker emailed a sign-in link instead
      else if(j.paid && j.token) signIn(j);
    });
  }
  function signIn(j){ acct = {token:j.token, email:j.email, studio:!!j.studio}; store.set("acct", acct); setLocked(!acct.studio); }

  const lockBox = document.createElement("div"); lockBox.className = "st-lock";
  // behind the offer, a blurred picture of Studio: never the charts themselves, which only an unlocked account gets
  const peek = document.createElement("div"); peek.className = "st-peek"; peek.setAttribute("aria-hidden", "true");
  const peekPic = () => '<img src="studio-peek-' + (isDark() ? "dark" : "light") + '.webp" alt="" width="464" height="550" decoding="async">';
  const acctLine = document.createElement("p"); acctLine.className = "st-acct";
  function setLocked(on){
    locked = on;
    if(!on && window.ccLive) window.ccLive(true);   // live updates across the site come with Studio
    if(on){ renderOffer("offer"); peek.innerHTML = peekPic(); lockBox.append(peek, offer); host.replaceChildren(lockBox); showOut(); return; }
    else { host.replaceChildren(acctLine, wrap); acctLine.innerHTML = window.CC_STUDIO_PREVIEW && !(acct && acct.email) ? 'Preview: only devices with the preview link see Studio until payments are switched on · <button type="button">Show the offer</button>' : ""; }
    showOut();
    requestAnimationFrame(drawAll);
  }
  // signing out lives in the round door button at the top of the page, beside Appearance and Share (index.html draws it and asks first)
  function signOut(){ store.del("acct"); acct = null; setLocked(true); if(window.ccLive) window.ccLive(false); }
  function showOut(){
    const b = document.getElementById("outBtn"), who = document.getElementById("outWho"), on = !locked && !!(acct && acct.email);
    if(b) b.hidden = !on; if(who) who.textContent = on ? "You’re signed in as " + acct.email + ". You can sign back in any time with the same email." : "";
  }
  window.ccSignOut = signOut;
  acctLine.addEventListener("click", e => { if(e.target.closest("button")) signOut(); });

  // coming back from Stripe, or from the sign-in link in an email
  function arrivals(){
    const q = new URLSearchParams(location.search), cs = q.get("cs"), link = q.get("signin");
    const demo = window.CC_STUDIO_PREVIEW || (q.get("studio") === "demo" && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname));   // the preview, or trying the page out locally
    if(cs || link || q.has("studio")){ ["cs", "signin", "studio"].forEach(k => q.delete(k)); history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "") + "#studio"); }
    if(demo){ acct = {token:"", email:"", studio:true}; return Promise.resolve(); }
    if(!API) return Promise.resolve();
    if(cs){ renderOffer("offer", "Confirming your payment…"); return api("/claim", {session_id:cs}).then(signIn).catch(x => renderOffer("offer", x.message, true)); }
    if(link){ renderOffer("offer", "Signing you in…"); return api("/session", {link}).then(signIn).catch(x => renderOffer("offer", x.message, true)); }
    if(acct && acct.token){ renderOffer("offer", "Checking your account…"); return api("/me", null, acct.token).then(j => { acct.studio = !!j.studio; store.set("acct", acct); if(j.studio) setLocked(false); else renderOffer("offer"); })
      .catch(x => { acct.studio = false; renderOffer("offer", x instanceof TypeError ? "Studio couldn’t check your account. Check your connection and reload." : x.message, true); }); }
    acct = null;
    return Promise.resolve();
  }

  /* ------------------------------------------------------------ start */
  wrap.innerHTML = shell();
  setLocked(locked);
  arrivals().then(() => { if(acct && acct.studio && locked) setLocked(false); });   // the demo, on this computer only
  Promise.resolve(window.__data || getJSON("data.json")).catch(() => getJSON("data.json")).then(j => {
    D = j.days || [];
    last = D.length ? D[D.length - 1].date : null; drawAll();
  }).catch(() => { wrap.querySelectorAll("[data-chart]").forEach(c => c.innerHTML = '<p class="st-note">The figures couldn’t be loaded. Check your connection and try again.</p>'); });
  Promise.allSettled([getJSON("gender.json"), getJSON("nationalities.json"), getJSON("returns.json"), getJSON("perboat.json")]).then(([g, n, r, b]) => {
    gender = g.value || null; nats = n.value || null; rets = r.value || null; perBoat = b.value && b.value.years && b.value.years.length ? b.value : null; const T = theme(); CARDS.filter(c => c.people).forEach(c => D.length && drawCard(c, T)); if(D.length && !locked) drawHero();
  });

  // redraw when the page changes width, or the visitor switches between day and night
  let rw = 0, rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { const w = host.clientWidth; if(w && w !== rw){ rw = w; drawAll(); } }, 120); });
  new MutationObserver(() => { if(locked) peek.innerHTML = peekPic(); wrap.querySelectorAll(".st-sw").forEach(b => { const s = STYLES.find(x => x.id === b.dataset.style); b.querySelectorAll("b").forEach((x, i) => x.style.background = (isDark() ? s.dark : s.light)[i]); }); drawAll(); }).observe(docEl, {attributes:true, attributeFilter:["data-theme"]});
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if(locked) peek.innerHTML = peekPic(); drawAll(); });
})();
