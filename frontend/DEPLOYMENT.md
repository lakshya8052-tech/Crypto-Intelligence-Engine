# Deployment Guide

## Overview
This guide covers deploying the Crypto Signals AI trading intelligence platform to production.

## Prerequisites
- Node.js 18+ 
- npm or yarn
- Vercel account (for frontend)
- Railway/Render account (for backend - optional)

## Environment Variables

### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.cryptosignals.app
NEXT_PUBLIC_WS_URL=wss://api.cryptosignals.app

# Environment
NODE_ENV=production

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_LIVE_DATA=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

## Frontend Deployment (Vercel)

### Option 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: Vercel Dashboard
1. Connect GitHub repository
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `out`
   - Install Command: `npm install`
3. Add environment variables
4. Deploy

### Option 3: Manual Build
```bash
# Build for production
npm run build

# Export static files
npm run export

# Deploy the `out` folder to your hosting provider
```

## Backend Deployment (Optional)

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render
1. Connect GitHub repository
2. Configure Dockerfile
3. Add environment variables
4. Deploy

## Performance Optimization

### Build Optimization
- Images are optimized with Next.js Image component
- CSS is minified with Tailwind
- JavaScript is bundled and minified
- Static assets are served from CDN

### Caching
- Static pages are cached at edge
- API responses have appropriate cache headers
- Client-side state management reduces API calls

## Monitoring

### Vercel Analytics
- Built-in performance monitoring
- Real-time user metrics
- Error tracking

### Custom Monitoring
```javascript
// Add to your app for custom monitoring
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // Send error to monitoring service
  })
}
```

## Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use Vercel's environment variable management
- Rotate API keys regularly

### Content Security Policy
```javascript
// Add to next.config.js for CSP
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL};
`
```

## Domain Configuration

### Custom Domain
1. Add domain in Vercel dashboard
2. Update DNS records
3. Configure SSL (automatic)

### SSL Certificate
- Automatically provided by Vercel
- Renewed automatically
- HSTS enabled

## Scaling

### Horizontal Scaling
- Vercel automatically scales globally
- Edge caching reduces server load
- CDN handles static assets

### Database Scaling
- Use managed database services
- Implement connection pooling
- Add read replicas for high traffic

## Troubleshooting

### Common Issues
1. **Build failures**: Check environment variables
2. **Runtime errors**: Check browser console
3. **Performance issues**: Check Vercel Analytics
4. **API errors**: Check backend logs

### Debug Mode
```bash
# Run locally in production mode
npm run build
npm run start
```

## Rollback

### Vercel
1. Go to Vercel dashboard
2. Select deployment
3. Click "Revert"
4. Confirm rollback

### Manual
```bash
# Deploy previous commit
vercel --prod --git-head <previous-commit-hash>
```

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Monitor performance metrics
- Review security advisories
- Backup data regularly

### Updates
```bash
# Update dependencies
npm update

# Check for security issues
npm audit

# Fix security issues
npm audit fix
```

## Support

### Documentation
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Community
- Vercel Discord
- Next.js GitHub Discussions
- Stack Overflow

## Checklist
- [ ] Environment variables configured
- [ ] Build succeeds locally
- [ ] Tests pass
- [ ] Performance metrics acceptable
- [ ] Security scan passed
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Documentation updated
