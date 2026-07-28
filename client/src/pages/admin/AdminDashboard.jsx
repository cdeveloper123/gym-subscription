import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/api'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentPayments, setRecentPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const response = await adminService.getDashboard()
      setStats(response.stats)
      setRecentPayments(response.recentPayments)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Users</h3>
          <p className="text-4xl font-bold">{stats?.totalUsers || 0}</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Active Subscriptions</h3>
          <p className="text-4xl font-bold">{stats?.activeSubscriptions || 0}</p>
        </div>

        <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Expired Subscriptions</h3>
          <p className="text-4xl font-bold">{stats?.expiredSubscriptions || 0}</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Revenue</h3>
          <p className="text-4xl font-bold">${stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Revenue</h2>
          <p className="text-3xl font-bold text-primary-600">
            ${stats?.monthlyRevenue?.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-gray-600 mt-2">Current month</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Links</h2>
          <div className="space-y-2">
            <Link
              to="/admin/users"
              className="block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            >
              Manage Users
            </Link>
            <Link
              to="/admin/subscriptions"
              className="block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            >
              View Subscriptions
            </Link>
            <Link
              to="/admin/payments"
              className="block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            >
              Payment History
            </Link>
            <Link
              to="/admin/plans"
              className="block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            >
              Manage Plans
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Payments</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : payment.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(payment.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
