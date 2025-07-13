'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { shortenUrl } from '../lib/api';
import QRCode from './QRCode';

export default function UrlForm() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!url) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await shortenUrl(url, customCode || null);
      setShortUrl(result.shortUrl);
      setShowQR(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Create Short URL</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Enter a long URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
            placeholder="https://example.com/very/long/url"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>
        
        <div>
          <label htmlFor="customCode" className="block text-sm font-medium text-gray-700 mb-1">
            Custom code (optional)
          </label>
          <input
            type="text"
            id="customCode"
            value={customCode}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCustomCode(e.target.value)}
            placeholder="e.g., my-link"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !url}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Short URL'}
        </button>
      </form>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {shortUrl && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium truncate">{shortUrl}</span>
            <button
              onClick={copyToClipboard}
              className="ml-2 text-blue-500 hover:text-blue-700"
            >
              Copy
            </button>
          </div>
          
          {showQR && (
            <div className="mt-4">
              <QRCode value={shortUrl} />
            </div>
          )}
          
          <div className="mt-4">
            <a
              href={`/analytics/${shortUrl.split('/').pop()}`}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              View Analytics
            </a>
          </div>
        </div>
      )}
    </div>
  );
}