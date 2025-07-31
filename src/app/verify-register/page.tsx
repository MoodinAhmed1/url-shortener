'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyEmail } from '@/lib/api' // Ensure you have this function implemented

export default function VerifyPage() {
  const [message, setMessage] = useState("Verifying your email...")
  const [countdown, setCountdown] = useState(5)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get("token")
      if (!token) {
        setMessage("Invalid or missing verification token.")
        return
      }
      try {
        const res = await verifyEmail(token)
        setMessage(res.message || "Email verified successfully!")
      } catch (error) {
        setMessage("Verification failed. Please try again.")
      }
    }
    verify()
  }, [searchParams])

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/login') // Redirect to login after verification
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="flex h-screen justify-center items-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{message}</h1>
        <p className="text-gray-500">Redirecting in {countdown} seconds...</p>
      </div>
    </div>
  )
}
