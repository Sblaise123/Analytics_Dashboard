# Analytics_Dashboard
# 📊 Analytics Dashboard

A modern, full-stack analytics dashboard built with **FastAPI** and **React** featuring real-time data visualization, role-based access control, and comprehensive reporting capabilities.

![Dashboard Preview](https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=Analytics+Dashboard+Preview)

## ✨ Features

- 🔐 **JWT Authentication** with role-based access control
- 📈 **Interactive Charts** (Line, Bar, Pie) with real-time data
- 📱 **Responsive Design** optimized for desktop and mobile
- 👥 **Multi-Role Support** (Admin, Manager, Analyst, Viewer)
- 📊 **Export Capabilities** (JSON, CSV, Excel)
- 🎨 **Modern UI** built with Tailwind CSS
- 🚀 **Fast Performance** with optimized API endpoints

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **JWT** - Secure authentication
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### Frontend  
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide React** - Beautiful icons
- **Vite** - Fast build tool

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd analytics-dashboard
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

Backend runs at: `http://localhost:8000`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:3000`

## 🔑 Demo Accounts

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| admin@example.com | `secret` | Admin | Full system access + user management |
| manager@example.com | `secret` | Manager | Analytics + report exports |
| analyst@example.com | `secret` | Analyst | Dashboard + detailed analytics |
| viewer@example.com | `secret` | Viewer | Basic dashboard view only |

## 📁 Project Structure

```
analytics-dashboard/
├── backend/
│   ├── main.py              # FastAPI application
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # Main React component
│   │   ├── index.css       # Tailwind CSS imports
│   │   └── main.tsx        # React entry point
│   ├── package.json        # Node.js dependencies
│   ├── vite.config.ts      # Vite configuration
│   └── tailwind.config.js  # Tailwind configuration
└── README.md
```

## 📊 Dashboard Features

### Core Metrics
- **Total Revenue** - Monthly revenue with growth indicators
- **Active Users** - Current user engagement metrics  
- **Conversion Rate** - Sales performance tracking
- **Average Order Value** - Customer spending analysis

### Data Visualizations
- **Revenue Trends** - 30-day line chart showing daily revenue
- **Sales by Category** - Bar chart of product category performance
- **User Demographics** - Pie chart of user age distribution

### Role-Based Access
- **Viewers** 👁️ - Basic dashboard access
- **Analysts** 📊 - Dashboard + detailed analytics
- **Managers** 📈 - All analytics + report exports  
- **Admins** ⚙️ - Full access + user management

## 🔌 API Documentation

### Authentication Endpoints
```
POST /api/v1/auth/login      # User login
POST /api/v1/auth/register   # User registration  
GET  /api/v1/auth/me         # Get current user info
```

### Dashboard Endpoints
```
GET /api/v1/dashboard              # Basic dashboard data
GET /api/v1/analytics/detailed     # Detailed analytics (Analyst+)
POST /api/v1/reports/export        # Export reports (Manager+)
GET /api/v1/admin/users           # User management (Admin only)
```

### Response Examples

**Dashboard Data:**
```json
{
  "metrics": [
    {
      "name": "Total Revenue",
      "value": 125000,
      "change": 12.5,
      "change_type": "increase"
    }
  ],
  "charts": [
    {
      "title": "Daily Revenue",
      "type": "line",
      "data": [{"date": "2024-01-01", "value": 4500}]
    }
  ]
}
```

## 🐳 Docker Deployment

### Build and Run with Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - SECRET_KEY=your-production-secret-key
  
  frontend:
    build: ./frontend  
    ports:
      - "3000:80"
    depends_on:
      - backend
```

```bash
docker-compose up --build
```

## 🔧 Development

### Backend Development
```bash
cd backend

# Install development dependencies
pip install pytest httpx

# Run tests
pytest

# Format code
black main.py

# Start with auto-reload
uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

## 🛡️ Security Features

- **JWT Tokens** - Secure authentication with expiration
- **Password Hashing** - bcrypt encryption for user passwords
- **CORS Protection** - Configured for frontend domain
- **Input Validation** - Pydantic schemas for API validation
- **Role-Based Permissions** - Granular access control

## 🚨 Troubleshooting

### Common Issues

**Backend won't start:**
- Verify Python 3.8+ is installed
- Check if port 8000 is available
- Ensure all dependencies are installed

**Frontend won't connect:**
- Confirm backend is running on port 8000
- Check CORS settings in FastAPI
- Verify API base URL in frontend code

**Charts not displaying:**
- Ensure Recharts is properly installed
- Check browser console for JavaScript errors
- Verify data format matches chart expectations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔮 Roadmap

- [ ] **Database Integration** - PostgreSQL/MongoDB support
- [ ] **Real-time Updates** - WebSocket implementation
- [ ] **Advanced Analytics** - Machine learning insights
- [ ] **Export Formats** - PDF and Excel reports
- [ ] **Data Filters** - Custom date ranges and filtering
- [ ] **User Management** - Admin panel for user CRUD operations
- [ ] **API Rate Limiting** - Request throttling and quotas
- [ ] **Audit Logging** - Track user actions and changes

## 📞 Support

- 📧 **Email**: your-email@example.com
- 💬 **Issues**: [GitHub Issues](https://github.com/username/analytics-dashboard/issues)
- 📖 **Documentation**: [Wiki](https://github.com/username/analytics-dashboard/wiki)

---

<div align="center">

**Built with ❤️ using FastAPI and React**

[⭐ Star this repo](https://github.com/username/analytics-dashboard) • [🐛 Report Bug](https://github.com/username/analytics-dashboard/issues) • [✨ Request Feature](https://github.com/username/analytics-dashboard/issues)

</div>