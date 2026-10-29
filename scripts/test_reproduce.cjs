const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const page = await browser.newPage();
  
  // Collect console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
  });

  page.on('pageerror', err => {
    console.error('[BROWSER UNCAUGHT ERROR]:', err);
  });

  console.log('Navigating to http://localhost:3000/vault ...');
  await page.goto('http://localhost:3000/vault', { waitUntil: 'networkidle' });

  // Check if Reset Vault button is visible and click it
  const resetBtn = await page.$('button:has-text("Reset Vault")');
  if (resetBtn) {
    console.log('Clicking Reset Vault button...');
    await resetBtn.click();
    await page.waitForTimeout(1000);
  }

  // Find file input
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) {
    console.error('File input not found!');
    await browser.close();
    return;
  }

  const docsDir = path.resolve('test-pack/documents');
  const files = [
    '01_Form16_PartA.pdf',
    '02_Form16_PartB.pdf',
    '03_Salary_Slip_Mar2026.pdf',
    '04_Form26AS_Summary.pdf',
    '05_AIS_TIS.pdf',
    '06_Capital_Gains_Statement.pdf',
    '07_Rent_Receipts_HRA.pdf',
    '08_Investment_Proofs.pdf',
  ].map(f => path.join(docsDir, f));

  console.log('Uploading 8 files to input:', files);
  await fileInput.setInputFiles(files);

  console.log('Waiting 10s for upload and processing...');
  await page.waitForTimeout(10000);

  // Take screenshot of vault
  await fs.promises.mkdir('test-artifacts', { recursive: true });
  await page.screenshot({ path: 'test-artifacts/01_vault_after_upload.png', fullPage: true });
  console.log('Saved test-artifacts/01_vault_after_upload.png');

  // Check what Vault page shows
  const vaultText = await page.textContent('body');
  console.log('Vault page files count text snippet:', vaultText.slice(0, 500));

  // Navigate to Dashboard
  console.log('Navigating to /dashboard ...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-artifacts/02_dashboard.png', fullPage: true });

  // Navigate to Tax Optimization
  console.log('Navigating to /tax-optimization ...');
  await page.goto('http://localhost:3000/tax-optimization', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-artifacts/03_tax_optimization.png', fullPage: true });

  // Navigate to Reports
  console.log('Navigating to /reports/ind-arjun ...');
  await page.goto('http://localhost:3000/reports/ind-arjun', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-artifacts/04_reports.png', fullPage: true });

  // Navigate to CA Workspace
  console.log('Navigating to /ca/workspace/ind-arjun ...');
  await page.goto('http://localhost:3000/ca/workspace/ind-arjun', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-artifacts/05_ca_workspace.png', fullPage: true });

  // Navigate to Agent Chat
  console.log('Navigating to /agent-chat ...');
  await page.goto('http://localhost:3000/agent-chat', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-artifacts/06_agent_chat.png', fullPage: true });

  await browser.close();
  console.log('Done reproducing.');
})();
