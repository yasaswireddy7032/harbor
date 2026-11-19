// Everything Harbor says outside the listener lives here, so it can be reviewed in one place
// by an advocate or counselor before release. US-focused; numbers checked November 2026.

export const HELP = [
  { id: "911", name: "Emergency", detail: "If you're in danger right now", call: "911", urgent: true },
  { id: "rainn", name: "RAINN National Sexual Assault Hotline", detail: "Free, confidential, 24/7. English and Spanish.",
    call: "18006564673", callLabel: "800-656-4673", chat: "https://hotline.rainn.org/online", text: { to: "64673", body: "HOPE" } },
  { id: "988", name: "988 Suicide & Crisis Lifeline", detail: "If you're thinking about ending your life or hurting yourself. Call or text.",
    call: "988", callLabel: "988", text: { to: "988", body: "" } },
  { id: "dv", name: "National Domestic Violence Hotline", detail: "If it's a partner, ex or someone you live with. 24/7.",
    call: "18007997233", callLabel: "1-800-799-7233", text: { to: "88788", body: "START" }, chat: "https://www.thehotline.org" },
  { id: "ctl", name: "Crisis Text Line", detail: "Text with a trained counselor, any time.", text: { to: "741741", body: "HOME" } },
  { id: "intl", name: "Outside the US", detail: "Find a free helpline in your country.", chat: "https://findahelpline.com" },
];

export const AFFIRMATIONS = [
  "What happened was not your fault.",
  "You don't owe anyone your story. Not even all of it to yourself, all at once.",
  "Freezing, going along, not fighting back: these are ways bodies survive. They are not consent.",
  "Your feelings make sense, even the ones that don't seem to.",
  "Healing isn't a straight line. A hard day doesn't erase the progress.",
  "You are allowed to take up space, to rest, and to ask for help.",
  "It still counts if you knew them. It still counts if it was a long time ago.",
  "You survived something hard. That took more strength than anyone saw.",
  "This is not the end of your story.",
  "You get to decide what happens next, at your own pace.",
];

// "Say it without words": tap instead of type.
export const FEELINGS = [
  { id: "scared", label: "Scared", emoji: "🫣" }, { id: "numb", label: "Numb", emoji: "😶" },
  { id: "ashamed", label: "Ashamed", emoji: "🙈" }, { id: "angry", label: "Angry", emoji: "😤" },
  { id: "confused", label: "Confused", emoji: "😵‍💫" }, { id: "alone", label: "Alone", emoji: "🫥" },
  { id: "unsafe", label: "Not safe", emoji: "⚠️" }, { id: "nosleep", label: "Can't sleep", emoji: "🌙" },
  { id: "tired", label: "Exhausted", emoji: "😮‍💨" }, { id: "guilty", label: "Like it's my fault", emoji: "💭" },
  { id: "dirty", label: "Dirty", emoji: "🚿" }, { id: "okay", label: "Okay right now", emoji: "🌿" },
  { id: "hopeful", label: "A little hopeful", emoji: "🌤️" }, { id: "dunno", label: "I don't know", emoji: "🤍" },
];
export const NEEDS = [
  { id: "heard", label: "To be heard" }, { id: "notalone", label: "To not feel alone" }, { id: "safe", label: "To feel safe" },
  { id: "info", label: "To know my options" }, { id: "calm", label: "To calm down" }, { id: "tell", label: "Help telling someone" },
];

// Cards to show a doctor, nurse, counselor, friend or officer when speaking is too hard.
export const SHOW_CARDS = [
  "Something happened to me that I can't talk about yet.",
  "I'm finding it hard to speak. Can I type or point instead?",
  "I'd feel safer with a woman doctor or nurse, if possible.",
  "Please ask before you touch me, and tell me what you're doing.",
  "I don't want to give details right now.",
  "I may need breaks. Please be patient with me.",
  "I'd like to talk to an advocate.",
  "I need help getting somewhere safe.",
  "Please don't tell anyone without asking me first.",
  "I'm not ready to report, but I need medical care.",
];

export const JOURNAL_PROMPTS = [
  "What's sitting heaviest on you right now? You can write one word.",
  "Write a letter you'll never send. To them, to someone who wasn't there, or to yourself.",
  "What would you say to a friend who told you this happened to her?",
  "Name one thing that helped you get through today, even if it's small.",
  "What do you wish someone would say to you?",
  "Describe a place where you feel safe, real or imagined.",
  "What's one thing you want for yourself a year from now?",
];

export const SMALL_STEPS = [
  "Drank some water", "Ate something", "Slept a little", "Went outside", "Took a shower when I wanted to",
  "Did something kind for myself", "Told one person", "Talked to a hotline or advocate", "Said no to something I didn't want",
  "Got through a hard moment", "Let myself cry", "Laughed at something",
];

// No pressure. Each option says plainly that it's her choice.
export const OPTIONS = [
  { id: "medical", title: "Medical care", body: [
    "You can get medical care whether or not you ever report. Many hospitals have specially trained nurses (sometimes called SANE nurses) who do sexual assault exams.",
    "Some care is time-sensitive: emergency contraception and medicine to prevent HIV work best within about 72 hours. Evidence can often be collected for up to about 5 days.",
    "You can say no to any part of an exam, at any point. You can bring someone with you, or ask for an advocate to be there.",
    "RAINN (800-656-4673) can tell you which hospitals near you have trained staff." ] },
  { id: "advocate", title: "Talk to an advocate", body: [
    "Advocates are free and confidential. They don't push you to do anything. They explain options, go with you to the hospital or police if you want, and help with things like housing or work.",
    "Calling RAINN connects you to a local sexual assault service provider." ] },
  { id: "report", title: "Reporting (only if you want to)", body: [
    "Reporting is your decision. Not reporting doesn't mean it didn't happen or didn't matter.",
    "You can report to police. Students can also report to their school's Title IX office, and employees can report to HR. These are separate and you can choose one, all or none.",
    "Time limits for criminal charges depend on your state and what happened. An advocate can help you find out without committing you to anything.",
    "If you might want to report later, writing down what you remember (in your own time) and keeping texts or messages can help. Harbor's journal stays private on this device." ] },
  { id: "safety", title: "Safety and protective orders", body: [
    "If the person is someone you live with, date or see often, you can ask a court for a protective order. Advocates and the National Domestic Violence Hotline (1-800-799-7233) can walk you through it.",
    "A safety plan can help: who you'd call, where you'd go, what you'd take. You can make one privately in Harbor." ] },
  { id: "therapy", title: "Therapy and support groups", body: [
    "Trauma-focused therapies like Cognitive Processing Therapy (CPT), Prolonged Exposure, trauma-focused CBT and EMDR have good evidence behind them.",
    "Support groups, in person or online, can make it feel less lonely. Many local sexual assault centers run free ones.",
    "It's okay to try a therapist and decide they're not right for you. You deserve someone you feel safe with." ] },
  { id: "consent", title: "Was it assault?", body: [
    "Consent means a clear, freely given yes, and it can be taken back at any time. It can't be given by someone who is asleep, unconscious, too drunk or high, or afraid.",
    "Not saying no, freezing, or going along to get it over with is not consent.",
    "It can be assault even if it was a partner, a husband, a date or a friend, and even if you'd said yes before.",
    "You don't have to put a name on it to deserve support." ] },
  { id: "reactions", title: "What you might be feeling", body: [
    "Many survivors feel numb, on edge, ashamed, angry, or like it wasn't real. Some feel almost nothing for a while. Some feel everything at once.",
    "Trouble sleeping, nightmares, flashbacks, not wanting to be touched, and feeling far away from your body are common reactions to trauma.",
    "These are signs your mind and body went through something overwhelming. They are not signs that you're broken, and they often ease with time and support." ] },
];

// Real, public talks. Verified on ted.com, November 2026. Linked, not embedded, so nothing loads from a third party
// unless she chooses to open it.
export const VOICES = [
  { title: "Me Too is a movement, not a moment", who: "Tarana Burke", where: "TEDWomen 2018",
    url: "https://www.ted.com/talks/tarana_burke_me_too_is_a_movement_not_a_moment",
    about: "The founder of the 'me too' movement on why it was always about survivors healing and being heard, and the work of building a world without sexual violence.", note: null },
  { title: "Why children stay silent following sexual violence", who: "Kristin Jones", where: "TED",
    url: "https://www.ted.com/talks/kristin_jones_sexual_assault_shame_and_teaching_kids_to_ask_for_help",
    about: "An advocate shares how she worked through the shame that followed abuse as a teenager, and why it's never the victim's fault.", note: "Talks about abuse as a teenager." },
  { title: "Breaking the barriers of sexual abuse", who: "Jessica T. White", where: "TEDx",
    url: "https://www.ted.com/talks/jessica_t_white_breaking_the_barriers_of_sexual_abuse",
    about: "Drawing on her own experience and her work with survivors, one path to healing.", note: null },
  { title: "From victim to survivor, finding hope and healing", who: "Wendy Jessen", where: "TEDxCedarCity",
    url: "https://www.ted.com/talks/wendy_jessen_from_victim_to_survivor_finding_hope_and_healing",
    about: "A survivor and writer on moving from surviving to healing. Includes a faith-based perspective.", note: null },
  { title: "Being Victim 125", who: "Sarah Klein", where: "TEDxRapidCity",
    url: "https://www.ted.com/talks/sarah_klein_being_victim_125",
    about: "A survivor of years of abuse by a team doctor on how that trauma disconnected her from herself, and on finding her voice.", note: "Describes childhood sexual abuse directly." },
];

export const READING = [
  { title: "Know My Name", who: "Chanel Miller", about: "A memoir by the survivor of the 2015 Stanford case, about reclaiming her name, her voice and her life." },
  { title: "The Body Keeps the Score", who: "Bessel van der Kolk", about: "A psychiatrist on how trauma lives in the body, and the many ways people recover." },
];
