# Insight Engine Backend - Render Deployment

## Quick Deploy to Render

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Backend ready for deployment"
   git push origin main
   ```

2. **Deploy on Render:**
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Select "Web Service"
   - Choose this Backend folder
   - Render will auto-detect Python and use the Procfile

3. **Environment Variables:**
   - No additional env vars needed
   - PORT is automatically set by Render

## API Endpoints

- `GET /` - API info
- `GET /health` - Health check
- `POST /analyze` - Upload CSV for analysis

## Local Development

```bash
pip install -r requirements.txt
python app.py
```

Server runs on http://localhost:5000