/**
 * Automated CAdesk Feature Demo Video Recorder (Playwright)
 * Generates an HD video recording of every screen and feature in CAdesk.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function recordDemo() {
  const outputDir = path.join(__dirname, '..', 'demo_recordings');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('🎬 Starting automated browser recording on http://localhost:3000...');
  
  // Launch in headless mode for headless recording
  const browser = await chromium.launch({
    headless: true,
    slowMo: 200
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1440, height: 900 }
    }
  });

  const page = await context.newPage();

  const tourSteps = [
    { name: '1. Landing Page', url: 'http://localhost:3000/', waitMs: 2500 },
    { name: '2. CA Practice Dashboard', url: 'http://localhost:3000/ca/dashboard', waitMs: 3000 },
    { name: '3. CA Client Working Papers & Review Workspace', url: 'http://localhost:3000/ca/workspace/client-1', waitMs: 3500 },
    { name: '4. Document Vault & OCR Verification', url: 'http://localhost:3000/vault', waitMs: 3000 },
    { name: '5. Tax Optimization & Regime Comparison', url: 'http://localhost:3000/tax-optimization', waitMs: 3000 },
    { name: '6. Scenario Simulator', url: 'http://localhost:3000/simulator', waitMs: 3000 },
    { name: '7. Statutory AI Tax Assistant (Agent Chat)', url: 'http://localhost:3000/agent-chat', waitMs: 3000 },
    { name: '8. Deadlines & Statutory Compliance Calendar', url: 'http://localhost:3000/deadlines', waitMs: 2500 },
    { name: '9. Document Request Automation', url: 'http://localhost:3000/ca/requests', waitMs: 2500 },
    { name: '10. Settings & Security Audit Configuration', url: 'http://localhost:3000/settings', waitMs: 2500 }
  ];

  for (const step of tourSteps) {
    console.log('➡️ Recording:', step.name);
    await page.goto(step.url, { waitUntil: 'networkidle' }).catch(() => {});
    await page.evaluate(() => window.scrollBy({ top: 250, behavior: 'smooth' }));
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollBy({ top: -250, behavior: 'smooth' }));
    await page.waitForTimeout(step.waitMs);
  }

  console.log('✅ Demo tour completed! Finalizing video file...');
  
  const videoPath = await page.video().path();
  await page.close();
  await context.close();
  await browser.close();

  const finalVideoName = path.join(outputDir, 'cadesk_demo_video.webm');
  try {
    if (fs.existsSync(videoPath)) {
      fs.copyFileSync(videoPath, finalVideoName);
      console.log('🎉 Demo video successfully saved to:', finalVideoName);
    }
  } catch (e) {
    console.log('Video saved to:', videoPath);
  }
}

recordDemo().catch(err => {
  console.error('Error recording demo video:', err);
  process.exit(1);
});
