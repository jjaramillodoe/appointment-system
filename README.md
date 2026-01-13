# NYC DOE District 79 Adult Education Appointment System

A comprehensive web-based appointment management system designed specifically for NYC DOE District 79 Adult Education programs. This system streamlines the intake process for adult learners, providing an efficient way to schedule, manage, and track appointments across multiple learning centers.

## 🏛️ Project Information

- **Organization**: NYC Department of Education (DOE)
- **District**: District 79 - Adult Education
- **Project Type**: Web Application
- **Technology Stack**: Next.js 16.0.10, TypeScript, MongoDB, Tailwind CSS
- **Deployment**: Vercel (Production), Local Development

## 👨‍💻 Development Team

- **Main Developer**: Javier Jaramillo - Data Systems Administrator
- **Organization**: NYC DOE District 79
- **Contact**: [Contact information for internal use]

## 🎯 Project Overview

The NYC DOE District 79 Adult Education Appointment System is designed to modernize and streamline the adult education intake process. The system serves multiple learning centers across New York City, providing a centralized platform for appointment scheduling, management, and reporting.

### Key Features

- **Student Portal**: Easy appointment scheduling and confirmation
- **Admin Dashboard**: Comprehensive management and analytics
- **Multi-Hub Support**: Manage appointments across multiple learning centers
- **Real-time Notifications**: SMS and in-app notifications
- **Reporting System**: Detailed analytics and reporting capabilities
- **Mobile Responsive**: Works seamlessly on all devices
- **Geolocation**: Find nearest learning centers using Mapbox integration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB 6.0+ (local) or MongoDB Atlas (production)
- npm or yarn package manager

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd appointment-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/appointment-system
   
   # JWT Secret
   JWT_SECRET=your-secret-key-here
   
   # Mapbox (for geocoding)
   NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
   
   # SMS Service (Twilio)
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_PHONE_NUMBER=your-twilio-phone
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Student Portal: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin/dashboard

## 🗄️ Database Migration to Production

### Prerequisites

1. **Production MongoDB** (MongoDB Atlas recommended)
2. **Environment variables** configured for production

### Migration Process

1. **Create production environment file**
   ```bash
   cp env.production.template .env.production
   # Edit with your production credentials
   ```

2. **Backup local database**
   ```bash
   npm run db:backup
   ```

3. **Run migration**
   ```bash
   # Quick migration (recommended)
   npm run migrate:quick
   
   # Or manual migration
   npm run migrate:to-production
   ```

4. **Verify migration**
   ```bash
   npm run migrate:verify
   ```

### Available Migration Commands

- `npm run migrate:quick` - Automated migration process
- `npm run migrate:to-production` - Manual migration
- `npm run migrate:verify` - Verify migration success
- `npm run db:backup` - Backup local database
- `npm run db:restore` - Restore from backup

## 🚀 Production Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # Deploy preview version
   npm run deploy:vercel
   
   # Deploy to production
   npm run deploy:vercel:prod
   ```

### Environment Variables in Vercel

Set these in your Vercel dashboard:
- `MONGODB_URI` - Production MongoDB connection string
- `JWT_SECRET` - Secure JWT secret
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox access token
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number

### Vercel Benefits

- ✅ **Global CDN** - Fast loading worldwide
- ✅ **SSL/TLS certificates** - Automatic HTTPS
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **Preview deployments** - Test before production
- ✅ **Analytics** - Performance monitoring
- ✅ **Edge functions** - Serverless API endpoints

## 📁 Project Structure

```
appointment-system/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── admin/         # Admin API endpoints
│   │   ├── appointments/  # Appointment management
│   │   ├── auth/          # Authentication
│   │   └── health/        # Health checks
│   ├── admin/             # Admin dashboard pages
│   ├── dashboard/         # Student dashboard
│   ├── login/             # Authentication pages
│   └── register/          # Registration pages
├── components/            # Reusable React components
│   ├── admin/             # Admin-specific components
│   ├── dashboard/         # Dashboard components
│   └── ui/                # Common UI components
├── lib/                   # Utility libraries
│   ├── mongodb.ts         # Database connection
│   ├── redis.ts           # Redis connection
│   └── availabilityService.ts
├── models/                # MongoDB models
├── scripts/               # Production scripts
│   ├── migrateToProduction.ts
│   ├── backup.sh
│   ├── quick-migrate.sh
│   └── deploy-vercel.sh
├── utils/                 # Helper functions
└── public/                # Static assets
```

## 🛠️ Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Management
- `npm run migrate:quick` - Quick migration to production
- `npm run migrate:to-production` - Manual migration
- `npm run migrate:verify` - Verify migration
- `npm run db:backup` - Backup local database
- `npm run db:restore` - Restore from backup

### Deployment
- `npm run deploy:vercel` - Deploy to Vercel (preview)
- `npm run deploy:vercel:prod` - Deploy to Vercel (production)

## 🔧 Configuration

### Next.js Configuration
- **Framework**: Next.js 16.0.10 with App Router
- **TypeScript**: Full TypeScript support
- **Styling**: Tailwind CSS with custom components
- **Security**: Built-in security headers and CORS protection

### Database Configuration
- **Primary**: MongoDB with Mongoose ODM
- **Caching**: Redis (optional)
- **Connection**: Optimized connection pooling
- **Models**: Structured data models with validation

### Security Features
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Data Validation**: Zod schema validation
- **Rate Limiting**: API rate limiting
- **Security Headers**: XSS protection, CSRF protection

## 📊 Data Models

### Core Entities
- **Users**: Students and administrators
- **Hubs**: Learning centers and locations
- **Appointments**: Scheduled sessions
- **Availability**: Time slots and schedules
- **Notifications**: System alerts and reminders
- **Reports**: Analytics and reporting data

### Database Collections
- `users` - User accounts and profiles
- `hubs` - Learning center information
- `appointments` - Appointment records
- `appointmentoptimizeds` - Optimized appointment data
- `appointmentslots` - Available time slots
- `hubconfigs` - Hub configuration settings
- `availabilities` - Availability schedules
- `notifications` - System notifications
- `reports` - Generated reports

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**
   - Verify MongoDB is running
   - Check connection string format
   - Ensure network connectivity

2. **Migration Issues**
   - Backup before migration
   - Check environment variables
   - Verify production database access

3. **Deployment Issues**
   - Check build logs in Vercel
   - Verify environment variables
   - Check function logs

### Support Commands

```bash
# Check application health
curl http://localhost:3000/api/health

# View Vercel logs
vercel logs

# Check database connection
npm run migrate:verify
```

## 📈 Performance & Monitoring

### Built-in Monitoring
- **Vercel Analytics**: Page views and performance
- **Speed Insights**: Core Web Vitals
- **Function Logs**: API performance monitoring
- **Health Checks**: System status monitoring

### Optimization Features
- **Image Optimization**: Automatic image compression
- **Code Splitting**: Dynamic imports for better performance
- **Caching**: Strategic caching strategies
- **CDN**: Global content delivery network

## 🔄 Maintenance & Updates

### Regular Tasks
- **Database Backups**: Automated backup scripts
- **Performance Monitoring**: Regular performance checks
- **Security Updates**: Keep dependencies updated
- **Data Validation**: Regular data integrity checks

### Update Process
```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Test locally
npm run dev

# Deploy to production
npm run deploy:vercel:prod
```

## 📞 Support & Resources

### Documentation
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB**: [docs.mongodb.com](https://docs.mongodb.com)

### Community
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Next.js Community**: [github.com/vercel/next.js/discussions](https://github.com/vercel/next.js/discussions)

## 📄 License

This project is developed for NYC DOE District 79 Adult Education programs. All rights reserved.

---

**Last Updated**: August 2025  
**Version**: 1.0.0  
**Status**: Production Ready 🚀 