import { useState, useEffect, useRef } from "react";

const SECTIONS = [
  { id: "checkin", label: "Check-In", range: [0, 4] },
  { id: "patterns", label: "Patterns", range: [5, 14] },
  { id: "scenarios", label: "Scenarios", range: [15, 19] },
  { id: "context", label: "Context", range: [20, 24] },
];

const DIMENSIONS = {
  AA: { name: "Anger Activation", max: 35, color: "#E85D3A" },
  DW: { name: "Depressive Withdrawal", max: 45, color: "#4A6FA5" },
  EOZ: { name: "Emotional Overlap", max: 25, color: "#9B72AA" },
  MB: { name: "Masking Behavior", max: 18, color: "#D4A843" },
  SE: { name: "Somatic Expression", max: 20, color: "#5BA88F" },
  CD: { name: "Cognitive Distortion", max: 22, color: "#C4736E" },
};

const PROFILES = {
  pressure_cooker: {
    emoji: "🔥",
    name: "The Pressure Cooker",
    summary: "Externalized intensity — anger without a clear outlet",
    description:
      "Your emotional pattern shows a lot of energy that doesn't have a clear outlet. You may be experiencing frustration, resentment, or a sense of injustice — and it's showing up as irritability, tension, or a short fuse. This isn't \"just being angry\" — it's a signal that something in your environment or life situation needs to change, and your emotional system is sounding the alarm.",
    practices: [
      "Boundary-setting exercises",
      "Anger journaling — what's underneath the frustration",
      "Identifying unmet needs behind the anger",
      "Physical release practices (movement, breathwork)",
    ],
  },
  slow_fade: {
    emoji: "🌊",
    name: "The Slow Fade",
    summary: "Quiet depletion — energy and interest gradually dimming",
    description:
      "Your emotional pattern shows a gradual dimming of energy, interest, and motivation. You may not feel \"sad\" in the dramatic way people expect — it might just feel like everything is muted, heavy, or like you're moving through fog. This kind of quiet emotional drain often goes unrecognized because it doesn't match the stereotype of depression. But the withdrawal, the flatness, the effort it takes to do ordinary things — those are signals worth understanding.",
    practices: [
      "Behavioral activation — small, low-stakes actions to rebuild momentum",
      "Social connection nudges",
      "Energy tracking throughout the day",
      "Gentle routine restoration",
    ],
  },
  shapeshifter: {
    emoji: "🔀",
    name: "The Shapeshifter",
    summary: "Oscillating between anger and withdrawal — toggling between fight and shutdown",
    description:
      "Your emotional pattern is showing up as both anger and low mood — and they may be feeding each other. One day you're irritable and reactive; the next you're flat and withdrawn. This isn't confusion — it's your emotional system toggling between fight mode and shutdown mode, and it's more common than most people realize. The key is learning to read which state you're in and what it needs.",
    practices: [
      "Emotional labeling practice — naming the state before reacting",
      "Mood tracking to identify oscillation triggers",
      "Nervous system regulation techniques",
      "Window of tolerance exercises",
    ],
  },
  performer: {
    emoji: "🎭",
    name: "The Performer",
    summary: "Managing the outside while struggling inside — the cost of \"I'm fine\"",
    description:
      "On the surface, you're managing. But underneath the \"I'm fine,\" there's a different story. Your pattern suggests you've gotten very skilled at masking what you're really feeling — which takes enormous energy. The gap between how you present and how you actually feel is worth paying attention to, because maintaining that performance has a real cost over time.",
    practices: [
      "Authenticity micro-practices — small moments of honesty",
      "Safe disclosure exercises",
      "Calculating the \"cost of masking\"",
      "Building trust bridges with select people",
    ],
  },
  body_score: {
    emoji: "⚡",
    name: "The Body Keeps Score",
    summary: "Emotions speaking through physical symptoms",
    description:
      "Your emotions are speaking through your body more than your thoughts. You might not feel \"emotionally\" upset, but the headaches, tension, fatigue, or restlessness are telling a story. This somatic pattern often shows up when emotions have been intellectualized or suppressed for a long time — the mind says \"I'm fine\" but the body disagrees.",
    practices: [
      "Body scan meditation",
      "Somatic experiencing exercises",
      "Movement-based emotional release",
      "Tension mapping and targeted relaxation",
    ],
  },
  thought_loop: {
    emoji: "🔄",
    name: "The Thought Loop",
    summary: "Cognitive patterns amplifying emotional distress",
    description:
      "Your emotional experience is being heavily shaped by recurring thought patterns — maybe replaying events, harsh self-talk, or catastrophic predictions. The emotions you're feeling are real, but they're being amplified or distorted by cognitive habits that have become automatic. The good news: these patterns, once spotted, can be interrupted and gradually reshaped.",
    practices: [
      "Cognitive restructuring basics",
      "Thought records — catching the loop in action",
      "Defusion techniques from ACT",
      "Reframing exercises",
    ],
  },
};

const PROGRAMS = [
  {
    id: "burnout",
    name: "Burnout Blueprint",
    tagline: "Recognizing, recovering from, and preventing burnout",
    icon: "🔋",
    condition: (d, triggers) => d.AA > 40 && triggers.includes("WORK"),
    weight: (d) => d.AA * 2 + d.SE,
  },
  {
    id: "stress",
    name: "Stress Decoded",
    tagline: "Understanding when stress is productive vs. destructive",
    icon: "📊",
    condition: (d) => d.AA > 45 && d.DW < 40,
    weight: (d) => d.AA * 2 + d.CD,
  },
  {
    id: "hidden",
    name: "The Hidden Current",
    tagline: "Identifying depression hiding behind productivity and 'I'm fine'",
    icon: "🌊",
    condition: (d) => d.DW > 50 && d.MB > 45,
    weight: (d) => d.DW * 2 + d.MB * 1.5,
  },
  {
    id: "beyond",
    name: "Beyond the Fog",
    tagline: "When it's time for deeper support — and how to take that step",
    icon: "🌅",
    condition: (d, _t, sev) =>
      d.DW > 60 && (sev === "ESTABLISHED" || sev === "CHRONIC"),
    weight: (d) => d.DW * 3 + d.CD,
  },
  {
    id: "anger",
    name: "The Anger Underneath",
    tagline: "Unpacking what anger is really communicating",
    icon: "🔥",
    condition: (d) => d.AA > 50 && (d.EOZ > 40 || d.MB > 40),
    weight: (d) => d.AA * 2 + d.EOZ + d.MB,
  },
  {
    id: "fluency",
    name: "Emotional Fluency",
    tagline: "Building a richer emotional vocabulary and response repertoire",
    icon: "🎨",
    condition: (d) => {
      const vals = [d.AA, d.DW, d.EOZ, d.MB, d.SE, d.CD];
      return d.EOZ > 50 || vals.every((v) => v < 55);
    },
    weight: (d) => d.EOZ * 2 + d.CD + d.MB,
  },
];

const QUESTIONS = [
  {
    id: "q1",
    section: 0,
    type: "scale",
    question: "Right now, your emotional battery is at...",
    min: 1,
    max: 10,
    minLabel: "Completely drained",
    maxLabel: "Fully charged",
    score: (v) => {
      if (v <= 3) return { DW: 3 };
      if (v <= 5) return { DW: 1, EOZ: 1 };
      if (v <= 7) return {};
      return { AA: 1 };
    },
  },
  {
    id: "q2",
    section: 0,
    type: "single",
    question:
      "If your emotional state this week were weather, it would be...",
    options: [
      { label: "⛈️ Thunderstorm — intense, volatile, unpredictable", score: { AA: 2, SE: 1 } },
      { label: "🌫️ Fog — heavy, unclear, hard to see through", score: { DW: 2, EOZ: 1 } },
      { label: "🌪️ Shifting winds — calm one minute, chaotic the next", score: { EOZ: 2, MB: 1 } },
      { label: "❄️ Frozen — numb, still, shut down", score: { DW: 3 } },
      { label: "🌤️ Mostly fine with passing clouds", score: { MB: 1 } },
      { label: "🔥 Slow burn — not explosive, but simmering", score: { AA: 2, MB: 1 } },
    ],
  },
  {
    id: "q3",
    section: 0,
    type: "single",
    question:
      "When something frustrating happens, your gut reaction lately is to...",
    options: [
      { label: "Push back or snap immediately", score: { AA: 3 } },
      { label: "Go silent and withdraw", score: { DW: 2, MB: 1 } },
      { label: "Feel a flash of anger, then go numb", score: { EOZ: 3 } },
      { label: "Blame yourself for overreacting", score: { DW: 2, CD: 1 } },
      { label: "Feel nothing at all", score: { DW: 3 } },
      { label: "Vent about it later to someone else", score: { AA: 1, SE: 1 } },
    ],
  },
  {
    id: "q4",
    section: 0,
    type: "single",
    question: "Your sleep lately has been...",
    options: [
      { label: "Can't fall asleep — mind races", score: { AA: 2, CD: 1 } },
      { label: "Sleeping a lot but waking up exhausted", score: { DW: 3 } },
      { label: "Erratic — some nights fine, some nights awful", score: { EOZ: 2, SE: 1 } },
      { label: "I avoid going to bed (scrolling, staying busy)", score: { MB: 2, EOZ: 1 } },
      { label: "Fine, no changes", score: {} },
    ],
  },
  {
    id: "q5",
    section: 0,
    type: "multi",
    question:
      "In the past 2 weeks, have you noticed any of these in your body?",
    options: [
      { label: "Jaw clenching or teeth grinding", score: { AA: 1, SE: 1 } },
      { label: "Tight chest or shallow breathing", score: { AA: 1, SE: 1 } },
      { label: "Headaches or pressure behind the eyes", score: { SE: 2 } },
      { label: "Heavy limbs — feeling physically weighed down", score: { DW: 2, SE: 1 } },
      { label: "Stomach knots or digestive issues", score: { SE: 2 } },
      { label: "Restlessness — can't sit still", score: { AA: 1, SE: 1 } },
      { label: "General fatigue with no clear cause", score: { DW: 1, SE: 1 } },
      { label: "Muscle tension (shoulders, neck, back)", score: { AA: 1, SE: 1 } },
      { label: "None of the above", score: {}, exclusive: true },
    ],
  },
  {
    id: "q6",
    section: 1,
    type: "likert",
    statement:
      "Getting started on even simple tasks has felt much harder than usual.",
    score: (v) => {
      if (v === 5) return { DW: 3 };
      if (v === 4) return { DW: 2 };
      if (v === 3) return { DW: 1 };
      return {};
    },
  },
  {
    id: "q7",
    section: 1,
    type: "likert",
    statement:
      "Small things that wouldn't normally bother me have been setting me off.",
    score: (v) => {
      if (v === 5) return { AA: 3, EOZ: 1 };
      if (v === 4) return { AA: 2, EOZ: 1 };
      if (v === 3) return { AA: 1 };
      return {};
    },
  },
  {
    id: "q8",
    section: 1,
    type: "likert",
    statement: "I've been losing interest in things I usually enjoy.",
    score: (v) => {
      if (v === 5) return { DW: 3, CD: 1 };
      if (v === 4) return { DW: 2 };
      if (v === 3) return { DW: 1 };
      return {};
    },
  },
  {
    id: "q9",
    section: 1,
    type: "likert",
    statement:
      "I keep replaying frustrating conversations or events in my head.",
    score: (v) => {
      if (v === 5) return { AA: 3, CD: 2 };
      if (v === 4) return { AA: 2, CD: 1 };
      if (v === 3) return { AA: 1 };
      return {};
    },
  },
  {
    id: "q10",
    section: 1,
    type: "likert",
    statement:
      "I've been thinking things like \"What's the point?\" or \"This will never change.\"",
    score: (v) => {
      if (v === 5) return { DW: 3, CD: 2 };
      if (v === 4) return { DW: 2, CD: 1 };
      if (v === 3) return { DW: 1 };
      return {};
    },
  },
  {
    id: "q11",
    section: 1,
    type: "likert",
    statement:
      "When things go wrong, my first thought is that other people are the problem.",
    score: (v) => {
      if (v === 5) return { AA: 3, CD: 1 };
      if (v === 4) return { AA: 2 };
      if (v === 3) return { AA: 1 };
      return {};
    },
  },
  {
    id: "q12",
    section: 1,
    type: "likert",
    statement: "I've been unusually harsh or critical toward myself.",
    score: (v) => {
      if (v === 5) return { DW: 3, CD: 2 };
      if (v === 4) return { DW: 2, CD: 1 };
      if (v === 3) return { DW: 1 };
      return {};
    },
  },
  {
    id: "q13",
    section: 1,
    type: "likert",
    statement:
      "People around me probably think I'm doing fine, but that's not the full picture.",
    score: (v) => {
      if (v === 5) return { MB: 4 };
      if (v === 4) return { MB: 3 };
      if (v === 3) return { MB: 1 };
      return {};
    },
  },
  {
    id: "q14",
    section: 1,
    type: "likert",
    statement:
      "I've been pulling away from people — cancelling plans, avoiding calls, keeping to myself.",
    score: (v) => {
      if (v === 5) return { DW: 3, MB: 1 };
      if (v === 4) return { DW: 2, MB: 1 };
      if (v === 3) return { DW: 1 };
      return {};
    },
  },
  {
    id: "q15",
    section: 1,
    type: "likert",
    statement:
      "My mood swings between feeling angry/irritable and flat/empty — sometimes in the same day.",
    score: (v) => {
      if (v === 5) return { EOZ: 4, SE: 1 };
      if (v === 4) return { EOZ: 3 };
      if (v === 3) return { EOZ: 1 };
      return {};
    },
  },
  {
    id: "q16",
    section: 2,
    type: "single",
    question:
      "A close friend cancels on you last minute. Your honest gut reaction:",
    options: [
      { label: "Annoyed — \"That's disrespectful.\"", score: { AA: 2 } },
      { label: "Relieved — \"I didn't want to go anyway.\"", score: { DW: 2 } },
      { label: "Hurt — \"I knew they didn't really want to see me.\"", score: { DW: 1, CD: 2 } },
      { label: "Nothing — just don't feel much about it", score: { DW: 2, EOZ: 1 } },
      { label: "Quick irritation, then I move on", score: {} },
    ],
  },
  {
    id: "q17",
    section: 2,
    type: "single",
    question:
      "Someone whose opinion matters gives you critical feedback. Your first internal response:",
    options: [
      { label: "\"They're wrong — they don't see the full picture.\"", score: { AA: 2, CD: 1 } },
      { label: "\"They're right — I'm not good enough.\"", score: { DW: 2, CD: 2 } },
      { label: "\"I don't even have the energy to care.\"", score: { DW: 3 } },
      { label: "\"I feel angry but I swallow it.\"", score: { AA: 1, MB: 2 } },
      { label: "\"I'll think about whether it's valid.\"", score: {} },
    ],
  },
  {
    id: "q18",
    section: 2,
    type: "single",
    question:
      "Sunday evening. You think about the week ahead. The dominant feeling is:",
    options: [
      { label: "Dread — heavy, sinking", score: { DW: 3 } },
      { label: "Tension — bracing for impact", score: { AA: 2, SE: 1 } },
      { label: "Emptiness — nothing specific", score: { DW: 2, EOZ: 1 } },
      { label: "Anxiety — racing thoughts about everything", score: { AA: 1, CD: 2 } },
      { label: "Neutral or slightly positive", score: {} },
    ],
  },
  {
    id: "q19",
    section: 2,
    type: "single",
    question:
      "You have a free afternoon with nothing planned. You most likely:",
    options: [
      { label: "Feel restless — can't settle into anything", score: { AA: 2, SE: 1 } },
      { label: "Stay on the couch — no motivation to move", score: { DW: 3 } },
      { label: "Start something but abandon it quickly", score: { EOZ: 2, DW: 1 } },
      { label: "Feel guilty for not being \"productive\"", score: { CD: 2, MB: 1 } },
      { label: "Actually enjoy it", score: {} },
    ],
  },
  {
    id: "q20",
    section: 2,
    type: "single",
    question:
      "Which of these thoughts has shown up most often in the past few weeks?",
    options: [
      { label: "\"This isn't fair.\"", score: { AA: 3 } },
      { label: "\"I'm not good enough.\"", score: { DW: 2, CD: 2 } },
      { label: "\"Nobody understands.\"", score: { EOZ: 2, MB: 1 } },
      { label: "\"I just don't care anymore.\"", score: { DW: 3 } },
      { label: "\"I can't take much more of this.\"", score: { AA: 1, DW: 1, EOZ: 2 } },
      { label: "None of these really resonate", score: {} },
    ],
  },
  {
    id: "q21",
    section: 3,
    type: "triggers",
    question:
      "How much is each of these areas contributing to how you've been feeling?",
    areas: [
      { label: "Work / Career", tag: "WORK" },
      { label: "Romantic Relationship", tag: "RELATIONSHIP" },
      { label: "Family", tag: "FAMILY" },
      { label: "Friendships / Social Life", tag: "SOCIAL" },
      { label: "Health / Body", tag: "HEALTH" },
      { label: "Money / Financial Stress", tag: "FINANCIAL" },
      { label: "Sense of Purpose / Direction", tag: "IDENTITY" },
      { label: "A Specific Loss or Life Change", tag: "TRANSITION" },
    ],
  },
  {
    id: "q22",
    section: 3,
    type: "single",
    question: "How long have you been feeling this way?",
    options: [
      { label: "Less than 2 weeks", score: {}, severity: "ACUTE" },
      { label: "2–6 weeks", score: {}, severity: "DEVELOPING" },
      { label: "2–6 months", score: {}, severity: "ESTABLISHED" },
      { label: "More than 6 months", score: {}, severity: "CHRONIC" },
      { label: "It comes and goes in cycles", score: {}, severity: "CYCLICAL" },
    ],
  },
  {
    id: "q23",
    section: 3,
    type: "single",
    question:
      "How much are these feelings affecting your daily life?",
    options: [
      { label: "Not really — I'm managing okay", score: {}, impact: "LOW" },
      { label: "Some things are slipping but nothing major", score: {}, impact: "MODERATE" },
      { label: "It's clearly affecting my performance and relationships", score: {}, impact: "HIGH" },
      { label: "I'm barely getting through each day", score: {}, impact: "SEVERE" },
    ],
  },
  {
    id: "q24",
    section: 3,
    type: "multi",
    question:
      "Which of these have you been leaning on to cope? (No judgment — just awareness.)",
    options: [
      { label: "Alcohol or substances more than usual", score: {} },
      { label: "Overworking / staying busy to avoid feeling", score: { MB: 1 } },
      { label: "Scrolling / binge-watching / numbing out", score: { DW: 1 } },
      { label: "Over-exercising or under-eating", score: {} },
      { label: "Isolating myself from everyone", score: { DW: 1 } },
      { label: "Lashing out at people who don't deserve it", score: { AA: 1 } },
      { label: "I've been managing okay without any of these", score: {}, exclusive: true },
    ],
  },
  {
    id: "q25",
    section: 3,
    type: "text",
    question:
      "Is there anything else you want to share about what you're going through? (Optional)",
  },
];

const LIKERT_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
];

/* ─── Radar Chart Component ─── */
function RadarChart({ dimensions, size = 280 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const keys = Object.keys(dimensions);
  const n = keys.length;

  const point = (i, val) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const dist = (val / 100) * r;
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)];
  };

  const rings = [25, 50, 75, 100];
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: size }}>
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={keys.map((_, i) => point(i, ring).join(",")).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}
      {keys.map((_, i) => {
        const [x, y] = point(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      <polygon
        points={keys.map((k, i) => point(i, dimensions[k]).join(",")).join(" ")}
        fill="rgba(212,168,67,0.15)"
        stroke="#D4A843"
        strokeWidth="2"
      />
      {keys.map((k, i) => {
        const [x, y] = point(i, dimensions[k]);
        return <circle key={k} cx={x} cy={y} r={4} fill={DIMENSIONS[k].color} />;
      })}
      {keys.map((k, i) => {
        const [x, y] = point(i, 115);
        return (
          <text
            key={k}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={DIMENSIONS[k].color}
            fontSize="10"
            fontWeight="600"
            fontFamily="'DM Sans', sans-serif"
          >
            {k} {Math.round(dimensions[k])}%
          </text>
        );
      })}
    </svg>
  );
}

/* ─── Scoring Engine ─── */
function calculateResults(answers) {
  const raw = { AA: 0, DW: 0, EOZ: 0, MB: 0, SE: 0, CD: 0 };
  let severity = "ACUTE";
  let impact = "LOW";
  const triggers = [];

  QUESTIONS.forEach((q, idx) => {
    const ans = answers[idx];
    if (ans === undefined || ans === null) return;

    if (q.type === "scale" && typeof q.score === "function") {
      const s = q.score(ans);
      Object.entries(s).forEach(([k, v]) => (raw[k] += v));
    } else if (q.type === "single") {
      const opt = q.options[ans];
      if (opt) {
        Object.entries(opt.score || {}).forEach(([k, v]) => (raw[k] += v));
        if (opt.severity) severity = opt.severity;
        if (opt.impact) impact = opt.impact;
      }
    } else if (q.type === "multi" && Array.isArray(ans)) {
      ans.forEach((i) => {
        const opt = q.options[i];
        if (opt) Object.entries(opt.score || {}).forEach(([k, v]) => (raw[k] += v));
      });
    } else if (q.type === "likert" && typeof q.score === "function") {
      const s = q.score(ans);
      Object.entries(s).forEach(([k, v]) => (raw[k] += v));
    } else if (q.type === "triggers" && typeof ans === "object") {
      Object.entries(ans).forEach(([area, rating]) => {
        if (rating >= 4) {
          const areaObj = q.areas.find((a) => a.label === area);
          if (areaObj) triggers.push(areaObj.tag);
        }
      });
    }
  });

  const pct = {};
  Object.keys(raw).forEach((k) => {
    pct[k] = Math.min(100, Math.round((raw[k] / DIMENSIONS[k].max) * 100));
  });

  // Profile determination
  const sorted = Object.entries(pct).sort((a, b) => b[1] - a[1]);
  const [topKey, topVal] = sorted[0];
  const [secKey, secVal] = sorted[1];

  let primary, secondary;

  if (pct.AA > 0 && pct.DW > 0 && Math.abs(pct.AA - pct.DW) <= 5 && pct.AA > 45 && pct.DW > 45) {
    primary = "shapeshifter";
  } else if (topKey === "AA" && pct.DW < 40) {
    primary = "pressure_cooker";
  } else if (topKey === "DW" && pct.AA < 40) {
    primary = "slow_fade";
  } else if (topKey === "EOZ" || (pct.AA > 45 && pct.DW > 45)) {
    primary = "shapeshifter";
  } else if (topKey === "MB" || pct.MB > 50) {
    primary = "performer";
  } else if (topKey === "SE" || pct.SE > 55) {
    primary = "body_score";
  } else if (topKey === "CD" || pct.CD > 55) {
    primary = "thought_loop";
  } else {
    primary = topKey === "AA" ? "pressure_cooker" : "slow_fade";
  }

  // Secondary
  if (pct.MB > 50 && primary !== "performer") secondary = "performer";
  else if (pct.SE > 55 && primary !== "body_score") secondary = "body_score";
  else if (pct.CD > 55 && primary !== "thought_loop") secondary = "thought_loop";
  else if (secVal > 40) {
    const map = { AA: "pressure_cooker", DW: "slow_fade", EOZ: "shapeshifter", MB: "performer", SE: "body_score", CD: "thought_loop" };
    const candidate = map[secKey];
    if (candidate !== primary) secondary = candidate;
  }

  // Severity label
  const sevMap = {
    "ACUTE-LOW": "🟢 Early Signal",
    "ACUTE-MODERATE": "🟡 Developing Pattern",
    "DEVELOPING-LOW": "🟡 Developing Pattern",
    "DEVELOPING-MODERATE": "🟡 Developing Pattern",
    "DEVELOPING-HIGH": "🟠 Active Concern",
    "ESTABLISHED-MODERATE": "🟠 Active Concern",
    "ESTABLISHED-HIGH": "🔴 Established Pattern",
    "ESTABLISHED-SEVERE": "🔴 Established Pattern",
    "CHRONIC-HIGH": "🔴 Established Pattern",
    "CHRONIC-SEVERE": "🔴 Established Pattern",
    "CYCLICAL-LOW": "🟡 Cyclical Pattern",
    "CYCLICAL-MODERATE": "🟡 Cyclical Pattern",
    "CYCLICAL-HIGH": "🟠 Active Concern",
    "CYCLICAL-SEVERE": "🔴 Established Pattern",
  };
  const sevLabel = sevMap[`${severity}-${impact}`] || "🟡 Developing Pattern";

  // Program routing
  const matchedPrograms = PROGRAMS
    .filter((p) => p.condition(pct, triggers, severity))
    .map((p) => ({ ...p, score: p.weight(pct) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (matchedPrograms.length === 0) {
    matchedPrograms.push(PROGRAMS.find((p) => p.id === "fluency"));
  }

  const topTriggers = triggers
    .map((t) => {
      const area = QUESTIONS[20].areas.find((a) => a.tag === t);
      return area ? area.label : t;
    });

  return { raw, pct, primary, secondary, severity, impact, sevLabel, triggers: topTriggers, programs: matchedPrograms };
}

/* ─── Main App ─── */
export default function EmotionalDecoded() {
  const [phase, setPhase] = useState("welcome"); // welcome | consent | quiz | results
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [animating, setAnimating] = useState(false);
  const [email, setEmail] = useState("");
  const containerRef = useRef(null);

  const progress = ((currentQ + 1) / QUESTIONS.length) * 100;
  const currentSection = SECTIONS.find(
    (s) => currentQ >= s.range[0] && currentQ <= s.range[1]
  );

  const goNext = () => {
    setAnimating(true);
    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        const r = calculateResults(answers);
        setResults(r);
        setPhase("results");
      }
      setAnimating(false);
    }, 300);
  };

  const goBack = () => {
    if (currentQ > 0) {
      setAnimating(true);
      setTimeout(() => {
        setCurrentQ(currentQ - 1);
        setAnimating(false);
      }, 300);
    }
  };

  const setAnswer = (val) => {
    setAnswers({ ...answers, [currentQ]: val });
  };

  const canProceed = () => {
    const q = QUESTIONS[currentQ];
    const a = answers[currentQ];
    if (q.type === "text") return true; // optional
    if (q.type === "triggers") {
      return a && Object.keys(a).length === q.areas.length;
    }
    return a !== undefined && a !== null;
  };

  const autoAdvance = (val) => {
    setAnswers((prev) => ({ ...prev, [currentQ]: val }));
    setTimeout(() => {
      setAnimating(true);
      setTimeout(() => {
        if (currentQ < QUESTIONS.length - 1) {
          setCurrentQ((c) => c + 1);
        } else {
          const r = calculateResults({ ...answers, [currentQ]: val });
          setResults(r);
          setPhase("results");
        }
        setAnimating(false);
      }, 300);
    }, 400);
  };

  /* ─── WELCOME ─── */
  if (phase === "welcome") {
    return (
      <div style={styles.root}>
        <div style={styles.welcomeContainer}>
          <div style={styles.glowOrb} />
          <p style={styles.eyebrow}>EMOTIONAL DECODED</p>
          <h1 style={styles.welcomeTitle}>What's Really{"\n"}Going On Inside?</h1>
          <p style={styles.welcomeSub}>
            A 7-minute assessment that helps you decode what you're actually
            feeling — not just what you think you're feeling.
          </p>
          <p style={styles.welcomeDetail}>
            No labels. No judgment. Just clarity.
          </p>
          <button style={styles.primaryBtn} onClick={() => setPhase("consent")}>
            Let's Begin
          </button>
          <p style={styles.welcomeFootnote}>25 questions · 100% confidential</p>
        </div>
      </div>
    );
  }

  /* ─── CONSENT ─── */
  if (phase === "consent") {
    return (
      <div style={styles.root}>
        <div style={styles.consentContainer}>
          <div style={styles.consentIcon}>🔒</div>
          <h2 style={styles.consentTitle}>Before We Start</h2>
          <p style={styles.consentText}>
            Your responses are confidential and used only to generate your
            personal Emotional Profile. This is an awareness tool — not a
            medical or psychological diagnosis.
          </p>
          <p style={styles.consentText}>
            If you're in crisis or experiencing persistent distress, please
            reach out to a licensed mental health professional or a crisis
            helpline in your area.
          </p>
          <button style={styles.primaryBtn} onClick={() => setPhase("quiz")}>
            I Understand — Continue
          </button>
          <button
            style={styles.ghostBtn}
            onClick={() => setPhase("welcome")}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ─── RESULTS ─── */
  if (phase === "results" && results) {
    const pri = PROFILES[results.primary];
    const sec = results.secondary ? PROFILES[results.secondary] : null;
    return (
      <div style={styles.root}>
        <div style={styles.resultsContainer}>
          <p style={styles.eyebrow}>YOUR EMOTIONAL PROFILE</p>
          <h1 style={styles.resultsTitle}>
            {pri.emoji} {pri.name}
          </h1>
          <p style={styles.resultsSummary}>{pri.summary}</p>

          {/* Radar Chart */}
          <div style={styles.radarWrap}>
            <RadarChart dimensions={results.pct} />
          </div>

          {/* Dimension Bars */}
          <div style={styles.dimSection}>
            <h3 style={styles.dimTitle}>Your Dimension Breakdown</h3>
            {Object.entries(results.pct)
              .sort((a, b) => b[1] - a[1])
              .map(([k, v]) => (
                <div key={k} style={styles.dimRow}>
                  <div style={styles.dimLabel}>
                    <span style={{ color: DIMENSIONS[k].color, fontWeight: 700 }}>{k}</span>
                    <span style={styles.dimName}>{DIMENSIONS[k].name}</span>
                  </div>
                  <div style={styles.barTrack}>
                    <div
                      style={{
                        ...styles.barFill,
                        width: `${v}%`,
                        background: DIMENSIONS[k].color,
                      }}
                    />
                  </div>
                  <span style={styles.dimPct}>{v}%</span>
                </div>
              ))}
          </div>

          {/* Primary Profile Detail */}
          <div style={styles.profileCard}>
            <h3 style={styles.profileCardTitle}>
              {pri.emoji} Primary: {pri.name}
            </h3>
            <p style={styles.profileDesc}>{pri.description}</p>
            <div style={styles.practicesList}>
              <p style={styles.practicesLabel}>Recommended practices:</p>
              {pri.practices.map((p, i) => (
                <div key={i} style={styles.practiceItem}>
                  <span style={styles.practiceCheck}>→</span> {p}
                </div>
              ))}
            </div>
          </div>

          {/* Secondary Profile */}
          {sec && (
            <div style={{ ...styles.profileCard, borderColor: "rgba(255,255,255,0.08)" }}>
              <h3 style={styles.profileCardTitle}>
                {sec.emoji} Secondary: {sec.name}
              </h3>
              <p style={styles.profileDesc}>{sec.description}</p>
              <div style={styles.practicesList}>
                <p style={styles.practicesLabel}>Recommended practices:</p>
                {sec.practices.map((p, i) => (
                  <div key={i} style={styles.practiceItem}>
                    <span style={styles.practiceCheck}>→</span> {p}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Context */}
          <div style={styles.contextCard}>
            <div style={styles.contextRow}>
              <span style={styles.contextLabel}>Status</span>
              <span style={styles.contextValue}>{results.sevLabel}</span>
            </div>
            {results.triggers.length > 0 && (
              <div style={styles.contextRow}>
                <span style={styles.contextLabel}>Top Triggers</span>
                <span style={styles.contextValue}>{results.triggers.join(", ")}</span>
              </div>
            )}
            <div style={styles.contextRow}>
              <span style={styles.contextLabel}>Duration</span>
              <span style={styles.contextValue}>{results.severity}</span>
            </div>
            <div style={styles.contextRow}>
              <span style={styles.contextLabel}>Impact</span>
              <span style={styles.contextValue}>{results.impact}</span>
            </div>
          </div>

          {/* Programs */}
          <div style={styles.programsSection}>
            <h3 style={styles.programsTitle}>Recommended Programs</h3>
            <p style={styles.programsSub}>Based on your profile, these would help most:</p>
            {results.programs.map((prog, i) => (
              <div key={prog.id} style={styles.programCard}>
                <div style={styles.programHeader}>
                  <span style={styles.programIcon}>{prog.icon}</span>
                  <div>
                    <p style={styles.programName}>
                      {i + 1}. {prog.name}
                    </p>
                    <p style={styles.programTag}>{prog.tagline}</p>
                  </div>
                </div>
                <div style={styles.matchBar}>
                  <div
                    style={{
                      ...styles.matchFill,
                      width: `${Math.min(100, Math.round((prog.score / 200) * 100))}%`,
                    }}
                  />
                </div>
                <button style={styles.programBtn}>Learn More</button>
              </div>
            ))}
          </div>

          {/* Lead Capture */}
          <div style={styles.leadCapture}>
            <h3 style={styles.leadTitle}>Get Your Full Report</h3>
            <p style={styles.leadSub}>
              Receive your detailed Emotional Profile by email — plus early access to our training programs.
            </p>
            <div style={styles.emailRow}>
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.emailInput}
              />
              <button style={styles.emailBtn}>Send Report</button>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={styles.disclaimer}>
            <p>
              This assessment is designed for personal awareness and emotional
              education. It is not a medical or psychological diagnostic tool.
              If you are experiencing persistent distress, please reach out to a
              licensed mental health professional or contact a crisis helpline in
              your area.
            </p>
          </div>

          {/* Retake */}
          <button
            style={styles.ghostBtn}
            onClick={() => {
              setPhase("welcome");
              setCurrentQ(0);
              setAnswers({});
              setResults(null);
            }}
          >
            Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  /* ─── QUIZ ─── */
  const q = QUESTIONS[currentQ];
  return (
    <div style={styles.root} ref={containerRef}>
      {/* Progress */}
      <div style={styles.progressWrap}>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${progress}%` }} />
        </div>
        <div style={styles.progressMeta}>
          <span style={styles.sectionLabel}>{currentSection?.label}</span>
          <span style={styles.qCount}>
            {currentQ + 1} / {QUESTIONS.length}
          </span>
        </div>
      </div>

      {/* Section intro */}
      {currentQ === 0 && (
        <p style={styles.sectionIntro}>
          First, let's check in with where you are right now.
        </p>
      )}
      {currentQ === 5 && (
        <p style={styles.sectionIntro}>
          Now let's zoom out — think about the past 2 to 4 weeks.
        </p>
      )}
      {currentQ === 15 && (
        <p style={styles.sectionIntro}>
          Almost there. A few quick "what would you do" questions.
        </p>
      )}
      {currentQ === 20 && (
        <p style={styles.sectionIntro}>
          Last section — let's see where these feelings live.
        </p>
      )}

      {/* Question */}
      <div style={{ ...styles.questionWrap, opacity: animating ? 0 : 1, transform: animating ? "translateY(12px)" : "translateY(0)" }}>
        <h2 style={styles.questionText}>
          {q.question || q.statement}
        </h2>

        {/* Scale */}
        {q.type === "scale" && (
          <div style={styles.scaleWrap}>
            <div style={styles.scaleLabels}>
              <span style={styles.scaleMin}>{q.minLabel}</span>
              <span style={styles.scaleMax}>{q.maxLabel}</span>
            </div>
            <div style={styles.scaleButtons}>
              {Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map(
                (n) => (
                  <button
                    key={n}
                    style={{
                      ...styles.scaleBtn,
                      ...(answers[currentQ] === n ? styles.scaleBtnActive : {}),
                    }}
                    onClick={() => autoAdvance(n)}
                  >
                    {n}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Single Select */}
        {q.type === "single" && (
          <div style={styles.optionsWrap}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                style={{
                  ...styles.optionBtn,
                  ...(answers[currentQ] === i ? styles.optionBtnActive : {}),
                }}
                onClick={() => autoAdvance(i)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Multi Select */}
        {q.type === "multi" && (
          <div style={styles.optionsWrap}>
            {q.options.map((opt, i) => {
              const selected = (answers[currentQ] || []).includes(i);
              return (
                <button
                  key={i}
                  style={{
                    ...styles.optionBtn,
                    ...(selected ? styles.optionBtnActive : {}),
                  }}
                  onClick={() => {
                    let arr = [...(answers[currentQ] || [])];
                    if (opt.exclusive) {
                      arr = selected ? [] : [i];
                    } else {
                      arr = arr.filter(
                        (x) => !q.options[x]?.exclusive
                      );
                      if (selected) arr = arr.filter((x) => x !== i);
                      else arr.push(i);
                    }
                    setAnswer(arr);
                  }}
                >
                  <span style={styles.checkbox}>
                    {selected ? "☑" : "☐"}
                  </span>{" "}
                  {opt.label}
                </button>
              );
            })}
            <button
              style={{ ...styles.nextBtn, marginTop: 16, opacity: canProceed() ? 1 : 0.4 }}
              disabled={!canProceed()}
              onClick={goNext}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Likert */}
        {q.type === "likert" && (
          <div style={styles.likertWrap}>
            {LIKERT_LABELS.map((label, i) => {
              const val = i + 1;
              return (
                <button
                  key={val}
                  style={{
                    ...styles.likertBtn,
                    ...(answers[currentQ] === val ? styles.likertBtnActive : {}),
                  }}
                  onClick={() => autoAdvance(val)}
                >
                  <div
                    style={{
                      ...styles.likertDot,
                      ...(answers[currentQ] === val ? styles.likertDotActive : {}),
                      width: 12 + i * 4,
                      height: 12 + i * 4,
                    }}
                  />
                  <span style={styles.likertLabel}>{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Triggers */}
        {q.type === "triggers" && (
          <div style={styles.triggersWrap}>
            {q.areas.map((area) => {
              const val = (answers[currentQ] || {})[area.label] || 0;
              return (
                <div key={area.label} style={styles.triggerRow}>
                  <span style={styles.triggerLabel}>{area.label}</span>
                  <div style={styles.triggerStars}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        style={{
                          ...styles.starBtn,
                          color: n <= val ? "#D4A843" : "rgba(255,255,255,0.15)",
                        }}
                        onClick={() =>
                          setAnswer({
                            ...(answers[currentQ] || {}),
                            [area.label]: n,
                          })
                        }
                      >
                        ●
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <button
              style={{ ...styles.nextBtn, marginTop: 20, opacity: canProceed() ? 1 : 0.4 }}
              disabled={!canProceed()}
              onClick={goNext}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Text */}
        {q.type === "text" && (
          <div style={styles.textWrap}>
            <textarea
              style={styles.textArea}
              rows={4}
              placeholder="Take your time... or skip this one."
              value={answers[currentQ] || ""}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button style={styles.nextBtn} onClick={goNext}>
              {currentQ === QUESTIONS.length - 1
                ? "See My Results"
                : "Continue →"}
            </button>
          </div>
        )}
      </div>

      {/* Back button */}
      {currentQ > 0 && (
        <button style={styles.backBtn} onClick={goBack}>
          ← Back
        </button>
      )}
    </div>
  );
}

/* ─── Styles ─── */
const styles = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(165deg, #0D0D12 0%, #151520 40%, #1A1A2E 100%)",
    color: "#E8E4DC",
    fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "24px 20px 60px",
    position: "relative",
    overflow: "hidden",
  },
  glowOrb: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(212,168,67,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  eyebrow: {
    letterSpacing: "0.2em",
    fontSize: 11,
    color: "#D4A843",
    fontWeight: 600,
    marginBottom: 12,
    textAlign: "center",
  },

  /* Welcome */
  welcomeContainer: {
    maxWidth: 440,
    textAlign: "center",
    marginTop: "15vh",
    position: "relative",
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 300,
    lineHeight: 1.2,
    margin: "0 0 20px",
    color: "#F5F2EB",
    whiteSpace: "pre-line",
  },
  welcomeSub: {
    fontSize: 16,
    lineHeight: 1.6,
    color: "rgba(232,228,220,0.7)",
    margin: "0 0 8px",
  },
  welcomeDetail: {
    fontSize: 14,
    color: "rgba(232,228,220,0.4)",
    margin: "0 0 36px",
    fontStyle: "italic",
  },
  welcomeFootnote: {
    fontSize: 12,
    color: "rgba(232,228,220,0.3)",
    marginTop: 16,
  },

  /* Buttons */
  primaryBtn: {
    background: "linear-gradient(135deg, #D4A843, #C4963A)",
    color: "#0D0D12",
    border: "none",
    borderRadius: 50,
    padding: "14px 40px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.03em",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 4px 24px rgba(212,168,67,0.25)",
  },
  ghostBtn: {
    background: "transparent",
    color: "rgba(232,228,220,0.5)",
    border: "1px solid rgba(232,228,220,0.12)",
    borderRadius: 50,
    padding: "10px 28px",
    fontSize: 13,
    cursor: "pointer",
    marginTop: 12,
    transition: "all 0.2s",
  },

  /* Consent */
  consentContainer: {
    maxWidth: 440,
    textAlign: "center",
    marginTop: "12vh",
  },
  consentIcon: { fontSize: 40, marginBottom: 16 },
  consentTitle: {
    fontSize: 24,
    fontWeight: 400,
    margin: "0 0 20px",
    color: "#F5F2EB",
  },
  consentText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "rgba(232,228,220,0.6)",
    margin: "0 0 16px",
  },

  /* Progress */
  progressWrap: { width: "100%", maxWidth: 520, marginBottom: 8 },
  progressTrack: {
    height: 3,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #D4A843, #E8C86A)",
    borderRadius: 3,
    transition: "width 0.4s ease",
  },
  progressMeta: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: "0.15em",
    color: "rgba(212,168,67,0.6)",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  qCount: { fontSize: 11, color: "rgba(232,228,220,0.3)" },
  sectionIntro: {
    fontSize: 13,
    color: "rgba(232,228,220,0.45)",
    fontStyle: "italic",
    textAlign: "center",
    margin: "12px 0 4px",
    maxWidth: 400,
  },

  /* Question */
  questionWrap: {
    maxWidth: 520,
    width: "100%",
    marginTop: 28,
    transition: "opacity 0.3s ease, transform 0.3s ease",
  },
  questionText: {
    fontSize: 20,
    fontWeight: 400,
    lineHeight: 1.5,
    color: "#F5F2EB",
    marginBottom: 28,
    textAlign: "center",
  },

  /* Scale */
  scaleWrap: { width: "100%" },
  scaleLabels: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  scaleMin: { fontSize: 11, color: "rgba(232,228,220,0.35)" },
  scaleMax: { fontSize: 11, color: "rgba(232,228,220,0.35)" },
  scaleButtons: {
    display: "flex",
    gap: 8,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  scaleBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(232,228,220,0.6)",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  scaleBtnActive: {
    background: "rgba(212,168,67,0.15)",
    borderColor: "#D4A843",
    color: "#D4A843",
    boxShadow: "0 0 12px rgba(212,168,67,0.2)",
  },

  /* Options */
  optionsWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  optionBtn: {
    textAlign: "left",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    color: "rgba(232,228,220,0.75)",
    fontSize: 14,
    lineHeight: 1.5,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  optionBtnActive: {
    background: "rgba(212,168,67,0.1)",
    borderColor: "rgba(212,168,67,0.4)",
    color: "#F5F2EB",
  },
  checkbox: { marginRight: 6, fontSize: 14, opacity: 0.6 },

  /* Likert */
  likertWrap: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  likertBtn: {
    flex: 1,
    minWidth: 60,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    padding: "16px 4px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "transparent",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  likertBtnActive: {
    background: "rgba(212,168,67,0.1)",
    borderColor: "rgba(212,168,67,0.35)",
  },
  likertDot: {
    borderRadius: "50%",
    background: "rgba(255,255,255,0.12)",
    transition: "all 0.2s",
  },
  likertDotActive: {
    background: "#D4A843",
    boxShadow: "0 0 10px rgba(212,168,67,0.4)",
  },
  likertLabel: {
    fontSize: 10,
    color: "rgba(232,228,220,0.4)",
    textAlign: "center",
    lineHeight: 1.3,
  },

  /* Triggers */
  triggersWrap: { width: "100%" },
  triggerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  triggerLabel: {
    fontSize: 13,
    color: "rgba(232,228,220,0.7)",
    flex: 1,
  },
  triggerStars: { display: "flex", gap: 8 },
  starBtn: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    transition: "color 0.15s",
    padding: "2px 4px",
  },

  /* Text */
  textWrap: { width: "100%" },
  textArea: {
    width: "100%",
    boxSizing: "border-box",
    padding: 16,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "#E8E4DC",
    fontSize: 14,
    lineHeight: 1.6,
    fontFamily: "inherit",
    resize: "vertical",
    outline: "none",
  },

  /* Nav */
  nextBtn: {
    background: "linear-gradient(135deg, #D4A843, #C4963A)",
    color: "#0D0D12",
    border: "none",
    borderRadius: 50,
    padding: "12px 32px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
    transition: "opacity 0.2s",
    alignSelf: "center",
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  },
  backBtn: {
    position: "fixed",
    bottom: 20,
    left: 20,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 50,
    padding: "8px 18px",
    color: "rgba(232,228,220,0.4)",
    fontSize: 12,
    cursor: "pointer",
  },

  /* Results */
  resultsContainer: {
    maxWidth: 520,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 300,
    color: "#F5F2EB",
    margin: "0 0 4px",
    textAlign: "center",
  },
  resultsSummary: {
    fontSize: 15,
    color: "rgba(232,228,220,0.55)",
    textAlign: "center",
    lineHeight: 1.5,
    margin: "0 0 24px",
    fontStyle: "italic",
  },
  radarWrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    margin: "0 0 24px",
  },

  /* Dimensions */
  dimSection: { width: "100%", marginBottom: 24 },
  dimTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "rgba(232,228,220,0.5)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  dimRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  dimLabel: {
    width: 140,
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  dimName: { fontSize: 10, color: "rgba(232,228,220,0.3)" },
  barTrack: {
    flex: 1,
    height: 6,
    background: "rgba(255,255,255,0.05)",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 6,
    transition: "width 0.8s ease",
  },
  dimPct: {
    width: 36,
    textAlign: "right",
    fontSize: 12,
    color: "rgba(232,228,220,0.5)",
    fontWeight: 600,
  },

  /* Profile Card */
  profileCard: {
    width: "100%",
    padding: 24,
    borderRadius: 16,
    border: "1px solid rgba(212,168,67,0.15)",
    background: "rgba(255,255,255,0.02)",
    marginBottom: 12,
  },
  profileCardTitle: {
    fontSize: 18,
    fontWeight: 500,
    color: "#F5F2EB",
    margin: "0 0 12px",
  },
  profileDesc: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "rgba(232,228,220,0.65)",
    margin: "0 0 16px",
  },
  practicesList: {},
  practicesLabel: {
    fontSize: 12,
    color: "rgba(212,168,67,0.6)",
    fontWeight: 600,
    letterSpacing: "0.05em",
    marginBottom: 8,
  },
  practiceItem: {
    fontSize: 13,
    color: "rgba(232,228,220,0.55)",
    marginBottom: 6,
    lineHeight: 1.5,
  },
  practiceCheck: { color: "#D4A843", marginRight: 6 },

  /* Context */
  contextCard: {
    width: "100%",
    padding: 20,
    borderRadius: 16,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    marginBottom: 24,
  },
  contextRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  contextLabel: { fontSize: 13, color: "rgba(232,228,220,0.4)" },
  contextValue: { fontSize: 13, color: "#F5F2EB", fontWeight: 500, textAlign: "right", maxWidth: "60%" },

  /* Programs */
  programsSection: { width: "100%", marginBottom: 24 },
  programsTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "rgba(232,228,220,0.5)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  programsSub: {
    fontSize: 13,
    color: "rgba(232,228,220,0.35)",
    marginBottom: 16,
  },
  programCard: {
    padding: 20,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    marginBottom: 10,
  },
  programHeader: { display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 },
  programIcon: { fontSize: 28 },
  programName: { fontSize: 15, fontWeight: 600, color: "#F5F2EB", margin: 0 },
  programTag: { fontSize: 12, color: "rgba(232,228,220,0.45)", margin: "2px 0 0" },
  matchBar: {
    height: 4,
    background: "rgba(255,255,255,0.06)",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  matchFill: {
    height: "100%",
    background: "linear-gradient(90deg, #D4A843, #5BA88F)",
    borderRadius: 4,
  },
  programBtn: {
    background: "rgba(212,168,67,0.1)",
    border: "1px solid rgba(212,168,67,0.25)",
    borderRadius: 50,
    padding: "8px 24px",
    color: "#D4A843",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  },

  /* Lead Capture */
  leadCapture: {
    width: "100%",
    padding: 24,
    borderRadius: 16,
    background: "linear-gradient(135deg, rgba(212,168,67,0.08), rgba(91,168,143,0.06))",
    border: "1px solid rgba(212,168,67,0.15)",
    textAlign: "center",
    marginBottom: 24,
  },
  leadTitle: { fontSize: 18, fontWeight: 500, color: "#F5F2EB", margin: "0 0 6px" },
  leadSub: { fontSize: 13, color: "rgba(232,228,220,0.5)", margin: "0 0 16px", lineHeight: 1.5 },
  emailRow: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  emailInput: {
    flex: 1,
    minWidth: 200,
    padding: "10px 16px",
    borderRadius: 50,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#E8E4DC",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  },
  emailBtn: {
    background: "linear-gradient(135deg, #D4A843, #C4963A)",
    color: "#0D0D12",
    border: "none",
    borderRadius: 50,
    padding: "10px 24px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },

  /* Disclaimer */
  disclaimer: {
    padding: 16,
    borderRadius: 12,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.04)",
    fontSize: 11,
    lineHeight: 1.6,
    color: "rgba(232,228,220,0.3)",
    textAlign: "center",
    marginBottom: 16,
  },
};
