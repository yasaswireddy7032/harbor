import { AFFIRMATIONS, FEELINGS, HELP, JOURNAL_PROMPTS, NEEDS, OPTIONS, READING, SHOW_CARDS, SMALL_STEPS, VOICES } from "./content.js";
import { MODEL_PROMPT, newState, respond, respondToTaps, safetyCheck, unsafeReply } from "./listener.js";
import { prefs, vault } from "./vault.js";

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const view = $("#view");
const today = () => new Date().toISOString().slice(0, 10);
const listen = newState();
let chat = [];            // this conversation; kept only in memory unless she chooses to save it
let taps = { f: new Set(), n: new Set() };
let breatheTimer = null;

/* ------------------------------------------------------------------ leaving quickly */

export function leave() {
  try { vault.lock(); sessionStorage.clear(); } catch { /* ignore */ }
  document.body.innerHTML = "";
  location.replace("https://www.google.com/search?q=weather+today");
}
let lastEsc = 0;
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (Date.now() - lastEsc < 900) leave();
  lastEsc = Date.now();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) hiddenAt = Date.now();
  else if (hiddenAt && Date.now() - hiddenAt > 5 * 60 * 1000 && vault.unlocked()) { vault.lock(); toast("Locked while you were away"); }
});
let hiddenAt = 0;

/* ------------------------------------------------------------------ navigation without history */
// replaceState keeps a single history entry, so the back button leaves Harbor instead of walking through it.
function go(hash) { history.replaceState(null, "", hash); route(); }
document.addEventListener("click", e => {
  const a = e.target.closest("a[data-go]");
  if (a) { e.preventDefault(); go(a.getAttribute("href")); }
});

function toast(msg) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; t.setAttribute("role", "status");
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}

/* ------------------------------------------------------------------ discreet mode */
function applyPrefs() {
  const p = prefs.get();
  const discreet = !!p.discreet;
  document.title = discreet ? "Notes" : "Harbor";
  $("#brand").textContent = discreet ? "Notes" : "Harbor";
  $("link[rel=icon]").href = discreet ? "icons/notes-192.png" : "icons/icon-192.png";
  document.documentElement.dataset.size = p.size || "m";
  document.documentElement.dataset.theme = p.theme || "";
}

/* ------------------------------------------------------------------ tool buttons under replies */
const TOOLS = {
  call911: () => `<a class="pill urgent" href="tel:911">Call 911</a>`,
  dvText: () => `<a class="pill" href="sms:88788?&body=START">Text a DV advocate</a>`,
  exit: () => `<button class="pill" data-act="leave">Leave Harbor now</button>`,
  call988: () => `<a class="pill urgent" href="tel:988">Call 988</a>`,
  text988: () => `<a class="pill" href="sms:988">Text 988</a>`,
  rainn: () => `<a class="pill" href="tel:18006564673">Call RAINN</a> <a class="pill" href="https://hotline.rainn.org/online" target="_blank" rel="noopener noreferrer">Chat with RAINN</a>`,
  dv: () => `<a class="pill" data-go href="#/help">If it's a partner</a>`,
  optMedical: () => `<a class="pill" data-go href="#/options/medical">Medical care options</a>`,
  optConsent: () => `<a class="pill" data-go href="#/options/consent">What consent means</a>`,
  optReport: () => `<a class="pill" data-go href="#/options/report">What reporting involves</a>`,
  options: () => `<a class="pill" data-go href="#/options">See my options</a>`,
  breathe: () => `<a class="pill" data-go href="#/calm">Breathe with me</a>`,
  grounding: () => `<a class="pill" data-go href="#/calm/ground">Ground myself</a>`,
  feelings: () => `<a class="pill" data-go href="#/tap">Tap how I feel</a>`,
  showCards: () => `<a class="pill" data-go href="#/show">Show someone a card</a>`,
  safetyPlan: () => `<a class="pill" data-go href="#/plan">Make a safety plan</a>`,
  voices: () => `<a class="pill" data-go href="#/voices">Hear from survivors</a>`,
  steps: () => `<a class="pill" data-go href="#/steps">Note a small step</a>`,
  talk: () => `<a class="pill" data-go href="#/talk">Keep talking</a>`,
};
const tools = list => list?.length ? `<div class="pills">${list.map(t => TOOLS[t]?.() || "").join("")}</div>` : "";
document.addEventListener("click", e => { if (e.target.closest("[data-act=leave]")) leave(); });

/* ------------------------------------------------------------------ views */

function home() {
  const a = AFFIRMATIONS[Math.floor(Date.now() / 86400000) % AFFIRMATIONS.length];
  const tiles = [
    ["#/talk", "Talk", "Type whatever you want. No one is judging.", "💬"],
    ["#/tap", "Say it without words", "Tap how you feel instead of typing.", "🤍"],
    ["#/show", "Show someone", "Cards with the words already on them.", "🪪"],
    ["#/write", "Write privately", "A journal only you can open.", "📓"],
    ["#/calm", "Calm my body", "Breathing and grounding, one step at a time.", "🌬️"],
    ["#/options", "My options", "Medical care, advocates, reporting. No pressure.", "🧭"],
    ["#/voices", "Women who've been here", "Real talks from survivors.", "🌱"],
    ["#/plan", "Safety plan", "Who to call, where to go, kept private.", "🛡️"],
    ["#/steps", "Small steps", "Notice what you did today. No streaks.", "🌤️"],
    ["#/help", "Talk to a person", "Free, confidential hotlines, 24/7.", "📞"],
  ];
  view.innerHTML = `
    <section class="welcome">
      <p class="soft">You're safe here.</p>
      <h1>Whatever happened, you don't have to carry it alone.</h1>
      <p class="soft">Nothing you write leaves this phone. You can stop, leave or come back any time.</p>
    </section>
    <blockquote class="affirm">${esc(a)}</blockquote>
    <div class="tiles">${tiles.map(([h, t, s, i]) => `<a class="tile" data-go href="${h}"><span class="ti" aria-hidden="true">${i}</span><b>${t}</b><span>${s}</span></a>`).join("")}</div>
    <a class="helpcard" data-go href="#/help"><b>Need to talk to a person right now?</b><span>Free, confidential, 24/7 hotlines →</span></a>
    <p class="fine">Harbor is not therapy or an emergency service. If you're in danger, call 911.</p>`;
}

function bubble(m) {
  return m.me ? `<div class="msg me">${esc(m.text)}</div>`
    : `<div class="msg them${m.crisis ? " crisis" : ""}">${esc(m.text)}${tools(m.tools)}</div>`;
}

function talk() {
  const saved = vault.unlocked() && vault.get().chat?.length && !chat.length ? vault.get().chat : null;
  if (saved) chat = saved.slice();
  view.innerHTML = `
    <div class="talk">
      <div class="thread" id="thread">${chat.length ? chat.map(bubble).join("") : `
        <div class="msg them">Hi. I'm here to listen, not to judge. You can tell me as much or as little as you want. There's no right way to start.${tools(["feelings"])}</div>`}</div>
      <form class="composer" id="composer" autocomplete="off">
        <textarea id="say" rows="1" placeholder="Type anything…" aria-label="Your message" autocorrect="on"></textarea>
        <button class="send" aria-label="Send">→</button>
      </form>
      <p class="fine center">${vault.unlocked() ? `<label><input type="checkbox" id="keep" ${prefs.get().keepChat ? "checked" : ""}> Keep this conversation, encrypted on this phone</label>` : "This conversation disappears when you leave."}</p>
    </div>`;
  const ta = $("#say");
  ta.oninput = () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 140) + "px"; };
  ta.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#composer").requestSubmit(); } };
  const keep = $("#keep"); if (keep) keep.onchange = () => { prefs.set({ keepChat: keep.checked }); persistChat(); };
  $("#composer").onsubmit = async e => {
    e.preventDefault();
    const text = ta.value.trim(); if (!text) return;
    ta.value = ""; ta.style.height = "auto";
    chat.push({ me: true, text });
    draw();
    const typing = { text: "…" }; chat.push(typing); draw();
    const r = await reply(text);
    Object.assign(typing, r);
    draw(); persistChat();
  };
  scrollDown();
}
function draw() { const th = $("#thread"); if (th) { th.innerHTML = chat.map(bubble).join(""); scrollDown(); } }
function scrollDown() { setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 20); }
function persistChat() { if (vault.unlocked() && prefs.get().keepChat) vault.update(d => { d.chat = chat.slice(-80); }); }

async function reply(text) {
  await new Promise(r => setTimeout(r, 450 + Math.min(900, text.length * 6)));  // a short pause reads as listening
  const rules = respond(text, listen);
  const p = prefs.get();
  if (rules.crisis || !p.modelUrl) return rules;
  // Optional local model (e.g. Ollama on this device). Safety rules ran first; its answer is screened too.
  try {
    const history = chat.filter(m => m.text !== "…").slice(-10).map(m => ({ role: m.me ? "user" : "assistant", content: m.text }));
    const r = await fetch(`${p.modelUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: p.modelName || "llama3.1:8b", temperature: 0.4, messages: [{ role: "system", content: MODEL_PROMPT }, ...history] }),
    });
    const out = (await r.json()).choices[0].message.content.trim();
    if (!out || unsafeReply(out).length || safetyCheck(out) || out.length > 600) return rules;
    return { text: out, tools: rules.tools, crisis: null };
  } catch { return rules; }
}

function tap() {
  view.innerHTML = `
    <h1 class="h">How are you feeling?</h1><p class="soft">Tap as many as you want. You don't have to explain.</p>
    <div class="feel">${FEELINGS.map(f => `<button data-f="${f.id}" aria-pressed="${taps.f.has(f.id)}"><span aria-hidden="true">${f.emoji}</span>${esc(f.label)}</button>`).join("")}</div>
    <h2 class="h2">What would help right now?</h2>
    <div class="need">${NEEDS.map(n => `<button data-n="${n.id}" aria-pressed="${taps.n.has(n.id)}">${esc(n.label)}</button>`).join("")}</div>
    <button class="btn block" id="done">That's how I feel</button>
    <div id="out"></div>`;
  view.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { const id = b.dataset.f; taps.f.has(id) ? taps.f.delete(id) : taps.f.add(id); b.setAttribute("aria-pressed", taps.f.has(id)); });
  view.querySelectorAll("[data-n]").forEach(b => b.onclick = () => { const id = b.dataset.n; taps.n = new Set(taps.n.has(id) ? [] : [id]); view.querySelectorAll("[data-n]").forEach(x => x.setAttribute("aria-pressed", taps.n.has(x.dataset.n))); });
  $("#done").onclick = () => {
    const r = respondToTaps([...taps.f], [...taps.n]);
    $("#out").innerHTML = `<div class="msg them gap${r.crisis ? " crisis" : ""}">${esc(r.text)}${tools(r.tools)}</div>`;
    $("#out").scrollIntoView({ behavior: "smooth", block: "center" });
  };
}

function show() {
  const custom = vault.unlocked() ? vault.get().cards || [] : vault.scratch().cards;
  const all = [...SHOW_CARDS, ...custom];
  view.innerHTML = `
    <h1 class="h">Show someone</h1>
    <p class="soft">For a doctor, nurse, counselor, friend or officer. Pick the cards you want, then hold up your phone. Or let it read them out loud for you.</p>
    <div class="cards">${all.map((c, i) => `<label class="cardopt"><input type="checkbox" value="${i}"><span>${esc(c)}</span></label>`).join("")}</div>
    <form id="add" class="row"><input id="newcard" placeholder="Write your own card…" aria-label="Write your own card"><button class="btn">Add</button></form>
    <button class="btn block" id="present">Show these</button>`;
  $("#add").onsubmit = async e => {
    e.preventDefault(); const v = $("#newcard").value.trim(); if (!v) return;
    if (vault.unlocked()) await vault.update(d => d.cards.push(v)); else vault.scratch().cards.push(v);
    show();
  };
  $("#present").onclick = () => {
    const picked = [...view.querySelectorAll(".cardopt input:checked")].map(i => all[+i.value]);
    if (!picked.length) return toast("Pick at least one card");
    const wrap = document.createElement("div"); wrap.className = "present"; wrap.setAttribute("role", "dialog");
    let i = 0;
    const paint = () => { wrap.innerHTML = `<p class="big">${esc(picked[i])}</p>
      <div class="presentbar"><button data-p="-1" ${i ? "" : "disabled"}>‹</button><button data-p="speak">🔊 Read aloud</button><button data-p="close">Done</button><button data-p="1" ${i < picked.length - 1 ? "" : "disabled"}>›</button></div>
      <p class="count">${i + 1} of ${picked.length}</p>`; };
    paint();
    wrap.onclick = e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.p === "close") { speechSynthesis?.cancel(); wrap.remove(); return; }
      if (b.dataset.p === "speak") { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(picked[i]); u.rate = 0.92; speechSynthesis.speak(u); } catch { toast("Reading aloud isn't available here"); } return; }
      i = Math.max(0, Math.min(picked.length - 1, i + +b.dataset.p)); paint();
    };
    document.body.appendChild(wrap);
  };
}

function write() {
  const prompt = JOURNAL_PROMPTS[Math.floor(Math.random() * JOURNAL_PROMPTS.length)];
  const entries = vault.unlocked() ? vault.get().journal.slice().reverse() : [];
  view.innerHTML = `
    <h1 class="h">Write privately</h1>
    <p class="soft" id="prompt">${esc(prompt)} <button class="link" id="another">Another prompt</button></p>
    <textarea id="entry" class="paper" placeholder="Start anywhere. Spelling and sense don't matter." aria-label="Journal entry"></textarea>
    <div class="row">
      <button class="btn" id="save">${vault.unlocked() ? "Save, encrypted" : vault.exists() ? "Unlock to save" : "Save privately"}</button>
      <button class="btn soft-btn" id="letgo">Let it go</button>
    </div>
    <p class="fine">“Let it go” clears the page without saving anything. Sometimes writing it out is enough.</p>
    ${entries.length ? `<h2 class="h2">Your entries</h2>${entries.map(e => `<details class="entry"><summary>${esc(new Date(e.at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }))} · ${esc(e.text.slice(0, 48))}${e.text.length > 48 ? "…" : ""}</summary><p>${esc(e.text)}</p><button class="link danger" data-del="${e.id}">Delete</button></details>`).join("")}` : ""}`;
  $("#another").onclick = write;
  $("#letgo").onclick = () => { const ta = $("#entry"); if (!ta.value.trim()) return; ta.classList.add("fade"); setTimeout(() => { ta.value = ""; ta.classList.remove("fade"); toast("Gone. Nothing was saved."); }, 900); };
  $("#save").onclick = async () => {
    const text = $("#entry").value.trim(); if (!text) return toast("Write something first");
    if (!vault.unlocked()) { sessionStorage.setItem("n.pending", text); return go("#/privacy"); }
    await vault.update(d => d.journal.push({ id: crypto.randomUUID(), at: Date.now(), prompt, text }));
    toast("Saved. Only you can open it."); write();
  };
  view.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
    if (!confirm("Delete this entry for good?")) return;
    await vault.update(d => { d.journal = d.journal.filter(e => e.id !== b.dataset.del); }); write();
  });
  const pending = sessionStorage.getItem("n.pending");
  if (pending && vault.unlocked()) { $("#entry").value = pending; sessionStorage.removeItem("n.pending"); }
}

function calm(part) {
  clearInterval(breatheTimer);
  const steps = [
    ["5", "things you can see", "Look around slowly. Name them, out loud or in your head."],
    ["4", "things you can feel", "Your feet on the floor. Your clothes. The air. Something in your hand."],
    ["3", "things you can hear", "Near or far. Even quiet ones."],
    ["2", "things you can smell", "Or two smells you like, if nothing's close."],
    ["1", "thing you can taste", "Or one kind thing you can say to yourself."],
  ];
  view.innerHTML = `
    <h1 class="h">Calm your body</h1>
    <div class="seg"><button data-c="breathe" aria-pressed="${part !== "ground" && part !== "hug"}">Breathe</button><button data-c="ground" aria-pressed="${part === "ground"}">5-4-3-2-1</button><button data-c="hug" aria-pressed="${part === "hug"}">Butterfly hug</button></div>
    <div id="calmbox"></div>`;
  view.querySelectorAll("[data-c]").forEach(b => b.onclick = () => go(`#/calm/${b.dataset.c}`));
  const box = $("#calmbox");
  if (part === "ground") {
    let i = 0;
    const paint = () => { const [n, what, how] = steps[i]; box.innerHTML = `<div class="ground"><div class="gnum">${n}</div><b>${what}</b><p class="soft">${how}</p>
      <button class="btn block" id="next">${i < steps.length - 1 ? "Next" : "Done"}</button></div>`;
      $("#next").onclick = () => { if (i < steps.length - 1) { i++; paint(); } else box.innerHTML = `<div class="ground"><b>You're here. You're present.</b><p class="soft">Notice your breath for a moment. You did that.</p>${tools(["talk", "breathe"])}</div>`; }; };
    paint();
  } else if (part === "hug") {
    box.innerHTML = `<div class="ground"><div class="gnum">🦋</div><p>Cross your arms over your chest, hands resting near your collarbones. Slowly tap left, then right, like wings. Breathe slowly. Keep going for a minute, or as long as feels good.</p><p class="soft">Many trauma therapists teach this to help the body settle.</p></div>`;
  } else {
    box.innerHTML = `<div class="breath"><div class="orb" id="orb"></div><p class="phase" id="phase">Breathe in</p><p class="soft">In for 4, hold for 4, out for 4, hold for 4. Follow the circle.</p></div>`;
    const phases = ["Breathe in", "Hold", "Breathe out", "Hold"]; let k = 0;
    const orb = $("#orb"), ph = $("#phase");
    const tick = () => { ph.textContent = phases[k % 4]; orb.dataset.phase = k % 4; k++; };
    tick(); breatheTimer = setInterval(() => { if (!$("#orb")) return clearInterval(breatheTimer); tick(); }, 4000);
  }
}

function options(open) {
  view.innerHTML = `
    <h1 class="h">Your options</h1>
    <p class="soft">Nothing here is something you have to do. It's here so you know what's possible, when you're ready.</p>
    ${OPTIONS.map(o => `<details class="opt" ${o.id === open ? "open" : ""} id="opt-${o.id}"><summary>${esc(o.title)}</summary>${o.body.map(p => `<p>${esc(p)}</p>`).join("")}</details>`).join("")}
    <p class="fine">This is general information for the US, not legal or medical advice. Laws and services vary by state. An advocate (free, through RAINN) can tell you what applies to you.</p>`;
  if (open) setTimeout(() => $(`#opt-${open}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
}

function voices() {
  const wins = vault.unlocked() ? vault.get().wins : vault.scratch().wins;
  view.innerHTML = `
    <h1 class="h">Women who've been here</h1>
    <p class="soft">Real talks from survivors and advocates. Each one opens on ted.com, which will show up in your browser history. Content notes are listed where they apply.</p>
    ${VOICES.map(v => `<article class="voice"><b>${esc(v.title)}</b><div class="who">${esc(v.who)} · ${esc(v.where)}</div><p>${esc(v.about)}</p>
      ${v.note ? `<p class="cn">Content note: ${esc(v.note)}</p>` : ""}<a class="pill" href="${esc(v.url)}" target="_blank" rel="noopener noreferrer">Watch on ted.com ↗</a></article>`).join("")}
    <h2 class="h2">To read, when you're ready</h2>
    ${READING.map(r => `<article class="voice"><b>${esc(r.title)}</b><div class="who">${esc(r.who)}</div><p>${esc(r.about)}</p></article>`).join("")}
    <h2 class="h2">Your own strength</h2>
    <p class="soft">Write down one thing you've survived or done that you're proud of. You'll want to read these on hard days.</p>
    <form id="win" class="row"><input id="wintext" placeholder="I got out of bed today." aria-label="Something you're proud of"><button class="btn">Add</button></form>
    <div class="wins">${wins.slice().reverse().map(w => `<div class="win">${esc(w.text)}</div>`).join("") || '<p class="fine">Nothing yet. Even small things count.</p>'}</div>
    ${!vault.unlocked() ? '<p class="fine">These disappear when you leave. <a data-go href="#/privacy">Set a passcode</a> to keep them.</p>' : ""}`;
  $("#win").onsubmit = async e => {
    e.preventDefault(); const text = $("#wintext").value.trim(); if (!text) return;
    if (vault.unlocked()) await vault.update(d => d.wins.push({ text, at: Date.now() })); else vault.scratch().wins.push({ text, at: Date.now() });
    voices();
  };
}

function plan() {
  if (!vault.unlocked()) {
    view.innerHTML = `<h1 class="h">Safety plan</h1><p class="soft">A safety plan holds the things that are hard to remember in a scary moment: who to call, where to go, what to take. Because it's personal, Harbor only keeps it behind your passcode.</p>
      <a class="btn block" data-go href="#/privacy">${vault.exists() ? "Unlock" : "Set a passcode"}</a>`;
    return;
  }
  const p = vault.get().plan || {};
  const fields = [
    ["signs", "Signs things might be getting unsafe", "e.g. when he starts drinking, when he checks my phone"],
    ["people", "People I can call or text", "Names and numbers, or a code word you've agreed on"],
    ["places", "Safe places I can go", "A friend's place, a 24-hour store, a shelter"],
    ["take", "What I'd take with me", "ID, phone charger, medication, cash, keys"],
    ["calm", "Things that help me calm down", "A song, a person, a place, a smell"],
    ["reasons", "Reasons to keep going", "People, plans, things I love"],
  ];
  view.innerHTML = `<h1 class="h">Safety plan</h1><p class="soft">Fill in only what feels right. It's encrypted and stays on this phone.</p>
    <form id="planf">${fields.map(([k, l, ph]) => `<label class="field"><span>${l}</span><textarea name="${k}" rows="2" placeholder="${esc(ph)}">${esc(p[k] || "")}</textarea></label>`).join("")}
    <button class="btn block">Save plan</button></form>
    <p class="fine">If you share a phone or someone checks it, think about whether keeping this here is safe for you. The National Domestic Violence Hotline (1-800-799-7233) can help you plan.</p>`;
  $("#planf").onsubmit = async e => {
    e.preventDefault(); const fd = new FormData(e.target);
    await vault.update(d => { d.plan = Object.fromEntries(fd.entries()); }); toast("Saved");
  };
}

function steps() {
  const store = vault.unlocked() ? vault.get() : vault.scratch();
  const done = new Set(store.steps[today()] || []);
  const days = Object.keys(store.steps).length;
  const total = Object.values(store.steps).reduce((a, s) => a + s.length, 0);
  view.innerHTML = `<h1 class="h">Small steps</h1><p class="soft">Not a to-do list, and there's no streak to break. Just a place to notice what you did today.</p>
    <div class="steps">${SMALL_STEPS.map(s => `<button data-s="${esc(s)}" aria-pressed="${done.has(s)}">${esc(s)}</button>`).join("")}</div>
    <p class="soft center">${total ? `You've noted ${total} small step${total > 1 ? "s" : ""} across ${days} day${days > 1 ? "s" : ""}. They add up.` : "Anything counts. Even opening this app."}</p>
    ${!vault.unlocked() ? '<p class="fine center">These disappear when you leave. <a data-go href="#/privacy">Set a passcode</a> to keep them.</p>' : ""}`;
  view.querySelectorAll("[data-s]").forEach(b => b.onclick = async () => {
    const s = b.dataset.s; done.has(s) ? done.delete(s) : done.add(s);
    store.steps[today()] = [...done]; if (vault.unlocked()) await vault.save(); steps();
  });
}

function help() {
  view.innerHTML = `<h1 class="h">Talk to a person</h1><p class="soft">These are free and confidential. You don't have to give your name, and you can hang up any time.</p>
    ${HELP.map(h => `<article class="hotline${h.urgent ? " urgent" : ""}"><b>${esc(h.name)}</b><p>${esc(h.detail)}</p><div class="pills">
      ${h.call ? `<a class="pill${h.urgent ? " urgent" : ""}" href="tel:${h.call}">Call ${esc(h.callLabel || h.call)}</a>` : ""}
      ${h.text ? `<a class="pill" href="sms:${h.text.to}${h.text.body ? `?&body=${h.text.body}` : ""}">Text ${h.text.body ? `${h.text.body} to ` : ""}${h.text.to}</a>` : ""}
      ${h.chat ? `<a class="pill" href="${h.chat}" target="_blank" rel="noopener noreferrer">Online ↗</a>` : ""}</div></article>`).join("")}
    <p class="fine">Calls and texts appear in your phone's history. If someone checks your phone, you may want to delete them afterward, or use RAINN's online chat in a private browser window.</p>`;
}

function privacy() {
  const p = prefs.get();
  view.innerHTML = `<h1 class="h">Privacy &amp; settings</h1>
    <section class="card">
      <b>${vault.unlocked() ? "Unlocked" : vault.exists() ? "Locked" : "Nothing is saved"}</b>
      <p class="soft">${vault.unlocked() ? "Your journal, plan and anything you chose to keep are open. They lock when you leave, or after 5 minutes away." : vault.exists() ? "Enter your passcode to open what you saved." : "Right now nothing is kept after you leave. If you want to save your journal, safety plan or small steps, set a passcode. Everything is encrypted on this phone. There's no account, and no one, including the people who made Harbor, can read it or reset it."}</p>
      ${vault.unlocked() ? `<button class="btn" id="lock">Lock now</button>` : `<form id="pass" class="row"><input id="pw" type="password" inputmode="text" autocomplete="new-password" minlength="4" placeholder="${vault.exists() ? "Passcode" : "Choose a passcode (4+ characters)"}" aria-label="Passcode" required><button class="btn">${vault.exists() ? "Unlock" : "Set"}</button></form>`}
    </section>
    <section class="card"><label class="switch"><input type="checkbox" id="discreet" ${p.discreet ? "checked" : ""}><span><b>Discreet mode</b><br><span class="soft">Shows “Notes” in the tab and header instead of Harbor.</span></span></label></section>
    <section class="card"><b>Text size</b><div class="seg top8">${["s", "m", "l"].map(s => `<button data-size="${s}" aria-pressed="${(p.size || "m") === s}">${{ s: "Smaller", m: "Normal", l: "Larger" }[s]}</button>`).join("")}</div></section>
    <section class="card"><b>Leaving quickly</b><p class="soft">Tap <b>Leave</b> at the top, or press Esc twice. Harbor closes and opens a weather search. The back button won't bring it back.</p></section>
    <section class="card"><details><summary><b>Use an AI model on this device (optional)</b></summary>
      <p class="soft">By default Harbor's listener runs on simple rules, entirely on this phone. If you run a model yourself (for example Ollama on your own computer), you can connect it here. Harbor only allows connections to this device, and its safety checks still run first.</p>
      <form id="model"><label class="field"><span>Address</span><input id="murl" placeholder="http://localhost:11434/v1" value="${esc(p.modelUrl || "")}"></label>
      <label class="field"><span>Model</span><input id="mname" placeholder="llama3.1:8b" value="${esc(p.modelName || "")}"></label><button class="btn">Save</button></form></details></section>
    <section class="card"><b>Erase everything</b><p class="soft">Deletes your passcode, journal, plan and settings from this phone. This can't be undone.</p><button class="btn danger" id="wipe">Erase everything</button></section>
    <p class="fine">Harbor has no servers, no accounts, no analytics and no ads. It never sends what you write anywhere. Built as an independent project; please talk to a professional for medical, legal or mental health care.</p>`;
  const f = $("#pass");
  if (f) f.onsubmit = async e => {
    e.preventDefault(); const pw = $("#pw").value;
    if (vault.exists()) { if (await vault.unlock(pw)) { toast("Unlocked"); go(sessionStorage.getItem("n.pending") ? "#/write" : "#/privacy"); } else toast("That passcode didn't work"); }
    else { await vault.create(pw); toast("Passcode set. Your things are encrypted."); go(sessionStorage.getItem("n.pending") ? "#/write" : "#/privacy"); }
  };
  const lk = $("#lock"); if (lk) lk.onclick = () => { vault.lock(); chat = []; privacy(); };
  $("#discreet").onchange = e => { prefs.set({ discreet: e.target.checked }); applyPrefs(); };
  view.querySelectorAll("[data-size]").forEach(b => b.onclick = () => { prefs.set({ size: b.dataset.size }); applyPrefs(); privacy(); });
  $("#model").onsubmit = e => {
    e.preventDefault(); const url = $("#murl").value.trim();
    if (url && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url + "/")) return toast("For privacy, only addresses on this device are allowed");
    prefs.set({ modelUrl: url, modelName: $("#mname").value.trim() }); toast(url ? "Connected. Safety checks still run first." : "Using the built-in listener");
  };
  $("#wipe").onclick = () => { if (confirm("Erase everything Harbor saved on this phone? This can't be undone.")) { vault.wipe(); chat = []; applyPrefs(); toast("Erased"); go("#/"); } };
}

/* ------------------------------------------------------------------ router */
const ROUTES = [
  [/^#?\/?$/, home, "home"], [/^#\/talk$/, talk, "talk"], [/^#\/tap$/, tap, "talk"], [/^#\/show$/, show, "talk"],
  [/^#\/write$/, write, "write"], [/^#\/calm(?:\/(\w+))?$/, calm, "calm"], [/^#\/options(?:\/(\w+))?$/, options, "home"],
  [/^#\/voices$/, voices, "home"], [/^#\/plan$/, plan, "me"], [/^#\/steps$/, steps, "me"], [/^#\/help$/, help, "help"],
  [/^#\/privacy$/, privacy, "me"],
];
function route() {
  clearInterval(breatheTimer);
  document.querySelectorAll(".present").forEach(x => x.remove());
  const h = location.hash || "#/";
  for (const [rx, fn, tab] of ROUTES) {
    const m = h.match(rx);
    if (m) {
      document.querySelectorAll(".nav a").forEach(a => a.classList.toggle("on", a.dataset.tab === tab));
      fn(m[1]); window.scrollTo(0, 0); view.focus({ preventScroll: true }); return;
    }
  }
  go("#/");
}
window.addEventListener("hashchange", route);
$("#leave").onclick = leave;
applyPrefs();
route();
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
