// This is the service worker with the Cache-first network
const putInCache = async (request, response) => {
    // Open the cache
    const cache = await caches.open("v1");
    // Put the response in the cache
    await cache.put(request, response);
};

const cacheFirst = async ({ request, fallbackUrl }) => {
    // Filter if we want to cache the request
    const responseFromCache = await caches.match(request);
    if (typeof responseFromCache === "undefined") return await fetch(request)

    // First try to get the resource from the cache.
    if (responseFromCache) {
        return responseFromCache;
    }

    // If the response was not found in the cache,
    // try to get the resource from the network.
    try {
        const responseFromNetwork = await fetch(request);
        // If the network request succeeded, clone the response:
        // - put one copy in the cache, for the next time
        // - return the original to the app
        // Cloning is needed because a response can only be consumed once.
        putInCache(request, responseFromNetwork.clone());
        return responseFromNetwork;
    } catch (error) {
        // If the network request failed,
        // get the fallback response from the cache.
        const fallbackResponse = await caches.match(fallbackUrl);
        if (fallbackResponse) {
            return fallbackResponse;
        }
        // When even the fallback response is not available,
        // there is nothing we can do, but we must always
        // return a Response object.
        return new Response("Network error happened", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
        });
    }
};

self.addEventListener("fetch", async (event) => {
    event.respondWith(cacheFirst({
        request: event.request,
        fallbackUrl: null,
    }));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.registration?.navigationPreload.enable());
});

self.addEventListener("message", async (event) => {
    if (event.data.action === "addCache" && await caches.match(event.data.url) == null) {
        putInCache(event.data.url, null)
        event.ports[0].postMessage("done")
    }
})