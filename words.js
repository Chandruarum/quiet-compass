// Every word the app shows lives in this file.
//
// To change the wording, edit the text between the quotes.
// Leave anything in {curly brackets} exactly as it is: the app swaps those
// for a number, a name or a date when it shows the sentence.
//
// Where a line has several versions in [square brackets], the app picks one
// each time, so it doesn't say the same sentence every day. Add or remove versions freely.
//
// The voice: warm, direct, short. It talks to me as "you". It never counts what I missed.
//
// Two things live elsewhere:
// - The names of my activities and life areas are in activities.js.
// - The app's name on the Home Screen is in manifest.webmanifest.

const words = {
  // ---------- Greetings, by time of day ----------
  greetings: {
    morning: "Good morning.", // 4 am to noon
    afternoon: "Good afternoon.", // noon to 5 pm
    evening: "Good evening.", // 5 pm to 11 pm
    late: "Still up? Go gently.", // 11 pm to 4 am
  },

  // How each life area is named inside a celebration, as in "That was for {fed}."
  fed: {
    body: "your body",
    mind: "your mind",
    food: "your body",
    sleep: "your sleep",
    "self-compassion": "yourself",
    health: "your health",
    family: "the people you love",
    wealth: "your peace of mind about money",
    growth: "your growth",
    meaning: "something bigger than you",
    enjoyment: "your enjoyment and peace",
    prosperity: "your future",
  },

  // The bar at the bottom
  tabs: {
    morning: "Morning",
    now: "What now",
    night: "Night",
    compass: "Compass",
  },

  // ---------- What Now ----------
  now: {
    title: "What now?",

    energyLabel: "Energy",
    energyLow: "Low",
    energyMedium: "Medium",
    energyHigh: "High",

    placeLabel: "Place",
    placeSit: "Sit",
    placeWalk: "Walk",
    placeOut: "Out",

    timeLabel: "Free time",
    time10: "10 min",
    time30: "30 min",
    time60: "60+ min",

    done: "Done",
    skip: "Skip",
    another: "Another",
    undo: "Undo",

    oneMoreTap: "One more tap.",
    moreTaps: "{count} more taps.",
    nothingFits: "You've done all that fits right now. That's a full day. Change a tap if you want something else.",

    // A kind word above the suggestion
    lowEnergy: "Low energy is fine. Here's the smallest thing that still counts.",
    manySkips: "Nothing's landing right now, and that's okay. Maybe just rest.",

    // After "done": a short celebration that names what it fed
    doneLines: [
      "Lovely. That was for {fed}.",
      "Nice one. A little care for {fed}.",
      "Done. That fed {fed}.",
    ],
    doneEnjoymentLines: [
      "Enjoyed, with no guilt. That fed {fed}.",
      "Good. Time for {fed} is time well spent.",
    ],
    doneClosingLines: [
      "Done. That one mattered.",
      "Done. Glad you got to it in time.",
    ],

    // After "skip": never a telling-off
    skippedLines: [
      "No problem. It'll be here if you want it.",
      "Not now is a fine answer.",
      "Skipped, and that's okay.",
    ],
  },

  // The reason under each suggestion.
  // For an activity it is the activity's benefit line (in activities.js),
  // followed by my own why for that life area.
  reasons: {
    youSaid: "You said: {why}",

    closingFromNight: "Last night you said you'd regret skipping this. Today's your chance.",
    closingFromWeek: "Your one thing for {fed} this week.",
    closingSetAside: "You set this aside when you chose something else. It's still here for you.",
    closingSetAsideToday: "You set this aside yesterday when you chose something else. Today's its turn.",
    closingNoDate: "You added this because the window won't stay open.",
    closingToday: "The window closes today.",
    closingByDate: "The window closes on {date}.",

  },

  // ---------- Closing windows (bottom of What Now) ----------
  windows: {
    open: "Add a closing window",
    title: "Closing window",
    hint: "Someone to call or answer, or a date that won't come round again.",
    nameLabel: "Who or what",
    dateLabel: "By when (optional)",
    add: "Add",
    close: "Close",
    remove: "Remove",
    listToday: "{name} · today.",
    listByDate: "{name} · by {date}.",
  },

  // ---------- Morning ----------
  morning: {
    title: "Morning",
    wentWellLabel: "Yesterday, this went well",
    lookingForward: "Looking forward to",
    minimumsHeading: "Daily minimums · {done} of {total} done",
    essentialLabel: "Today's essential",
    weekLabel: "This week's one thing",
  },

  // ---------- Night ----------
  night: {
    title: "Night",
    wentWell: "What went well today?",
    regret: "Is there anything you'd regret skipping?",
    regretHint: "Leave it empty if there's nothing. Anything you write, I'll offer you tomorrow.",
    oneThing: "What's the one thing you're looking forward to tomorrow?",
    // The pick sheet: options to tap instead of typing
    pick: "Pick instead of typing",
    sheetWell: "What went well?",
    sheetRegret: "What would you regret skipping?",
    sheetOneThing: "What are you looking forward to?",
    sheetWeek: "One thing for next week",
    sheetHintMany: "Tap as many as you like.",
    sheetEmptyWell: "Nothing recorded today yet. Type anything that went well, however small.",
    sheetEmpty: "Nothing to pick from yet. Type whatever comes to mind.",
    sheetClose: "Done",

    // The weekly review, shown on Sunday nights only
    weekReviewHeading: "Your week",
    weekStarved: "This week, {fed} had the least of you: {days} of 7 days. That's a signal, not a verdict.",
    weekPrompt: "What one thing will you do for it next week?",

    finish: "Finish the day",
    finished: "Saved",
    savedLines: [
      "Saved. You showed up today. Sleep well.",
      "Saved. That's the day done. Rest now.",
    ],
    savedAlready: "Already saved for today. Change anything you like and save again.",

    todayHeading: "Today",

    // One kind sentence about today's balance. {fed} is a list such as
    // "your mind, the people you love and your growth"; {hungry} is one area.
    fedAndHungry: "Today you fed {fed}. The hungry one is {hungry}. A little for it tomorrow?",
    fedEverything: "Today you fed {fed}. Nothing is going hungry. Rest well.",
    fedNothing: "Nothing recorded today, and that's okay. Tomorrow, a little care for {hungry} would be good.",
    listAnd: "and",

    todayCount: "{done} of {total}",
    todayLabel: "daily minimums",
    nothingDone: "Nothing recorded yet today. No pressure.",
    oneDone: "One thing done today. It counts.",
    manyDone: "{count} things done today.",

    weekHeading: "Last 7 days",
    weekTotals: "{done} done · {skipped} skipped",
    areaDays: "{days} of 7 days",
    minimumsLabel: "Daily minimums",
    weekKey: "A filled square is a day you fed that area. The bars are your daily minimums, and a dot means you finished Night. Tap a day to see more.",
    dayDetail: "{day}: {count} done, {skipped} skipped. {done} of {total} daily minimums. {night}",
    dayFed: "You fed {fed}.",
    dayNotRecorded: "{day}: not recorded.",
    nightFinished: "You finished Night.",
    nightNotFinished: "Night not recorded.",
  },

  // ---------- My Compass ----------
  compass: {
    title: "My Compass",
    motto: "A high-quality life I'm proud of and happy about at any time, especially at the end.",

    tierMust: "Must",
    tierShould: "Should",
    tierMay: "May have",

    whyLabel: "Why it matters to me",
    noWhy: "You haven't written this one yet.",
    addWhy: "Add your why",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",

    goodWeekLabel: "A good week",
    approachLabel: "How to approach it",

    attentionLabel: "Last 7 days",
    fedOn: "You fed this on {days} of the last 7 days.",
    notRecorded: "Not recorded in the last 7 days.",

    activitiesLabel: "What feeds it",
    finished: "Finished",
    finishedCount: "Finished · {count}",
    bringBack: "Bring back",

    // Adding something of my own to a life area
    add: "Add something",
    addNameLabel: "What is it?",
    addKindLabel: "What kind of thing?",
    addSave: "Add",
    addCancel: "Cancel",
    addDuplicate: "That's already on your list.",
    remove: "Remove",
    kinds: {
      book: "Book",
      manga: "Manga",
      series: "Series",
      film: "Film",
      documentary: "Documentary",
      practice: "Practice",
      other: "Something else",
    },
    // Put in front of the name I type, so "Dune" as a film becomes "Watch Dune"
    kindPrefixes: {
      book: "Read ",
      manga: "Read ",
      series: "Watch ",
      film: "Watch ",
      documentary: "Watch ",
      practice: "",
      other: "",
    },
    // The line shown under the suggestion for something I added
    kindBenefits: {
      book: "A few pages of a book you chose.",
      manga: "A chapter of a story you chose.",
      series: "An episode, purely because you want to.",
      film: "A film you've been meaning to see.",
      documentary: "A documentary you've been meaning to see.",
      practice: "A little practice at something you care about.",
      other: "Something you chose for yourself.",
    },
    essentialsLabel: "No-regret essentials",
    noActivities: "Nothing here yet.",

    // The first-time questions
    introTitle: "Why does it matter?",
    introLead: "Seven short questions. Each starts with a draft. Change it into your own words, or skip it.",
    progress: "{number} of {total}",
    question: "Why does {area} matter to you?",
    introSave: "Save",
    introSkip: "Skip",

    // For each life area:
    // whyDraft: the starting draft for my "why" (my own version is kept on the phone).
    // goodWeek: what a good week looks like.
    // approach: one or two short principles.
    areas: {
      health: {
        whyDraft: "Everything else runs on this. I want to feel good in my body and easy in my mind, and to look after both before they force me to.",
        goodWeek: "I moved most days, ate properly, slept on time, and was kind to myself when I didn't.",
        approach: ["Small and daily beats big and rare.", "Take it easy. Don't stress yourself."],
      },
      family: {
        whyDraft: "The people I love won't be here forever. I want them to know they matter to me while I can still show it.",
        goodWeek: "One undistracted conversation with family, and one message to a friend.",
        approach: ["Be fully there: phone away.", "Say what you feel: love, thanks, apologies."],
      },
      wealth: {
        whyDraft: "Enough money means freedom from worry. I want to save and invest early, so money is never the reason I can't live well.",
        goodWeek: "One 10-minute money check, and nothing spent that I regret.",
        approach: ["Enough is the goal, not more.", "Early and small beats late and large."],
      },
      growth: {
        whyDraft: "I'm happiest when I'm getting better at something. I want to keep learning and to make work I'm proud of.",
        goodWeek: "A few focused sessions of study or building, and some pages read.",
        approach: ["One thing at a time, done with care.", "Twenty focused minutes count."],
      },
      meaning: {
        whyDraft: "I want my life to be useful to someone besides me: by helping, teaching and giving back.",
        goodWeek: "I helped or taught one person something.",
        approach: ["Start with one person.", "Share what you already know."],
      },
      enjoyment: {
        whyDraft: "Life is happening now, not after X. I want to let myself enjoy it and to feel at peace.",
        goodWeek: "I played, watched or read something purely because I wanted to, with no guilt.",
        approach: ["Enjoy it now, not after X.", "Rest and play are not rewards to earn."],
      },
      prosperity: {
        whyDraft: "More than enough would be nice to have, but never at the cost of anything above it.",
        goodWeek: "Nothing is needed here. If an opportunity appears, I notice it.",
        approach: ["Never trade a must for it."],
      },
    },
  },

  // ---------- The honest nudge ----------
  // One kind line when a life area has gone several days without attention.
  // The button beneath it carries the name of one small action from that area.
  nudge: {
    lines: [
      "{area} hasn't had your attention in {days} days. Want to start small?",
      "It's been {days} days since {area} got some care. One small step?",
    ],
    notToday: "Not today",
  },

  // ---------- Help me decide ----------
  decide: {
    open: "Help me decide",
    title: "Help me decide",
    lead: "When two things clash, name them both. A few questions will sort it out.",
    firstLabel: "One thing",
    secondLabel: "The other thing",
    areaPrompt: "Which life area is it?",
    start: "Start",
    cancel: "Cancel",

    progress: "Question {number} of {total}",
    neither: "Neither, or I can't tell",

    // Asked in this order. It stops at the first one where I pick a side.
    questions: [
      "Is a daily minimum at risk? Which of these protects one?",
      "Which one can't be repeated or made up later?",
      "Looking back in 10 years, which would you regret skipping?",
      "Which have you neglected longest?",
    ],

    // The reason given for each question above, in the same order.
    // {other} is the thing I didn't pick.
    reasons: [
      "It protects one of your daily minimums, and those come first. The other can wait.",
      "This one won't come round again. The other will still be there.",
      "It's the one you'd regret skipping. Trust that.",
      "It's been waiting longest. The other has had its turn.",
    ],

    // What the app finds in my diary for questions 1 and 4. I can always choose differently.
    // {option} is the one it points to.
    findings: {
      sameArea: "Both belong to {area}, so your diary can't separate them.",

      // Question 1: daily minimums still open today in each option's life area
      minimumOne: "{area} still has 1 daily minimum open today. {other} has none. That points to {option}.",
      minimumMany: "{area} still has {count} daily minimums open today. {other} has none. That points to {option}.",
      minimumBoth: "Both areas still have daily minimums open today, so that doesn't settle it.",
      minimumNeither: "Neither area has a daily minimum open today.",

      // Question 4: how long since each area was fed
      neglected: "{areaA}: {whenA}. {areaB}: {whenB}. That points to {option}.",
      neglectedSame: "{areaA}: {whenA}. {areaB}: {whenB}. That doesn't settle it.",
      whenNever: "nothing recorded yet",
      whenToday: "fed today",
      whenYesterday: "fed yesterday",
      whenDays: "fed {days} days ago",
    },

    resultLabel: "Here's my read",
    answer: "Go with this: {chosen}.",
    noWinner: "No clear winner, and that's okay.",
    noWinnerReason: "When it's this close, either is a good choice. Go with the smaller one, or the one that's easier to undo, and let the other go without guilt.",

    // The list of past decisions
    history: "Past decisions",
    historyEmpty: "No decisions yet. They'll appear here after your first one.",
    historyChose: "{chosen}, over {other}",
    historyNoWinner: "{a} or {b}: no clear winner",
    historyBack: "Back",
    // Why each was chosen, in the same order as the four questions
    historyReasons: [
      "It protected a daily minimum.",
      "It couldn't be repeated.",
      "You'd have regretted skipping it.",
      "It had waited longest.",
    ],

    // After the verdict: keep the other option so it isn't lost
    keepPrompt: "Want to keep the other one for later? {other}",
    keepTomorrow: "For tomorrow",
    keepOpen: "Until it's done",
    keptTomorrow: "Kept. I'll offer it to you tomorrow.",
    keptOpen: "Kept. It's with your closing windows until you do it.",
    close: "Close",
    again: "Start again",
  },

  // ---------- No-regret essentials ----------
  // text: the essential itself.
  // area: the id of the life area it belongs to (see activities.js).
  // way:  one small way to honour it today. Morning shows one essential a day, in this order.
  essentials: [
    {
      text: "Time with parents and family while they're here",
      area: "family",
      way: "Call or sit with one of them, phone away.",
    },
    {
      text: "Staying close to a few real friends",
      area: "family",
      way: "Send one friend a message that isn't about plans.",
    },
    {
      text: "Saying what I feel: love, thanks, apologies",
      area: "family",
      way: "Tell one person something you've been meaning to say.",
    },
    {
      text: "Looking after my health before it forces me to",
      area: "health",
      way: "Do the smallest version: ten minutes of movement.",
    },
    {
      text: "Saving and investing early, even small amounts",
      area: "wealth",
      way: "Move a small amount into savings, or do the money check.",
    },
    {
      text: "Trying the thing I keep postponing",
      area: "growth",
      way: "Give it ten minutes. Starting counts.",
    },
    {
      text: "Living by my own values, not others' expectations",
      area: "meaning",
      way: "Before one decision today, ask: is this mine?",
    },
    {
      text: "Letting myself enjoy life now, not \"after X\"",
      area: "enjoyment",
      way: "Pick one thing you enjoy and do it without earning it.",
    },
  ],
};

// Picks one version of a line that has several.
function pick(versions) {
  return versions[Math.floor(Math.random() * versions.length)];
}

// Fills the {curly bracket} blanks in a sentence.
// say("Nothing in {area} yet.", { area: "Health" }) gives "Nothing in Health yet."
function say(sentence, blanks) {
  return sentence.replace(/\{(\w+)\}/g, (whole, name) => (name in blanks ? blanks[name] : whole));
}
