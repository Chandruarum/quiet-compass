// My life areas and my activity list.

// ---------- Life areas, in order of priority ----------
//
// id:    a short tag the app uses behind the scenes. Don't change these:
//        my diary entries are filed under them.
// name:  what I see on screen. Safe to reword.
// tier:  "must", "should" or "may".
// parts: the sides of an area that each need looking after.
// nudgeAfter: how many quiet days before the app gently mentions it (3 if not set).

const areas = [
  { id: "health", name: "Health", tier: "must", parts: ["body", "mind", "food", "sleep", "self-compassion"] },
  { id: "family", name: "Family & relationships", tier: "must" },
  { id: "wealth", name: "Enough wealth", tier: "must", nudgeAfter: 10 }, // its action is weekly
  { id: "growth", name: "Growth & mastery", tier: "should" },
  { id: "meaning", name: "Meaning & contribution", tier: "should" },
  { id: "enjoyment", name: "Enjoyment & peace", tier: "should" },
  { id: "prosperity", name: "Prosperity beyond \"enough\"", tier: "may" },
];

// ---------- Activities ----------
//
// kind:   what sort of thing it is: practice, care, book, manga, series, film or documentary.
//         Books, manga, series, films and documentaries can be marked "Finished" on the Compass.
// area:   the id of the life area it feeds (see the list above).
// part:   for Health only, which side of it: body, mind, food, sleep or self-compassion.
// energy: the least energy the activity needs ("low", "medium" or "high").
// places: the situations it fits.
//         "sit"  = settled at home, at a desk or on the sofa
//         "walk" = on my feet and moving
//         "out"  = away from home
//         "anywhere" means all three.
// time:   the smallest free-time tap it fits into (10, 30 or 60).
//         A 20-minute activity needs the 30 tap.
// minimum: true means it is a daily minimum. Everything else is an interest.
// onlyWhenLow: true means it is only suggested when energy is low.
// benefit: one short line on what this gives me. The app shows it under the suggestion,
//          followed by my own "why" for that life area.
// rest: true marks the one activity offered first when I've skipped several things in a row.
// evening: true means it is only suggested from 8 pm until my day ends.
// weekly: true means it stays away for 7 days after I do it.
// once: true means it is finished for good after one "done" (a film, a documentary).
//       Without it, the activity comes back the next day (a book, a series, a practice).

const activities = [
  // Daily minimums
  { name: "Morning workout", area: "health", part: "body", energy: "medium", places: ["sit", "walk"], time: 10, minimum: true, benefit: "Ten minutes that wake your body up." },
  { name: "Meditation", area: "health", part: "mind", energy: "low", places: ["sit"], time: 10, minimum: true, benefit: "10 minutes of calm for your mind." },
  { name: "Run or walk", area: "health", part: "body", energy: "medium", places: ["walk", "out"], time: 60, minimum: true, benefit: "An hour outside for your body and your head." },
  { name: "Undistracted family conversation or call", area: "family", energy: "low", places: "anywhere", time: 10, minimum: true, benefit: "Full attention for someone you love." },
  { name: "Design or product study session", area: "growth", energy: "medium", places: ["sit"], time: 30, minimum: true, benefit: "A focused session that sharpens your craft." },
  { name: "Work on Quiet Compass", area: "growth", energy: "high", places: ["sit"], time: 30, minimum: true, benefit: "Time on the thing you've been wanting to build." },

  // Practice
  { name: "Guitar practice", kind: "practice", area: "enjoyment", energy: "medium", places: ["sit"], time: 10, benefit: "A few minutes of music, just for you." },
  { name: "Chess practice", kind: "practice", area: "enjoyment", energy: "medium", places: "anywhere", time: 10, benefit: "A short workout for your thinking." },
  { name: "Learn to make something new", kind: "practice", area: "growth", energy: "medium", places: ["sit"], time: 30, benefit: "A new skill, started today." },
  { name: "Try a new hobby", kind: "practice", area: "enjoyment", energy: "medium", places: ["sit", "out"], time: 60, benefit: "Room for something you've never tried." },
  { name: "Duolingo", kind: "practice", area: "growth", energy: "low", places: "anywhere", time: 10, benefit: "A small step in a new language." },

  // Looking after myself and the people around me
  // For anything done away from the phone, "done" means "I'm starting now".
  { name: "Take a real break, phone down", kind: "care", area: "health", part: "mind", energy: "low", places: "anywhere", time: 10, onlyWhenLow: true, rest: true, benefit: "Ten minutes of rest you don't have to earn." },
  { name: "Be kind to yourself: forgive one thing, be glad of one", kind: "care", area: "health", part: "self-compassion", energy: "low", places: "anywhere", time: 10, benefit: "A moment to forgive yourself and be glad." },
  { name: "Start winding down for an early night", kind: "care", area: "health", part: "sleep", energy: "low", places: ["sit"], time: 10, evening: true, benefit: "An early night, started now. Read a few pages or just sit." },
  { name: "One proper, unhurried meal", kind: "care", area: "health", part: "food", energy: "low", places: ["sit", "out"], time: 30, benefit: "Real food, eaten slowly." },
  { name: "10-minute money check", kind: "care", area: "wealth", energy: "medium", places: ["sit"], time: 10, weekly: true, benefit: "Ten minutes that keep money from becoming a worry." },
  { name: "Help or teach one person something", kind: "care", area: "meaning", energy: "medium", places: "anywhere", time: 10, benefit: "Something you know, given to someone who can use it." },
  { name: "Message one friend", kind: "care", area: "family", energy: "low", places: "anywhere", time: 10, benefit: "A small hello that keeps a friendship warm." },

  // Reading: comes back each day until I say I've finished
  { name: "Read Caps Lock", kind: "book", area: "growth", energy: "low", places: ["sit", "walk"], time: 30, benefit: "A few pages that feed how you think about design." },
  { name: "Read Vinland Saga", kind: "manga", area: "enjoyment", energy: "low", places: ["sit", "walk"], time: 10, benefit: "A chapter of a story you love." },

  // Series: comes back each day until I say I've finished
  { name: "Watch Kingdom", kind: "series", area: "enjoyment", energy: "low", places: ["sit", "walk"], time: 30, benefit: "An episode of strategy and story, purely for enjoyment." },
  { name: "Watch Legend of the Galactic Heroes", kind: "series", area: "enjoyment", energy: "low", places: ["sit", "walk"], time: 30, benefit: "An episode of strategy and story, purely for enjoyment." },
  { name: "Watch Code Geass", kind: "series", area: "enjoyment", energy: "low", places: ["sit", "walk"], time: 30, benefit: "An episode of strategy and story, purely for enjoyment." },
  { name: "Watch Abstract: The Art of Design", kind: "series", area: "growth", energy: "low", places: ["sit", "walk"], time: 60, benefit: "An episode on how great designers think." },

  // Films: gone for good once done
  { name: "Watch Arrival", kind: "film", area: "enjoyment", energy: "low", places: ["sit", "walk"], time: 60, once: true, benefit: "A film you've been meaning to see." },
  { name: "Watch Demon Slayer: Infinity Castle, part 1", kind: "film", area: "enjoyment", energy: "low", places: ["sit", "walk"], time: 60, once: true, benefit: "A film you've been meaning to see." },
  { name: "Watch The Sheep Detectives", kind: "film", area: "enjoyment", energy: "low", places: ["sit", "walk"], time: 60, once: true, benefit: "A film you've been meaning to see." },

  // Documentaries: gone for good once done
  { name: "Watch Rams", kind: "documentary", area: "growth", energy: "low", places: ["sit", "walk"], time: 60, once: true, benefit: "A documentary that feeds your eye for design." },
  { name: "Watch Helvetica", kind: "documentary", area: "growth", energy: "low", places: ["sit", "walk"], time: 60, once: true, benefit: "A documentary that feeds your eye for design." },
  { name: "Watch Objectified", kind: "documentary", area: "growth", energy: "low", places: ["sit", "walk"], time: 60, once: true, benefit: "A documentary that feeds your eye for design." },
  { name: "Watch Urbanized", kind: "documentary", area: "growth", energy: "low", places: ["sit", "walk"], time: 60, once: true, benefit: "A documentary that feeds your eye for design." },
  { name: "Watch Stutz", kind: "documentary", area: "growth", energy: "low", places: ["sit", "walk"], time: 60, once: true, benefit: "A documentary about tools for the mind." },
  { name: "Watch Eames: The Architect and the Painter", kind: "documentary", area: "growth", energy: "low", places: ["sit", "walk"], time: 60, once: true, benefit: "A documentary that feeds your eye for design." },
  { name: "Watch Jiro Dreams of Sushi", kind: "documentary", area: "growth", energy: "low", places: ["sit", "walk"], time: 60, once: true, benefit: "A documentary about a lifetime of mastery." },
];
