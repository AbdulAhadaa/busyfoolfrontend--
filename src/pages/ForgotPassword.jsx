"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coffee, Mail, ArrowLeft, Send, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const [toastType, setToastType] = useState("success") // success, error, info
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm()

  const showToastMessage = (message, type = "success") => {
    setToastMsg(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 5000)
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await fetch("https://busy-fool-backend.vercel.app/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        showToastMessage(errorData.message || "Failed to send reset email", "error")
        return
      }

      // Success - email sent
      setEmailSent(true)
      showToastMessage("Password reset email sent! Check your inbox.", "success")
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
      case "info":
        return <AlertCircle className="w-6 h-6 text-blue-600" />
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
      case "info":
        return "border-blue-500 bg-blue-50"
      default:
        return "border-green-500 bg-green-50"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Toast Notification */}
      {showToast && (
        <div
          className={`fixed top-6 right-6 z-50 transition-all duration-300 ${showToast ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}`}
        >
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-l-4 ${getToastColors()}`}>
            <div
              className={`rounded-full p-2 ${toastType === "success" ? "bg-green-100" : toastType === "error" ? "bg-red-100" : "bg-blue-100"}`}
            >
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
              Forgot Password?
            </h1>

            {!emailSent ? (
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            ) : (
              <p className="text-gray-600">
                We've sent a password reset link to{" "}
                <span className="font-semibold text-amber-700">{getValues("email")}</span>
              </p>
            )}
          </div>

          {!emailSent ? (
            /* Email Form */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="group">
                <Label htmlFor="email" className="text-gray-700 font-medium mb-2 block">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    className={`pl-12 h-14 bg-white/70 border-2 rounded-xl transition-all duration-300 focus:border-amber-500 focus:bg-white hover:bg-white/90 ${
                      errors.email ? "border-red-400 focus:border-red-500" : "border-gray-200"
                    }`}
                    placeholder="your@email.com"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <div className="flex items-center mt-2 text-red-500 text-sm">
                      <XCircle className="w-4 h-4 mr-1" />
                      {errors.email.message}
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Send className="w-5 h-5" />
                    <span>Send Reset Link</span>
                  </div>
                )}
              </Button>
            </form>
          ) : (
            /* Success State */
            <div className="text-center space-y-6">
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-green-800">
                  Check your email for the password reset link. It may take a few minutes to arrive.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">Didn't receive the email? Check your spam folder or</p>
                <Button
                  onClick={() => {
                    setEmailSent(false)
                    setIsLoading(false)
                  }}
                  variant="outline"
                  className="w-full h-12 border-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 rounded-xl transition-all duration-300"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Back to Login */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href="/login"
              className="flex items-center justify-center space-x-2 text-amber-600 hover:text-amber-700 font-medium transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Sign In</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
