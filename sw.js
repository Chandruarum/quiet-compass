// The offline helper. The phone keeps this running in the background for the app.
//
// The app is treated as one numbered edition, like a printed book:
// - The phone always opens the complete edition it has saved, with no waiting.
// - When a new edition is published, every file is downloaded in the background first.
// - Only when all of them have arrived does the phone switch to the new edition.
//   If even one file fails, it keeps the old edition and tries again next time.

// publish.sh replaces this with a fresh edition number every time the app is published.
const EDITION = "4e5d805";
const SHELF = "quiet-compass-" + EDITION;

// Everything the app needs to open.
const FILES = [
  "./",
  "style.css",
  "words.js",
  "activities.js",
  "app.js",
  "manifest.webmanifest",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

// A new edition has been published: download all of it, or none of it.
self.addEventListener("install", (event) => {
  event.waitUntil(downloadEdition().then(() => self.skipWaiting()));
});

async function downloadEdition() {
  const shelf = await caches.open(SHELF);

  await Promise.all(
    FILES.map(async (file) => {
      const address = new URL(file, self.registration.scope);

      // Adding the edition number to the request guarantees a fresh copy from the
      // web host, never a stale one kept somewhere along the way.
      const freshAddress = new URL(address);
      freshAddress.searchParams.set("edition", EDITION);

      const response = await fetch(freshAddress, { cache: "reload" });
      if (!response.ok) throw new Error("Could not download " + file);
      await shelf.put(address.href, response);
    })
  );
}

// The new edition is complete: throw away older ones and start using it.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith("quiet-compass-") && name !== SHELF)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Every time the app asks for one of its files: hand over the saved copy.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const sameSite = new URL(request.url).origin === self.location.origin;
  if (request.method !== "GET" || !sameSite) return;

  event.respondWith(
    caches
      .open(SHELF)
      .then((shelf) => shelf.match(request, { ignoreSearch: true }))
      .then((saved) => saved || fetch(request))
  );
});
