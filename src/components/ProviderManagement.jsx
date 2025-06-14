import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Edit, 
  Play, 
  Pause, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ProviderManagement = () => {
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProviders, setSelectedProviders] = useState([]);

  // Load providers from API
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/dynamic-provider/`);
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.data);
        setError(null);
      } else {
        setError('Failed to load providers: ' + data.error);
      }
    } catch (err) {
      setError('Failed to load providers: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProvider = async (providerId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dynamic-provider/${providerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh the list
        loadProviders();
      } else {
        alert('Failed to update provider: ' + data.error);
      }
    } catch (err) {
      alert('Failed to update provider: ' + err.message);
    }
  };

  const handleDeleteProvider = async (providerId, providerName) => {
    if (!window.confirm(`Are you sure you want to delete "${providerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/dynamic-provider/${providerId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh the list
        loadProviders();
      } else {
        alert('Failed to delete provider: ' + data.error);
      }
    } catch (err) {
      alert('Failed to delete provider: ' + err.message);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedProviders.length === 0) {
      alert('Please select at least one provider');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/dynamic-provider/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          providerIds: selectedProviders
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSelectedProviders([]);
        loadProviders();
      } else {
        alert('Bulk operation failed: ' + data.error);
      }
    } catch (err) {
      alert('Bulk operation failed: ' + err.message);
    }
  };

  const getStatusBadge = (provider) => {
    if (!provider.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <Pause className="w-3 h-3 mr-1" />
          Disabled
        </span>
      );
    }

    if (provider.remainingToday <= 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Quota Exceeded
        </span>
      );
    }

    const usagePercentage = (provider.usedToday / provider.dailyQuota) * 100;
    
    if (usagePercentage < 80) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          High Usage
        </span>
      );
    }
  };

  const getUsageBarColor = (usagePercentage) => {
    if (usagePercentage < 60) return 'bg-green-500';
    if (usagePercentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading providers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error Loading Providers</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={loadProviders}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Email Provider Management
        </h2>
        <p className="text-gray-600">
          Manage your configured email providers and monitor their usage.
        </p>
      </div>

      {/* Bulk Actions */}
      {selectedProviders.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedProviders.length} provider(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Deactivate
              </button>
              <button
                onClick={() => setSelectedProviders([])}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Providers List */}
      {providers.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No providers configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by configuring your first email provider.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {providers.map((provider) => {
              const usagePercentage = (provider.usedToday / provider.dailyQuota) * 100;
              
              return (
                <li key={provider.id} className="hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-4"
                          checked={selectedProviders.includes(provider.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProviders([...selectedProviders, provider.id]);
                            } else {
                              setSelectedProviders(selectedProviders.filter(id => id !== provider.id));
                            }
                          }}
                        />
                        <div>
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {provider.name}
                            </p>
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {provider.type}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span>
                              {provider.config?.endpoint && (
                                <span className="truncate max-w-md">
                                  {provider.config.endpoint}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(provider)}
                      </div>
                    </div>

                    {/* Usage Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                        <span>Daily Usage</span>
                        <span>{provider.usedToday} / {provider.dailyQuota}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getUsageBarColor(usagePercentage)}`}
                          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Auth: {provider.config?.authentication?.type || 'Unknown'}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleProvider(provider.id, provider.isActive)}
                          className={`p-2 rounded-md ${
                            provider.isActive
                              ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                          title={provider.isActive ? 'Disable provider' : 'Enable provider'}
                        >
                          {provider.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                          title="Edit provider"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProvider(provider.id, provider.name)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                          title="Delete provider"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={loadProviders}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>
    </div>
  );
};

export default ProviderManagement; 
