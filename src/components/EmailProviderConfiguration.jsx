import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, TestTube, Save, Plus, X } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const EmailProviderConfigurationUI = () => {
  const [configMode, setConfigMode] = useState('simple'); // 'simple' | 'advanced'
  const [selectedProvider, setSelectedProvider] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [availablePresets, setAvailablePresets] = useState([]);
  const [errors, setErrors] = useState({});
  const [customHeaders, setCustomHeaders] = useState([{ key: '', value: '' }]);

  // Form data for simple configuration
  const [simpleConfig, setSimpleConfig] = useState({
    name: '',
    type: '',
    apiKey: '',
    apiSecret: '',
    dailyQuota: 1000,
    isActive: true,
    customEndpoint: '',
    customHeaders: {}
  });

  // Form data for advanced configuration
  const [advancedConfig, setAdvancedConfig] = useState({
    name: '',
    type: 'custom',
    apiKey: '',
    apiSecret: '',
    dailyQuota: 1000,
    isActive: true,
    endpoint: '',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    authentication: {
      type: 'api-key',
      headerName: 'X-API-Key',
      prefix: ''
    },
    payloadTemplate: {
      from: '{{sender.email}}',
      to: '{{recipients.0.email}}',
      subject: '{{subject}}',
      html: '{{htmlContent}}'
    },
    fieldMappings: {
      sender: 'from',
      recipients: 'to',
      subject: 'subject',
      htmlContent: 'html'
    }
  });

  // Load available presets from API
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/dynamic-provider/presets`);
        const data = await response.json();
        if (data.success) {
          setAvailablePresets(data.data);
        }
      } catch (error) {
        console.error('Failed to load presets:', error);
        // Fallback to hardcoded presets
        setAvailablePresets([
          { type: 'brevo', name: 'Brevo (formerly Sendinblue)', description: 'Popular email marketing platform', authType: 'api-key', requiresSecret: false },
          { type: 'sendgrid', name: 'SendGrid', description: 'Cloud-based email delivery service', authType: 'bearer', requiresSecret: false },
          { type: 'mailjet', name: 'Mailjet', description: 'Email service with real-time monitoring', authType: 'basic', requiresSecret: true },
          { type: 'mailgun', name: 'Mailgun', description: 'Email API service for developers', authType: 'basic', requiresSecret: false },
          { type: 'postmark', name: 'Postmark', description: 'Fast transactional email service', authType: 'api-key', requiresSecret: false }
        ]);
      }
    };

    loadPresets();
  }, []);

  const handleProviderSelect = (providerType) => {
    setSelectedProvider(providerType);
    const preset = availablePresets.find(p => p.type === providerType);
    
    if (configMode === 'simple') {
      setSimpleConfig(prev => ({
        ...prev,
        type: providerType,
        name: preset ? `${preset.name} - ${new Date().toLocaleDateString()}` : ''
      }));
    }
  };

  const validateSimpleConfig = () => {
    const newErrors = {};
    
    if (!simpleConfig.name.trim()) newErrors.name = 'Configuration name is required';
    if (!simpleConfig.type) newErrors.type = 'Provider type is required';
    if (!simpleConfig.apiKey.trim()) newErrors.apiKey = 'API key is required';
    if (simpleConfig.dailyQuota <= 0) newErrors.dailyQuota = 'Daily quota must be greater than 0';
    
    const preset = availablePresets.find(p => p.type === simpleConfig.type);
    if (preset?.requiresSecret && !simpleConfig.apiSecret?.trim()) {
      newErrors.apiSecret = 'API secret is required for this provider';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAdvancedConfig = () => {
    const newErrors = {};
    
    if (!advancedConfig.name.trim()) newErrors.name = 'Configuration name is required';
    if (!advancedConfig.apiKey.trim()) newErrors.apiKey = 'API key is required';
    if (!advancedConfig.endpoint.trim()) newErrors.endpoint = 'API endpoint is required';
    if (advancedConfig.dailyQuota <= 0) newErrors.dailyQuota = 'Daily quota must be greater than 0';
    
    try {
      if (typeof advancedConfig.payloadTemplate === 'string') {
        JSON.parse(advancedConfig.payloadTemplate);
      }
    } catch (e) {
      newErrors.payloadTemplate = 'Invalid JSON in payload template';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConfiguration = async () => {
    const isValid = configMode === 'simple' ? validateSimpleConfig() : validateAdvancedConfig();
    if (!isValid) return;

    setIsLoading(true);
    setTestResult(null);
    
    try {
      const config = configMode === 'simple' ? simpleConfig : advancedConfig;
      const endpoint = configMode === 'simple' ? '/simple' : '/advanced';
      
      const response = await fetch(`${API_BASE_URL}/api/dynamic-provider/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResult(data.data);
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Test failed',
          error: data.error
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed: ' + error.message,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    const isValid = configMode === 'simple' ? validateSimpleConfig() : validateAdvancedConfig();
    if (!isValid) return;

    setIsLoading(true);
    
    try {
      const config = configMode === 'simple' ? simpleConfig : advancedConfig;
      const endpoint = configMode === 'simple' ? '/simple' : '/advanced';
      
      // Convert custom headers array to object for simple config
      if (configMode === 'simple' && customHeaders.length > 0) {
        const headersObj = {};
        customHeaders.forEach(header => {
          if (header.key && header.value) {
            headersObj[header.key] = header.value;
          }
        });
        config.customHeaders = headersObj;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/dynamic-provider${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Provider configuration saved successfully!');
        
        // Reset form
        if (configMode === 'simple') {
          setSimpleConfig({
            name: '',
            type: '',
            apiKey: '',
            apiSecret: '',
            dailyQuota: 1000,
            isActive: true,
            customEndpoint: '',
            customHeaders: {}
          });
          setSelectedProvider('');
          setCustomHeaders([{ key: '', value: '' }]);
        } else {
          setAdvancedConfig({
            name: '',
            type: 'custom',
            apiKey: '',
            apiSecret: '',
            dailyQuota: 1000,
            isActive: true,
            endpoint: '',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            authentication: {
              type: 'api-key',
              headerName: 'X-API-Key',
              prefix: ''
            },
            payloadTemplate: {
              from: '{{sender.email}}',
              to: '{{recipients.0.email}}',
              subject: '{{subject}}',
              html: '{{htmlContent}}'
            },
            fieldMappings: {
              sender: 'from',
              recipients: 'to',
              subject: 'subject',
              htmlContent: 'html'
            }
          });
        }
        setErrors({});
        setTestResult(null);
      } else {
        alert('Failed to save configuration: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to save configuration: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomHeader = () => {
    setCustomHeaders([...customHeaders, { key: '', value: '' }]);
  };

  const removeCustomHeader = (index) => {
    setCustomHeaders(customHeaders.filter((_, i) => i !== index));
  };

  const updateCustomHeader = (index, field, value) => {
    const updated = [...customHeaders];
    updated[index][field] = value;
    setCustomHeaders(updated);
  };

  const renderSimpleConfiguration = () => (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Email Provider
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePresets.map((preset) => (
            <div
              key={preset.type}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedProvider === preset.type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleProviderSelect(preset.type)}
            >
              <h3 className="font-semibold text-gray-900">{preset.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
              <div className="flex items-center mt-2 space-x-2">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {preset.authType}
                </span>
                {preset.requiresSecret && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Requires Secret
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
      </div>

      {selectedProvider && (
        <>
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configuration Name
              </label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                value={simpleConfig.name}
                onChange={(e) => setSimpleConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., SendGrid Production"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Quota
              </label>
              <input
                type="number"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dailyQuota ? 'border-red-300' : 'border-gray-300'
                }`}
                value={simpleConfig.dailyQuota}
                onChange={(e) => setSimpleConfig(prev => ({ ...prev, dailyQuota: parseInt(e.target.value) || 0 }))}
                min="1"
              />
              {errors.dailyQuota && <p className="text-red-500 text-sm mt-1">{errors.dailyQuota}</p>}
            </div>
          </div>

          {/* Authentication */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Authentication</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.apiKey ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={simpleConfig.apiKey}
                  onChange={(e) => setSimpleConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your API key"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.apiKey && <p className="text-red-500 text-sm mt-1">{errors.apiKey}</p>}
            </div>

            {availablePresets.find(p => p.type === selectedProvider)?.requiresSecret && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Secret
                </label>
                <div className="relative">
                  <input
                    type={showApiSecret ? 'text' : 'password'}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.apiSecret ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={simpleConfig.apiSecret}
                    onChange={(e) => setSimpleConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
                    placeholder="Enter your API secret"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                  >
                    {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.apiSecret && <p className="text-red-500 text-sm mt-1">{errors.apiSecret}</p>}
              </div>
            )}
          </div>

          {/* Optional Advanced Settings */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings (Optional)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Endpoint (leave empty to use default)
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={simpleConfig.customEndpoint}
                  onChange={(e) => setSimpleConfig(prev => ({ ...prev, customEndpoint: e.target.value }))}
                  placeholder="https://api.custom-provider.com/v1/send"
                />
              </div>
              
              {/* Custom Headers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Headers
                </label>
                {customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Header name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={header.key}
                      onChange={(e) => updateCustomHeader(index, 'key', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Header value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={header.value}
                      onChange={(e) => updateCustomHeader(index, 'value', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomHeader(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCustomHeader}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Header
                </button>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="mr-2"
                  checked={simpleConfig.isActive}
                  onChange={(e) => setSimpleConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Enable this provider
                </label>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderAdvancedConfiguration = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Advanced Configuration</h3>
            <p className="text-sm text-yellow-700 mt-1">
              This mode is for custom email providers or advanced users who need full control over the API configuration.
            </p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Configuration Name
          </label>
          <input
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            value={advancedConfig.name}
            onChange={(e) => setAdvancedConfig(prev => ({ ...prev, name: e.target.value }))}
            placeholder="My Custom Provider"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Quota
          </label>
          <input
            type="number"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.dailyQuota ? 'border-red-300' : 'border-gray-300'
            }`}
            value={advancedConfig.dailyQuota}
            onChange={(e) => setAdvancedConfig(prev => ({ ...prev, dailyQuota: parseInt(e.target.value) || 0 }))}
          />
          {errors.dailyQuota && <p className="text-red-500 text-sm mt-1">{errors.dailyQuota}</p>}
        </div>
      </div>

      {/* Authentication */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Authentication</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.apiKey ? 'border-red-300' : 'border-gray-300'
              }`}
              value={advancedConfig.apiKey}
              onChange={(e) => setAdvancedConfig(prev => ({ ...prev, apiKey: e.target.value }))}
              placeholder="Enter your API key"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.apiKey && <p className="text-red-500 text-sm mt-1">{errors.apiKey}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Secret (optional)
          </label>
          <div className="relative">
            <input
              type={showApiSecret ? 'text' : 'password'}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={advancedConfig.apiSecret}
              onChange={(e) => setAdvancedConfig(prev => ({ ...prev, apiSecret: e.target.value }))}
              placeholder="Enter your API secret (if required)"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowApiSecret(!showApiSecret)}
            >
              {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">API Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Endpoint
            </label>
            <input
              type="url"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.endpoint ? 'border-red-300' : 'border-gray-300'
              }`}
              value={advancedConfig.endpoint}
              onChange={(e) => setAdvancedConfig(prev => ({ ...prev, endpoint: e.target.value }))}
              placeholder="https://api.provider.com/v1/send"
            />
            {errors.endpoint && <p className="text-red-500 text-sm mt-1">{errors.endpoint}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTTP Method
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={advancedConfig.method}
              onChange={(e) => setAdvancedConfig(prev => ({ ...prev, method: e.target.value }))}
            >
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
        </div>

        {/* Authentication Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auth Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={advancedConfig.authentication.type}
              onChange={(e) => setAdvancedConfig(prev => ({
                ...prev,
                authentication: { ...prev.authentication, type: e.target.value }
              }))}
            >
              <option value="api-key">API Key</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Header Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={advancedConfig.authentication.headerName}
              onChange={(e) => setAdvancedConfig(prev => ({
                ...prev,
                authentication: { ...prev.authentication, headerName: e.target.value }
              }))}
              placeholder="Authorization"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prefix (optional)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={advancedConfig.authentication.prefix}
              onChange={(e) => setAdvancedConfig(prev => ({
                ...prev,
                authentication: { ...prev.authentication, prefix: e.target.value }
              }))}
              placeholder="Bearer "
            />
          </div>
        </div>
      </div>

      {/* Headers */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Request Headers (JSON)
        </label>
        <textarea
          className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          value={JSON.stringify(advancedConfig.headers, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setAdvancedConfig(prev => ({ ...prev, headers: parsed }));
            } catch (err) {
              // Invalid JSON, but keep updating the display
            }
          }}
          placeholder='{"Content-Type": "application/json"}'
        />
      </div>

      {/* Payload Template */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payload Template (JSON)
        </label>
        <textarea
          className={`w-full h-40 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
            errors.payloadTemplate ? 'border-red-300' : 'border-gray-300'
          }`}
          value={JSON.stringify(advancedConfig.payloadTemplate, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setAdvancedConfig(prev => ({ ...prev, payloadTemplate: parsed }));
            } catch (err) {
              // Invalid JSON, but keep updating the display
            }
          }}
          placeholder={`{
  "from": "{{sender.email}}",
  "to": "{{recipients.0.email}}",
  "subject": "{{subject}}",
  "html": "{{htmlContent}}"
}`}
        />
        {errors.payloadTemplate && <p className="text-red-500 text-sm mt-1">{errors.payloadTemplate}</p>}
        <p className="text-xs text-gray-500 mt-1">
          Use Mustache template syntax like {{`{{sender.email}}`}} for dynamic values
        </p>
      </div>

      {/* Field Mappings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Field Mappings (JSON)
        </label>
        <textarea
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          value={JSON.stringify(advancedConfig.fieldMappings, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setAdvancedConfig(prev => ({ ...prev, fieldMappings: parsed }));
            } catch (err) {
              // Invalid JSON, but keep updating the display
            }
          }}
          placeholder={`{
  "sender": "from",
  "recipients": "to",
  "subject": "subject",
  "htmlContent": "html"
}`}
        />
        <p className="text-xs text-gray-500 mt-1">
          Map email fields to your API's field names
        </p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActiveAdvanced"
          className="mr-2"
          checked={advancedConfig.isActive}
          onChange={(e) => setAdvancedConfig(prev => ({ ...prev, isActive: e.target.checked }))}
        />
        <label htmlFor="isActiveAdvanced" className="text-sm text-gray-700">
          Enable this provider
        </label>
      </div>
    </div>
  );

  const renderTestResult = () => {
    if (!testResult) return null;

    return (
      <div className={`mt-6 p-4 rounded-md ${
        testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-start">
          {testResult.success ? (
            <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
          )}
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${
              testResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {testResult.success ? 'Configuration Test Passed' : 'Configuration Test Failed'}
            </h3>
            <p className={`text-sm mt-1 ${
              testResult.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {testResult.message}
            </p>
            
            {testResult.success && testResult.generatedPayload && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-green-800">
                  View Generated Payload
                </summary>
                <pre className="mt-2 text-xs bg-green-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(testResult.generatedPayload, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Email Provider Configuration
        </h1>
        <p className="text-gray-600">
          Configure email providers to send emails through your preferred services.
        </p>
      </div>

      {/* Configuration Mode Toggle */}
      <div className="mb-8">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              configMode === 'simple'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setConfigMode('simple')}
          >
            Simple Configuration
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              configMode === 'advanced'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setConfigMode('advanced')}
          >
            Advanced Configuration
          </button>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        {configMode === 'simple' ? renderSimpleConfiguration() : renderAdvancedConfiguration()}
      </div>

      {/* Test Result */}
      {renderTestResult()}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-gray-500">
          {configMode === 'simple' && !selectedProvider && 'Select a provider to continue'}
          {configMode === 'simple' && selectedProvider && 'Fill in the configuration details above'}
          {configMode === 'advanced' && 'Configure your custom email provider'}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleTestConfiguration}
            disabled={isLoading || (configMode === 'simple' && !selectedProvider)}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isLoading ? 'Testing...' : 'Test Configuration'}
          </button>
          
          <button
            onClick={handleSaveConfiguration}
            disabled={isLoading || (configMode === 'simple' && !selectedProvider)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailProviderConfigurationUI; 
