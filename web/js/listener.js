// Harbor's listener. Runs entirely on the device.
//
// Order matters: safety checks run first and always win, then theme detection, then a gentle
// reflection. It never asks "why", never asks for details, never tells her what she should have done,
// and never pushes her to report. Every reply is short, because long replies are hard to take in
// when you're overwhelmed.

const any = (text, words) => words.some(w => (w instanceof RegExp ? w.test(text) : text.includes(w)));

// ---------------------------------------------------------------- safety
const DANGER = [/\b(he|she|they)('s| is| are) (here|outside|coming|at the door|in the house)\b/, /\bnot safe (right )?now\b/,
  /\b(going to|gonna|will) (hurt|kill) me\b/, /\b(locked|trapped) (in|me)\b/, /\bhelp me (now|please)\b/, /\bi'?m in danger\b/,
  /\bhe('s| is) (hitting|hurting|chasing)\b/, /\bhe has a (gun|knife|weapon)\b/];
const SELF_HARM = [/\b(kill|hurt|cut|harm) myself\b/, /\bend (it all|my life)\b/, /\b(want|wanna|going) to die\b/,
  /\bdon'?t want to (live|be alive|exist|be here)( anymore)?\b/, /\bsuicid/, /\bno (point|reason) (in )?(living|to live|going on)\b/,
  /\bbetter off (dead|without me)\b/, /\bcan'?t (do this|go on|keep going) anymore\b/, /\bwish i (was|were) dead\b/, /\boverdose\b/];
const RECENT = [/\b(last night|tonight|this morning|yesterday|today|few hours ago|just happened|earlier today|this weekend)\b/];
const ASSAULT_WORDS = [/\b(rape|raped|assault|assaulted|forced|attacked|abused|molested|touched me|made me|violated|drugged)\b/];

export const SAFETY = {
  danger: {
    text: "I'm really glad you told me. If you're in danger right now, please call 911 if you can. If calling isn't safe, you can text 911 in many areas, or tap Leave to close this app quickly.",
    tools: ["call911", "dvText", "exit"] },
  selfharm: {
    text: "Thank you for telling me. That sounds incredibly heavy, and you don't have to carry it alone tonight. You can call or text 988 any time to talk to someone who's trained for exactly this. Are you safe right now?",
    tools: ["call988", "text988", "rainn"] },
  recent: {
    text: "I'm so sorry. It sounds like this happened very recently. You don't have to decide anything right now. If you want, I can share what medical care is available, which works best soon after. Or we can just stay here for a minute.",
    tools: ["optMedical", "rainn", "breathe"] },
};

export function safetyCheck(raw) {
  const t = raw.toLowerCase();
  if (any(t, SELF_HARM)) return "selfharm";
  if (any(t, DANGER)) return "danger";
  if (any(t, RECENT) && any(t, ASSAULT_WORDS)) return "recent";
  return null;
}

// ---------------------------------------------------------------- themes
// Each theme: patterns, and a few replies so she doesn't hear the same sentence twice.
const THEMES = [
  { id: "freeze", p: [/\bfroze\b/, /\bfreeze\b/, /couldn'?t (move|speak|scream|say anything)/, /didn'?t (fight|say no|stop (him|them|it)|scream|run)/, /\bjust lay there\b/, /went along/],
    r: ["Freezing is one of the most common ways a body responds to danger. It happens automatically, before you can choose. It isn't consent, and it isn't a failure.",
        "So many survivors say exactly that. Your body was trying to keep you safe in the only way it could in that moment. That's not on you."],
    tools: ["optConsent"] },
  { id: "blame", p: [/\bmy fault\b/, /\bi should (have|'ve)\b/, /\bi (shouldn'?t|should not) have\b/, /\bi let (him|them|it)\b/, /\bi (was|got) (drunk|high|wasted)\b/,
      /\bi asked for it\b/, /\bi (went|invited|flirted|kissed)\b/, /\bwhat i was wearing\b/, /\bi led (him|them) on\b/, /\bblame (myself|me)\b/],
    r: ["It wasn't your fault. Not what you wore, not what you drank, not where you went, not that you knew them. The only person responsible is the one who chose to hurt you.",
        "I hear how much you're blaming yourself. That's a really common feeling after something like this, and it's so painful. But choosing to hurt someone is always on the person who did it.",
        "Looking back, our minds search for what we could have done differently, because that feels like control. But nothing you did made this okay or made it your fault."] },
  { id: "believed", p: [/\b(no one|nobody|they|he|she|people) (will|would|won'?t|wouldn'?t) believe\b/, /\bdidn'?t believe me\b/, /\bthink i'?m lying\b/, /\bmaking it up\b/, /\bover ?reacting\b/],
    r: ["I believe you.",
        "I believe you. Being doubted after something like this can hurt almost as much as the thing itself. Your experience is real, whether or not anyone else understands it yet."] },
  { id: "known", p: [/\bmy (boyfriend|husband|partner|ex|date|friend|best friend|boss|manager|coworker|teacher|coach|uncle|cousin|brother|stepdad|stepfather|father|dad|neighbor|roommate)\b/, /\bsomeone i (knew|know|trusted|love|loved)\b/],
    r: ["When it's someone you know or trusted, it can be so much more confusing. You might feel loyalty, fear, love and anger all at once. All of that can be true, and it still wasn't okay.",
        "It still counts when it's someone you know. Most survivors know the person who hurt them. That doesn't make it smaller or your fault."],
    tools: ["optConsent", "dv"] },
  { id: "alone", p: [/\b(no one|nobody) to (talk|tell)\b/, /\bcan'?t tell (anyone|anybody|my)\b/, /\b(so|all) alone\b/, /\bfeel alone\b/, /\bno one understands\b/, /\bhaven'?t told\b/, /\bnever told\b/],
    r: ["Carrying this by yourself is so heavy. You've shared some of it here, and that matters. You don't have to tell anyone until you're ready, and if you want to, I can help you find the words.",
        "You're not alone in this, even if it feels that way. A lot of women have sat exactly where you are, not knowing who to tell. When you're ready, there are people who will listen without judging."],
    tools: ["showCards", "rainn"] },
  { id: "shame", p: [/\bashamed\b/, /\bshame\b/, /\b(feel|so) (dirty|disgusting|gross|ruined|broken|damaged|worthless)\b/, /\bembarrass/, /\bhate (my body|myself)\b/],
    r: ["Shame is one of the hardest parts, and it's a lie that trauma tells. What happened was done to you. It says something about them, not about your worth.",
        "You are not ruined and you are not broken. You're a person who was hurt, and you're still here, still you."] },
  { id: "numb", p: [/\bnumb\b/, /\bfeel nothing\b/, /\bdon'?t feel anything\b/, /\bempty\b/, /\bnot real\b/, /\bfar away\b/, /\bdisconnected\b/, /\bon autopilot\b/],
    r: ["Feeling numb is a way the mind protects itself when something is too much to feel all at once. It makes sense, and it usually doesn't last forever.",
        "That far-away, not-quite-real feeling is really common after trauma. Sometimes grounding helps bring you back gently. Want to try one together?"],
    tools: ["grounding"] },
  { id: "flashback", p: [/\bflashback/, /\bnightmare/, /\bcan'?t (stop thinking|get it out|sleep)\b/, /\bkeep (seeing|thinking|remembering)\b/, /\bremind(s|ed) me\b/, /\btrigger/, /\bpanic/, /\bheart (is )?racing\b/],
    r: ["That sounds exhausting. Flashbacks and nightmares are your mind trying to process something overwhelming. You're here now, and right now you're safe enough to breathe.",
        "When it comes back like that, it can feel like it's happening again. It isn't. Let's slow your breathing together for a moment, if you'd like."],
    tools: ["breathe", "grounding"] },
  { id: "angry", p: [/\bangry\b/, /\bfurious\b/, /\brage\b/, /\bhate (him|them|her)\b/, /\bpissed\b/, /\bso mad\b/],
    r: ["Your anger makes sense. Someone crossed a line they had no right to cross. Anger can be a sign that part of you knows you deserved better.",
        "It's okay to be angry. You don't have to make it nice or quiet here."] },
  { id: "scared", p: [/\b(scared|afraid|terrified|frightened)\b/, /\bfear\b/, /\banxious\b/, /\bon edge\b/],
    r: ["Feeling scared after something like this is so understandable. Your nervous system is on high alert, trying to protect you.",
        "That fear makes sense. If it would help, we can make a small safety plan, just for you, kept on this phone."],
    tools: ["safetyPlan", "breathe"] },
  { id: "report", p: [/\b(report|police|cops|press charges|title ix|hr)\b/],
    r: ["Whether to report is completely your decision, and there's no wrong choice. If you want, I can show you what each option involves, without committing you to anything.",
        "Some people report right away, some years later, some never. All of those are okay. An advocate can explain the process privately if you want to know more."],
    tools: ["optReport", "rainn"] },
  { id: "was_it", p: [/\bwas it (rape|assault|abuse)\b/, /\bdoes (it|this) count\b/, /\bis (it|this|that) (rape|assault)\b/, /\bnot sure (if|it was)\b/, /\bmaybe i'?m overreacting\b/],
    r: ["You don't have to be sure, and you don't have to put a name on it to deserve support. If something happened that you didn't freely want, your feelings about it are valid.",
        "That's a question a lot of women carry. If you'd like, I can show you what consent means. Some people find it helps to see it written down."],
    tools: ["optConsent"] },
  { id: "body", p: [/\bdon'?t want to be touched\b/, /\bcan'?t (be|stand being) touched\b/, /\bmy body\b/, /\bshower(ed|ing)?\b/, /\bscrub\b/],
    r: ["Not wanting to be touched, or wanting to wash it away: those are really common reactions. Your body is yours. You get to decide who comes near it, and when.",
        "Be gentle with your body. It carried you through something it shouldn't have had to."] },
  { id: "hopeless", p: [/\bnever (be|get) (better|over|okay|normal)\b/, /\bruined my life\b/, /\bwhat'?s the point\b/, /\bno hope\b/, /\bcan'?t move on\b/, /\bstuck\b/, /\bwill (this|it) ever (stop|end|get better)\b/],
    r: ["It might not feel like it now, but this is not the end of your story. Healing is slow and uneven, but so many women who once felt exactly this way have found their way to good days again.",
        "Right now it might be hard to imagine feeling better, and that's okay. You don't have to believe it yet. You just have to get through today. Would hearing from women who've been through this help?"],
    tools: ["voices"] },
  { id: "progress", p: [/\b(feel|felt|feeling) (better|a bit better|okay|stronger|lighter)\b/, /\bi told (someone|my|a friend|her|him)\b/, /\bi (called|talked to) (a|the) (hotline|counselor|therapist)\b/, /\bgood day\b/, /\bproud\b/],
    r: ["That's really something. Hold onto that. Small steps are still steps, and you took this one.",
        "I'm really glad to hear that. You're doing something brave, even on the days it doesn't feel like it."],
    tools: ["steps"] },
  { id: "thanks", p: [/^(thank you|thanks|thx|ty)\b/],
    r: ["Of course. I'm here whenever you want to come back, and you can leave any time.",
        "You're welcome. Be gentle with yourself today."] },
  { id: "hello", p: [/^(hi|hey|hello|hii+|hey there)\b[\s!.]*$/],
    r: ["Hi. I'm really glad you're here. You can tell me as much or as little as you want, or nothing at all. What's on your mind?"] },
];

const REFLECT = [
  "I'm listening. Take all the time you need.",
  "Thank you for trusting me with that. How are you feeling right now, as you write it?",
  "That sounds really hard. You don't have to explain it all. I'm here.",
  "I hear you. Whatever you're feeling about it is okay to feel.",
  "You're doing something hard just by putting it into words. Would you like to keep going, or take a breath first?",
];
const SHORT = [
  "That's okay. You don't need the right words. If it's easier, you can tap how you feel instead of typing.",
  "It's okay to not know. We can just sit here for a moment. There's no rush.",
];

const BLAME_OUTPUT = [/\bwhy did(n'?t)? you\b/i, /\byou should (have|'ve)\b/i, /\bwhat were you (wearing|thinking|doing)\b/i, /\bare you sure\b/i,
  /\bit (was|is) (partly|also) your\b/i, /\bovereact/i, /\bcalm down\b/i, /\bat least\b/i];

/** Screen any generated reply (from a model, if one is connected) for things a survivor should never hear. */
export function unsafeReply(text) {
  return BLAME_OUTPUT.filter(rx => rx.test(text)).map(rx => rx.source);
}

export function newState() { return { turns: 0, used: {}, themes: [] }; }

function pick(list, key, state) {
  const n = state.used[key] || 0;
  state.used[key] = n + 1;
  return list[n % list.length];
}

/**
 * respond(text, state) → { text, tools, crisis, themes }
 * Pure function of the text and a small state object, so it is easy to test.
 */
export function respond(raw, state = newState()) {
  state.turns += 1;
  const text = (raw || "").trim();
  const t = text.toLowerCase();
  const crisis = safetyCheck(t);
  if (crisis) return { text: SAFETY[crisis].text, tools: SAFETY[crisis].tools, crisis, themes: [crisis] };

  if (t.replace(/[^a-z]/g, "").length < 3 || /^(idk|i don'?t know|dunno|nothing|\.+|\?+)$/.test(t)) {
    return { text: pick(SHORT, "short", state), tools: ["feelings"], crisis: null, themes: ["short"] };
  }

  const hits = THEMES.filter(th => any(t, th.p));
  if (!hits.length) {
    return { text: pick(REFLECT, "reflect", state), tools: state.turns > 3 && state.turns % 3 === 1 ? ["breathe"] : [], crisis: null, themes: [] };
  }
  // Up to two themes, most important first (order in THEMES), so the reply stays short.
  const top = hits.slice(0, 2);
  const parts = top.map(th => pick(th.r, th.id, state));
  const tools = [...new Set(top.flatMap(th => th.tools || []))].slice(0, 3);
  state.themes.push(...top.map(th => th.id));
  return { text: parts.join(" "), tools, crisis: null, themes: top.map(th => th.id) };
}

const FEELING_REPLY = {
  scared: "Being scared makes so much sense.", numb: "Feeling numb is a way your mind protects you.",
  ashamed: "Shame belongs to the person who hurt you, not you.", angry: "Your anger is valid.",
  confused: "It's okay to feel confused. Trauma scrambles things.", alone: "You're not as alone as it feels right now.",
  unsafe: "Your safety comes first.", nosleep: "Not sleeping makes everything harder.", tired: "Of course you're exhausted.",
  guilty: "It wasn't your fault.", dirty: "You are not dirty. Something was done to you.", okay: "I'm glad you're okay right now.",
  hopeful: "Hold onto that little bit of hope.", dunno: "Not knowing is okay too.",
};
const NEED_REPLY = {
  heard: ["I'm here and I'm listening. Write whenever you're ready, or tap again.", ["talk"]],
  notalone: ["You're not alone. If you want a real person right now, RAINN's hotline is free, confidential and open all night.", ["rainn", "talk"]],
  safe: ["Let's focus on safety. If you're in danger, call 911. Otherwise, a small safety plan can help you feel more in control.", ["safetyPlan", "call911"]],
  info: ["Here are your options, with no pressure to choose any of them.", ["options"]],
  calm: ["Let's slow down together. Breathe in for four, hold for four, out for four.", ["breathe", "grounding"]],
  tell: ["You don't have to say it out loud. You can show someone a card with the words already on it.", ["showCards"]],
};

export function respondToTaps(feelings = [], needs = []) {
  if (feelings.includes("unsafe")) return { text: SAFETY.danger.text, tools: SAFETY.danger.tools, crisis: "danger", themes: ["unsafe"] };
  const f = feelings.map(id => FEELING_REPLY[id]).filter(Boolean).slice(0, 3).join(" ");
  const n = needs[0] && NEED_REPLY[needs[0]];
  const text = [f || "Thank you for showing me.", n ? n[0] : "Whatever you're feeling is allowed here."].join(" ");
  const tools = n ? n[1] : (feelings.includes("guilty") || feelings.includes("dirty") ? ["optConsent", "talk"] : ["talk"]);
  return { text, tools, crisis: null, themes: feelings };
}

// Used when a local model is connected. The rules above still run first and screen what comes back.
export const MODEL_PROMPT = `You are Harbor, a gentle, trauma-informed listener for women who have experienced sexual violence.
Rules you must always follow:
- Believe her. Never question whether it happened or whether it "counts".
- Never ask "why". Never ask for details of what happened.
- Never suggest she could have prevented it, and never mention what she wore, drank or did.
- Never push her to report, forgive, or tell anyone. Every choice is hers.
- Do not diagnose. You are not a therapist and you don't pretend to be.
- Keep replies to 2-4 short sentences. Warm, plain words. No lists, no headings.
- Reflect what she feels, validate it, and offer one gentle, optional next step at most.
- If she mentions danger or hurting herself, gently share 911 or 988 and ask if she's safe.`;
