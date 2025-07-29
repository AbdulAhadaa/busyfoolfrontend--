import React, { useState, useRef, useEffect } from "react"
import { Bell, Menu, UserCircle, X, Check, Clock, MessageSquare, ShoppingCart, Heart, Star, User, Settings, HelpCircle, LogOut, Moon, Shield, CreditCard } from "lucide-react"

const profileMenuItems = [
  {
    id: 1,
    icon: User,
    label: "My Profile",
    description: "View and edit your profile",
    action: () => console.log("Navigate to profile")
  },
  {
    id: 2,
    icon: Settings,
    label: "Account Settings",
    description: "Manage your account preferences",
    action: () => console.log("Navigate to settings")
  },
  {
    id: 3,
    icon: CreditCard,
    label: "Billing & Plans",
    description: "Manage subscription and billing",
    action: () => console.log("Navigate to billing")
  },
 
  
  {
    id: 6,
    icon: HelpCircle,
    label: "Help & Support",
    description: "Get help and contact support",
    action: () => console.log("Navigate to help")
  }
]

const dummyNotifications = [
  {
    id: 1,
    type: "message",
    icon: MessageSquare,
    title: "New message from Sarah",
    description: "Hey! How's the project coming along?",
    time: "2 min ago",
    unread: true,
    color: "text-blue-500"
  },
  {
    id: 2,
    type: "order",
    icon: ShoppingCart,
    title: "Order shipped",
    description: "Your order #12345 has been shipped and is on its way",
    time: "1 hour ago",
    unread: true,
    color: "text-green-500"
  },
  {
    id: 3,
    type: "like",
    icon: Heart,
    title: "Someone liked your post",
    description: "Your recent post received 15 new likes",
    time: "3 hours ago",
    unread: false,
    color: "text-red-500"
  },
  {
    id: 4,
    type: "review",
    icon: Star,
    title: "New review received",
    description: "You received a 5-star review for your service",
    time: "5 hours ago",
    unread: true,
    color: "text-yellow-500"
  },
  {
    id: 5,
    type: "reminder",
    icon: Clock,
    title: "Meeting reminder",
    description: "Team standup meeting in 30 minutes",
    time: "1 day ago",
    unread: false,
    color: "text-purple-500"
  }
]

const Navbar = ({ onToggleSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState(dummyNotifications)
  const [darkMode, setDarkMode] = useState(false)
  const [userData, setUserData] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  const unreadCount = notifications.filter(n => n.unread).length

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true)
      try {
        const token = localStorage.getItem("accessToken")
        if (!token) return setUserData(null)
        const res = await fetch("http://localhost:3000/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return setUserData(null)
        const user = await res.json()
        setUserData({
          name: user.name,
          email: user.email,
          avatar: user.avatar || null,
          role: user.role,
          joinDate: user.created_at ? `Member since ${new Date(user.created_at).toLocaleDateString()}` : "",
        })
      } catch {
        setUserData(null)
      } finally {
        setLoadingUser(false)
      }
    }
    fetchUser()
  }, [])

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, unread: false } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, unread: false })))
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const handleProfileAction = (item) => {
    if (item.toggle && item.label === "Dark Mode") {
      setDarkMode(!darkMode)
    } else {
      item.action()
    }
    setShowProfile(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-4">
        <button className="md:hidden" onClick={onToggleSidebar}>
          <Menu className="w-6 h-6 text-[#6B4226]" />
        </button>
       
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown */}
        <div className="relative" ref={notificationRef}>
             <button 
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-7 h-7 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-xs text-white font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 hover:bg-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No notifications</p>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const IconComponent = notification.icon
                    return (
                      <div
                        key={notification.id}
                        className={`relative group hover:bg-gray-50 transition-colors ${
                          notification.unread ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3 p-4">
                          <div className={`flex-shrink-0 p-2 rounded-full bg-gray-100 ${notification.color}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`font-medium text-sm ${
                                notification.unread ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-all"
                              >
                                <X className="w-3 h-3 text-gray-500" />
                              </button>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.description}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {notification.time}
                              </span>
                              {notification.unread && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                  Mark read
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {notification.unread && (
                          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50">
                 
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            className="relative p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
            onClick={() => setShowProfile(!showProfile)}
          >
            <img
              src={userData && userData.avatar ? userData.avatar : undefined}
              alt={userData ? userData.name : "User"}
              className="w-10 h-10 rounded-full object-cover bg-gray-200"
              style={!userData || !userData.avatar ? { display: 'none' } : {}}
            />
            {(!userData || !userData.avatar) && (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg">
                {userData && userData.name ? userData.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : "?"}
              </div>
            )}
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-[#6B4226] to-[#8B5A3B] text-white p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={userData && userData.avatar ? userData.avatar : undefined}
                      alt={userData ? userData.name : "User"}
                      className="w-12 h-12 rounded-full border-2 border-white object-cover bg-gray-200"
                      style={!userData || !userData.avatar ? { display: 'none' } : {}}
                    />
                    {(!userData || !userData.avatar) && (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xl">
                        {userData && userData.name ? userData.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : "?"}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{userData ? userData.name : (loadingUser ? "Loading..." : "-")}</h3>
                    <p className="text-sm opacity-90">{userData ? userData.email : ""}</p>
                    <p className="text-xs opacity-75 mt-1">{userData ? userData.role : ""}</p>
                  </div>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {profileMenuItems.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleProfileAction(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                    >
                      <div className="flex-shrink-0 p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-[#6B4226] group-hover:text-white transition-colors">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{item.label}</span>
                          {item.toggle && item.label === "Dark Mode" && (
                            <div className={`w-10 h-5 rounded-full transition-colors ${
                              darkMode ? 'bg-[#6B4226]' : 'bg-gray-300'
                            }`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                                darkMode ? 'translate-x-5' : 'translate-x-0.5'
                              }`}></div>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 bg-gray-50">
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-500 mb-3">{userData ? userData.joinDate : ""}</p>
                 
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export { Navbar }
export default Navbar