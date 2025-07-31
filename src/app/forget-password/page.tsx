'use client'
import { useEffect, useState } from 'react'
import { requestPasswordReset } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  const router = useRouter();

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'reset-token') {
        const token = e.newValue;
        if (!token) return;

        // Cleanup
        localStorage.removeItem('reset-token');

        // Notify the email-redirect tab
        localStorage.setItem('token-used', 'yes');
        localStorage.removeItem('token-used'); // fire event

        // Redirect the current tab
        router.push(`/reset-password?token=${token}`);
      }
    };
    // Listen for storage events to handle cross-tab communication
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await requestPasswordReset(email);
    alert(res.message);
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-semibold text-center">Forgot Password</h2>

        {message && (
          <div className={`text-center text-sm ${success ? 'text-green-500' : 'text-red-500'}`}>
            {message}
          </div>
        )}

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          Send Reset Link
        </button>
      </form>
    </div>
  )
}
