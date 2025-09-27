-- FarmGrid Database Schema
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('buyer', 'seller', 'admin')),
    phoneNumber TEXT NOT NULL,
    shopLocation TEXT
);

CREATE TABLE IF NOT EXISTS farmer_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    farmName TEXT,
    contactInfo TEXT,
    bio TEXT,
    latitude REAL,
    longitude REAL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    sellerId INTEGER NOT NULL,
    latitude REAL,
    longitude REAL,
    FOREIGN KEY (sellerId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyerId INTEGER NOT NULL,
    productId INTEGER NOT NULL,
    orderType TEXT NOT NULL CHECK(orderType IN ('in_person', 'farmgrid_plus')),
    status TEXT DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyerId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    businessName TEXT NOT NULL,
    content TEXT NOT NULL,
    link TEXT
);

-- Insert default admin user
INSERT OR IGNORE INTO users (fullName, email, password, role, phoneNumber, shopLocation) 
VALUES ('Admin User', 'admin@farmgrid.com', 'admin123', 'admin', '+1-555-0000', 'FarmGrid HQ');

-- Insert sample ads with specific IDs to prevent duplication
INSERT OR IGNORE INTO ads (id, businessName, content, link) 
VALUES 
(1, 'Green Valley Seeds', 'Premium organic seeds for your farm - 20% off first order!', 'https://greenvalleyseeds.com'),
(2, 'Farm Equipment Co', 'Quality tractors and farming equipment - financing available', 'https://farmequipment.com'),
(3, 'Organic Fertilizers', 'Natural fertilizers that boost crop yield sustainably', 'https://organicfert.com');
