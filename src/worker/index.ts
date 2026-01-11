/// <reference lib="webworker" />

import {precacheAndRoute} from 'workbox-precaching';
import {registerRoute} from 'workbox-routing';
import {NetworkFirst} from 'workbox-strategies';
import {CacheableResponsePlugin} from 'workbox-cacheable-response';
import {ExpirationPlugin} from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST || []);

// Runtime caching for all other requests
registerRoute(
  ({url}) => url.origin === self.location.origin,
  new NetworkFirst({
    cacheName: 'all-pages',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200], // Cache opaque responses and successful ones
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);
