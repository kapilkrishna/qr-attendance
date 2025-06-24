# Tennis Academy MVP - Deployment Guide

This guide covers deploying the Tennis Academy MVP to production environments.

## 🚀 Quick Deploy Options

### Option 1: Render.com (Recommended)

#### Backend Deployment
1. **Create Render Account**: Sign up at [render.com](https://render.com)
2. **Create New Web Service**:
   - Connect your GitHub repository
   - Select the `backend` directory as root
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://user:password@host:port/database
   SENDGRID_API_KEY=your_sendgrid_api_key
   FROM_EMAIL=noreply@yourdomain.com
   COACH_PASSWORD=your_secure_password
   ```
4. **Database**: Create a PostgreSQL database in Render

#### Frontend Deployment
1. **Create Static Site**:
   - Connect your GitHub repository
   - Select the root directory
   - Set build command: `npm install && npm run build`
   - Set publish directory: `dist`
2. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://your-backend-service.onrender.com/api
   ```

### Option 2: Heroku

#### Backend Deployment
1. **Install Heroku CLI**
2. **Create Heroku App**:
   ```bash
   heroku create your-tennis-academy-backend
   ```
3. **Add PostgreSQL**:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```
4. **Set Environment Variables**:
   ```bash
   heroku config:set SENDGRID_API_KEY=your_key
   heroku config:set FROM_EMAIL=noreply@yourdomain.com
   heroku config:set COACH_PASSWORD=your_secure_password
   ```
5. **Deploy**:
   ```bash
   cd backend
   git subtree push --prefix backend heroku main
   ```

#### Frontend Deployment
1. **Create Static Site**:
   ```bash
   heroku create your-tennis-academy-frontend
   ```
2. **Build and Deploy**:
   ```bash
   npm run build
   heroku static:deploy
   ```

### Option 3: Vercel + Railway

#### Backend (Railway)
1. **Create Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Deploy from GitHub**:
   - Connect repository
   - Select `backend` directory
   - Add PostgreSQL database
   - Set environment variables
3. **Get deployment URL**

#### Frontend (Vercel)
1. **Create Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Import Project**:
   - Connect GitHub repository
   - Set build command: `npm run build`
   - Set output directory: `dist`
3. **Environment Variables**:
   ```
   VITE_API_BASE_URL=https://your-railway-backend.railway.app/api
   ```

## 🔧 Production Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Security
COACH_PASSWORD=your_secure_password_here
SECRET_KEY=your_secret_key_here

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=https://your-frontend-domain.com
```

### Frontend Configuration

Update `src/pages/*.jsx` files to use environment variable:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

### Database Migration

For production database setup:

```bash
# Install Alembic
pip install alembic

# Initialize migrations
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Run migration
alembic upgrade head
```

## 📧 Email Setup

### SendGrid Configuration
1. **Create SendGrid Account**: Sign up at [sendgrid.com](https://sendgrid.com)
2. **Create API Key**:
   - Go to Settings → API Keys
   - Create new API key with "Mail Send" permissions
3. **Verify Sender**:
   - Go to Settings → Sender Authentication
   - Verify your domain or single sender
4. **Set Environment Variable**:
   ```
   SENDGRID_API_KEY=your_api_key_here
   ```

### Alternative Email Providers
- **Mailgun**: Similar setup to SendGrid
- **SMTP**: Use your own SMTP server
- **AWS SES**: For AWS users

## 🔒 Security Considerations

### Production Security Checklist
- [ ] Change default coach password
- [ ] Use HTTPS for all communications
- [ ] Set up proper CORS origins
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Use environment variables for secrets
- [ ] Set up monitoring and logging
- [ ] Regular security updates

### SSL/HTTPS Setup
- **Cloudflare**: Free SSL certificates
- **Let's Encrypt**: Free SSL certificates
- **Heroku**: Automatic SSL
- **Vercel**: Automatic SSL
- **Render**: Automatic SSL

## 📊 Monitoring & Analytics

### Backend Monitoring
- **Logging**: Use Python logging
- **Health Checks**: `/` endpoint
- **Error Tracking**: Sentry integration
- **Performance**: APM tools

### Frontend Monitoring
- **Error Tracking**: Sentry for React
- **Analytics**: Google Analytics
- **Performance**: Lighthouse CI

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Tennis Academy MVP

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.1
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Check CORS_ORIGINS environment variable
   - Ensure frontend URL is included

2. **Database Connection**:
   - Verify DATABASE_URL format
   - Check database credentials
   - Ensure database is accessible

3. **Email Not Sending**:
   - Verify SendGrid API key
   - Check sender email verification
   - Review SendGrid logs

4. **QR Code Issues**:
   - Check camera permissions
   - Verify HTTPS for camera access
   - Test on different devices

### Debug Commands

```bash
# Check backend logs
heroku logs --tail

# Check database connection
python -c "from app.database import engine; print(engine.execute('SELECT 1').scalar())"

# Test email service
python -c "from app.email_service import EmailService; EmailService().send_test_email()"
```

## 📈 Scaling Considerations

### Performance Optimization
- **Database Indexing**: Add indexes for frequent queries
- **Caching**: Implement Redis for session storage
- **CDN**: Use CDN for static assets
- **Load Balancing**: For high traffic

### Cost Optimization
- **Database**: Use appropriate tier
- **Email**: Monitor SendGrid usage
- **Hosting**: Choose right plan
- **Monitoring**: Set up alerts

## 🆘 Support

For deployment issues:
1. Check the troubleshooting section
2. Review platform-specific documentation
3. Create an issue in the repository
4. Contact the development team

## 📚 Additional Resources

- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)
- [PostgreSQL Setup](https://www.postgresql.org/docs/)
- [SendGrid Documentation](https://sendgrid.com/docs/) 