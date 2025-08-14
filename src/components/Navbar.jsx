import React, { useState, useRef, useEffect } from "react"
import { useLocation } from "react-router-dom"

import { Bell, Menu, UserCircle, X, Check, Clock, MessageSquare, ShoppingCart, Heart, Star, User, Settings, HelpCircle, LogOut, Moon, Shield, CreditCard, Home, Package, Leaf, BarChart3, Users, FileText, Cog, Receipt, TrendingUp } from "lucide-react"

const profileMenuItems = [
  // {
  //   id: 1,
  //   icon: User,
  //   label: "My Profile",
  //   action: () => console.log("Navigate to profile")
  // },
  // {
  //   id: 2,
  //   icon: Settings,
  //   label: "Account Settings",
  //   action: () => console.log("Navigate to settings")
  // },
  // {
  //   id: 3,
  //   icon: CreditCard,
  //   label: "Billing & Plans",
  //   action: () => console.log("Navigate to billing")
  // },
  // {
  //   id: 6,
  //   icon: HelpCircle,
  //   label: "Help & Support",
  //   action: () => console.log("Navigate to help")
  // }
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

// Enhanced dynamic page configuration based on your actual routes
const pageConfig = {
  '/': {
    title: 'Sign Up',
    icon: User,
    breadcrumb: ['Sign Up']
  },
  '/signup': {
    title: 'Sign Up',
    icon: User,
    breadcrumb: ['Sign Up']
  },
  '/login': {
    title: 'Login',
    icon: Shield,
    breadcrumb: ['Login']
  },
  '/welcome': {
    title: 'Dashboard',
    subtitle: 'Welcome to your coffee shop management system',
    icon: Home,
    breadcrumb: ['Dashboard']
  },
  '/products': {
    title: 'Products',
    subtitle: 'Manage your coffee and beverage products',
    icon: Package,
    breadcrumb: ['Products']
  },
  '/ingredients': {
    title: 'Ingredients',
    subtitle: 'Manage raw materials and ingredients',
    icon: Leaf,
    breadcrumb: ['Ingredients']
  },
  '/stock': {
    title: 'Stock Management',
    subtitle: 'Monitor inventory levels and stock',
    icon: Package,
    breadcrumb: ['Stock']
  },
   '/sales': {
    title: 'Sales',
    subtitle: 'View and manage sales transactions',
    icon: Receipt,
    breadcrumb: ['Sales']
  },
   '/purchases': {
    title: 'Purchases',
    subtitle: 'Track purchase orders and suppliers',
    icon: ShoppingCart,
    breadcrumb: ['Purchases']
  },
   '/dashboard': {
    title: 'Analytics',
    subtitle: 'Business insights and performance metrics',
    icon: TrendingUp,
    breadcrumb: ['Analytics']
  }
}

// Get page information with fallback
const getPageInfo = (currentPath) => {
  // Direct match
  if (pageConfig[currentPath]) {
    return pageConfig[currentPath]
  }
  
  // Try to match parent routes for dynamic segments
  const pathSegments = currentPath.split('/').filter(Boolean)
  
  // Check for dynamic routes like /products/123/edit
  if (pathSegments.length >= 2) {
    const possibleRoutes = [
      `/${pathSegments[0]}/${pathSegments[1]}`, // /products/edit
      `/${pathSegments[0]}`, // /products
    ]
    
    for (const route of possibleRoutes) {
      if (pageConfig[route]) {
        return pageConfig[route]
      }
    }
  }
  
  // Single segment check
  if (pathSegments.length >= 1) {
    const singleRoute = `/${pathSegments[0]}`
    if (pageConfig[singleRoute]) {
      return pageConfig[singleRoute]
    }
  }
  
  // Fallback for auth pages or unknown routes
  return {
    title: 'Dashboard',
   
    icon: Home,
  
  }
}

const Navbar = ({ onToggleSidebar, isSidebarOpen = false }) => {
  const location = useLocation()
  const currentPath = location.pathname
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [notifications, setNotifications] = useState(dummyNotifications)
  const [darkMode, setDarkMode] = useState(false)
  const [userData, setUserData] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const notificationRef = useRef(null)
  const profileRef = useRef(null)

  const unreadCount = notifications.filter(n => n.unread).length
  const pageInfo = getPageInfo(currentPath)
  const PageIcon = pageInfo.icon

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
    setLoadingUser(true);
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("https://busy-fool-backend.vercel.app/auth/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUserData({
            name: data.fullName || data.name || data.username || data.email || "-",
            email: data.email || "-",
            avatar: data.avatar || null,
            role: data.role || "",
            joinDate: data.joinDate || "",
          });
        } else {
          // fallback to localStorage
          const userStr = localStorage.getItem("user");
          let user = null;
          if (userStr) {
            user = JSON.parse(userStr);
          }
          setUserData({
            name: user?.name || user?.username || user?.email || "-",
            email: user?.email || user?.username || user?.name || "-",
            avatar: user?.avatar || null,
            role: user?.role || "",
            joinDate: user?.joinDate || "",
          });
        }
      } catch {
        setUserData({ name: "-", email: "-" });
      } finally {
        setLoadingUser(false);
      }
    };
    fetchProfile();
  }, []);

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

  // Enhanced mobile menu toggle handler
  const handleMenuToggle = () => {
    console.log('Menu button clicked!') // Debug log
    if (onToggleSidebar) {
      onToggleSidebar()
    } else {
      console.warn('onToggleSidebar function not provided')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          {/* Enhanced Mobile Menu Button */}
          <button 
            className={`md:hidden flex-shrink-0 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 active:bg-gray-200 ${
              isSidebarOpen ? 'bg-[#6B4226]/10' : ''
            }`}
            onClick={handleMenuToggle}
            aria-label="Toggle sidebar"
            type="button"
          >
            <Menu className={`w-6 h-6 transition-colors duration-200 ${
              isSidebarOpen ? 'text-[#6B4226]' : 'text-[#6B4226]'
            }`} />
          </button>
          
          {/* Enhanced Dynamic Page Header */}
          <div className="min-w-0 flex-1">
            {/* Only show header for authenticated pages (not login/signup) */}
            {!['/login', '/signup', '/'].includes(currentPath) && (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex-shrink-0 p-2 bg-[#6B4226]/10 rounded-lg">
                    <PageIcon className="w-5 h-5 text-[#6B4226]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#6B4226] truncate">
                      {pageInfo.title}
                    </h1>
                  </div>
                </div>
                
                {/* Breadcrumb Navigation */}
                {/* <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mb-1">
                  {pageInfo.breadcrumb.map((crumb, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span className="mx-1">/</span>}
                      <span className={index === pageInfo.breadcrumb.length - 1 ? 'text-[#6B4226] font-medium' : 'hover:text-[#6B4226] cursor-pointer'}>
                        {crumb}
                      </span>
                    </React.Fragment>
                  ))}
                </div> */}
                
                {/* Subtitle */}
                {/* <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  {pageInfo.subtitle}
                </p> */}
              </>
            )}
            
            {/* Show simple title for auth pages */}
            {['/login', '/signup', '/'].includes(currentPath) && (
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#6B4226]">
                {pageInfo.title}
              </h1>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {/* Hide notifications and profile for auth pages */}
          {!['/login', '/signup', '/'].includes(currentPath) && (
            <>
              {/* Notifications Dropdown */}
              
              
              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button 
                  className="relative p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  onClick={() => setShowProfile(!showProfile)}
                >
                  <img
                    src={userData && userData.avatar ? userData.avatar : undefined}
                    alt={userData ? userData.name : "User"}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover bg-gray-200"
                    style={!userData || !userData.avatar ? { display: 'none' } : {}}
                  />
                  {(!userData || !userData.avatar) && (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm sm:text-lg">
                      {userData && userData.name ? userData.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : "?"}
                    </div>
                  )}
                </button>

                {showProfile && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200 max-w-[90vw] sm:max-w-none">
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-[#6B4226] to-[#8B5A3B] text-white p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={userData && userData.avatar ? userData.avatar : undefined}
                            alt={userData ? userData.name : "User"}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white object-cover bg-gray-200"
                            style={!userData || !userData.avatar ? { display: 'none' } : {}}
                          />
                          {(!userData || !userData.avatar) && (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg sm:text-xl">
                              {userData && userData.name ? userData.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : "?"}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg truncate">{userData ? userData.name : (loadingUser ? "Loading..." : "-")}</h3>
                          <p className="text-xs sm:text-sm opacity-90 truncate">{userData ? userData.email : ""}</p>
                          <p className="text-xs opacity-75 mt-1">{userData ? userData.role : ""}</p>
                        </div>
                        <button
                          onClick={() => setShowProfile(false)}
                          className="p-1 hover:bg-white/20 rounded-full transition-colors flex-shrink-0"
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
                            className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                          >
                            <div className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg bg-gray-100 text-gray-600 group-hover:bg-[#6B4226] group-hover:text-white transition-colors">
                              <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 text-sm sm:text-base">{item.label}</span>
                                {item.toggle && item.label === "Dark Mode" && (
                                  <div className={`w-8 h-4 sm:w-10 sm:h-5 rounded-full transition-colors ${
                                    darkMode ? 'bg-[#6B4226]' : 'bg-gray-300'
                                  }`}>
                                    <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                                      darkMode ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0.5'
                                    }`}></div>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 bg-gray-50">
                      <div className="px-3 sm:px-4 py-3">
                        <p className="text-xs text-gray-500 mb-3">{userData ? userData.joinDate : ""}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export { Navbar }
export default Navbar