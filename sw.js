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

const excludedResources = [
    {
        url: "app://",
        includes: true,
    },
    {
        url: "https://myapp/",
        includes: true,
    },
    {
        url: "https://mycache/",
        includes: true,
    },
    {
        url: "https://mydata/",
        includes: true,
    },
    {
        url: "https://myfiles/",
        includes: true,
    },
];

const isExcluded = (url) => {
    return excludedResources.some((resource) => {
        if (resource.includes) {
            return url.includes(resource.url);
        } else {
            return url === resource.url;
        }
    });
}

const excludeResource = (url, includes) => {
    if (!isExcluded(url)) {
        excludedResources.push({
            url: url,
            includes: includes,
        });
    }
};


const cacheFirst = async ({
    request,
    preloadResponsePromise,
    event,
}) => {
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
    if (isExcluded(event.request.url) || event.request.method !== "GET") {
        return;
    }
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
    if (event.data.action === "excludeResource") {
        // Exclude a resource from caching
        const url = event.data.url;
        const includes = event.data.includes || false; // Default to false if not provided
        excludeResource(url, includes);
        return;
    }
});