import { test } from "node:test";
import assert from "node:assert/strict";
import { newState, respond, respondToTaps, safetyCheck, unsafeReply } from "../web/js/listener.js";

const say = (t, s = newState()) => respond(t, s);

test("self-harm always wins, and points to 988", () => {
  for (const t of ["I want to die", "i dont want to live anymore", "sometimes I think about killing myself... no wait, kill myself",
                   "I can't do this anymore", "everyone would be better off without me"]) {
    const r = say(t);
    assert.equal(r.crisis, "selfharm", t);
    assert.match(r.text, /988/);
  }
});

test("immediate danger points to 911 and the quick exit", () => {
  for (const t of ["he's outside my door", "I'm not safe right now", "he is going to hurt me", "he has a knife"]) {
    const r = say(t);
    assert.equal(r.crisis, "danger", t);
    assert.ok(r.tools.includes("call911") && r.tools.includes("exit"));
  }
});

test("a recent assault offers time-sensitive medical info without pressure", () => {
  const r = say("he raped me last night");
  assert.equal(r.crisis, "recent");
  assert.ok(r.tools.includes("optMedical"));
  assert.match(r.text, /don't have to decide/);
});

test("ending a relationship is not treated as self-harm", () => {
  assert.equal(safetyCheck("i want to end it with him"), null);
});

test("self-blame is met with 'it wasn't your fault'", () => {
  for (const t of ["it was my fault, I was drunk", "I should have left earlier", "i let him", "I keep thinking about what I was wearing"]) {
    assert.match(say(t).text, /wasn't your fault|on the person who did it|nothing you did/i, t);
  }
});

test("freezing is explained as a survival response", () => {
  const r = say("I froze. I didn't even say no");
  assert.ok(r.themes.includes("freeze"));
  assert.match(r.text, /isn't consent|body was trying to keep you safe/);
});

test("fear of not being believed gets 'I believe you'", () => {
  assert.match(say("no one will believe me").text, /I believe you/);
});

test("it counts when it's someone she knows", () => {
  const r = say("it was my boyfriend");
  assert.ok(r.themes.includes("known"));
  assert.match(r.text, /still|wasn't okay/);
});

test("very short or empty messages offer tapping instead of typing", () => {
  for (const t of ["idk", "...", "", "i don't know"]) assert.ok(say(t).tools.includes("feelings"), t);
});

test("replies rotate instead of repeating the same sentence", () => {
  const s = newState();
  const a = respond("it's my fault", s).text, b = respond("it's all my fault", s).text;
  assert.notEqual(a, b);
});

test("no reply ever contains blaming or doubting language", () => {
  const samples = ["hi", "my fault", "froze", "no one will believe me", "my husband", "I'm so alone", "I feel dirty", "numb",
    "nightmares every night", "so angry", "scared", "should I report", "was it rape", "can't be touched", "I'll never be okay",
    "I told my sister today", "thank you", "something happened at a party", "I don't know how to say this"];
  const s = newState();
  for (const t of samples) {
    const r = respond(t, s);
    assert.deepEqual(unsafeReply(r.text), [], `${t} -> ${r.text}`);
    assert.doesNotMatch(r.text, /\bwhy\b/i, `asked why: ${t}`);
    assert.ok(r.text.length < 420, `too long for an overwhelmed reader: ${t}`);
  }
});

test("the output screen catches the classic harmful phrases", () => {
  assert.ok(unsafeReply("Why didn't you leave?").length);
  assert.ok(unsafeReply("You should have told someone sooner.").length);
  assert.ok(unsafeReply("What were you wearing?").length);
  assert.ok(unsafeReply("At least it wasn't worse.").length);
  assert.deepEqual(unsafeReply("I believe you. It wasn't your fault."), []);
});

test("tapping 'Not safe' goes straight to safety", () => {
  assert.equal(respondToTaps(["unsafe", "numb"], []).crisis, "danger");
});

test("tapping feelings and a need gives a short, matching reply", () => {
  const r = respondToTaps(["guilty", "alone"], ["tell"]);
  assert.match(r.text, /wasn't your fault/);
  assert.ok(r.tools.includes("showCards"));
});
