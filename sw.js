const addResourcesToCache = async (resources) => {
    const cache = await caches.open("v1");
    await cache.addAll(resources);
};

const putInCache = async (request, response) => {
    try {
        const cache = await caches.open("v1");
        await cache.put(request, response);
    }
    catch (ex) {
        console.error(ex, request)
    }
};

const cacheFirst = async ({
    request,
    preloadResponsePromise,
    event,
}) => {
    if (request.url.startsWith("app://")
        || request.url.startsWith("https://myapp/")
        || request.url.startsWith("https://mycache/")
        || request.url.startsWith("https://mydata/")
        || request.url.startsWith("https://myfiles/")) {
        // For internal app resources, we can skip caching
        return fetch(request);
    }
    // TODO: skip API requests. We don't need to cache them for now because they use POST requests.
    if (request.method !== "GET") {
        // Only cache GET requests
        return fetch(request);
    }
    // First try to get the resource from the cache
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
        return responseFromCache;
    }

    // Next try to use (and cache) the preloaded response, if it's there
    const preloadResponse = await preloadResponsePromise;
    if (preloadResponse) {
        event.waitUntil(putInCache(request, preloadResponse.clone()));
        return preloadResponse;
    }

    // Next try to get the resource from the network
    try {
        const responseFromNetwork = await fetch(request);
        // response may be used only once
        // we need to save clone to put one copy in cache
        // and serve second one
        event.waitUntil(putInCache(request, responseFromNetwork.clone()));
        return responseFromNetwork;
    } catch (error) {
        return new Response("Network error happened", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
        });
    }
};

const deleteCache = async (key) => {
    await caches.delete(key);
};

const removeCache = async (cacheKey, key) => {
    caches.open(cacheKey).then((cache) => {
        cache.delete(key).then((response) => {
            if (response) {
                console.log(`Cache item ${key} removed successfully.`);
            } else {
                console.log(`Cache item ${key} not found.`);
            }
        }).catch((error) => {
            console.error(`Error removing cache item ${key}:`, error);
        });
    });
}

self.addEventListener("fetch", (event) => {
    event.respondWith(
        cacheFirst({
            request: event.request,
            preloadResponsePromise: event.preloadResponse,
            event,
        }),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.registration?.navigationPreload.enable());
});

addEventListener("message", (event) => {
    // event is an ExtendableMessageEvent object
    console.log(`The client sent me a message: ${event.data}`);
    if (event.data.action === "deleteCache") {
        // Delete a specific cache
        const cacheKey = event.data.cacheKey || "v1"; // Default to "v1" if no cacheKey is provided
        deleteCache(cacheKey);
        return;
    }
    if (event.data.action === "removeCache") {
        // Remove a specific cache item
        const key = event.data.key;
        const cacheKey = event.data.cacheKey || "v1"; // Default to "v1" if no cacheKey is provided
        removeCache(cacheKey, key);
        return;
    }
});