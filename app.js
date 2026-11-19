// Quiet Compass: What Now screen.
// The activity list itself lives in activities.js.

// ---------- Memory: kept on this phone, nowhere else ----------

const LOG_KEY = "quiet-compass-log"; // what I did or skipped
const WINDOWS_KEY = "quiet-compass-windows"; // my closing-window items

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // If the phone refuses to save (for example in Private Browsing), carry on without memory.
  }
}

// ---------- My library: what I've finished ----------

// The activity list in activities.js is the starting point. What I change on the Compass
// is kept here, on this phone. Looks like: { finished: ["Watch Kingdom"], added: [] }
const LIBRARY_KEY = "quiet-compass-library";
const startingActivities = activities.slice(); // the list exactly as activities.js wrote it

// The kinds of thing that can be finished for good.
const FINISHABLE_KINDS = ["book", "manga", "series", "film", "documentary"];

function loadLibrary() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(LIBRARY_KEY));
  } catch (error) {
    saved = null;
  }
  return Object.assign({ finished: [], added: [] }, saved);
}

// Everything I could ever be offered: the starting list plus anything I've added.
function wholeLibrary() {
  return startingActivities.concat(loadLibrary().added);
}

// Rebuild the working list the rest of the app uses: the whole library, minus what I've finished.
function applyLibrary() {
  const finished = loadLibrary().finished;
  activities.length = 0;
  wholeLibrary()
    .filter((activity) => !finished.includes(activity.name))
    .forEach((activity) => activities.push(activity));
}

function finishActivity(name) {
  const library = loadLibrary();
  if (!library.finished.includes(name)) library.finished.push(name);
  save(LIBRARY_KEY, library);
  applyLibrary();
}

function bringBackActivity(name) {
  const library = loadLibrary();
  library.finished = library.finished.filter((finished) => finished !== name);
  save(LIBRARY_KEY, library);
  applyLibrary();
}

// When I add something, its kind decides the energy, place and time it needs.
const KIND_DEFAULTS = {
  book: { energy: "low", places: ["sit", "walk"], time: 30 },
  manga: { energy: "low", places: ["sit", "walk"], time: 10 },
  series: { energy: "low", places: ["sit", "walk"], time: 30 },
  film: { energy: "low", places: ["sit", "walk"], time: 60, once: true },
  documentary: { energy: "low", places: ["sit", "walk"], time: 60, once: true },
  practice: { energy: "medium", places: ["sit"], time: 10 },
  other: { energy: "low", places: "anywhere", time: 10 },
};

// Add something of my own to a life area. Returns false if it's empty or already on the list.
function addActivity(typedName, kind, areaId) {
  let name = typedName.trim();
  if (!name) return false;

  // "Dune" as a film becomes "Watch Dune", unless I already typed the "Watch".
  const prefix = words.compass.kindPrefixes[kind];
  if (prefix && name.toLowerCase().startsWith(prefix.toLowerCase())) name = name.slice(prefix.length).trim();
  name = prefix + name.charAt(0).toUpperCase() + name.slice(1); // tidy capitals: "watch dune" becomes "Watch Dune"

  const taken = wholeLibrary().some((activity) => activity.name.toLowerCase() === name.toLowerCase());
  if (taken) return false;

  const library = loadLibrary();
  library.added.push(
    Object.assign(
      { name: name, kind: kind, area: areaId, benefit: words.compass.kindBenefits[kind], added: true },
      KIND_DEFAULTS[kind]
    )
  );
  save(LIBRARY_KEY, library);
  applyLibrary();
  return true;
}

// Remove something I added. My diary keeps what I already did with it.
function removeActivity(name) {
  const library = loadLibrary();
  library.added = library.added.filter((activity) => activity.name !== name);
  library.finished = library.finished.filter((finished) => finished !== name);
  save(LIBRARY_KEY, library);
  applyLibrary();
}

applyLibrary();

// Each log entry looks like:
// { name: "Meditation", area: "health", part: "mind", action: "done", at: "2026-11-18T21:40:00.000Z" }
function addToLog(item, action) {
  const log = load(LOG_KEY);
  log.push({
    name: item.name,
    area: item.area || null,
    part: item.part || null,
    action: action,
    at: new Date().toISOString(),
  });
  save(LOG_KEY, log);
  return log[log.length - 1].at; // lets "undo" find exactly this entry again
}

// Undo: forget that I did this today (used when I untick something on Morning).
function removeDoneToday(name) {
  const today = todayString();
  const log = load(LOG_KEY).filter(
    (entry) => !(entry.action === "done" && entry.name === name && dateString(shifted(entry.at)) === today)
  );
  save(LOG_KEY, log);
}

// My day doesn't end at midnight. It ends at 4 am, so a late night still counts
// as the day I'm living. "Shifting" a moment back by 4 hours gives the day it belongs to:
// 12:30 am on the 19th becomes 8:30 pm on the 18th.
const DAY_ENDS_AT_HOUR = 4;

function shifted(moment) {
  const date = new Date(moment);
  date.setHours(date.getHours() - DAY_ENDS_AT_HOUR);
  return date;
}

// Names of things I marked as "done" or "skip" today.
function namesToday(action) {
  const today = todayString();
  return load(LOG_KEY)
    .filter((entry) => entry.action === action && dateString(shifted(entry.at)) === today)
    .map((entry) => entry.name);
}

// A date written as 2026-11-18, the same way the date picker writes dates.
function dateString(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + day;
}

function todayString() {
  return dateString(shifted(new Date()));
}

function tomorrowString() {
  const date = shifted(new Date());
  date.setDate(date.getDate() + 1);
  return dateString(date);
}

// Closing-window items that are open today: not done, the date hasn't passed,
// and (for items that came from the Night screen) their day has arrived.
function openWindows() {
  const today = todayString();
  return load(WINDOWS_KEY).filter((item) => {
    if (item.doneAt) return false;
    if (item.date && item.date < today) return false;
    if (item.notBefore && item.notBefore > today) return false;
    return true;
  });
}

// Have I done this activity within the last so-many days (today included)?
function doneInLastDays(name, days) {
  const today = shifted(new Date());
  today.setHours(0, 0, 0, 0);
  return load(LOG_KEY).some((entry) => {
    if (entry.action !== "done" || entry.name !== name) return false;
    const day = shifted(entry.at);
    day.setHours(0, 0, 0, 0);
    return Math.round((today - day) / 86400000) < days;
  });
}

// Is it evening? From 8 pm until my day ends at 4 am.
const EVENING_STARTS_AT_HOUR = 20;

function isEvening() {
  const hour = new Date().getHours();
  return hour >= EVENING_STARTS_AT_HOUR || hour < DAY_ENDS_AT_HOUR;
}

// How many days since I last did anything in this life area? Infinity means never.
function daysSince(area) {
  const times = load(LOG_KEY)
    .filter((entry) => entry.action === "done" && areaOf(entry) === area)
    .map((entry) => new Date(entry.at).getTime());
  if (times.length === 0) return Infinity;

  const lastDay = shifted(Math.max(...times));
  lastDay.setHours(0, 0, 0, 0);
  const today = shifted(new Date());
  today.setHours(0, 0, 0, 0);
  return Math.round((today - lastDay) / 86400000);
}

// Diary entries written before version 0.2 used four area names.
// They are read under the new ids, so nothing recorded earlier is lost.
const earlierAreaNames = { Health: "health", Family: "family", Growth: "growth", Enjoyment: "enjoyment" };

// Which life area does this diary entry belong to?
function areaOf(entry) {
  if (entry.area) return earlierAreaNames[entry.area] || entry.area;
  const activity = activities.find((item) => item.name === entry.name);
  return activity ? activity.area : null;
}

// The on-screen name of a life area, for example "growth" becomes "Growth & mastery".
function areaName(id) {
  const area = areas.find((item) => item.id === id);
  return area ? area.name : id;
}

// ---------- What I've tapped ----------

// My last three taps are remembered for a few hours. After that the app starts from low, sit, 10 minutes.
const TAPS_KEY = "quiet-compass-taps";
const REMEMBER_TAPS_HOURS = 3;

const answers = { energy: null, place: null, time: null };

// Used to compare: "medium" energy is enough for a "low" activity, and so on.
const energyLevels = ["low", "medium", "high"];
const timeSlots = [10, 30, 60];

// Does this activity fit what I tapped?
function fits(activity) {
  const myEnergy = energyLevels.indexOf(answers.energy);
  const neededEnergy = energyLevels.indexOf(activity.energy);

  if (activity.onlyWhenLow && answers.energy !== "low") return false;
  if (neededEnergy > myEnergy) return false;
  if (activity.places !== "anywhere" && !activity.places.includes(answers.place)) return false;
  if (activity.time > Number(answers.time)) return false;
  return true;
}

// How much of my energy and time would go unused? Lower is a closer fit.
function spare(activity) {
  const spareEnergy = energyLevels.indexOf(answers.energy) - energyLevels.indexOf(activity.energy);
  const spareTime = timeSlots.indexOf(Number(answers.time)) - timeSlots.indexOf(activity.time);
  return spareEnergy + spareTime;
}

// ---------- Choosing a suggestion: the four-rung ladder ----------

const MAX_ALTERNATIVES = 2;

// One "round" is one visit to the suggestion: the first pick plus up to two alternatives.
let candidates = []; // what this round can show, in order. Each has a name and a reason.
let position = 0; // which candidate is on screen
let mode = "waiting"; // waiting, suggest, done, skipped or empty
let kindLine = ""; // a kind word shown above this round's suggestion, if one is called for

// How many things have I skipped in a row today, with nothing done in between?
function skipsInARow() {
  const today = todayString();
  const todays = load(LOG_KEY).filter((entry) => dateString(shifted(entry.at)) === today);
  let count = 0;
  for (let index = todays.length - 1; index >= 0 && todays[index].action === "skip"; index--) count++;
  return count;
}

// A short celebration that names what the thing fed.
function celebration(item) {
  if (!item.area) return pick(words.now.doneClosingLines);
  const fed = words.fed[item.part] || words.fed[item.area];
  const lines = item.area === "enjoyment" ? words.now.doneEnjoymentLines : words.now.doneLines;
  return say(pick(lines), { fed: fed });
}

// The greeting for this time of day.
function greeting() {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 4) return words.greetings.late;
  if (hour < 12) return words.greetings.morning;
  if (hour < 17) return words.greetings.afternoon;
  return words.greetings.evening;
}

// Sorts a list by several questions in turn: the second only matters when the first is a tie.
function sortBy(list, questions) {
  return list.slice().sort((a, b) => {
    for (const question of questions) {
      const answerA = question(a);
      const answerB = question(b);
      if (answerA < answerB) return -1;
      if (answerA > answerB) return 1;
    }
    return 0;
  });
}

// The reason under a suggested activity: what it gives me, then my own words
// for why that life area matters (the first sentence of what I wrote on the Compass).
function reasonFor(activity) {
  const myWhy = loadCompass().whys[activity.area] || "";
  const found = myWhy.match(/^[\s\S]*?[.!?](?=\s|$)/);
  let firstSentence = (found ? found[0] : myWhy).trim();
  if (firstSentence && !/[.!?]$/.test(firstSentence)) firstSentence += "."; // tidy ending
  const parts = [activity.benefit];
  if (firstSentence) parts.push(say(words.reasons.youSaid, { why: firstSentence }));
  return parts.filter(Boolean).join(" ");
}

function windowReason(item) {
  if (item.fromNight) return words.reasons.closingFromNight;
  if (item.fromDecide) return item.date ? words.reasons.closingSetAsideToday : words.reasons.closingSetAside;
  if (item.fromWeek) return say(words.reasons.closingFromWeek, { fed: words.fed[item.area] });
  if (!item.date) return words.reasons.closingNoDate;
  if (item.date === todayString()) return words.reasons.closingToday;
  return say(words.reasons.closingByDate, { date: shortDate(item.date) });
}

// Turns "2026-11-21" into "21 Nov".
function shortDate(dateText) {
  const parts = dateText.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function startRound() {
  const doneToday = namesToday("done");
  const skippedToday = namesToday("skip");

  const neglect = {};
  activities.forEach((activity) => {
    if (!(activity.area in neglect)) neglect[activity.area] = daysSince(activity.area);
  });

  // Things I skipped today are still offered, just after everything else on their rung.
  const skippedLast = (item) => (skippedToday.includes(item.name) ? 1 : 0);
  const mostNeglectedFirst = (activity) => -neglect[activity.area];
  // When two areas are equally neglected, my priorities decide: must before should before may.
  const priorityOrder = (activity) => areas.findIndex((area) => area.id === activity.area);

  // Films and documentaries I've already watched never come back.
  const everDone = load(LOG_KEY)
    .filter((entry) => entry.action === "done")
    .map((entry) => entry.name);

  const fitting = activities
    .filter(fits)
    .filter((activity) => !doneToday.includes(activity.name))
    .filter((activity) => !(activity.once && everDone.includes(activity.name)))
    .filter((activity) => !(activity.weekly && doneInLastDays(activity.name, 7)))
    .filter((activity) => !(activity.evening && !isEvening()));
  const minimums = fitting.filter((activity) => activity.minimum);
  const interests = fitting.filter((activity) => !activity.minimum);

  const rungs = [
    // Rung 1: a daily minimum I haven't done today. The most neglected area goes first.
    sortBy(minimums, [skippedLast, mostNeglectedFirst, priorityOrder, spare]).map((activity) => ({
      name: activity.name,
      area: activity.area,
      part: activity.part,
      reason: reasonFor(activity),
    })),

    // Rung 2: something with a closing window. The nearest date goes first.
    sortBy(openWindows(), [skippedLast, (item) => item.date || "9999", (item) => item.addedAt]).map((item) => ({
      name: item.name,
      area: item.area || null, // only the weekly promise belongs to a life area
      windowId: item.id,
      reason: windowReason(item),
    })),

    // Rung 3: an interest from the life area I've neglected longest.
    sortBy(interests, [skippedLast, mostNeglectedFirst, priorityOrder, spare]).map((activity) => ({
      name: activity.name,
      area: activity.area,
      part: activity.part,
      reason: reasonFor(activity),
    })),

    // Rung 4: something I enjoy. The closest fit goes first.
    sortBy(interests, [skippedLast, spare]).map((activity) => ({
      name: activity.name,
      area: activity.area,
      part: activity.part,
      reason: reasonFor(activity),
    })),
  ];

  // The first suggestion comes from the highest rung that has something.
  // Each "show another" steps down a rung. If the lower rungs are empty,
  // it goes back to the top and takes whatever hasn't been shown yet.
  candidates = [];
  let startRung = 0;
  const notShownYet = (item) => !candidates.some((shown) => shown.name === item.name);

  while (candidates.length < 1 + MAX_ALTERNATIVES) {
    let found = null;
    for (let rung = startRung; rung < rungs.length && !found; rung++) {
      found = rungs[rung].find(notShownYet) || null;
      if (found) startRung = rung + 1;
    }
    for (let rung = 0; rung < rungs.length && !found; rung++) {
      found = rungs[rung].find(notShownYet) || null;
      if (found) startRung = rungs.length;
    }
    if (!found) break;
    candidates.push(found);
  }

  // Kindness first. After three skips in a row, lead with a real rest (unless I've
  // already done or skipped it today). At low energy, say that low energy is fine.
  const skips = skipsInARow();
  if (skips >= 3) {
    const rest = activities.find((activity) => activity.rest);
    if (rest && !doneToday.includes(rest.name) && !skippedToday.includes(rest.name)) {
      candidates = candidates.filter((candidate) => candidate.name !== rest.name);
      candidates.unshift({ name: rest.name, area: rest.area, part: rest.part, reason: reasonFor(rest) });
      candidates = candidates.slice(0, 1 + MAX_ALTERNATIVES);
    }
    kindLine = words.now.manySkips;
  } else if (answers.energy === "low") {
    kindLine = words.now.lowEnergy;
  } else {
    kindLine = "";
  }

  position = 0;
  mode = candidates.length > 0 ? "suggest" : "empty";
  show();
}

// ---------- The honest nudge ----------

// When I last said "not today". Looks like: { dismissedOn: "2026-11-19" }
const NUDGE_KEY = "quiet-compass-nudge";
const NUDGE_AFTER_DAYS = 3;

// The one nudge to show right now, or null. It names the life area that has gone
// longest without attention (past its limit) and one small action from that area.
function currentNudge() {
  if (load(NUDGE_KEY).dismissedOn === todayString()) return null;

  const log = load(LOG_KEY);
  if (log.length === 0) return null; // a brand-new diary gets no nudges

  // An area I've never fed counts from my very first diary entry, not from forever.
  const today = shifted(new Date());
  today.setHours(0, 0, 0, 0);
  const firstDay = shifted(Math.min(...log.map((entry) => new Date(entry.at).getTime())));
  firstDay.setHours(0, 0, 0, 0);
  const daysOfDiary = Math.round((today - firstDay) / 86400000);

  const doneToday = namesToday("done");
  const everDone = log.filter((entry) => entry.action === "done").map((entry) => entry.name);

  let hungriest = null;
  areas.forEach((area) => {
    // Things I could do for this area today, smallest first.
    const possible = activities
      .filter((activity) => activity.area === area.id)
      .filter((activity) => !doneToday.includes(activity.name))
      .filter((activity) => !(activity.once && everDone.includes(activity.name)))
      .filter((activity) => !(activity.evening && !isEvening()))
      .sort((a, b) => a.time - b.time || energyLevels.indexOf(a.energy) - energyLevels.indexOf(b.energy));
    if (possible.length === 0) return;

    let days = daysSince(area.id);
    if (days === Infinity) days = daysOfDiary;
    if (days < (area.nudgeAfter || NUDGE_AFTER_DAYS)) return;

    // The longest wait wins. A tie goes to the higher priority, which comes first in the list.
    if (hungriest === null || days > hungriest.days) {
      hungriest = { area: area, days: days, activity: possible[0] };
    }
  });
  return hungriest;
}

// Draw the nudge (or hide it) in both places it can appear.
function showNudge() {
  const nudge = currentNudge();

  ["nudge-now", "nudge-morning"].forEach((id) => {
    const box = document.getElementById(id);
    box.textContent = "";
    box.hidden = !nudge;
    if (!nudge) return;

    // The same wording all day, a different one tomorrow.
    const dayNumber = Math.floor(shifted(new Date()).getTime() / 86400000);
    const line = words.nudge.lines[dayNumber % words.nudge.lines.length];
    box.append(piece("p", "", say(line, { area: nudge.area.name, days: nudge.days })));

    const buttons = piece("div", "nudge-buttons");
    const yes = piece("button", "nudge-yes", nudge.activity.name);
    yes.type = "button";
    yes.addEventListener("click", () => acceptNudge(nudge));
    const no = piece("button", "nudge-no", words.nudge.notToday);
    no.type = "button";
    no.addEventListener("click", () => {
      save(NUDGE_KEY, { dismissedOn: todayString() });
      showNudge();
    });
    buttons.append(yes, no);
    box.append(buttons);
  });
}

// "Yes": make that action my current suggestion on What Now, ready for done or skip.
function acceptNudge(nudge) {
  save(NUDGE_KEY, { dismissedOn: todayString() }); // one nudge a day is enough
  showScreen("now");
  const activity = nudge.activity;
  candidates = [{ name: activity.name, area: activity.area, part: activity.part, reason: reasonFor(activity) }];
  position = 0;
  mode = "suggest";
  kindLine = "";
  show();
  suggestion.scrollIntoView({ block: "center" });
}

// ---------- Putting it on screen ----------

const hint = document.getElementById("hint");
const suggestion = document.getElementById("suggestion");
const why = document.getElementById("why");
const kind = document.getElementById("kind");
const actions = document.getElementById("actions");
const doneButton = document.getElementById("done");
const skipButton = document.getElementById("skip");
const anotherButton = document.getElementById("another");
const coach = document.getElementById("coach");
const coachText = document.getElementById("coach-text");
const undoButton = document.getElementById("undo");

// The coach's line after "done" or "skip", and what "undo" would take back.
let coachLine = "";
let undoable = null; // { name, at, windowId } for the thing I just marked done
let coachTimer = null;
const COACH_LINE_SECONDS = 6;

function sayCoach(line, whatToUndo) {
  coachLine = line;
  undoable = whatToUndo;
  clearTimeout(coachTimer);
  coachTimer = setTimeout(() => {
    coachLine = "";
    undoable = null;
    show();
  }, COACH_LINE_SECONDS * 1000);
}

function allAnswered() {
  return Object.values(answers).every((value) => value !== null);
}

// Plays a short animation on an element by taking its class off and putting it back on.
function replay(element, className) {
  element.classList.remove(className);
  void element.offsetWidth; // makes the browser notice the class was removed
  element.classList.add(className);
}

const resultCard = document.querySelector(".result");
let lastShown = ""; // what the card showed last time, to tell when it has changed

function show() {
  hint.hidden = !(mode === "waiting" || mode === "empty");
  suggestion.hidden = mode === "waiting" || mode === "empty";
  why.hidden = suggestion.hidden;
  actions.hidden = mode !== "suggest";
  anotherButton.hidden = !(mode === "suggest" && position < candidates.length - 1);

  if (mode === "waiting") {
    const remaining = Object.values(answers).filter((value) => value === null).length;
    hint.textContent = remaining === 1 ? words.now.oneMoreTap : say(words.now.moreTaps, { count: remaining });
  }

  if (mode === "empty") {
    hint.textContent = words.now.nothingFits;
  }

  if (mode === "suggest") {
    suggestion.textContent = candidates[position].name;
    why.textContent = candidates[position].reason;
  }

  // The bar at the bottom only shows when it has a button to offer.
  document.getElementById("now-bar").hidden = actions.hidden;

  showNudge();

  // The coach's line about what I just did sits above the next suggestion for a few seconds.
  // While it's there, it takes the place of the "low energy is fine" line.
  coach.hidden = !coachLine;
  coachText.textContent = coachLine;
  undoButton.hidden = !undoable;
  // The small line at the top of the card: a kind word when one is called for,
  // otherwise the greeting for this time of day.
  kind.hidden = !(mode === "suggest" && !coachLine);
  kind.textContent = kindLine || greeting();

  // A short fade whenever the card says something new, so the change is noticed.
  const nowShown = mode + "|" + suggestion.textContent + "|" + hint.textContent;
  if (nowShown !== lastShown) {
    lastShown = nowShown;
    replay(resultCard, "changed");
  }
}

// ---------- Taps on the main screen ----------

// One tap handler for all nine answer buttons.
document.querySelectorAll(".question").forEach((question) => {
  const name = question.dataset.question;
  const buttons = question.querySelectorAll("button");

  buttons.forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      answers[name] = button.dataset.value;
      save(TAPS_KEY, { answers: Object.assign({}, answers), at: Date.now() });
      buttons.forEach((other) => {
        other.setAttribute("aria-pressed", String(other === button));
      });

      if (allAnswered()) {
        startRound();
      } else {
        show();
      }
    });
  });
});

doneButton.addEventListener("click", () => {
  const current = candidates[position];
  if (mode !== "suggest" || !current) return; // nothing on offer, so nothing to mark
  const at = addToLog(current, "done");

  // A closing-window item is finished for good once it's done.
  if (current.windowId) {
    const items = load(WINDOWS_KEY);
    const item = items.find((entry) => entry.id === current.windowId);
    if (item) item.doneAt = new Date().toISOString();
    save(WINDOWS_KEY, items);
    showWindowList();
  }

  // Celebrate briefly, offer undo, and move straight on to the next suggestion.
  sayCoach(celebration(current), { name: current.name, at: at, windowId: current.windowId || null });
  startRound();
});

skipButton.addEventListener("click", () => {
  const current = candidates[position];
  if (mode !== "suggest" || !current) return;
  addToLog(current, "skip");
  sayCoach(pick(words.now.skippedLines), null);
  startRound();
});

// Undo: take back the "done" I just tapped, as if it never happened.
undoButton.addEventListener("click", () => {
  if (!undoable) return;
  const taken = undoable;
  save(
    LOG_KEY,
    load(LOG_KEY).filter((entry) => !(entry.action === "done" && entry.name === taken.name && entry.at === taken.at))
  );
  if (taken.windowId) {
    const items = load(WINDOWS_KEY);
    const item = items.find((entry) => entry.id === taken.windowId);
    if (item) item.doneAt = null;
    save(WINDOWS_KEY, items);
    showWindowList();
  }
  clearTimeout(coachTimer);
  coachLine = "";
  undoable = null;
  startRound();
});

anotherButton.addEventListener("click", () => {
  position = position + 1;
  show();
});


// ---------- Closing windows: add, list, remove ----------

const openWindowsButton = document.getElementById("open-windows");
const windowForm = document.getElementById("window-form");
const windowName = document.getElementById("window-name");
const windowDate = document.getElementById("window-date");
const closeWindowsButton = document.getElementById("close-windows");
const windowList = document.getElementById("window-list");

// Start a fresh round so a new or removed item is taken into account straight away.
function refreshSuggestion() {
  if (allAnswered() && (mode === "suggest" || mode === "empty")) startRound();
}

function showWindowList() {
  windowList.textContent = "";

  openWindows().forEach((item) => {
    const row = document.createElement("li");

    const text = document.createElement("span");
    if (!item.date || item.fromNight) {
      text.textContent = item.name;
    } else if (item.date === todayString()) {
      text.textContent = say(words.windows.listToday, { name: item.name });
    } else {
      text.textContent = say(words.windows.listByDate, { name: item.name, date: shortDate(item.date) });
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = words.windows.remove;
    remove.addEventListener("click", () => {
      save(WINDOWS_KEY, load(WINDOWS_KEY).filter((entry) => entry.id !== item.id));
      showWindowList();
      refreshSuggestion();
    });

    row.append(text, remove);
    windowList.append(row);
  });
}

openWindowsButton.addEventListener("click", () => {
  windowForm.hidden = false;
  openWindowsButton.hidden = true;
  windowDate.min = todayString();
  showWindowList();
});

closeWindowsButton.addEventListener("click", () => {
  windowForm.hidden = true;
  openWindowsButton.hidden = false;
});

windowForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = windowName.value.trim();
  if (!name) return;

  const items = load(WINDOWS_KEY);
  items.push({
    id: String(Date.now()),
    name: name,
    date: windowDate.value || null,
    addedAt: new Date().toISOString(),
    doneAt: null,
  });
  save(WINDOWS_KEY, items);

  windowName.value = "";
  windowDate.value = "";
  showWindowList();
  refreshSuggestion();
});

// ---------- Morning screen ----------

// The one thing I'm looking forward to. The Night screen will write this (step 7).
// Each entry looks like: { date: "2026-11-19", text: "Dinner with Appa" }
const ONE_THING_KEY = "quiet-compass-one-thing";

const morningDate = document.getElementById("morning-date");
const oneThing = document.getElementById("one-thing");
const minimumHeading = document.getElementById("minimum-heading");
const weekThingBlock = document.getElementById("week-thing-block");
const wentWellBlock = document.getElementById("went-well-block");
const wentWell = document.getElementById("went-well");
const essentialText = document.getElementById("essential-text");
const essentialWay = document.getElementById("essential-way");
const essentialArea = document.getElementById("essential-area");

// Which essential is featured today? Counting days gives a steady rotation:
// each day shows the next one, and after the last it starts again.
function todaysEssential() {
  const today = shifted(new Date());
  const dayNumber = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000);
  return words.essentials[dayNumber % words.essentials.length];
}
const minimumList = document.getElementById("minimum-list");

let justTicked = null; // the daily minimum I ticked a moment ago

function showMorning() {
  showNudge();
  morningDate.textContent = shifted(new Date()).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const entry = load(ONE_THING_KEY).find((item) => item.date === todayString());
  // Hidden on mornings when I didn't choose one the night before.
  document.getElementById("one-thing-block").hidden = !entry;
  oneThing.textContent = entry ? entry.text : "";

  // Yesterday's "what went well", shown back to me. Hidden if I didn't write one.
  const yesterday = shifted(new Date());
  yesterday.setDate(yesterday.getDate() - 1);
  const lastNight = load(NIGHT_KEY).find((night) => night.date === dateString(yesterday));
  wentWellBlock.hidden = !(lastNight && lastNight.wentWell);
  wentWell.textContent = lastNight ? lastNight.wentWell : "";

  // This week's one thing, from Sunday's review. It stays until I've done it or the week ends.
  const weekThing = openWindows().find((item) => item.fromWeek);
  weekThingBlock.hidden = !weekThing;
  if (weekThing) {
    document.getElementById("week-thing").textContent = weekThing.name;
    document.getElementById("week-thing-area").textContent = areaName(weekThing.area);
  }

  // Today's essential: one a day, in rotation.
  const essential = todaysEssential();
  essentialText.textContent = essential.text;
  essentialWay.textContent = essential.way;
  essentialArea.textContent = areaName(essential.area);

  const doneToday = namesToday("done");
  const minimums = activities.filter((activity) => activity.minimum);
  const doneCount = minimums.filter((activity) => doneToday.includes(activity.name)).length;
  minimumHeading.textContent = say(words.morning.minimumsHeading, { done: doneCount, total: minimums.length });

  minimumList.textContent = "";
  minimums.forEach((activity) => {
    const isDone = doneToday.includes(activity.name);
    const row = document.createElement("li");

    // The whole row is one big tick box: tap to mark done, tap again to undo.
    const box = document.createElement("button");
    box.type = "button";
    box.setAttribute("role", "checkbox");
    box.setAttribute("aria-checked", String(isDone));

    const tick = document.createElement("span");
    tick.className = activity.name === justTicked ? "tick pop" : "tick";

    // The name, with what it gives me underneath.
    const label = document.createElement("span");
    label.className = "label";
    const name = document.createElement("span");
    name.textContent = activity.name;
    const benefit = document.createElement("span");
    benefit.className = "benefit";
    benefit.textContent = activity.benefit || "";
    label.append(name, benefit);

    box.append(tick, label);

    box.addEventListener("click", () => {
      if (isDone) {
        removeDoneToday(activity.name);
        justTicked = null;
      } else {
        addToLog(activity, "done");
        justTicked = activity.name; // so its tick pops when the list is redrawn
      }
      showMorning();
      justTicked = null;
    });

    row.append(box);
    minimumList.append(row);
  });
}

// ---------- Night screen ----------

// One entry per night. Each looks like:
// { date: "2026-11-18", wentWell: "...", regret: "...", oneThing: "...", at: "..." }
const NIGHT_KEY = "quiet-compass-nights";

const nightDate = document.getElementById("night-date");
const nightForm = document.getElementById("night-form");
const nightWell = document.getElementById("night-well");
const nightRegret = document.getElementById("night-regret");
const nightOneThing = document.getElementById("night-one-thing");
const nightSaved = document.getElementById("night-saved");
const weekReview = document.getElementById("week-review");
const weekStarved = document.getElementById("week-starved");
const nightWeek = document.getElementById("night-week");

function isSunday() {
  return shifted(new Date()).getDay() === 0;
}

// The life area that got the least attention in the last 7 days.
// A tie goes to the higher priority. Areas with nothing I can do in them are left out.
function starvedArea() {
  let starved = null;
  areas
    .filter((area) => activities.some((activity) => activity.area === area.id))
    .forEach((area) => {
      const days = fedDays(area.id).filter(Boolean).length;
      if (starved === null || days < starved.days) starved = { area: area, days: days };
    });
  return starved;
}

function showNight() {
  nightDate.textContent = shifted(new Date()).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // If I already finished today, show what I wrote so I can change it.
  const entry = load(NIGHT_KEY).find((item) => item.date === todayString());
  const nothingTyped = !nightWell.value && !nightRegret.value && !nightOneThing.value;
  if (entry && nothingTyped) {
    nightWell.value = entry.wentWell;
    nightRegret.value = entry.regret;
    nightOneThing.value = entry.oneThing;
  }
  nightOneThing.enterKeyHint = isSunday() ? "next" : "done";

  // Sunday night: the weekly review.
  weekReview.hidden = !isSunday();
  if (isSunday()) {
    const starved = starvedArea();
    weekStarved.textContent = say(words.night.weekStarved, { fed: words.fed[starved.area.id], days: starved.days });
    const savedPromise = load(WINDOWS_KEY).find((item) => item.id === "week-" + todayString());
    if (savedPromise && !nightWeek.value) nightWeek.value = savedPromise.name;
  }

  nightSaved.textContent = entry ? words.night.savedAlready : "";
  showProgress();
}

let nightNoteTimer = null; // the short wait before the "Saved" confirmation settles back

nightForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const today = todayString();
  const tomorrow = tomorrowString();
  const wentWell = nightWell.value.trim();
  const regret = nightRegret.value.trim();
  const oneThing = nightOneThing.value.trim();

  // 1. Keep tonight's answers. Saving twice on the same day replaces the first save.
  const nights = load(NIGHT_KEY).filter((item) => item.date !== today);
  nights.push({ date: today, wentWell: wentWell, regret: regret, oneThing: oneThing, at: new Date().toISOString() });
  save(NIGHT_KEY, nights);

  // 2. A regret becomes a closing-window item for tomorrow only.
  const regretId = "night-" + today;
  const items = load(WINDOWS_KEY).filter((item) => item.id !== regretId);
  if (regret) {
    items.push({
      id: regretId,
      name: regret,
      date: tomorrow,
      notBefore: tomorrow,
      fromNight: true,
      addedAt: new Date().toISOString(),
      doneAt: null,
    });
  }
  save(WINDOWS_KEY, items);

  // On Sundays: my one thing for the starved area becomes an item for the coming week.
  // It is offered on What Now from Monday and shown on Morning until done.
  if (isSunday()) {
    const weekId = "week-" + today;
    const promise = nightWeek.value.trim();
    const weekEnd = shifted(new Date());
    weekEnd.setDate(weekEnd.getDate() + 7);

    const withoutOld = load(WINDOWS_KEY).filter((item) => item.id !== weekId);
    if (promise) {
      withoutOld.push({
        id: weekId,
        name: promise,
        area: starvedArea().area.id,
        date: dateString(weekEnd),
        notBefore: tomorrow,
        fromWeek: true,
        addedAt: new Date().toISOString(),
        doneAt: null,
      });
    }
    save(WINDOWS_KEY, withoutOld);
  }

  // 3. The one thing shows on tomorrow's Morning screen.
  const things = load(ONE_THING_KEY).filter((item) => item.date !== tomorrow);
  if (oneThing) things.push({ date: tomorrow, text: oneThing });
  save(ONE_THING_KEY, things);

  // Say so where I'm looking: the button itself confirms, and the coach's line
  // appears just above it. Both settle back after a few seconds.
  const savedLine = pick(words.night.savedLines);
  nightSaved.textContent = savedLine;
  const finishButton = document.getElementById("night-finish");
  const note = document.getElementById("night-note");
  finishButton.textContent = words.night.finished;
  finishButton.classList.add("confirmed");
  note.textContent = savedLine;
  note.hidden = false;
  clearTimeout(nightNoteTimer);
  nightNoteTimer = setTimeout(() => {
    finishButton.textContent = words.night.finish;
    finishButton.classList.remove("confirmed");
    note.hidden = true;
  }, 4500);
  showProgress();
  document.activeElement.blur(); // puts the keyboard away
});

// ---------- The pick sheet: options to tap instead of typing ----------

const sheet = document.getElementById("sheet");
const sheetTitle = document.getElementById("sheet-title");
const sheetHint = document.getElementById("sheet-hint");
const sheetOptions = document.getElementById("sheet-options");

// Removes repeats from a list, keeping the first of each.
function unique(items) {
  return items.filter((item, index) => items.indexOf(item) === index);
}

// What each prompt offers. Everything comes from what is already on this phone.
function pickOptions(kind) {
  const doneToday = namesToday("done");
  const everDone = load(LOG_KEY)
    .filter((entry) => entry.action === "done")
    .map((entry) => entry.name);
  const stillOpen = (activity) => !(activity.once && everDone.includes(activity.name));

  if (kind === "well") {
    // Everything I marked done today.
    return unique(doneToday);
  }

  if (kind === "regret") {
    // Daily minimums I haven't ticked, things I skipped today, and my open closing windows.
    const unticked = activities
      .filter((activity) => activity.minimum && !doneToday.includes(activity.name))
      .map((activity) => activity.name);
    const skipped = namesToday("skip").filter((name) => !doneToday.includes(name));
    const windows = openWindows().map((item) => item.name);
    return unique(unticked.concat(skipped, windows));
  }

  if (kind === "oneThing") {
    // This week's one thing, then my interests: the things I do because I want to.
    const weekThing = openWindows()
      .filter((item) => item.fromWeek)
      .map((item) => item.name);
    const interests = activities
      .filter((activity) => !activity.minimum && stillOpen(activity))
      .sort((a, b) => (a.area === "enjoyment" ? 0 : 1) - (b.area === "enjoyment" ? 0 : 1))
      .map((activity) => activity.name);
    return unique(weekThing.concat(interests));
  }

  // "week": things I could do for the area that got the least of me.
  const starved = starvedArea().area.id;
  return activities
    .filter((activity) => activity.area === starved && stillOpen(activity))
    .map((activity) => activity.name);
}

const pickTargets = {
  well: { box: nightWell, title: words.night.sheetWell, many: true },
  regret: { box: nightRegret, title: words.night.sheetRegret, many: false },
  oneThing: { box: nightOneThing, title: words.night.sheetOneThing, many: false },
  week: { box: nightWeek, title: words.night.sheetWeek, many: false },
};

function openSheet(kind) {
  const target = pickTargets[kind];
  const options = pickOptions(kind);

  sheetTitle.textContent = target.title;
  if (options.length === 0) {
    sheetHint.textContent = kind === "well" ? words.night.sheetEmptyWell : words.night.sheetEmpty;
  } else {
    sheetHint.textContent = target.many ? words.night.sheetHintMany : "";
  }
  sheetHint.hidden = !sheetHint.textContent;

  sheetOptions.textContent = "";
  options.forEach((option) => {
    const row = piece("li");
    const button = piece("button", "", option);
    button.type = "button";
    // Already in the box? Show it as chosen.
    const alreadyIn = () => target.box.value.split(", ").includes(option);
    button.setAttribute("aria-pressed", String(alreadyIn()));

    button.addEventListener("click", () => {
      if (!target.many) {
        // One answer: put it in the box and close. I can still edit it afterwards.
        target.box.value = option;
        closeSheet();
        return;
      }
      // Several answers: tap to add, tap again to take out.
      const chosen = target.box.value ? target.box.value.split(", ") : [];
      const updated = alreadyIn() ? chosen.filter((item) => item !== option) : chosen.concat(option);
      target.box.value = updated.join(", ");
      button.setAttribute("aria-pressed", String(alreadyIn()));
    });

    row.append(button);
    sheetOptions.append(row);
  });

  // If the sheet was still sliding away from a moment ago, stop that first.
  clearTimeout(sheetTimer);
  sheet.classList.remove("closing");
  sheet.hidden = false;
  document.body.classList.add("sheet-open"); // stops the page behind from scrolling
}

let sheetTimer = null; // the short wait while the sheet slides away

function closeSheet() {
  // Let it slide away first, then take it off the screen.
  sheet.classList.add("closing");
  sheetTimer = setTimeout(() => {
    sheet.hidden = true;
    sheet.classList.remove("closing");
    document.body.classList.remove("sheet-open");
  }, 170);
}

document.querySelectorAll("[data-pick]").forEach((button) => {
  button.addEventListener("click", () => openSheet(button.dataset.pick));
});
document.getElementById("sheet-close").addEventListener("click", closeSheet);
// Tapping the dimmed area outside the sheet closes it too.
sheet.addEventListener("click", (event) => {
  if (event.target === sheet) closeSheet();
});

// ---------- Progress: today and the last 7 days ----------

const todayCount = document.getElementById("today-count");
const todayExtra = document.getElementById("today-extra");
const week = document.getElementById("week");
const dayDetail = document.getElementById("day-detail");

let selectedDay = null; // the day I tapped in the 7-day view

// Everything the progress view needs to know about one day.
function summaryOf(date) {
  const key = dateString(date);
  const minimumNames = activities.filter((activity) => activity.minimum).map((activity) => activity.name);
  const entries = load(LOG_KEY).filter((entry) => dateString(shifted(entry.at)) === key);
  const done = entries.filter((entry) => entry.action === "done");
  const skipped = entries.filter((entry) => entry.action === "skip");
  const minimumsDone = new Set(
    done.filter((entry) => minimumNames.includes(entry.name)).map((entry) => entry.name)
  ).size;

  return {
    key: key,
    date: date,
    minimumsDone: minimumsDone,
    minimumsTotal: minimumNames.length,
    totalDone: done.length,
    totalSkipped: skipped.length,
    fedAreas: new Set(done.map((entry) => areaOf(entry)).filter(Boolean)), // which life areas got attention
    nightFinished: load(NIGHT_KEY).some((night) => night.date === key),
  };
}

function detailOf(day) {
  const dayName = day.date.toLocaleDateString("en-GB", { weekday: "long" });
  // A day with nothing in it is "not recorded", never a failure.
  const nothing = day.totalDone === 0 && day.totalSkipped === 0 && !day.nightFinished;
  if (nothing) return say(words.night.dayNotRecorded, { day: dayName });

  const fedNames = areas.filter((area) => day.fedAreas.has(area.id)).map((area) => words.fed[area.id]);
  const fedLine = fedNames.length > 0 ? " " + say(words.night.dayFed, { fed: asList(fedNames) }) : "";

  return say(words.night.dayDetail, {
    day: day.date.toLocaleDateString("en-GB", { weekday: "long" }),
    done: day.minimumsDone,
    total: day.minimumsTotal,
    count: day.totalDone,
    skipped: day.totalSkipped,
    night: day.nightFinished ? words.night.nightFinished : words.night.nightNotFinished,
  }) + fedLine;
}

// Turns ["a", "b", "c"] into "a, b and c".
function asList(items) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join(", ") + " " + words.night.listAnd + " " + items[items.length - 1];
}

// One kind sentence: what I fed today, and which life area is hungry.
function balanceSentence() {
  const today = todayString();
  const fedToday = new Set(
    load(LOG_KEY)
      .filter((entry) => entry.action === "done" && dateString(shifted(entry.at)) === today)
      .map((entry) => areaOf(entry))
  );

  // In priority order. Only areas that have something I can do in them can be "hungry".
  const fed = areas.filter((area) => fedToday.has(area.id));
  const couldBeFed = areas.filter(
    (area) => !fedToday.has(area.id) && activities.some((activity) => activity.area === area.id)
  );

  // The hungry one: neglected longest. A tie goes to the higher priority.
  let hungry = null;
  couldBeFed.forEach((area) => {
    if (hungry === null || daysSince(area.id) > daysSince(hungry.id)) hungry = area;
  });

  const fedNames = asList(fed.map((area) => words.fed[area.id]));
  if (fed.length === 0) return say(words.night.fedNothing, { hungry: words.fed[hungry.id] });
  if (hungry === null) return say(words.night.fedEverything, { fed: fedNames });
  return say(words.night.fedAndHungry, { fed: fedNames, hungry: words.fed[hungry.id] });
}

function showProgress() {
  document.getElementById("balance").textContent = balanceSentence();

  // Today
  const today = summaryOf(shifted(new Date()));
  todayCount.textContent = say(words.night.todayCount, { done: today.minimumsDone, total: today.minimumsTotal });
  if (today.totalDone === 0) {
    todayExtra.textContent = words.night.nothingDone;
  } else if (today.totalDone === 1) {
    todayExtra.textContent = words.night.oneDone;
  } else {
    todayExtra.textContent = say(words.night.manyDone, { count: today.totalDone });
  }

  // The last 7 days, oldest on the left and today on the right.
  const days = [];
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const date = shifted(new Date());
    date.setDate(date.getDate() - daysAgo);
    days.push(summaryOf(date));
  }
  if (!days.some((day) => day.key === selectedDay)) selectedDay = today.key;

  // Totals for the week
  document.getElementById("week-totals").textContent = say(words.night.weekTotals, {
    done: days.reduce((sum, day) => sum + day.totalDone, 0),
    skipped: days.reduce((sum, day) => sum + day.totalSkipped, 0),
  });

  // Balance at a glance: one row per life area, one square per day.
  // Areas with nothing I can do in them yet are left out.
  const areaWeek = document.getElementById("area-week");
  areaWeek.textContent = "";
  areas
    .filter((area) => activities.some((activity) => activity.area === area.id))
    .forEach((area) => {
      const fedCount = days.filter((day) => day.fedAreas.has(area.id)).length;

      const heading = piece("div", "area-row-heading");
      heading.append(piece("span", "", area.name));
      heading.append(piece("span", "", say(words.night.areaDays, { days: fedCount })));

      const squares = piece("div", "area-row");
      days.forEach((day) => {
        const square = piece("span", "square");
        if (day.fedAreas.has(area.id)) square.classList.add("on");
        if (day.key === selectedDay) square.classList.add("selected");
        const cell = piece("span", "cell");
        cell.append(square);
        squares.append(cell);
      });

      areaWeek.append(heading, squares);
    });

  week.textContent = "";
  days.forEach((day) => {
    const column = document.createElement("button");
    column.type = "button";
    column.className = "day";
    column.setAttribute("aria-pressed", String(day.key === selectedDay));
    column.setAttribute("aria-label", detailOf(day));

    const track = document.createElement("span");
    track.className = "track";
    const bar = document.createElement("span");
    bar.className = "bar";
    bar.style.height = (day.minimumsDone / day.minimumsTotal) * 100 + "%";
    track.append(bar);

    const letter = document.createElement("span");
    letter.textContent = day.date.toLocaleDateString("en-GB", { weekday: "narrow" });

    const dot = document.createElement("span");
    dot.className = day.nightFinished ? "dot on" : "dot";

    column.append(track, letter, dot);
    column.addEventListener("click", () => {
      selectedDay = day.key;
      showProgress();
    });
    week.append(column);

    if (day.key === selectedDay) dayDetail.textContent = detailOf(day);
  });
}

// ---------- My Compass ----------

// My own "why" for each life area, and whether I've been through the first-time questions.
// Looks like: { introDone: true, introStep: 0, whys: { health: "...", family: "..." } }
const COMPASS_KEY = "quiet-compass-compass";

function loadCompass() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(COMPASS_KEY));
  } catch (error) {
    saved = null;
  }
  return Object.assign({ introDone: false, introStep: 0, whys: {} }, saved);
}

const compassIntro = document.getElementById("compass-intro");
const compassMain = document.getElementById("compass-main");
const compassAreas = document.getElementById("compass-areas");
const whyForm = document.getElementById("why-form");
const whyProgress = document.getElementById("why-progress");
const whyQuestion = document.getElementById("why-question");
const whyText = document.getElementById("why-text");
const whySkip = document.getElementById("why-skip");

let editingWhy = null; // the area whose "why" I'm editing right now
const openAreas = new Set(); // the areas I've unfolded, so they stay open
const openFinishedFolds = new Set(); // the "Finished" lists I've unfolded
let addingTo = null; // the life area whose "Add something" form is open

function showCompass() {
  const compass = loadCompass();
  compassIntro.hidden = compass.introDone;
  compassMain.hidden = !compass.introDone;
  if (compass.introDone) {
    showAreas();
  } else {
    showWhyQuestion();
  }
}

// --- The first-time questions, one life area at a time ---

function showWhyQuestion() {
  const compass = loadCompass();
  const area = areas[compass.introStep];
  whyProgress.textContent = say(words.compass.progress, { number: compass.introStep + 1, total: areas.length });
  whyQuestion.textContent = say(words.compass.question, { area: area.name });
  whyText.value = words.compass.areas[area.id].whyDraft;
}

// Keep the answer (an empty answer means "skip") and move to the next area.
function answerWhy(text) {
  const compass = loadCompass();
  if (text) compass.whys[areas[compass.introStep].id] = text;
  compass.introStep = compass.introStep + 1;
  if (compass.introStep >= areas.length) compass.introDone = true;
  save(COMPASS_KEY, compass);
  showCompass();
  window.scrollTo(0, 0);
}

whyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  answerWhy(whyText.value.trim());
});

whySkip.addEventListener("click", () => answerWhy(""));

// --- The compass itself ---

// For one life area: was anything done on each of the last 7 days? Oldest first, today last.
function fedDays(areaId) {
  const daysFed = new Set(
    load(LOG_KEY)
      .filter((entry) => entry.action === "done" && areaOf(entry) === areaId)
      .map((entry) => dateString(shifted(entry.at)))
  );

  const result = [];
  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const date = shifted(new Date());
    date.setDate(date.getDate() - daysAgo);
    result.push(daysFed.has(dateString(date)));
  }
  return result;
}

// A small helper for building pieces of the screen.
function piece(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function showAreas() {
  const compass = loadCompass();
  const everDone = load(LOG_KEY)
    .filter((entry) => entry.action === "done")
    .map((entry) => entry.name);
  const tierNames = { must: words.compass.tierMust, should: words.compass.tierShould, may: words.compass.tierMay };

  compassAreas.textContent = "";

  ["must", "should", "may"].forEach((tier) => {
    compassAreas.append(piece("h2", "tier", tierNames[tier]));

    areas
      .filter((area) => area.tier === tier)
      .forEach((area) => {
        const text = words.compass.areas[area.id];
        const fed = fedDays(area.id);
        const fedCount = fed.filter(Boolean).length;

        // The row I tap to unfold: the area's name and seven dots, one per day.
        const card = piece("details", "area");
        card.open = openAreas.has(area.id);
        card.addEventListener("toggle", () => {
          card.classList.toggle("just-opened", card.open); // plays the unfold animation
          if (card.open) {
            openAreas.add(area.id);
          } else {
            openAreas.delete(area.id);
          }
        });

        const row = piece("summary");
        row.append(piece("span", "area-name", area.name));
        const dots = piece("span", "fed-dots");
        fed.forEach((wasFed) => dots.append(piece("span", wasFed ? "on" : "")));
        row.append(dots);
        card.append(row);

        // Why it matters to me
        card.append(piece("h3", "", words.compass.whyLabel));
        const myWhy = compass.whys[area.id] || "";

        if (editingWhy === area.id) {
          const box = piece("textarea");
          box.rows = 5;
          box.value = myWhy || text.whyDraft;

          const buttons = piece("div", "actions");
          const saveButton = piece("button", "primary", words.compass.save);
          saveButton.type = "button";
          saveButton.addEventListener("click", () => {
            const latest = loadCompass();
            const written = box.value.trim();
            if (written) {
              latest.whys[area.id] = written;
            } else {
              delete latest.whys[area.id];
            }
            save(COMPASS_KEY, latest);
            editingWhy = null;
            showAreas();
          });
          const cancelButton = piece("button", "", words.compass.cancel);
          cancelButton.type = "button";
          cancelButton.addEventListener("click", () => {
            editingWhy = null;
            showAreas();
          });
          buttons.append(saveButton, cancelButton);
          card.append(box, buttons);
        } else {
          card.append(piece("p", myWhy ? "my-why" : "quiet", myWhy || words.compass.noWhy));
          const editButton = piece("button", "link-button", myWhy ? words.compass.edit : words.compass.addWhy);
          editButton.type = "button";
          editButton.addEventListener("click", () => {
            editingWhy = area.id;
            showAreas();
          });
          card.append(editButton);
        }

        // A good week
        card.append(piece("h3", "", words.compass.goodWeekLabel));
        card.append(piece("p", "", text.goodWeek));

        // How to approach it
        card.append(piece("h3", "", words.compass.approachLabel));
        const principles = piece("ul", "plain-list");
        text.approach.forEach((principle) => principles.append(piece("li", "", principle)));
        card.append(principles);

        // Attention in the last 7 days
        card.append(piece("h3", "", words.compass.attentionLabel));
        card.append(
          piece("p", "", fedCount > 0 ? say(words.compass.fedOn, { days: fedCount }) : words.compass.notRecorded)
        );

        // The no-regret essentials that belong to this area
        const itsEssentials = words.essentials.filter((essential) => essential.area === area.id);
        if (itsEssentials.length > 0) {
          card.append(piece("h3", "", words.compass.essentialsLabel));
          const essentialList = piece("ul", "plain-list");
          itsEssentials.forEach((essential) => essentialList.append(piece("li", "", essential.text)));
          card.append(essentialList);
        }

        // What feeds it: my activities in this area (films already watched are left out)
        card.append(piece("h3", "", words.compass.activitiesLabel));
        const mine = activities.filter(
          (activity) => activity.area === area.id && !(activity.once && everDone.includes(activity.name))
        );
        if (mine.length === 0) {
          card.append(piece("p", "quiet", words.compass.noActivities));
        } else {
          const list = piece("ul", "feeds-list");
          mine.forEach((activity) => {
            const row = piece("li");
            row.append(piece("span", "", activity.name));

            // A book, manga, series, film or documentary can be finished for good.
            if (FINISHABLE_KINDS.includes(activity.kind)) {
              const finishButton = piece("button", "link-button", words.compass.finished);
              finishButton.type = "button";
              finishButton.addEventListener("click", () => {
                finishActivity(activity.name);
                showAreas();
              });
              row.append(finishButton);
            }

            // Something I added myself can also be removed.
            if (activity.added) {
              const removeButton = piece("button", "link-button", words.compass.remove);
              removeButton.type = "button";
              removeButton.addEventListener("click", () => {
                removeActivity(activity.name);
                showAreas();
              });
              row.append(removeButton);
            }
            list.append(row);
          });
          card.append(list);
        }

        // Add something of my own to this area.
        if (addingTo === area.id) {
          const form = piece("div", "add-form");

          form.append(piece("p", "chips-label", words.compass.addNameLabel));
          const nameBox = piece("input");
          nameBox.type = "text";
          nameBox.autocomplete = "off";
          nameBox.setAttribute("aria-label", words.compass.addNameLabel);
          form.append(nameBox);

          form.append(piece("p", "chips-label", words.compass.addKindLabel));
          const kindRow = piece("div", "chips");
          let chosenKind = null;
          Object.keys(words.compass.kinds).forEach((kind) => {
            const chip = piece("button", "", words.compass.kinds[kind]);
            chip.type = "button";
            chip.setAttribute("aria-pressed", "false");
            chip.addEventListener("click", () => {
              chosenKind = kind;
              kindRow.querySelectorAll("button").forEach((other) => {
                other.setAttribute("aria-pressed", String(other === chip));
              });
            });
            kindRow.append(chip);
          });
          form.append(kindRow);

          const problem = piece("p", "hint add-problem");
          problem.hidden = true;
          form.append(problem);

          const buttons = piece("div", "actions");
          const addButton = piece("button", "primary", words.compass.addSave);
          addButton.type = "button";
          addButton.addEventListener("click", () => {
            if (!nameBox.value.trim()) {
              nameBox.focus();
              return;
            }
            const added = addActivity(nameBox.value, chosenKind || "other", area.id);
            if (!added) {
              problem.textContent = words.compass.addDuplicate;
              problem.hidden = false;
              return;
            }
            addingTo = null;
            showAreas();
          });
          const cancelButton = piece("button", "", words.compass.addCancel);
          cancelButton.type = "button";
          cancelButton.addEventListener("click", () => {
            addingTo = null;
            showAreas();
          });
          buttons.append(addButton, cancelButton);
          form.append(buttons);
          card.append(form);
        } else {
          const openAdd = piece("button", "link-button add-link", words.compass.add);
          openAdd.type = "button";
          openAdd.addEventListener("click", () => {
            addingTo = area.id;
            showAreas();
          });
          card.append(openAdd);
        }

        // What I've finished in this area, folded away, with a way to bring each one back.
        const finishedNames = loadLibrary().finished;
        const finishedHere = wholeLibrary().filter(
          (activity) => activity.area === area.id && finishedNames.includes(activity.name)
        );
        if (finishedHere.length > 0) {
          const fold = piece("details", "finished-fold");
          fold.open = openFinishedFolds.has(area.id);
          fold.addEventListener("toggle", () => {
            if (fold.open) {
              openFinishedFolds.add(area.id);
            } else {
              openFinishedFolds.delete(area.id);
            }
          });
          fold.append(piece("summary", "", say(words.compass.finishedCount, { count: finishedHere.length })));

          const finishedList = piece("ul", "feeds-list");
          finishedHere.forEach((activity) => {
            const row = piece("li");
            row.append(piece("span", "", activity.name));
            const backButton = piece("button", "link-button", words.compass.bringBack);
            backButton.type = "button";
            backButton.addEventListener("click", () => {
              bringBackActivity(activity.name);
              showAreas();
            });
            row.append(backButton);
            finishedList.append(row);
          });
          fold.append(finishedList);
          card.append(fold);
        }

        compassAreas.append(card);
      });
  });

  // All eight essentials together, each with the life area it belongs to.
  const essentialsList = document.getElementById("essentials-list");
  essentialsList.textContent = "";
  words.essentials.forEach((essential) => {
    const row = piece("li");
    row.append(piece("span", "", essential.text));
    row.append(piece("span", "essential-area", areaName(essential.area)));
    essentialsList.append(row);
  });
}

// ---------- Help me decide ----------

const decideForm = document.getElementById("decide-form");
const decideA = document.getElementById("decide-a");
const decideB = document.getElementById("decide-b");
const decideQuestion = document.getElementById("decide-question");
const decideResult = document.getElementById("decide-result");
const decideProgress = document.getElementById("decide-progress");
const decideText = document.getElementById("decide-text");
const decidePickA = document.getElementById("decide-pick-a");
const decidePickB = document.getElementById("decide-pick-b");
const decideAnswer = document.getElementById("decide-answer");
const decideReason = document.getElementById("decide-reason");

let decideStep = 0; // which of the four questions I'm on
const decideAreas = { a: null, b: null }; // the life area I tapped for each option
const decideFinding = document.getElementById("decide-finding");

// The row of life areas under each box. Tapping one selects it; tapping it again clears it.
function showAreaChoices(which) {
  const row = document.getElementById("decide-areas-" + which);
  row.textContent = "";
  areas.forEach((area) => {
    const chip = piece("button", "", area.name);
    chip.type = "button";
    chip.setAttribute("aria-pressed", String(decideAreas[which] === area.id));
    chip.addEventListener("click", () => {
      decideAreas[which] = decideAreas[which] === area.id ? null : area.id;
      showAreaChoices(which);
    });
    row.append(chip);
  });
}

// How long ago a life area was last fed, in words.
function whenFed(areaId) {
  const days = daysSince(areaId);
  if (days === Infinity) return words.decide.findings.whenNever;
  if (days === 0) return words.decide.findings.whenToday;
  if (days === 1) return words.decide.findings.whenYesterday;
  return say(words.decide.findings.whenDays, { days: days });
}

// For questions 1 and 4, look in my diary. Returns the line to show and which
// option it points to ("a", "b" or null when it can't tell). Other questions: nothing.
function findingFor(step) {
  const found = words.decide.findings;
  const a = decideAreas.a;
  const b = decideAreas.b;
  if ((step !== 0 && step !== 3) || !a || !b) return null;
  if (a === b) return { line: say(found.sameArea, { area: areaName(a) }), points: null };

  const optionName = { a: decideA.value.trim(), b: decideB.value.trim() };

  if (step === 0) {
    // Question 1: which area still has daily minimums I haven't ticked today?
    const doneToday = namesToday("done");
    const open = (areaId) =>
      activities.filter((activity) => activity.minimum && activity.area === areaId && !doneToday.includes(activity.name)).length;
    const openA = open(a);
    const openB = open(b);
    if (openA > 0 && openB > 0) return { line: found.minimumBoth, points: null };
    if (openA === 0 && openB === 0) return { line: found.minimumNeither, points: null };

    const points = openA > 0 ? "a" : "b";
    const count = Math.max(openA, openB);
    return {
      line: say(count === 1 ? found.minimumOne : found.minimumMany, {
        area: areaName(points === "a" ? a : b),
        other: areaName(points === "a" ? b : a),
        count: count,
        option: optionName[points],
      }),
      points: points,
    };
  }

  // Question 4: which area has gone longest without attention?
  const daysA = daysSince(a);
  const daysB = daysSince(b);
  const blanks = { areaA: areaName(a), whenA: whenFed(a), areaB: areaName(b), whenB: whenFed(b) };
  if (daysA === daysB) return { line: say(found.neglectedSame, blanks), points: null };

  const points = daysA > daysB ? "a" : "b";
  blanks.option = optionName[points];
  return { line: say(found.neglected, blanks), points: points };
}

// Every decision I've made here, so I can look back on them.
// Each looks like: { at: "...", a: "Call my parents", b: "Design review", chosen: "a", question: 1 }
// chosen is null when there was no clear winner.
const DECISIONS_KEY = "quiet-compass-decisions";

function recordDecision(chosen, question) {
  const decisions = load(DECISIONS_KEY);
  decisions.push({
    at: new Date().toISOString(),
    a: decideA.value.trim(),
    b: decideB.value.trim(),
    areaA: decideAreas.a,
    areaB: decideAreas.b,
    chosen: chosen,
    question: question,
  });
  save(DECISIONS_KEY, decisions);
}

function showDecideHistory() {
  const decisions = load(DECISIONS_KEY).slice().reverse(); // newest first
  const list = document.getElementById("decide-history-list");
  list.textContent = "";
  document.getElementById("decide-history-empty").hidden = decisions.length > 0;

  decisions.forEach((decision) => {
    const row = piece("li");
    const date = shifted(decision.at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    row.append(piece("span", "history-date", date));

    if (decision.chosen) {
      const chosen = decision.chosen === "a" ? decision.a : decision.b;
      const other = decision.chosen === "a" ? decision.b : decision.a;
      row.append(piece("span", "history-what", say(words.decide.historyChose, { chosen: chosen, other: other })));
      row.append(piece("span", "history-why", words.decide.historyReasons[decision.question]));
    } else {
      row.append(piece("span", "history-what", say(words.decide.historyNoWinner, { a: decision.a, b: decision.b })));
    }
    list.append(row);
  });

  showDecideStage("history");
}

document.getElementById("decide-open-history").addEventListener("click", showDecideHistory);
document.getElementById("decide-history-back").addEventListener("click", () => showDecideStage("form"));

// Show one of the stages: "form", "question", "result" or "history".
function showDecideStage(stage) {
  document.getElementById("decide-history").hidden = stage !== "history";
  decideForm.hidden = stage !== "form";
  decideQuestion.hidden = stage !== "question";
  decideResult.hidden = stage !== "result";
  window.scrollTo(0, 0);
}

function startDecide() {
  decideA.value = "";
  decideB.value = "";
  decideAreas.a = null;
  decideAreas.b = null;
  showAreaChoices("a");
  showAreaChoices("b");
  showDecideStage("form");
}

function askDecideQuestion() {
  decideProgress.textContent = say(words.decide.progress, {
    number: decideStep + 1,
    total: words.decide.questions.length,
  });
  decideText.textContent = words.decide.questions[decideStep];
  decidePickA.textContent = decideA.value.trim();
  decidePickB.textContent = decideB.value.trim();

  // Show what my diary says, and mark the option it points to. I can still tap any of the three.
  const finding = findingFor(decideStep);
  decideFinding.hidden = !finding;
  decideFinding.textContent = finding ? finding.line : "";
  decidePickA.classList.toggle("suggested", Boolean(finding && finding.points === "a"));
  decidePickB.classList.toggle("suggested", Boolean(finding && finding.points === "b"));
  showDecideStage("question");
}

const decideKeep = document.getElementById("decide-keep");
const decideKept = document.getElementById("decide-kept");
let decideOther = null; // the option I didn't pick: { name, area }

// I picked a side ("a" or "b"): that's the answer, with the reason for this question.
function decideFor(which) {
  const boxes = { a: decideA, b: decideB };
  const otherSide = which === "a" ? "b" : "a";
  const chosen = boxes[which].value.trim();
  decideOther = { name: boxes[otherSide].value.trim(), area: decideAreas[otherSide] };

  decideAnswer.textContent = say(words.decide.answer, { chosen: chosen });
  decideReason.textContent = say(words.decide.reasons[decideStep], { chosen: chosen, other: decideOther.name });

  recordDecision(which, decideStep);

  // Offer to keep the other one, so choosing doesn't mean losing it.
  document.getElementById("decide-keep-prompt").textContent = say(words.decide.keepPrompt, { other: decideOther.name });
  decideKeep.hidden = false;
  decideKept.hidden = true;
  showDecideStage("result");
}

// Keep the other option as an item What Now can offer:
// for tomorrow only, or open-ended until I do it.
function keepOther(forTomorrow) {
  const items = load(WINDOWS_KEY);
  items.push({
    id: "decide-" + Date.now(),
    name: decideOther.name,
    area: decideOther.area,
    date: forTomorrow ? tomorrowString() : null,
    notBefore: forTomorrow ? tomorrowString() : null,
    fromDecide: true,
    addedAt: new Date().toISOString(),
    doneAt: null,
  });
  save(WINDOWS_KEY, items);
  showWindowList();

  decideKeep.hidden = true;
  decideKept.hidden = false;
  decideKept.textContent = forTomorrow ? words.decide.keptTomorrow : words.decide.keptOpen;
}

document.getElementById("decide-keep-tomorrow").addEventListener("click", () => keepOther(true));
document.getElementById("decide-keep-open").addEventListener("click", () => keepOther(false));

decideForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!decideA.value.trim() || !decideB.value.trim()) return;
  document.activeElement.blur(); // puts the keyboard away
  decideStep = 0;
  askDecideQuestion();
});

decidePickA.addEventListener("click", () => decideFor("a"));
decidePickB.addEventListener("click", () => decideFor("b"));

// No clear answer to this question: move to the next one, or admit there's no winner.
document.getElementById("decide-neither").addEventListener("click", () => {
  decideStep = decideStep + 1;
  if (decideStep < words.decide.questions.length) {
    askDecideQuestion();
  } else {
    decideAnswer.textContent = words.decide.noWinner;
    decideReason.textContent = words.decide.noWinnerReason;
    recordDecision(null, null);
    decideKeep.hidden = true; // nothing was set aside, so nothing to keep
    decideKept.hidden = true;
    showDecideStage("result");
  }
});

document.getElementById("open-decide").addEventListener("click", () => {
  startDecide();
  showScreen("decide");
});
document.getElementById("decide-cancel").addEventListener("click", () => showScreen("now"));
document.getElementById("decide-close").addEventListener("click", () => showScreen("now"));
document.getElementById("decide-again").addEventListener("click", startDecide);

// ---------- Moving between screens ----------

const tabButtons = document.querySelectorAll(".tabs button");

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.hidden = screen.id !== "screen-" + name;
  });
  tabButtons.forEach((button) => {
    if (button.dataset.screen === name) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  if (name === "morning") showMorning();
  if (name === "now") refreshSuggestion(); // something may have been ticked on Morning
  if (name === "night") showNight();
  if (name === "compass") showCompass();
  window.scrollTo(0, 0);
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => showScreen(button.dataset.screen));
});

// ---------- Typing ----------

// On Night, the keyboard's Return key moves to the next box. On the last box it puts the keyboard away.
// (Without this, Return would finish the day before I'd answered everything.)
nightForm.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.target.tagName !== "INPUT") return;
  event.preventDefault();
  const boxes = Array.from(nightForm.querySelectorAll('input[type="text"]')).filter((box) => box.getClientRects().length > 0);
  const next = boxes[boxes.indexOf(event.target) + 1];
  if (next) {
    next.focus();
  } else {
    event.target.blur();
  }
});

// Wherever I'm typing, keep that box in the middle of the screen, clear of the keyboard and the bars.
document.addEventListener("focusin", (event) => {
  const box = event.target;
  if (box.tagName !== "INPUT" && box.tagName !== "TEXTAREA") return;
  setTimeout(() => box.scrollIntoView({ block: "center", behavior: "smooth" }), 300); // after the keyboard has risen
});

// ---------- Starting up ----------

// Put the wording from words.js into every label, heading and button on the page.
// In index.html, data-words="now.title" means "use words.now.title here".
document.querySelectorAll("[data-words]").forEach((element) => {
  const path = element.dataset.words.split(".");
  element.textContent = words[path[0]][path[1]];
});

// Open with an answer already picked in each row, so a suggestion shows straight away.
// I only tap when one of them is wrong.
// If I tapped something in the last few hours, my situation probably hasn't changed, so start from that.
const savedTaps = load(TAPS_KEY);
const tapsAreRecent = savedTaps.at && Date.now() - savedTaps.at < REMEMBER_TAPS_HOURS * 3600000;
const startingAnswers = tapsAreRecent ? savedTaps.answers : { energy: "low", place: "sit", time: "10" };

Object.keys(startingAnswers).forEach((name) => {
  answers[name] = startingAnswers[name];
  document.querySelectorAll('[data-question="' + name + '"] button').forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.value === startingAnswers[name]));
  });
});

startRound();

// ---------- Offline and updates ----------

// Start the offline helper (sw.js). It only runs at a secure web address,
// so it is skipped when testing over home Wi-Fi.
if ("serviceWorker" in navigator) {
  const onThisMac = location.hostname === "localhost" || location.hostname === "127.0.0.1";

  if (onThisMac) {
    // While building on the Mac, always show the newest files: no helper, no saved copies.
    navigator.serviceWorker.getRegistrations().then((helpers) => helpers.forEach((helper) => helper.unregister()));
    caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
  } else {
    const hadHelperAlready = Boolean(navigator.serviceWorker.controller);

    navigator.serviceWorker
      .register("sw.js", { updateViaCache: "none" })
      .then((helper) => {
        helper.update();
        // Also look for a new edition whenever I come back to the app,
        // since the phone often keeps it open in the background.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") helper.update().catch(() => {});
        });
      })
      .catch(() => {
        // If it can't start, the app still works. It just needs a connection to open.
      });

    // When a new edition has fully arrived, refresh once to show it.
    // Not while I'm typing or on the Night screen, so nothing I've written is lost.
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadHelperAlready) return; // the very first visit has nothing to refresh
      const typing = document.activeElement && document.activeElement.tagName === "INPUT";
      const onNight = !document.getElementById("screen-night").hidden;
      if (typing || onNight) return;
      location.reload();
    });
  }
}
