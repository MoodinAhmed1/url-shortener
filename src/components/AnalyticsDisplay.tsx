'use client';

import { useEffect, useState } from 'react';
import { getAnalytics } from '../lib/api';

interface AnalyticsData {
  created: string;
  clicks: number;
  countries: Record<string, number>;
  devices: Record<string, number>;
  referrers: Record<string, number>;
}

export default function AnalyticsDisplay({ shortId }: { shortId: string }) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const data = await getAnalytics(shortId);
        setAnalytics(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (shortId) {
      fetchAnalytics();
    }
  }, [shortId]);

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!analytics) return <div>No analytics available</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">URL Analytics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-500">Total Clicks</h3>
            <p className="text-3xl font-bold">{analytics.clicks}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-500">Created</h3>
            <p className="text-lg font-medium">
              {new Date(analytics.created).toLocaleDateString()}
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-500">Short ID</h3>
            <p className="text-lg font-medium">{shortId}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Countries</h3>
          {Object.keys(analytics.countries).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(analytics.countries)
                .sort((a, b) => b[1] - a[1])
                .map(([country, count]) => (
                  <li key={country} className="flex justify-between">
                    <span>{country}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p>No country data available</p>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-4">Devices</h3>
          {Object.keys(analytics.devices).length > 0 ? (
            <ul className="space-y-2">
              {Object.entries(analytics.devices)
                .sort((a, b) => b[1] - a[1])
                .map(([device, count]) => (
                  <li key={device} className="flex justify-between">
                    <span>{device}</span>
                    <span className="font-medium">{count}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p>No device data available</p>
          )}
        </div>
      </div>
    </div>
  );
}