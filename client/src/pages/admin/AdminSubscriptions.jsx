import { useState, useEffect } from 'react'
import { adminService } from '../../services/api'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })

  useEffect(() => {
    loadSubscriptions()
  }, [pagination.page, filter])

  const loadSubscriptions = async () => {
    try {
      const response = await adminService.getSubscriptions({
        page: pagination.page,
        limit: pagination.limit,
        status: filter
      })
      setSubscriptions(response.subscriptions)
      setPagination(response.pagination)
    } catch (error) {
      toast.error('Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (status) => {
    setFilter(status)
    setPagination({ ...pagination, page: 1 })
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusStyles = (status) => {
    const styles = {
      ACTIVE: 'bg-green-50 text-green-700 border-green-200',
      EXPIRED: 'bg-red-50 text-red-700 border-red-200',
      CANCELLED: 'bg-gray-50 text-gray-700 border-gray-200',
      PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    }
    return styles[status] || styles.PENDING
  }

  if (loading) return <LoadingSpinner />

  const filters = [
    { label: 'All', value: '', count: pagination.total },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Subscriptions</h1>
        <p className="text-gray-600">Monitor and manage all active memberships</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-wrap gap-3">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                filter === f.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
              {f.count !== undefined && filter === f.value && (
                <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-20 rounded-full text-xs">
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {subscriptions.map((subscription) => (
          <div key={subscription.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {subscription.user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{subscription.user.name}</h3>
                  <p className="text-sm text-gray-500">{subscription.user.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Plan</p>
                  <p className="font-semibold text-gray-900">{subscription.plan.name}</p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <p className="font-semibold text-gray-900">${subscription.plan.price}</p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Period</p>
                  <p className="text-xs text-gray-700">{formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {subscriptions.length === 0 && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No subscriptions found</h3>
          <p className="text-gray-500">{filter ? `No ${filter.toLowerCase()} subscriptions` : 'No subscriptions yet'}</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminSubscriptions
