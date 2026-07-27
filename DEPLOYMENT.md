# Healthcare Referral System - Deployment Guide

This guide will help you deploy the Healthcare Referral System to production using Vercel (frontend) and Render (backend).

## Prerequisites

- GitHub repository with the code
- MongoDB Atlas account (free tier available)
- Email service account (Gmail or SendGrid) for verification codes
- Vercel account (free tier available)
- Render account (free tier available)

## Backend Deployment (Render)

### 1. Deploy MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password

### 2. Deploy Backend to Render

1. Go to [Render](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: healthcare-referral-api
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`

5. Add Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://your-connection-string
   JWT_SECRET=generate-a-strong-secret-key
   PORT=10000
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=noreply@healthcare-referral.com
   ```

6. Click "Deploy Web Service"
7. Wait for deployment to complete
8. Copy the deployed URL (e.g., `https://healthcare-referral-api.onrender.com`)

### 3. Email Service Setup

**Option A: Gmail**
1. Enable 2-factor authentication on your Google account
2. Go to Google Account → Security → App Passwords
3. Generate an app password for "Mail"
4. Use the app password as `EMAIL_PASSWORD`

**Option B: SendGrid**
1. Create a SendGrid account
2. Generate an API key
3. Set `EMAIL_SERVICE=sendgrid` and use the API key as `SENDGRID_API_KEY`

## Frontend Deployment (Vercel)

### 1. Deploy Frontend to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variable:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

6. Click "Deploy"
7. Wait for deployment to complete
8. Copy the deployed URL (e.g., `https://healthcare-referral.vercel.app`)

### 2. Update Backend CORS

Go back to Render and update the `ALLOWED_ORIGINS` environment variable to include your Vercel frontend URL:
```
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

## Post-Deployment Setup

### 1. Create First User

Since we removed default test users, you'll need to create your first account:

1. Navigate to your deployed frontend
2. Click "Sign Up"
3. Fill in your details
4. Choose your role (admin recommended for first user)

### 2. Verify Email Functionality

1. Test the password reset feature
2. Check that verification codes are sent to your email
3. If emails aren't working, check the Render logs

### 3. Monitor Deployments

- **Render**: Check logs and deployment status in Render dashboard
- **Vercel**: Monitor deployments and performance in Vercel dashboard
- **MongoDB**: Monitor database usage in MongoDB Atlas

## Troubleshooting

### Backend Issues

- **Connection refused**: Check MongoDB connection string and network access
- **CORS errors**: Verify `ALLOWED_ORIGINS` includes your frontend URL
- **Email not sending**: Check email credentials and service configuration

### Frontend Issues

- **API errors**: Verify `VITE_API_URL` is correct
- **Build failures**: Check Vercel build logs for dependency issues
- **Blank page**: Check browser console for JavaScript errors

### Database Issues

- **Connection timeout**: Check MongoDB Atlas IP whitelist
- **Authentication failed**: Verify database user credentials
- **Performance issues**: Consider upgrading MongoDB tier for production

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files to git
2. **Strong Passwords**: Use strong JWT secrets and database passwords
3. **HTTPS**: Both Vercel and Render provide HTTPS by default
4. **Rate Limiting**: Consider adding rate limiting for API endpoints
5. **Input Validation**: All inputs are validated on both frontend and backend
6. **Password Hashing**: All passwords are hashed using bcrypt

## Scaling Considerations

### Free Tier Limitations

- **Render Free Tier**: Spins down after 15 minutes of inactivity (cold starts)
- **MongoDB Free Tier**: 512 MB storage, shared RAM
- **Vercel Free Tier**: 100 GB bandwidth/month

### Production Recommendations

- **Backend**: Upgrade to paid Render tier for consistent performance
- **Database**: Upgrade MongoDB Atlas for production workloads
- **Email**: Use dedicated email service for high volume
- **Monitoring**: Add application monitoring (Sentry, LogRocket)
- **CDN**: Consider CDN for static assets

## Maintenance

### Regular Tasks

- Monitor database storage usage
- Check email service quota
- Review application logs
- Update dependencies regularly
- Backup database regularly

### Updates

To update the application:
1. Push changes to GitHub main branch
2. Render and Vercel will auto-deploy
3. Monitor deployment logs for issues
4. Test critical functionality after deployment

## Support

For issues with:
- **Render**: https://render.com/docs
- **Vercel**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Email Services**: Check respective provider documentation
