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

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Plans</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Cancel' : 'Add New Plan'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingPlan ? 'Edit Plan' : 'Create New Plan'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="input"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Features (one per line)
              </label>
              <textarea
                name="features"
                value={formData.features}
                onChange={handleChange}
                className="input"
                rows={5}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn btn-primary">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="card">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  plan.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-2xl font-bold text-primary-600 mb-4">
              ${plan.price}
              <span className="text-sm text-gray-600 ml-1">
                / {plan.duration.toLowerCase()}
              </span>
            </p>
            <ul className="space-y-1 mb-4 text-sm">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary-600 mr-2">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(plan)}
                className="btn btn-secondary flex-1 text-sm"
              >
                Edit
              </button>
              {plan.isActive && (
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="btn btn-danger flex-1 text-sm"
                >
                  Deactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPlans
