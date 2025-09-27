# FarmGrid - Local Farm Marketplace

FarmGrid is a full-stack web application that connects local farmers with buyers, featuring an integrated marketplace, premium logistics service, and hub network for offline support.

## Features

### 🌱 Core Features
- **FarmGrid Marketplace**: Free platform for farmers to list produce
- **FarmGrid+ Logistics**: Premium delivery service with pay-per-delivery model
- **FarmGrid Hubs**: Local shops acting as intermediaries for non-digital farmers
- **Interactive Maps**: Leaflet.js integration showing farm locations
- **Weather Integration**: Local weather forecasts for farmers and buyers
- **Sponsored Ads**: Revenue generation through targeted advertisements

### 👥 User Roles
- **Buyers**: Browse products, view farm locations, choose pickup or delivery
- **Sellers/Farmers**: List products, manage farm profiles, track earnings
- **Admin**: Platform management, user/product moderation, ads management

### 🔐 Authentication
- Role-based signup and login system
- Admin access with hardcoded credentials (admin/admin123)
- Secure session management with localStorage

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite3** database for data persistence
- **CORS** enabled for cross-origin requests
- RESTful API design

### Frontend
- **Vanilla HTML, CSS, JavaScript** (no frameworks)
- **Leaflet.js** for interactive maps
- **OpenStreetMap** tiles for map data
- **Responsive design** with mobile-first approach

### Database Schema
- Users (buyers, sellers, admins)
- Farmer profiles with location data
- Products with geographic coordinates
- Orders with purchase type tracking
- Sponsored advertisements

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm package manager

### Backend Setup

cd backend

npm install

npm start


The server will start on `http://localhost:3000`

### Frontend Access
Open your browser and navigate to `http://localhost:3000`

The frontend files are served statically by the Express server.

Project Structure

/farmgrid
├── backend/
│   ├── server.js          # Main Express server file
│   ├── schema.sql         # SQL schema for database setup
│   ├── database.db        # SQLite database file (auto-created)
│   └── package.json       # Backend dependencies (Node.js)
│
└── frontend/
    ├── index.html         # Main landing page
    ├── login.html         # User login page
    ├── signup.html        # User registration page
    ├── buyer-home.html    # Dashboard for buyers
    ├── seller-home.html   # Dashboard for sellers (farmers)
    ├── farmer-profile.html# Page for managing farmer profiles
    ├── product-detail.html# View details of a specific product
    ├── admin.html         # Admin panel for platform management
    ├── style.css          # Global CSS stylesheets
    └── script.js          # Global JavaScript for client-side logic
## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Users & Profiles
- `GET /api/users/:id` - Get user profile
- `POST /api/farmer-profile` - Update farmer profile

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Add new product
- `GET /api/products/seller/:sellerId` - Get seller's products

### Orders
- `POST /api/orders` - Place order
- `GET /api/orders/buyer/:buyerId` - Get buyer's orders
- `GET /api/orders/seller/:sellerId` - Get seller's orders

### Admin
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/:id` - Delete user
- `DELETE /api/admin/products/:id` - Delete product

### Statistics
- `GET /api/stats/seller/:sellerId` - Get seller statistics

### Advertisements
- `GET /api/ads` - Get all ads

## Usage Guide

### For Buyers
1. Sign up with buyer role
2. Browse products on the marketplace
3. Click products to view details and farm location
4. Choose between direct purchase or FarmGrid+ delivery

### For Farmers/Sellers
1. Sign up with seller role
2. Complete your farmer profile with farm location
3. Add products with descriptions and prices
4. Track your sales and earnings on the dashboard

### For Administrators
1. Login with admin credentials (admin/admin123)
2. Manage users and products
3. Monitor platform statistics
4. Manage sponsored advertisements

## Design Features

### Visual Design
- Dark theme with green accent colors
- Professional card-based layouts
- Responsive grid systems
- Interactive hover effects
- Loading states and animations

### User Experience
- Intuitive navigation
- Real-time search and filtering
- Interactive maps for location selection
- Weather widgets for contextual information
- Mobile-responsive design

## Business Model

### Revenue Streams
1. **Fixed delivery fees** for FarmGrid+ logistics service
2. **Sponsored advertisements** displayed across all pages
3. **Hub commission** from partner shops managing offline farmers

### Value Proposition
- **For Farmers**: Direct access to local customers, premium delivery options
- **For Buyers**: Fresh local produce, transparent farm locations, convenient delivery
- **For Hubs**: Additional revenue stream helping local farmers

## Development Notes

### Security Considerations
- Input validation on all forms
- SQL injection prevention with parameterized queries
- XSS protection through proper data handling
- Admin route protection

### Performance Optimizations
- Efficient database queries with proper indexing
- Lazy loading of map components
- Debounced search functionality
- Optimized image handling

### Scalability Features
- Modular code architecture
- RESTful API design
- Database normalization
- Responsive frontend design

## Contributing

This is an open-source project. Contributions are welcome!

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Open source - feel free to use and modify for your projects.

## Support

For issues or questions, please create an issue in the project repository.

---

**FarmGrid** - Connecting local farmers and buyers for a sustainable food future! 🌱
