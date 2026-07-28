import { useState, useEffect } from 'react'
import { planService } from '../../services/api'
import { toast } from 'react-toastify'
import LoadingSpinner from '../../components/LoadingSpinner'

const AdminPlans = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    duration: 'MONTHLY',
    price: '',
    features: '',
    isActive: true
  })

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await planService.getAll()
      setPlans(response.plans)
    } catch (error) {
      toast.error('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const planData = {
      ...formData,
      features: formData.features.split('\n').filter((f) => f.trim())
    }

    try {
      if (editingPlan) {
        await planService.update(editingPlan.id, planData)
        toast.success('Plan updated successfully')
      } else {
        await planService.create(planData)
        toast.success('Plan created successfully')
      }
      resetForm()
      loadPlans()
    } catch (error) {
      toast.error(error.error || 'Failed to save plan')
    }
  }

  const handleEdit = (plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      duration: plan.duration,
      price: plan.price.toString(),
      features: plan.features.join('\n'),
      isActive: plan.isActive
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this plan?')) {
      return
    }

    try {
      await planService.delete(id)
      toast.success('Plan deactivated')
      loadPlans()
    } catch (error) {
      toast.error('Failed to deactivate plan')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      duration: 'MONTHLY',
      price: '',
      features: '',
      isActive: true
    })
    setEditingPlan(null)
    setShowForm(false)
  }

  const getDurationLabel = (duration) => {
    return { MONTHLY: 'month', QUARTERLY: '3 months', YEARLY: 'year' }[duration] || duration
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Membership Plans</h1>
          <p className="text-gray-600">Create and manage subscription plans for your gym</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            showForm
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {showForm ? '✕ Cancel' : '+ New Plan'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Plan Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Premium Membership"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Duration</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly (3 months)</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Features (one per line)</label>
              <textarea
                name="features"
                value={formData.features}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                placeholder="Access to all equipment&#10;Personal trainer sessions&#10;Group classes"
                required
              />
            </div>

            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-700">
                Make this plan active and available for purchase
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button type="submit" className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl shadow-sm border-2 p-6 hover:shadow-lg transition-all ${
              plan.isActive ? 'border-blue-200' : 'border-gray-200 opacity-75'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">per {getDurationLabel(plan.duration)}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mb-6">
              <p className="text-5xl font-bold text-gray-900">${plan.price}</p>
            </div>

            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Features</h4>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex space-x-2 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleEdit(plan)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Edit
              </button>
              {plan.isActive && (
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors"
                >
                  Deactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {plans.length === 0 && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No plans yet</h3>
          <p className="text-gray-500 mb-4">Create your first membership plan to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
          >
            + Create First Plan
          </button>
        </div>
      )}
    </div>
  )
}

export default AdminPlans
