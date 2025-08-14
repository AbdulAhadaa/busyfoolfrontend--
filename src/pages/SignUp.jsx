import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coffee, User, Mail, Lock, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react"

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      // Register the user
      const registerResponse = await fetch("https://busy-fool-backend.vercel.app/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          role: "owner", // or set dynamically if needed
        }),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        alert(errorData.message || "Registration failed");
        setIsLoading(false);
        return;
      }

      const user = await registerResponse.json();
      if (user.id) {
        localStorage.setItem("userId", user.id);
      }

      // Automatically log in after registration
      const loginResponse = await fetch("https://busy-fool-backend.vercel.app/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        alert(errorData.message || "Login after registration failed");
        setIsLoading(false);
        return;
      }

      const loginUser = await loginResponse.json();
      if (loginUser.accessToken) {
        localStorage.setItem("accessToken", loginUser.accessToken);
      }

      // Registration and login successful, redirect to welcome page
      localStorage.setItem("loginSuccess", "1");
      window.location.href = "/welcome";
    } catch (error) {
      alert("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const password = watch("password", "")

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-200/20 to-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-red-200/20 to-pink-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-yellow-200/10 to-amber-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-6xl relative">
        <div className="bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20 rounded-3xl overflow-hidden grid lg:grid-cols-2 transform transition-all duration-700 hover:shadow-3xl">
          {/* Left Side – Brand Section */}
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
                Create Your Account
              </h1>
              
              <p className="text-xl text-amber-100/90 leading-relaxed mb-8">
                Register to access your business dashboard and manage your operations efficiently.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-amber-100/80">
                  <CheckCircle className="w-5 h-5" />
                  <span>Real-time analytics</span>
                </div>
                <div className="flex items-center space-x-3 text-amber-100/80">
                  <CheckCircle className="w-5 h-5" />
                  <span>Operational insights</span>
                </div>
                <div className="flex items-center space-x-3 text-amber-100/80">
                  <CheckCircle className="w-5 h-5" />
                  <span>Secure data management</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8 border-t border-white/20">
              <p className="text-amber-200/70 mb-3">Already have an account?</p>
              <a
                href="/login"
                className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Sign in instead
              </a>
            </div>
          </div>

          {/* Right Side – Form Section */}
          <div className="p-12 bg-white/90 backdrop-blur-sm">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-800 to-orange-700 bg-clip-text text-transparent mb-3">
                  Create Account
                </h2>
                <p className="text-gray-600">Join thousands of coffee shop owners</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <div className="group">
                  <Label htmlFor="name" className="text-gray-700 font-medium mb-2 block">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                    <Input
                      id="name"
                      className={`pl-12 h-14 bg-white/70 border-2 rounded-xl transition-all duration-300 focus:border-amber-500 focus:bg-white hover:bg-white/90 ${
                        errors.name ? 'border-red-400 focus:border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Enter your full name"
                      {...register("name", { required: "Name is required" })}
                    />
                    {errors.name && (
                      <div className="flex items-center mt-2 text-red-500 text-sm">
                        <XCircle className="w-4 h-4 mr-1" />
                        {errors.name.message}
                      </div>
                    )}
                  </div>
                </div>

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
                        errors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-200'
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
                  <Label htmlFor="password" className="text-gray-700 font-medium mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className={`pl-12 pr-12 h-14 bg-white/70 border-2 rounded-xl transition-all duration-300 focus:border-amber-500 focus:bg-white hover:bg-white/90 ${
                        errors.password ? 'border-red-400 focus:border-red-500' : 'border-gray-200'
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
                      <span className="text-xs font-medium text-gray-600">{showPassword ? 'Hide' : 'Show'}</span>
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
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className={`pl-12 pr-12 h-14 bg-white/70 border-2 rounded-xl transition-all duration-300 focus:border-amber-500 focus:bg-white hover:bg-white/90 ${
                        errors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-gray-200'
                      }`}
                      placeholder="Confirm your password"
                      {...register("confirmPassword", {
                        required: "Confirm password is required",
                        validate: value => value === password || "Passwords do not match"
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      <span className="text-xs font-medium text-gray-600">{showConfirmPassword ? 'Hide' : 'Show'}</span>
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
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              {/* Terms */}
              <p className="text-center text-sm text-gray-500 mt-6">
                By creating an account, you agree to our{" "}
                <a href="#" className="text-amber-600 hover:text-amber-700 font-medium">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-amber-600 hover:text-amber-700 font-medium">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}