'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function EmailRedirectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [fallbackTriggered, setFallbackTriggered] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Store the token in localStorage so other tabs can read it
    localStorage.setItem('reset-token', token);
    localStorage.removeItem('reset-token'); // Fire the storage event

    // Wait for 5 seconds to see if another tab picks it up
    const fallbackTimeout = setTimeout(() => {
      setFallbackTriggered(true);
      router.replace(`/reset-password?token=${token}`);
    }, 5000);

    const handleTokenUsed = (e: StorageEvent) => {
      if (e.key === 'token-used') {
        clearTimeout(fallbackTimeout); // Cancel fallback
      }
    };

    window.addEventListener('storage', handleTokenUsed);

    return () => {
      clearTimeout(fallbackTimeout);
      window.removeEventListener('storage', handleTokenUsed);
    };
  }, [token, router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-2xl shadow-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-800">Redirecting...</h1>
        <p className="text-gray-600">
          Your password reset page is now ready in your previous tab.
          If it didn&apos;t open, this page will continue in a few seconds.
        </p>

        {fallbackTriggered && (
          <p className="text-blue-600 font-semibold">Redirecting now...</p>
        )}
      </div>
    </div>
  );
}
