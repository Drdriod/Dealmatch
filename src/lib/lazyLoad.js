import { lazy } from 'react'

/**
 * A robust lazy loading utility that handles "Failed to fetch dynamically imported module" errors.
 * This usually happens when a new version of the app is deployed and old chunks are deleted.
 * 
 * @param {Function} importFn - The dynamic import function, e.g., () => import('./MyComponent')
 * @param {number} retries - Number of times to retry before giving up and reloading the page
 */
export const lazyWithRetry = (importFn, retries = 2) => {
  return lazy(async () => {
    try {
      return await importFn()
    } catch (error) {
      // Check if it's a chunk load error
      const isChunkLoadError = 
        error.name === 'ChunkLoadError' || 
        /Failed to fetch dynamically imported module/.test(error.message) ||
        /Loading chunk .* failed/.test(error.message)

      if (isChunkLoadError && retries > 0) {
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 1000))
        return lazyWithRetry(importFn, retries - 1)
      }

      if (isChunkLoadError) {
        // If all retries fail, the chunk is likely gone (new deployment).
        // Force a full page reload to get the latest version.
        console.error('Critical chunk load error. Reloading page to get latest version...', error)
        window.location.reload(true)
      }

      throw error
    }
  })
}
