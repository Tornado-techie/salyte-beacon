# 🌊 Salyte Beacon - AI for Safer Water

**AI-powered water safety monitoring platform supporting UN SDG 6: Clean Water and Sanitation**

Salyte Beacon is a comprehensive web platform that combines artificial intelligence, real-time data monitoring, and community engagement to improve water quality and safety globally. Built with modern web technologies and designed for scalability.

## 🚀 Features

### 🤖 AI Water Assistant
- Intelligent chatbot for water quality guidance
- Real-time answers about pH, TDS, turbidity, contamination
- Source citations and confidence scoring
- File upload for water test result analysis

### 🗺️ Interactive Cartomap
- Real-time water quality visualization
- Contaminated areas and safe boreholes mapping
- Active water projects tracking
- Community-contributed data points

### 🛒 Sensor Marketplace
- Curated water testing equipment
- pH meters, TDS testers, turbidity sensors
- Vendor integration (Amazon, Jumia)
- Price comparison and specifications

### 📚 Knowledge Hub
- Comprehensive water safety guides
- FAQ section with search functionality
- Offline content saving capability
- Educational resources library

### 📊 Data Dashboard
- Water quality trend visualization
- Real-time monitoring charts
- CSV data upload and analysis
- Statistical insights and alerts

### 📝 Community Reporting
- Incident reporting system
- Geotagged water quality reports
- Photo upload capabilities
- Community engagement features

## 🏗️ Project Structure

```
salyte-beacon/
├── frontend/                 # Frontend application files
│   ├── index.html           # Homepage
│   ├── index.css            # Homepage styles
│   ├── index.js             # Homepage functionality
│   ├── login.html           # Login page
│   ├── login.css            # Login styles
│   ├── login.js             # Login functionality
│   ├── signup.html          # Registration page
│   ├── signup.css           # Registration styles
│   ├── signup.js            # Registration functionality
│   ├── ai.html              # AI Assistant page
│   ├── ai.css               # AI Assistant styles
│   ├── ai.js                # AI Assistant functionality
│   ├── cartomap.html        # Interactive map page
│   ├── cartomap.css         # Map styles
│   ├── cartomap.js          # Map functionality
│   ├── marketplace.html     # Sensor marketplace
│   ├── marketplace.css      # Marketplace styles
│   ├── marketplace.js       # Marketplace functionality
│   ├── knowledge.html       # Knowledge hub
│   ├── knowledge.css        # Knowledge hub styles
│   ├── knowledge.js         # Knowledge hub functionality
│   ├── dashboard.html       # Data dashboard
│   ├── dashboard.css        # Dashboard styles
│   ├── dashboard.js         # Dashboard functionality
│   ├── report.html          # Community reporting
│   ├── report.css           # Reporting styles
│   ├── report.js            # Reporting functionality
│   └── assets/              # Static assets
│       ├── images/          # Image files
│       ├── icons/           # Icon files
│       └── data/            # Static data files
├── backend/                 # Backend server files
│   ├── server.js            # Main server file
│   ├── config/              # Configuration files
│   │   └── db.js            # Database configuration
│   ├── models/              # Database models
│   │   ├── User.js          # User model
│   │   ├── Report.js        # Report model
│   │   ├── Sensor.js        # Sensor model
│   │   └── DataPoint.js     # Data point model
│   ├── routes/              # API route handlers
│   │   ├── auth.js          # Authentication routes
│   │   ├── chat.js          # AI chat routes
│   │   ├── sensors.js       # Sensor marketplace routes
│   │   ├── map.js           # Map data routes
│   │   ├── dashboard.js     # Dashboard data routes
│   │   └── report.js        # Community reporting routes
│   └── middleware/          # Express middleware
│       ├── auth.js          # Authentication middleware
│       └── rateLimiter.js   # Rate limiting middleware
├── package.json             # Project dependencies
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
└── README.md               # Project documentation
```

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with Bootstrap 5
- **JavaScript (ES6+)** - Interactive functionality
- **Bootstrap 5** - Responsive UI framework
- **Font Awesome** - Icon library
- **Chart.js** - Data visualization
- **Leaflet.js** - Interactive maps

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

### External Services
- **MongoDB Atlas** - Cloud database (optional)
- **AWS S3** - File storage (optional)
- **SendGrid** - Email services (optional)
- **Google Maps API** - Enhanced mapping (optional)

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ installed
- MongoDB installed locally or MongoDB Atlas account
- VS Code (recommended) or any code editor

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/salyte-beacon.git
   cd salyte-beacon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # If using MongoDB Atlas, update the connection string in .env
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:3000/api/docs
   - Health Check: http://localhost:3000/api/health

### Development Mode

For development with auto-restart:
```bash
npm install -g nodemon
npm run dev
```

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/check-email` - Email availability check
- `POST /api/auth/forgot-password` - Password reset request

### AI Chat Endpoints
- `POST /api/chat` - Send message to AI assistant
- `GET /api/chat/history` - Get chat history
- `DELETE /api/chat/:id` - Delete chat session

### Sensor Marketplace Endpoints
- `GET /api/sensors` - Get sensor marketplace data
- `GET /api/sensors/:id` - Get specific sensor details
- `GET /api/sensors/search` - Search sensors

### Map Data Endpoints
- `GET /api/map/data` - Get GeoJSON map data
- `GET /api/map/layers` - Get available map layers
- `POST /api/map/report` - Report water quality data point

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/trends` - Get trend data
- `POST /api/dashboard/upload` - Upload CSV data

### Community Reporting Endpoints
- `GET /api/report` - Get community reports
- `POST /api/report` - Submit new report
- `GET /api/report/:id` - Get specific report

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/salyte-beacon

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# API Keys (Optional)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
SENDGRID_API_KEY=your-sendgrid-api-key
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket-name

# External API Configuration
OPENAI_API_KEY=your-openai-api-key (for enhanced AI features)
WEATHER_API_KEY=your-weather-api-key (for weather integration)
```

## 🚀 Deployment

### Local Development
```bash
npm start
```

### Production Deployment

#### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start backend/server.js --name "salyte-beacon"
pm2 save
pm2 startup
```

#### Using Docker
```dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t salyte-beacon .
docker run -p 3000:3000 salyte-beacon
```

#### Cloud Deployment
- **Heroku**: Connect GitHub repository and deploy
- **AWS**: Use Elastic Beanstalk or EC2
- **DigitalOcean**: Use App Platform or Droplets
- **Vercel/Netlify**: For frontend-only deployment

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Manual Testing
1. Register a new account at `/signup`
2. Login at `/login`
3. Test AI Assistant at `/ai`
4. Explore interactive map at `/cartomap`
5. Browse sensors at `/marketplace`
6. View knowledge hub at `/knowledge`
7. Check dashboard at `/dashboard`
8. Submit report at `/report`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style
- Use ESLint and Prettier
- Follow JavaScript Standard Style
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for API changes

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Security headers middleware
- SQL injection prevention
- XSS protection

## 🌍 SDG 6 Alignment

Salyte Beacon directly supports UN Sustainable Development Goal 6:

- **6.1**: Universal access to safe and affordable drinking water
- **6.2**: Access to adequate sanitation and hygiene
- **6.3**: Water quality improvement and wastewater treatment
- **6.4**: Water-use efficiency and sustainable withdrawals
- **6.5**: Integrated water resources management
- **6.6**: Water-related ecosystems protection

## 📊 Performance

### Metrics
- Page load time: <2 seconds
- API response time: <200ms
- Database query time: <50ms
- Mobile-responsive design
- Progressive Web App features

### Optimization
- Image compression and lazy loading
- CSS and JavaScript minification
- CDN integration for static assets
- Database indexing
- Caching strategies

## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
Error: connect ECONNREFUSED 127.0.0.1:27017
```
Solution: Ensure MongoDB is running locally or check connection string.

**Authentication Fails**
```bash
Error: Invalid token
```
Solution: Clear browser storage and login again.

**API Rate Limit Exceeded**
```bash
Error: Too many requests
```
Solution: Wait for rate limit reset or upgrade account.

### Support
- Create an issue on GitHub
- Email: support@salytebeacon.org
- Documentation: [Project Wiki]

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- WHO Guidelines for Drinking-water Quality
- UN Sustainable Development Goals framework
- Open source water quality datasets
- Community contributors and testers
- Environmental monitoring organizations

## 📞 Contact

- **Website**: https://salytebeacon.org
- **Email**: info@salytebeacon.org
- **Twitter**: @SalyteBeacon
- **LinkedIn**: Salyte Beacon

---

**Built with 💙 for cleaner, safer water worldwide**