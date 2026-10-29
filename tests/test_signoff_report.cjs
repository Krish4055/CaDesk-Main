const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testSignOffAndReport() {
  console.log('=== STARTING STATUTORY SIGN-OFF & REPORT VERIFICATION ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', (msg) => {
    if (msg.text().includes('PIPELINE') || msg.text().includes('Sign-off') || msg.text().includes('error')) {
      console.log('[BROWSER CONSOLE]:', msg.text());
    }
  });

  try {
    // 1. Go to Vault and upload all 8 test PDFs
    console.log('Step 1: Navigating to Document Vault...');
    await page.goto('http://localhost:3000/vault', { waitUntil: 'networkidle' });

    const docsDir = path.resolve('test-pack/documents');
    const all8Files = fs.readdirSync(docsDir)
      .filter((f) => f.endsWith('.pdf'))
      .sort()
      .map((f) => path.join(docsDir, f));

    const fileInput = await page.$('input[type="file"]');
    console.log('Uploading all 8 PDFs from /test-pack/documents...');
    await fileInput.setInputFiles(all8Files);

    // Wait for pipeline batch queue to finish
    console.log('Waiting for pipeline to complete extraction...');
    await page.waitForFunction(() => {
      const isAnalyzing = document.querySelector('.animate-spin');
      const text = document.body.textContent || '';
      return !isAnalyzing && text.includes('8 Files in Vault') && text.includes('Rohan Mehta');
    }, { timeout: 20000 });
    console.log('PASS: Vault loaded Rohan Mehta with 8 files.');

    // 2. Navigate to CA Client Workspace
    console.log('Step 2: Navigating to CA Client Workspace...');
    await page.goto('http://localhost:3000/ca/workspace/ind-rohan', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    console.log('PASS: CA Client Workspace loaded.');

    // 3. Scroll to sign-off panel and click Execute Fiduciary Sign-Off
    console.log('Step 3: Clicking Execute Fiduciary Sign-Off...');
    await page.click('button:has-text("Execute Fiduciary Sign-Off")');
    await page.waitForTimeout(500);

    // 4. Verify modal is visible
    const modalHeading = await page.textContent('h4:has-text("Confirm Statutory Sign-Off")');
    if (!modalHeading) {
      throw new Error('Confirm Statutory Sign-Off modal did not appear');
    }
    console.log('PASS: Confirm Statutory Sign-Off modal is open.');

    // 5. Click Sign & Generate Report
    console.log('Step 4: Clicking Sign & Generate Report button in modal...');
    const signBtn = page.locator('button:has-text("Sign &")');
    await signBtn.click();

    // 6. Wait for navigation to /reports
    console.log('Step 5: Waiting for navigation to generated report page...');
    await page.waitForURL(url => url.pathname.includes('/reports'), { timeout: 8000 });
    await page.waitForTimeout(1500);

    // 7. Verify report page content
    const reportText = await page.textContent('body');
    if (!reportText.includes('Printable Working Papers Summary')) {
      throw new Error('Did not reach Printable Working Papers Summary page');
    }
    if (!reportText.includes('Rohan Mehta')) {
      throw new Error('Report page does not mention Rohan Mehta');
    }
    if (!reportText.includes('1,77,034')) {
      throw new Error('Report page does not show New Regime Tax ₹1,77,034');
    }
    if (!reportText.includes('2,00,590')) {
      throw new Error('Report page does not show Old Regime Tax ₹2,00,590');
    }
    if (!reportText.includes('Statutory Working Papers Signed Off & Certified')) {
      throw new Error('Report page does not display the certified sign-off banner');
    }
    if (!reportText.includes('UDIN: 26084920AAAAAX9912 (VERIFIED)')) {
      throw new Error('Report page does not show verified UDIN seal');
    }

    console.log('PASS: Generated Report rendered perfectly with Rohan Mehta and all statutory figures!');

    // Take screenshot of the generated report
    const screenshotDir = path.resolve('test-artifacts');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotPath = path.join(screenshotDir, 'live_07_signed_off_report.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved screenshot to ${screenshotPath}`);

    console.log('\n======================================================');
    console.log('ALL STATUTORY SIGN-OFF & REPORT TESTS PASSED 100%');
    console.log('======================================================');
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testSignOffAndReport();
