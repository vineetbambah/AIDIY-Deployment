# Vercel Deployment Guide

## Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Run deployment command in client directory**:
   ```bash
   cd client
   vercel --prod
   ```

4. **Or deploy via Vercel Dashboard**:
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `client`
   - Add environment variable: `REACT_APP_API_URL=https://web-production-a435c.up.railway.app`

## Configuration Details

- `vercel.json`: Contains all necessary build and routing configurations
- Environment variable: `REACT_APP_API_URL` configured to point to your Railway backend
- Build directory: `build` (React default build directory)

## Environment Variables

If you need to manually configure environment variables in Vercel Dashboard:
- Variable name: `REACT_APP_API_URL`
- Variable value: `https://web-production-a435c.up.railway.app`

## Important Notes

- Make sure your backend API supports CORS and allows requests from Vercel domains
- Frontend API calls will automatically use the production API address 