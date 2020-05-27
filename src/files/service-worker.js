import path from 'path'
import { generateSW } from 'workbox-build'
import fs from 'fs-extra'

const appendToServiceWorker = async (config, options) => {
    const skipWaitingPath = path.resolve(__dirname, '../utils/skip-waiting.js')
    const skipWaiting = await fs.readFile(skipWaitingPath, 'utf8')
    const outPath = path.join(config.outputDir, options.serviceWorkerPath)
    await fs.writeFile(outPath, `\n${skipWaiting}`, { flag: 'a' })
}

export const createServiceWorker = async (context, config, queue, options) => {
    if (options.disableServiceWorker) return false;
    const serviceWorkerPath = path.join(config.outputDir, options.serviceWorkerPath)
    const cacheId = config.siteUrl.split("/")[2] || "gridsome-pwa"
    const cacheStrategy = {
      cacheId: cacheId,
      modifyURLPrefix: { '' : config.pathPrefix + '/' || ''},
      swDest: serviceWorkerPath,
      globDirectory: config.outputDir,
      globPatterns: [],

      cleanupOutdatedCaches: true,
      offlineGoogleAnalytics: true,
      
      runtimeCaching: [
        {
          urlPattern: /.+(\/|.html)$/,
          handler: "NetworkFirst",
          options: {
            cacheName: cacheId + "-html",
            networkTimeoutSeconds: 3,
            cacheableResponse: {
              statuses: [ 0, 200 ]
            },
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 14
            }
          }
        },
        {
          urlPattern: /\/assets\/data\/.+\.[0-9a-f]{8}\.json(\?.+)?$/,
          handler: "NetworkFirst",
          options: {
            cacheName: cacheId + "-assets-json",
            networkTimeoutSeconds: 3,
            cacheableResponse: {
              statuses: [ 0, 200 ]
            },
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 14,
              purgeOnQuotaError: true
            }
          }
        },
        {
          urlPattern: /\/assets\/.+\.[0-9a-f]{8}\.(js|css|woff|woff2)(\?.+)?$/,
          handler: "CacheFirst",
          options: {
            cacheName: cacheId + "-assets-dependent",
            cacheableResponse: {
              statuses: [ 0, 200 ]
            },
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 60
            }
          }
        },
        {
          urlPattern: /\/assets\/.+\.[0-9a-f]{8}\.(png|gif|jpg|jpeg|svg)(\?.+)?$/,
          handler: "CacheFirst",
          options: {
            cacheName: cacheId + "-assets-image",
            cacheableResponse: {
              statuses: [ 0, 200 ]
            },
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 30,
              maxEntries: 50,
              purgeOnQuotaError: true
            }
          }
        },
        {
          urlPattern: /\/manifest\.json$/,
          handler: "NetworkFirst",
          options: {
            cacheName: cacheId + "-static-json",
            networkTimeoutSeconds: 3,
            cacheableResponse: {
              statuses: [ 0, 200 ]
            },
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 14
            }
          }
        },
        {
          urlPattern: /\/[^/.]+\.(js|css|woff|woff2)$/,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: cacheId + "-static-dependent",
            cacheableResponse: {
              statuses: [ 0, 200 ]
            },
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 7
            }
          }
        },
        {
          urlPattern: /\/[^/.]+\.(png|gif|jpg|jpeg|svg)$/,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: cacheId + "-static-image",
            cacheableResponse: {
              statuses: [ 0, 200 ]
            },
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 7,
              maxEntries: 50,
              purgeOnQuotaError: true
            }
          }
        }
      ]
    }
  
    await generateSW({cacheStrategy})
    await appendToServiceWorker(config, options)
    return true
}
