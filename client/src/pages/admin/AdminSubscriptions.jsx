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

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Subscriptions</h1>

      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => handleFilterChange('')}
              className={`btn text-sm ${
                filter === '' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('ACTIVE')}
              className={`btn text-sm ${
                filter === 'ACTIVE' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleFilterChange('EXPIRED')}
              className={`btn text-sm ${
                filter === 'EXPIRED' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Expired
            </button>
            <button
              onClick={() => handleFilterChange('CANCELLED')}
              className={`btn text-sm ${
                filter === 'CANCELLED' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Cancelled
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Total: {pagination.total} subscriptions
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  End Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {subscription.user.name}
                    <br />
                    <span className="text-xs text-gray-500">{subscription.user.email}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {subscription.plan.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${subscription.plan.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        subscription.status
                      )}`}
                    >
                      {subscription.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(subscription.startDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(subscription.endDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="btn btn-secondary text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
              className="btn btn-secondary text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSubscriptions
