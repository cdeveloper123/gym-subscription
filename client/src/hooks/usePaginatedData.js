import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Manages the paginated data-fetching pattern shared by the admin pages:
 * pagination state, filter/search params, initial loading state and refetching
 * whenever the page or a filter changes (filter changes reset to page 1).
 *
 * @param {(params: object) => Promise<object>} fetchFn - called with
 *   `{ page, limit, ...filters }`, must resolve to a response containing
 *   a `pagination` object alongside the items.
 * @param {object} [options]
 * @param {number} [options.initialLimit=10]
 * @param {object} [options.initialFilters={}] - filter params merged into each request
 * @param {(response: object) => Array} options.getItems - extracts the item array
 *   from the response (e.g. `(res) => res.users`)
 * @param {(error: any) => void} [options.onError]
 */
const usePaginatedData = (fetchFn, options = {}) => {
  const { initialLimit = 10, initialFilters = {}, getItems, onError } = options

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(initialFilters)
  const [pagination, setPagination] = useState({ page: 1, limit: initialLimit, total: 0 })
  const [refreshKey, setRefreshKey] = useState(0)

  // Callbacks are typically inline arrows recreated every render; keep them out of
  // the effect deps via a ref so only page/filter changes trigger a fetch.
  const callbacksRef = useRef()
  callbacksRef.current = { fetchFn, getItems, onError }

  useEffect(() => {
    let stale = false

    const load = async () => {
      const { fetchFn, getItems, onError } = callbacksRef.current
      try {
        const response = await fetchFn({
          page: pagination.page,
          limit: pagination.limit,
          ...filters
        })
        if (stale) return
        setData(getItems(response))
        setPagination(response.pagination)
      } catch (error) {
        if (!stale) onError?.(error)
      } finally {
        if (!stale) setLoading(false)
      }
    }

    load()
    return () => {
      stale = true
    }
  }, [pagination.page, pagination.limit, filters, refreshKey])

  const setPage = useCallback((page) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const setFilter = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const refresh = useCallback(() => {
    setRefreshKey((key) => key + 1)
  }, [])

  return { data, pagination, loading, filters, setPage, setFilter, refresh }
}

export default usePaginatedData
