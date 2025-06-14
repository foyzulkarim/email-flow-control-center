import React, { useState } from 'react';
import { Plus, Settings, List, BarChart3 } from 'lucide-react';
import EmailProviderConfigurationUI from './EmailProviderConfiguration';
import ProviderManagement from './ProviderManagement';

const EmailProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState('manage');

  const tabs = [
    {
      id: 'manage',
      name: 'Manage Providers',
      icon: List,
      component: ProviderManagement
    },
    {
      id: 'configure',
      name: 'Add Provider',
      icon: Plus,
      component: EmailProviderConfigurationUI
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center py-6 px-4 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Email Provider Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Configure and manage your email delivery providers
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="py-8">
        {ActiveComponent && <ActiveComponent />}
      </main>
    </div>
  );
};

export default EmailProviderDashboard; 
