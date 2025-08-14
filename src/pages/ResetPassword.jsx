"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coffee, Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowRight, Shield } from "lucide-react"

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const [toastType, setToastType] = useState("success")
  const [resetToken, setResetToken] = useState("")
  const [tokenValid, setTokenValid] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch("password", "")

  useEffect(() => {
    // Extract token from URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get("token")

    if (!token) {
      setTokenValid(false)
      showToastMessage("Invalid or missing reset token", "error")
    } else {
      setResetToken(token)
    }
  }, [])

  const showToastMessage = (message, type = "success") => {
    setToastMsg(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 5000)
  }

  const onSubmit = async (data) => {
    if (!resetToken) {
      showToastMessage("Invalid reset token", "error")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("https://busy-fool-backend.vercel.app/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword: data.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        showToastMessage(errorData.message || "Failed to reset password", "error")
        return
      }

      // Success - password reset
      showToastMessage("Password reset successfully! Redirecting to login...", "success")

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/login"
      }, 2000)
    } catch (error) {
      showToastMessage("Network error. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const getToastIcon = () => {
    switch (toastType) {
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case "error":
        return <XCircle className="w-6 h-6 text-red-600" />
      default:
        return <CheckCircle className="w-6 h-6 text-green-600" />
    }
  }

  const getToastColors = () => {
    switch (toastType) {
      case "success":
        return "border-green-500 bg-green-50"
      case "error":
        return "border-red-500 bg-red-50"
      default:
        return "border-green-500 bg-green-50"
    }
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20 rounded-3xl p-8 text-center">
            <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <a
              href="/forgot-password"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300"
            >
              Request New Link
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-6 right-6 z-50 transition-all duration-300 ${showToast ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}`}
        >
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-l-4 ${getToastColors()}`}>
            <div className={`rounded-full p-2 ${toastType === "success" ? "bg-green-100" : "bg-red-100"}`}>
              {getToastIcon()}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">{toastMsg}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-200/20 to-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-red-200/20 to-pink-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-yellow-200/10 to-amber-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative">
        <div className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20 rounded-3xl p-8 transform transition-all duration-700 hover:shadow-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl">
                <Coffee className="w-8 h-8 text-amber-600" />
              </div>
            </div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-800 to-orange-700 bg-clip-text text-transparent mb-3">
              Reset Password
            </h1>

            <p className="text-gray-600">Enter your new password below to complete the reset process.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password Field */}
            <div className="group">
              <Label htmlFor="password" className="text-gray-700 font-medium mb-2 block">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`pl-12 pr-12 h-14 bg-white/70 border-2 rounded-xl transition-all duration-300 focus:border-amber-500 focus:bg-white hover:bg-white/90 ${
                    errors.password ? "border-red-400 focus:border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Enter new password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  <span className="text-xs font-medium text-gray-600">{showPassword ? "Hide" : "Show"}</span>
                </button>
                {errors.password && (
                  <div className="flex items-center mt-2 text-red-500 text-sm">
                    <XCircle className="w-4 h-4 mr-1" />
                    {errors.password.message}
                  </div>
                )}
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="group">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium mb-2 block">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`pl-12 pr-12 h-14 bg-white/70 border-2 rounded-xl transition-all duration-300 focus:border-amber-500 focus:bg-white hover:bg-white/90 ${
                    errors.confirmPassword ? "border-red-400 focus:border-red-500" : "border-gray-200"
                  }`}
                  placeholder="Confirm new password"
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) => value === password || "Passwords do not match",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  <span className="text-xs font-medium text-gray-600">{showConfirmPassword ? "Hide" : "Show"}</span>
                </button>
                {errors.confirmPassword && (
                  <div className="flex items-center mt-2 text-red-500 text-sm">
                    <XCircle className="w-4 h-4 mr-1" />
                    {errors.confirmPassword.message}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Resetting Password...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Reset Password</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </Button>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-amber-50/50 border border-amber-200/50 rounded-xl">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">Password Security</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Choose a strong password with at least 6 characters for better security.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
