const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const path = require("path")
const fs = require("fs")
const cors = require("cors")

const app = express()
const PORT = 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "../frontend")))

// Initialize database
const dbPath = path.join(__dirname, "database.db")
const db = new sqlite3.Database(dbPath)

// Initialize database schema
const schemaPath = path.join(__dirname, "schema.sql")
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, "utf8")

  db.serialize(() => {
    // First, try to add missing columns if they don't exist
    db.run("ALTER TABLE users ADD COLUMN phoneNumber TEXT", (err) => {
      // Ignore error if column already exists
    })

    db.run("ALTER TABLE users ADD COLUMN shopLocation TEXT", (err) => {
      // Ignore error if column already exists
    })

    // Now run the main schema (this will handle table creation and data insertion)
    db.exec(schema, (err) => {
      if (err) {
        console.error("Error initializing database:", err)
      } else {
        console.log("Database initialized successfully")
      }
    })
  })
} else {
  console.error("Schema file not found")
}

// Authentication endpoints
app.post("/api/auth/signup", (req, res) => {
  const { fullName, email, password, role, phoneNumber, shopLocation } = req.body

  if (!fullName || !email || !password || !role || !phoneNumber) {
    return res.status(400).json({ error: "All required fields must be filled" })
  }

  const stmt = db.prepare(
    "INSERT INTO users (fullName, email, password, role, phoneNumber, shopLocation) VALUES (?, ?, ?, ?, ?, ?)",
  )
  stmt.run([fullName, email, password, role, phoneNumber, shopLocation], function (err) {
    if (err) {
      if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return res.status(400).json({ error: "Email already exists" })
      }
      return res.status(500).json({ error: "Database error" })
    }
    res.json({
      success: true,
      userId: this.lastID,
      message: "User created successfully",
    })
  })
  stmt.finalize()
})

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" })
  }

  db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, password], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        shopLocation: user.shopLocation,
      },
    })
  })
})

// User profile endpoints
app.get("/api/users/:id", (req, res) => {
  const userId = req.params.id

  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Get farmer profile if user is a seller
    if (user.role === "seller") {
      db.get("SELECT * FROM farmer_profiles WHERE userId = ?", [userId], (err, profile) => {
        if (err) {
          return res.status(500).json({ error: "Database error" })
        }
        res.json({
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            shopLocation: user.shopLocation,
          },
          profile: profile || null,
        })
      })
    } else {
      res.json({
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber,
          shopLocation: user.shopLocation,
        },
        profile: null,
      })
    }
  })
})

// Farmer profile endpoints
app.post("/api/farmer-profile", (req, res) => {
  const { userId, farmName, contactInfo, bio, latitude, longitude } = req.body

  const stmt = db.prepare(`
        INSERT OR REPLACE INTO farmer_profiles 
        (userId, farmName, contactInfo, bio, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?)
    `)

  stmt.run([userId, farmName, contactInfo, bio, latitude, longitude], (err) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    res.json({ success: true, message: "Profile updated successfully" })
  })
  stmt.finalize()
})

// Products endpoints
app.get("/api/products", (req, res) => {
  const query = `
        SELECT p.*, u.fullName as sellerName, u.phoneNumber as sellerPhone, fp.farmName, fp.contactInfo
        FROM products p
        JOIN users u ON p.sellerId = u.id
        LEFT JOIN farmer_profiles fp ON u.id = fp.userId
        ORDER BY p.id DESC
    `

  db.all(query, [], (err, products) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    res.json(products)
  })
})

app.get("/api/products/:id", (req, res) => {
  const productId = req.params.id

  const query = `
        SELECT p.*, u.fullName as sellerName, u.email as sellerEmail, u.phoneNumber as sellerPhone,
               fp.farmName, fp.contactInfo, fp.bio
        FROM products p
        JOIN users u ON p.sellerId = u.id
        LEFT JOIN farmer_profiles fp ON u.id = fp.userId
        WHERE p.id = ?
    `

  db.get(query, [productId], (err, product) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }
    res.json(product)
  })
})

app.post("/api/products", (req, res) => {
  const { name, description, price, sellerId, latitude, longitude } = req.body

  if (!name || !price || !sellerId) {
    return res.status(400).json({ error: "Name, price, and seller ID are required" })
  }

  const stmt = db.prepare(`
        INSERT INTO products (name, description, price, sellerId, latitude, longitude) 
        VALUES (?, ?, ?, ?, ?, ?)
    `)

  stmt.run([name, description, price, sellerId, latitude, longitude], function (err) {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    res.json({
      success: true,
      productId: this.lastID,
      message: "Product added successfully",
    })
  })
  stmt.finalize()
})

app.put("/api/products/:id", (req, res) => {
  const productId = req.params.id
  const { name, description, price, sellerId, latitude, longitude } = req.body

  if (!name || !price || !sellerId) {
    return res.status(400).json({ error: "Name, price, and seller ID are required" })
  }

  const stmt = db.prepare(`
        UPDATE products 
        SET name = ?, description = ?, price = ?, latitude = ?, longitude = ?
        WHERE id = ? AND sellerId = ?
    `)

  stmt.run([name, description, price, latitude, longitude, productId, sellerId], function (err) {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Product not found or unauthorized" })
    }
    res.json({
      success: true,
      message: "Product updated successfully",
    })
  })
  stmt.finalize()
})

app.get("/api/products/seller/:sellerId", (req, res) => {
  const sellerId = req.params.sellerId

  db.all("SELECT * FROM products WHERE sellerId = ? ORDER BY id DESC", [sellerId], (err, products) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    res.json(products)
  })
})

// Orders endpoints
app.post("/api/orders", (req, res) => {
  const { buyerId, productId, orderType } = req.body

  if (!buyerId || !productId || !orderType) {
    return res.status(400).json({ error: "All fields are required" })
  }

  const stmt = db.prepare(`
        INSERT INTO orders (buyerId, productId, orderType) 
        VALUES (?, ?, ?)
    `)

  stmt.run([buyerId, productId, orderType], function (err) {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    res.json({
      success: true,
      orderId: this.lastID,
      message: "Order placed successfully",
    })
  })
  stmt.finalize()
})

app.get("/api/orders/buyer/:buyerId", (req, res) => {
  const buyerId = req.params.buyerId

  const query = `
        SELECT o.*, p.name as productName, p.price, u.fullName as sellerName
        FROM orders o
        JOIN products p ON o.productId = p.id
        JOIN users u ON p.sellerId = u.id
        WHERE o.buyerId = ?
        ORDER BY o.createdAt DESC
    `

  db.all(query, [buyerId], (err, orders) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    res.json(orders)
  })
})

app.get("/api/orders/seller/:sellerId", (req, res) => {
  const sellerId = req.params.sellerId

  const query = `
        SELECT o.*, p.name as productName, p.price, u.fullName as buyerName
        FROM orders o
        JOIN products p ON o.productId = p.id
        JOIN users u ON o.buyerId = u.id
        WHERE p.sellerId = ?
        ORDER BY o.createdAt DESC
    `

  db.all(query, [sellerId], (err, orders) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    res.json(orders)
  })
})

// Ads endpoints
app.get("/api/ads", (req, res) => {
  db.all("SELECT * FROM ads ORDER BY id DESC", [], (err, ads) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    res.json(ads)
  })
})

// Admin endpoints
app.get("/api/admin/users", (req, res) => {
  db.all(
    "SELECT id, fullName, email, role, phoneNumber, shopLocation FROM users ORDER BY id DESC",
    [],
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: "Database error" })
      }
      res.json(users)
    },
  )
})

app.delete("/api/admin/users/:id", (req, res) => {
  const userId = req.params.id

  db.run("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    res.json({ success: true, message: "User deleted successfully" })
  })
})

app.delete("/api/admin/products/:id", (req, res) => {
  const productId = req.params.id

  db.run("DELETE FROM products WHERE id = ?", [productId], (err) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }
    res.json({ success: true, message: "Product deleted successfully" })
  })
})

// Stats endpoints
app.get("/api/stats/seller/:sellerId", (req, res) => {
  const sellerId = req.params.sellerId

  // Get product count
  db.get("SELECT COUNT(*) as productCount FROM products WHERE sellerId = ?", [sellerId], (err, productResult) => {
    if (err) {
      return res.status(500).json({ error: "Database error" })
    }

    // Get order count and total earnings
    const orderQuery = `
            SELECT COUNT(*) as orderCount, COALESCE(SUM(p.price), 0) as totalEarnings
            FROM orders o
            JOIN products p ON o.productId = p.id
            WHERE p.sellerId = ?
        `

    db.get(orderQuery, [sellerId], (err, orderResult) => {
      if (err) {
        return res.status(500).json({ error: "Database error" })
      }

      res.json({
        productCount: productResult.productCount,
        orderCount: orderResult.orderCount,
        totalEarnings: orderResult.totalEarnings,
      })
    })
  })
})

// Serve frontend files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"))
})

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"))
})

app.listen(PORT, () => {
  console.log(`FarmGrid server running on http://localhost:${PORT}`)
})
