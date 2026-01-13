"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function TestSecurityPage() {
  const { user, isAuthenticated, isAdmin, token } = useAuth();
  const [localStorageUser, setLocalStorageUser] = useState<string>('');
  const [localStorageToken, setLocalStorageToken] = useState<string>('');

  const checkLocalStorage = () => {
    const userStr = localStorage.getItem('user') || '';
    const tokenStr = localStorage.getItem('token') || '';
    setLocalStorageUser(userStr);
    setLocalStorageToken(tokenStr);
  };

  const tryToBypassSecurity = () => {
    // This demonstrates the old insecure method
    localStorage.setItem('user', JSON.stringify({ isAdmin: true }));
    localStorage.setItem('token', 'fake-token');
    checkLocalStorage();
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    checkLocalStorage();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Security Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Authentication Status</h2>
          <div className="space-y-2">
            <p><strong>Is Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User ID:</strong> {user?._id || 'None'}</p>
            <p><strong>User Email:</strong> {user?.email || 'None'}</p>
            <p><strong>Has Valid Token:</strong> {token ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Status</h2>
          <div className="space-y-2">
            <p><strong>User in localStorage:</strong></p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              {localStorageUser || 'None'}
            </pre>
            <p><strong>Token in localStorage:</strong></p>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
              {localStorageToken || 'None'}
            </pre>
          </div>
          <div className="mt-4 space-x-2">
            <button 
              onClick={checkLocalStorage}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Check LocalStorage
            </button>
            <button 
              onClick={tryToBypassSecurity}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            >
              Try to Bypass Security (Old Method)
            </button>
            <button 
              onClick={clearLocalStorage}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear LocalStorage
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Security Test</h2>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800">
                <strong>Test 1:</strong> Try to manually set localStorage.user = {"{isAdmin: true}"} in browser dev tools
              </p>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-800">
                <strong>Test 2:</strong> Try to access /admin/dashboard after setting localStorage
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800">
                <strong>Result:</strong> The AdminRouteGuard will validate the token with the server and deny access
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">How the New Security Works</h2>
          <div className="space-y-2 text-sm">
            <p>1. <strong>Client-side check:</strong> AdminRouteGuard checks if user is authenticated and is admin</p>
            <p>2. <strong>Server-side validation:</strong> Every API call validates the JWT token</p>
            <p>3. <strong>Database verification:</strong> Token verification fetches fresh user data from database</p>
            <p>4. <strong>Automatic cleanup:</strong> Invalid tokens are automatically removed from localStorage</p>
            <p>5. <strong>Redirect protection:</strong> Unauthorized users are redirected to appropriate pages</p>
          </div>
        </div>
      </div>
    </div>
  );
}
