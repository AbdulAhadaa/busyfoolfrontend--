"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coffee, Mail, Lock, Eye, EyeOff, XCircle, ArrowRight, Shield, CheckCircle, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMsg, setToastMsg] = useState("")
  const [toastType, setToastType] = useState("success") // success, error, warning

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  // Show toast with auto-hide
  const showToastMessage = (message, type = "success") => {
    setToastMsg(message)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 4000)
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const response = await fetch("https://busy-fool-backend.vercel.app/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        showToastMessage(errorData.message || "Login failed", "error")
        return
      }

      const user = await response.json()
      // Store access token in localStorage if present
      if (user.accessToken) {
        localStorage.setItem("accessToken", user.accessToken)
      }

      // Show success toast and redirect
      showToastMessage("Login successful! Redirecting...", "success")
      localStorage.setItem("loginSuccess", "1")

      // Delay redirect to show toast
      setTimeout(() => {
        window.location.href = "/welcome"
      }, 1500)
    } catch (error) {
      showToastMessage("Network error occurred. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Toast Component
  const Toast = () => (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-6 right-6 z-50 transition-all duration-300"
        >
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border-l-4 ${
              toastType === "success"
                ? "border-green-500 bg-green-50"
                : toastType === "error"
                  ? "border-red-500 bg-red-50"
                  : "border-yellow-500 bg-yellow-50"
            }`}
          >
            <div
              className={`rounded-full p-2 ${
                toastType === "success" ? "bg-green-100" : toastType === "error" ? "bg-red-100" : "bg-yellow-100"
              }`}
            >
              {toastType === "success" ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : toastType === "error" ? (
                <XCircle className="w-6 h-6 text-red-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {toastType === "success" ? "Success!" : toastType === "error" ? "Error" : "Warning"}
              </p>
              <p className="text-sm text-gray-700">{toastMsg}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <Toast />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-200/20 to-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-red-200/20 to-pink-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-yellow-200/10 to-amber-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-6xl relative">
        <div className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20 rounded-3xl overflow-hidden grid lg:grid-cols-2 transform transition-all duration-700 hover:shadow-3xl">
          {/* Left Side – Welcome Back Section */}
          <div className="relative bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 text-white p-12 flex flex-col justify-center space-y-8 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-400/20 to-transparent rounded-full blur-xl"></div>

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <Coffee className="w-8 h-8 text-amber-200" />
                </div>
                <div className="w-12 h-1 bg-gradient-to-r from-amber-300 to-orange-400 rounded-full"></div>
              </div>

              <h1 className="text-5xl font-bold leading-tight bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent mb-4">
                Welcome Back
              </h1>

              <p className="text-xl text-amber-100/90 leading-relaxed mb-8">
                Sign in to access your business dashboard and manage your operations efficiently.
              </p>

              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-amber-100/80">
                  <Shield className="w-5 h-5" />
                  <span>Secure authentication</span>
                </div>
                <div className="flex items-center space-x-3 text-amber-100/80">
                  <Coffee className="w-5 h-5" />
                  <span>Instant dashboard access</span>
                </div>
                <div className="flex items-center space-x-3 text-amber-100/80">
                  <ArrowRight className="w-5 h-5" />
                  <span>Continue your workflow</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8 border-t border-white/20">
              <p className="text-amber-200/70 mb-3">Don't have an account?</p>
              <a
                href="/signup"
                className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Create account
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>

          {/* Right Side – Login Form */}
          <div className="p-12 bg-white/90 backdrop-blur-sm">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-800 to-orange-700 bg-clip-text text-transparent mb-3">
                  Sign In
                </h2>
                <p className="text-gray-600">Access your coffee shop dashboard</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Field */}
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

                {/* Password Field */}
                <div className="group">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Password
                    </Label>
                    <a
                      href="/forgot-password"
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className={`pl-12 pr-12 h-14 bg-white/70 border-2 rounded-xl transition-all duration-300 focus:border-amber-500 focus:bg-white hover:bg-white/90 ${
                        errors.password ? "border-red-400 focus:border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Enter your password"
                      {...register("password", {
                        required: "Password is required",
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

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>Sign In</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>

                {/* Security Notice */}
                <div className="mt-8 p-4 bg-amber-50/50 border border-amber-200/50 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-800 font-medium">Your data is secure</p>
                      <p className="text-xs text-amber-700 mt-1">
                        We use industry-standard encryption to protect your information.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
