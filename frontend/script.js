// Global variables
let currentUser = null
let currentMap = null
const L = window.L // Declare the L variable

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const userData = localStorage.getItem("farmgrid_user")
  if (userData) {
    currentUser = JSON.parse(userData)
  }

  initScrollAnimations()

  // Initialize page-specific functionality
  const path = window.location.pathname
  if (path.includes("login.html")) {
    initLoginPage()
  } else if (path.includes("signup.html")) {
    initSignupPage()
  } else if (path.includes("buyer-home.html")) {
    initBuyerHome()
  } else if (path.includes("seller-home.html")) {
    initSellerHome()
  } else if (path.includes("farmer-profile.html")) {
    initFarmerProfile()
  } else if (path.includes("product-detail.html")) {
    initProductDetail()
  } else if (path.includes("admin.html")) {
    initAdminPage()
  }
})

// Scroll animation functions
function initScrollAnimations() {
  // Create intersection observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate")
      }
    })
  }, observerOptions)

  // Observe all elements with scroll animation classes
  const animatedElements = document.querySelectorAll(
    ".scroll-fade-in, .scroll-slide-left, .scroll-slide-right, .scroll-scale-in",
  )

  animatedElements.forEach((el) => observer.observe(el))
}

// Authentication functions
function initLoginPage() {
  const form = document.getElementById("login-form")
  if (form) {
    form.addEventListener("submit", handleLogin)
  }
}

function initSignupPage() {
  const form = document.getElementById("signup-form")
  const roleSelect = document.getElementById("role")

  // Set role from URL parameter
  const urlParams = new URLSearchParams(window.location.search)
  const role = urlParams.get("role")
  if (role && roleSelect) {
    roleSelect.value = role
  }

  if (form) {
    form.addEventListener("submit", handleSignup)
  }
}

async function handleLogin(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const email = formData.get("email")
  const password = formData.get("password")

  // Check for admin credentials
  if (email === "admin" && password === "admin123") {
    const adminUser = {
      id: 0,
      fullName: "Admin User",
      email: "admin@farmgrid.com",
      role: "admin",
    }
    localStorage.setItem("farmgrid_user", JSON.stringify(adminUser))
    window.location.href = "admin.html"
    return
  }

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (data.success) {
      localStorage.setItem("farmgrid_user", JSON.stringify(data.user))

      // Redirect based on role
      if (data.user.role === "buyer") {
        window.location.href = "buyer-home.html"
      } else if (data.user.role === "seller") {
        window.location.href = "seller-home.html"
      } else if (data.user.role === "admin") {
        window.location.href = "admin.html"
      }
    } else {
      alert(data.error || "Login failed")
    }
  } catch (error) {
    console.error("Login error:", error)
    alert("Login failed. Please try again.")
  }
}

async function handleSignup(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const userData = {
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  }

  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    const data = await response.json()

    if (data.success) {
      alert("Account created successfully! Please login.")
      window.location.href = "login.html"
    } else {
      alert(data.error || "Signup failed")
    }
  } catch (error) {
    console.error("Signup error:", error)
    alert("Signup failed. Please try again.")
  }
}

function logout() {
  localStorage.removeItem("farmgrid_user")
  window.location.href = "index.html"
}

// Buyer home page functions
async function initBuyerHome() {
  if (!currentUser || currentUser.role !== "buyer") {
    window.location.href = "login.html"
    return
  }

  loadProducts()
  loadWeather()
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products")
    const products = await response.json()

    const productsContainer = document.getElementById("products-container")
    if (productsContainer) {
      productsContainer.innerHTML = products
        .map(
          (product) => `
                <div class="product-card" onclick="viewProduct(${product.id})">
                    <h3>${product.name}</h3>
                    <p>${product.description || "No description available"}</p>
                    <div class="product-price">$${product.price}</div>
                    <div class="product-location">📍 ${product.farmName || product.sellerName}</div>
                </div>
            `,
        )
        .join("")
    }
  } catch (error) {
    console.error("Error loading products:", error)
  }
}

function viewProduct(productId) {
  window.location.href = `product-detail.html?id=${productId}`
}

// Seller home page functions
async function initSellerHome() {
  if (!currentUser || currentUser.role !== "seller") {
    window.location.href = "login.html"
    return
  }

  loadSellerStats()
  loadSellerProducts()
  loadWeather()
  loadAds()
}

async function loadSellerStats() {
  try {
    const response = await fetch(`/api/stats/seller/${currentUser.id}`)
    const stats = await response.json()

    document.getElementById("product-count").textContent = stats.productCount
    document.getElementById("order-count").textContent = stats.orderCount
    document.getElementById("total-earnings").textContent = `$${stats.totalEarnings.toFixed(2)}`
  } catch (error) {
    console.error("Error loading stats:", error)
  }
}

async function loadSellerProducts() {
  console.log("[v0] Loading seller products for user:", currentUser)

  try {
    const productsContainer = document.getElementById("seller-products")
    const emptyState = document.getElementById("products-empty-state")

    if (!productsContainer) {
      console.log("[v0] Products container not found")
      return
    }

    productsContainer.innerHTML = `<div class="loading" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">Loading products...</div>`

    const response = await fetch(`/api/products/seller/${currentUser.id}`)
    const products = await response.json()

    console.log("[v0] Loaded products:", products)

    productsContainer.innerHTML = ""

    if (products.length === 0) {
      if (emptyState) {
        emptyState.classList.remove("hidden")
      }
      productsContainer.innerHTML = ""
    } else {
      if (emptyState) {
        emptyState.classList.add("hidden")
      }
      productsContainer.innerHTML = products
        .map(
          (product) => `
            <div class="product-card">
                <h3>${product.name}</h3>
                <p>${product.description || "No description available"}</p>
                <div class="product-price">$${product.price}</div>
                <div style="margin-top: 1rem;">
                    <button class="btn btn-secondary" onclick="editProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}', '${(product.description || "").replace(/'/g, "\\'")}', ${product.price})">Edit</button>
                    <button class="btn btn-destructive" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </div>
          `,
        )
        .join("")
    }
  } catch (error) {
    console.error("Error loading seller products:", error)
    const productsContainer = document.getElementById("seller-products")
    if (productsContainer) {
      productsContainer.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--destructive);">Error loading products. Please try again.</div>`
    }
  }
}

// Weather functions
async function loadWeather() {
  // Mock weather data since we don't have API key
  const weatherData = {
    temperature: Math.floor(Math.random() * 20) + 15,
    condition: ["Sunny", "Cloudy", "Partly Cloudy", "Rainy"][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 40) + 40,
  }

  const weatherWidget = document.getElementById("weather-widget")
  if (weatherWidget) {
    weatherWidget.innerHTML = `
            <h3>Local Weather</h3>
            <div class="weather-temp">${weatherData.temperature}°C</div>
            <div>${weatherData.condition}</div>
            <div style="font-size: 0.875rem; color: var(--muted-foreground); margin-top: 0.5rem;">
                Humidity: ${weatherData.humidity}%
            </div>
        `
  }
}

// Map functions
function initMap(containerId, lat = 40.7128, lng = -74.006) {
  if (currentMap) {
    currentMap.remove()
  }

  currentMap = L.map(containerId).setView([lat, lng], 13)

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(currentMap)

  return currentMap
}

function addMapMarker(map, lat, lng, popupText) {
  L.marker([lat, lng]).addTo(map).bindPopup(popupText).openPopup()
}

// Product detail functions
async function initProductDetail() {
  const urlParams = new URLSearchParams(window.location.search)
  const productId = urlParams.get("id")

  if (!productId) {
    window.location.href = "buyer-home.html"
    return
  }

  try {
    const response = await fetch(`/api/products/${productId}`)
    const product = await response.json()

    // Update page content
    document.getElementById("product-name").textContent = product.name
    document.getElementById("product-description").textContent = product.description || "No description available"
    document.getElementById("product-price").textContent = `$${product.price}`
    document.getElementById("seller-name").textContent = product.sellerName
    document.getElementById("seller-email").textContent = product.sellerEmail
    document.getElementById("farm-name").textContent = product.farmName || "Farm information not available"
    document.getElementById("seller-bio").textContent = product.bio || "No bio available"

    // Initialize map
    if (product.latitude && product.longitude) {
      const map = initMap("product-map", product.latitude, product.longitude)
      addMapMarker(
        map,
        product.latitude,
        product.longitude,
        `${product.name} - ${product.farmName || product.sellerName}`,
      )
    }

    // Set up purchase buttons
    document.getElementById("buy-in-person").onclick = () => purchaseProduct(productId, "in_person")
    document.getElementById("buy-farmgrid-plus").onclick = () => purchaseProduct(productId, "farmgrid_plus")
  } catch (error) {
    console.error("Error loading product:", error)
    alert("Product not found")
    window.location.href = "buyer-home.html"
  }
}

async function purchaseProduct(productId, orderType) {
  if (!currentUser) {
    alert("Please login to make a purchase")
    window.location.href = "login.html"
    return
  }

  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        buyerId: currentUser.id,
        productId: productId,
        orderType: orderType,
      }),
    })

    const data = await response.json()

    if (data.success) {
      alert(
        `Order placed successfully! ${orderType === "farmgrid_plus" ? "We will deliver to you soon." : "Please contact the seller for pickup details."}`,
      )
    } else {
      alert(data.error || "Order failed")
    }
  } catch (error) {
    console.error("Purchase error:", error)
    alert("Purchase failed. Please try again.")
  }
}

// Farmer profile functions
async function initFarmerProfile() {
  if (!currentUser || currentUser.role !== "seller") {
    window.location.href = "login.html"
    return
  }

  // Load existing profile
  try {
    const response = await fetch(`/api/users/${currentUser.id}`)
    const data = await response.json()

    if (data.profile) {
      document.getElementById("farm-name").value = data.profile.farmName || ""
      document.getElementById("contact-info").value = data.profile.contactInfo || ""
      document.getElementById("bio").value = data.profile.bio || ""

      if (data.profile.latitude && data.profile.longitude) {
        const map = initMap("profile-map", data.profile.latitude, data.profile.longitude)
        addMapMarker(map, data.profile.latitude, data.profile.longitude, data.profile.farmName || "Your Farm")
      }
    } else {
      // Initialize empty map
      initMap("profile-map")
    }
  } catch (error) {
    console.error("Error loading profile:", error)
  }

  // Set up form submission
  const form = document.getElementById("profile-form")
  if (form) {
    form.addEventListener("submit", handleProfileUpdate)
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const profileData = {
    userId: currentUser.id,
    farmName: formData.get("farmName"),
    contactInfo: formData.get("contactInfo"),
    bio: formData.get("bio"),
    latitude: Number.parseFloat(formData.get("latitude")) || null,
    longitude: Number.parseFloat(formData.get("longitude")) || null,
  }

  try {
    const response = await fetch("/api/farmer-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    })

    const data = await response.json()

    if (data.success) {
      alert("Profile updated successfully!")
    } else {
      alert(data.error || "Profile update failed")
    }
  } catch (error) {
    console.error("Profile update error:", error)
    alert("Profile update failed. Please try again.")
  }
}

// Admin functions
async function initAdminPage() {
  if (!currentUser || currentUser.role !== "admin") {
    window.location.href = "login.html"
    return
  }

  loadAllUsers()
  loadAllProducts()
}

async function loadAllUsers() {
  try {
    const response = await fetch("/api/admin/users")
    const users = await response.json()

    const usersContainer = document.getElementById("users-container")
    if (usersContainer) {
      usersContainer.innerHTML = users
        .map(
          (user) => `
                <div class="card">
                    <h3>${user.fullName}</h3>
                    <p>Email: ${user.email}</p>
                    <p>Role: ${user.role}</p>
                    <button class="btn btn-destructive" onclick="deleteUser(${user.id})">Delete User</button>
                </div>
            `,
        )
        .join("")
    }
  } catch (error) {
    console.error("Error loading users:", error)
  }
}

async function loadAllProducts() {
  try {
    const response = await fetch("/api/products")
    const products = await response.json()

    const productsContainer = document.getElementById("admin-products")
    if (productsContainer) {
      productsContainer.innerHTML = products
        .map(
          (product) => `
                <div class="card">
                    <h3>${product.name}</h3>
                    <p>Price: $${product.price}</p>
                    <p>Seller: ${product.sellerName}</p>
                    <button class="btn btn-destructive" onclick="deleteProductAdmin(${product.id})">Delete Product</button>
                </div>
            `,
        )
        .join("")
    }
  } catch (error) {
    console.error("Error loading products:", error)
  }
}

async function deleteUser(userId) {
  if (confirm("Are you sure you want to delete this user?")) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        alert("User deleted successfully")
        loadAllUsers()
      } else {
        alert(data.error || "Delete failed")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Delete failed. Please try again.")
    }
  }
}

async function deleteProductAdmin(productId) {
  if (confirm("Are you sure you want to delete this product?")) {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        alert("Product deleted successfully")
        loadAllProducts()
      } else {
        alert(data.error || "Delete failed")
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Delete failed. Please try again.")
    }
  }
}

// Utility functions
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString()
}

function formatCurrency(amount) {
  return `$${Number.parseFloat(amount).toFixed(2)}`
}

function refreshData() {
  if (currentUser && currentUser.role === "seller") {
    loadSellerStats()
    loadSellerProducts()
    loadWeather()
  }
}

async function loadAds() {
  console.log("[v0] Loading ads...")

  try {
    const response = await fetch("/api/ads")
    const ads = await response.json()

    console.log("[v0] Loaded ads:", ads)

    const adsContainer = document.getElementById("ads-container")
    if (adsContainer) {
      if (Array.isArray(ads) && ads.length > 0) {
        adsContainer.innerHTML = ads
          .map(
            (ad) => `
          <div class="ad-card">
            <h4>${ad.title}</h4>
            <p>${ad.description}</p>
            <a href="${ad.link}" target="_blank" class="btn btn-primary">Learn More</a>
          </div>
        `,
          )
          .join("")
      } else {
        adsContainer.innerHTML = `<div style="text-align: center; padding: 1rem; color: var(--muted-foreground);">No ads available</div>`
      }
    } else {
      console.log("[v0] Ads container not found")
    }
  } catch (error) {
    console.error("Error loading ads:", error)
    const adsContainer = document.getElementById("ads-container")
    if (adsContainer) {
      adsContainer.innerHTML = `<div style="text-align: center; padding: 1rem; color: var(--destructive);">Error loading ads</div>`
    }
  }
}
