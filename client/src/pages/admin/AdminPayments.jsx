import { useState, useEffect } from 'react'
import { adminService } from '../../services/api'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminPayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 })

  useEffect(() => {
    loadPayments()
  }, [pagination.page, filter])

  const loadPayments = async () => {
    try {
      const response = await adminService.getPayments({
        page: pagination.page,
        limit: pagination.limit,
        status: filter
      })
      setPayments(response.payments)
      setPagination(response.pagination)
    } catch (error) {
      toast.error('Failed to load payments')
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusStyles = (status) => {
    const styles = {
      COMPLETED: 'bg-green-50 text-green-700 border-green-200',
      FAILED: 'bg-red-50 text-red-700 border-red-200',
      PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      REFUNDED: 'bg-gray-50 text-gray-700 border-gray-200'
    }
    return styles[status] || styles.PENDING
  }

  if (loading) return <LoadingSpinner />

  const filters = [
    { label: 'All Payments', value: '' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Failed', value: 'FAILED' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment History</h1>
        <p className="text-gray-600">Track and monitor all payment transactions</p>
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
            </button>
          ))}
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {payments.map((payment) => (
          <div key={payment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                  {payment.user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{payment.user.name}</h3>
                  <p className="text-sm text-gray-500">{payment.user.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Plan</p>
                  <p className="font-semibold text-gray-900">{payment.subscription?.plan.name || '-'}</p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Amount</p>
                  <p className="text-lg font-bold text-gray-900">${payment.amount.toFixed(2)}</p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(payment.status)}`}>
                    {payment.status}
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Method</p>
                  <p className="text-xs text-gray-700 capitalize">{payment.paymentMethod || 'card'}</p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Date</p>
                  <p className="text-xs text-gray-700">{formatDate(payment.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {payments.length === 0 && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No payments found</h3>
          <p className="text-gray-500">{filter ? `No ${filter.toLowerCase()} payments` : 'No payment records yet'}</p>
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

export default AdminPayments
