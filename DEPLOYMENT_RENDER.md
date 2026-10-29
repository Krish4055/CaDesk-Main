# Deploying CaDesk on Render

This guide provides simple, step-by-step instructions to deploy **CaDesk** on [Render](https://render.com).

---

## Option 1: Automatic Blueprint Deployment (Recommended)

CaDesk includes a `render.yaml` blueprint configuration in the repository root that sets up both the frontend and backend services automatically.

1. Push your repository to GitHub: `https://github.com/Krish4055/CaDesk-Main.git`.
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** in the top right corner and select **Blueprint**.
4. Connect your GitHub account and select the **`CaDesk-Main`** repository.
5. Render will automatically detect `render.yaml` and display the services:
   - **`cadesk-web`**: Static Site (Vite React frontend, instant CDN, free tier supported).
   - **`cadesk-api`**: Web Service (Python FastAPI AI sidecar).
6. Click **Apply**.
7. Once deployed, Render will provide a live URL for your application (e.g., `https://cadesk-web.onrender.com`).

---

## Option 2: Deploy Frontend as a Static Site (Fastest & Free)

Because the statutory tax calculation engine, PDF text extraction, document classification, and client workspace execute client-side in the browser, you can deploy the complete app as a free Render Static Site in less than 2 minutes:

1. In the [Render Dashboard](https://dashboard.render.com), click **New +** > **Static Site**.
2. Connect your GitHub repository: `Krish4055/CaDesk-Main`.
3. Configure the build settings:
   - **Name**: `cadesk`
   - **Branch**: `main`
   - **Root Directory**: Leave blank (or `./` if asked)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Important**: Configure SPA client-side routing:
   - Go to **Redirects / Rewrites** in the service settings.
   - Add a rewrite rule:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
5. Click **Create Static Site**.

---

## Option 3: Deploy as a Node Web Service

If you prefer deploying as a Node Web Service:
1. In Render Dashboard, click **New +** > **Web Service**.
2. Select your repository `Krish4055/CaDesk-Main`.
3. Configure settings:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start` (runs `node server.cjs` to serve `dist`)
4. Click **Create Web Service**.

---

## Environment Variables (Optional)

In your Render Service Dashboard under **Environment**:
- `VITE_AI_PROVIDER`: `mock` (default) or `gemini` or `local_sidecar`
- `VITE_GEMINI_API_KEY`: Your Gemini API Key (if you wish to enable live Gemini multi-modal OCR in the browser).
