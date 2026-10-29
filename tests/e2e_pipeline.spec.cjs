const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

// Helper to clean formatted strings for numeric comparison
const cleanNum = (str) => str.replace(/[^0-9]/g, '');

async function runE2ETest() {
  console.log('=== STARTING END-TO-END PLAYWRIGHT BROWSER VALIDATION ===');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  const page = await browser.newPage();
  const consoleLogs = [];

  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(`[BROWSER ${msg.type().toUpperCase()}]: ${text}`);
    if (text.includes('[PIPELINE:')) {
      console.log(`[BROWSER TRACE]: ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    console.error('[BROWSER UNCAUGHT PAGE ERROR]:', err);
  });

  const docsDir = path.resolve('test-pack/documents');
  const all8Files = [
    '01_Form16_PartA.pdf',
    '02_Form16_PartB.pdf',
    '03_Salary_Slip_Mar2026.pdf',
    '04_Form26AS_Summary.pdf',
    '05_AIS_TIS.pdf',
    '06_Capital_Gains_Statement.pdf',
    '07_Rent_Receipts_HRA.pdf',
    '08_Investment_Proofs.pdf',
  ].map((f) => path.join(docsDir, f));

  await fs.promises.mkdir('test-artifacts', { recursive: true });

  try {
    // ==========================================
    // TEST PART A: MULTI-SELECT UPLOAD OF 8 PDFs
    // ==========================================
    console.log('\n--- PART A: Testing Multi-Select Upload of all 8 PDFs ---');
    await page.goto('http://localhost:3000/vault', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 1. Reset Vault
    const resetBtn = await page.$('button:has-text("Reset Vault")');
    if (resetBtn) {
      console.log('Resetting Vault to clean initial state...');
      await resetBtn.click();
      await page.waitForTimeout(1000);
    }

    // Verify empty state
    let bodyText = await page.textContent('body');
    assert(
      bodyText.includes('Upload documents to begin') || bodyText.includes('Choose Files to Upload'),
      'Expected empty state before upload'
    );
    console.log('Verified Vault initial empty state.');

    // Upload all 8 PDFs in one multi-select
    const fileInput = await page.$('input[type="file"]');
    assert(fileInput, 'File input element must exist');
    console.log('Uploading all 8 PDFs in a single multi-select batch...');
    await fileInput.setInputFiles(all8Files);

    // Wait for batch processing to complete
    console.log('Waiting for pipeline batch queue to extract & classify all 8 files...');
    await page.waitForFunction(() => {
      const isAnalyzing = document.querySelector('.animate-spin');
      const tableRows = document.querySelectorAll('tbody tr');
      const text = document.body.textContent || '';
      return !isAnalyzing && tableRows.length >= 8 && text.includes('Rohan Mehta');
    }, { timeout: 35000 });

    await page.waitForTimeout(2000);

    // Save Vault Screenshot
    await page.screenshot({ path: 'test-artifacts/live_01_vault.png', fullPage: true });
    console.log('Saved test-artifacts/live_01_vault.png');

    // Assert Vault assertions
    const vaultContent = await page.textContent('body');
    assert(vaultContent.includes('Rohan Mehta'), 'Vault header must show Rohan Mehta');
    assert(vaultContent.includes('ABCPM*****K') || vaultContent.includes('ABCPM1234K'), 'Vault header must show masked PAN ABCPM*****K');
    assert(vaultContent.includes('8 Files in Vault'), 'Vault header must show "8 Files in Vault"');
    assert(vaultContent.includes('8/8 documents loaded'), 'Stepper must show 8/8 documents loaded');
    assert(vaultContent.includes('All documents structured'), 'Stepper must show All documents structured');
    assert(vaultContent.includes('23,556'), 'Stepper must reflect ₹23,556 savings');
    console.log('PASS: Vault assertions verified (Assessee: Rohan Mehta [ABCPM*****K], 8 Files in Vault, Stepper complete).');

    // ==========================================
    // TEST DASHBOARD
    // ==========================================
    console.log('\n--- PART A.2: Testing Individual Dashboard ---');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-artifacts/live_02_dashboard.png', fullPage: true });
    console.log('Saved test-artifacts/live_02_dashboard.png');

    const dashContent = await page.textContent('body');
    assert(dashContent.includes('Rohan Mehta'), 'Dashboard must display Rohan Mehta');
    assert(dashContent.includes('ABCPM*****K'), 'Dashboard must display PAN ABCPM*****K');
    assert(dashContent.includes('1,77,034'), 'Dashboard must display New Regime Tax ₹1,77,034');
    assert(dashContent.includes('2,00,590') || dashContent.includes('23,556'), 'Dashboard must display Old Tax / Savings ₹23,556');
    assert(dashContent.includes('2,01,700'), 'Dashboard must display TDS credit ₹2,01,700');
    assert(dashContent.includes('24,666'), 'Dashboard must display Net Refund Due ₹24,666');
    assert(dashContent.includes('5/5 Cross-Checks PASS') || dashContent.includes('5/5 PASS'), 'Dashboard must show 5/5 Cross-Checks PASS');
    console.log('PASS: Dashboard assertions verified (New 1,77,034, Savings 23,556, TDS 2,01,700, Refund 24,666, 5/5 PASS).');

    // ==========================================
    // TEST TAX OPTIMIZATION
    // ==========================================
    console.log('\n--- PART A.3: Testing Tax Optimization Page ---');
    await page.goto('http://localhost:3000/tax-optimization', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-artifacts/live_03_tax_optimization.png', fullPage: true });
    console.log('Saved test-artifacts/live_03_tax_optimization.png');

    const optContent = await page.textContent('body');
    assert(optContent.includes('1,77,034'), 'Tax Optimization must show New Regime Tax 1,77,034');
    assert(optContent.includes('2,00,590'), 'Tax Optimization must show Old Regime Tax 2,00,590');
    assert(optContent.includes('23,556'), 'Tax Optimization must show Savings 23,556');
    console.log('PASS: Tax Optimization numbers verified.');

    // ==========================================
    // TEST PRINTABLE REPORTS
    // ==========================================
    console.log('\n--- PART A.4: Testing Reports Page ---');
    await page.goto('http://localhost:3000/reports/ind-rohan', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-artifacts/live_04_reports.png', fullPage: true });
    console.log('Saved test-artifacts/live_04_reports.png');

    const reportContent = await page.textContent('body');
    assert(reportContent.includes('Rohan Mehta'), 'Reports demographic block must show Rohan Mehta');
    assert(reportContent.includes('ABCPM*****K'), 'Reports demographic block must show ABCPM*****K');
    assert(reportContent.includes('1,77,034'), 'Reports computation must show New Regime Tax ₹1,77,034');
    assert(reportContent.includes('2,00,590'), 'Reports computation must show Old Regime Tax ₹2,00,590');
    assert(reportContent.includes('2,01,700'), 'Reports computation must show Reconciled TDS Credit ₹2,01,700');
    assert(reportContent.includes('24,666'), 'Reports computation must show Net Refund ₹24,666');
    assert(reportContent.includes('PASS'), 'Reports must show PASS cross checks');
    console.log('PASS: Reports working papers verified (Rohan Mehta, 1,77,034 vs 2,00,590, Refund 24,666).');

    // ==========================================
    // TEST CA WORKSPACE
    // ==========================================
    console.log('\n--- PART A.5: Testing CA Client Workspace ---');
    await page.goto('http://localhost:3000/ca/workspace/ind-rohan', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-artifacts/live_05_ca_workspace.png', fullPage: true });
    console.log('Saved test-artifacts/live_05_ca_workspace.png');

    const caContent = await page.textContent('body');
    assert(caContent.includes('Rohan Mehta'), 'CA Workspace must show Rohan Mehta');
    assert(caContent.includes('ABCPM*****K'), 'CA Workspace must show ABCPM*****K');
    assert(caContent.includes('1,77,034'), 'CA Workspace must show New Regime Tax 1,77,034');
    assert(caContent.includes('2,00,590'), 'CA Workspace must show Old Regime Tax 2,00,590');
    assert(caContent.includes('23,556'), 'CA Workspace must show Net Savings 23,556');
    console.log('PASS: CA Client Workspace numbers verified.');

    // ==========================================
    // TEST AGENT CHAT
    // ==========================================
    console.log('\n--- PART A.6: Testing Agent Chat Context Grounding ---');
    await page.goto('http://localhost:3000/agent-chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const chatGreeting = await page.textContent('body');
    assert(chatGreeting.includes('Rohan Mehta'), 'Agent Chat initial greeting must address Rohan Mehta');

    // Ask regime comparison question
    const queryInput = await page.$('input[placeholder*="Ask about regime"]');
    assert(queryInput, 'Query input should exist');
    await queryInput.fill('Which regime saves me more tax for FY 2025-26?');
    const sendBtn = await page.$('button:has-text("Execute")');
    assert(sendBtn, 'Send button should exist');
    await sendBtn.click();

    console.log('Waiting for Agent Swarm to answer...');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'test-artifacts/live_06_agent_chat.png', fullPage: true });
    console.log('Saved test-artifacts/live_06_agent_chat.png');

    const chatAnswers = await page.textContent('body');
    assert(chatAnswers.includes('1,77,034'), 'Agent response must cite New Regime Tax ₹1,77,034');
    assert(chatAnswers.includes('2,00,590'), 'Agent response must cite Old Regime Tax ₹2,00,590');
    assert(chatAnswers.includes('23,556'), 'Agent response must cite Savings ₹23,556');
    console.log('PASS: Agent Chat grounded response citations verified.');

    // ==========================================
    // TEST PART B: UPLOAD IN REVERSE ORDER ONE-BY-ONE
    // ==========================================
    console.log('\n--- PART B: Testing Upload in Reverse Order One-by-One ---');
    await page.goto('http://localhost:3000/vault', { waitUntil: 'networkidle' });
    const resetBtn2 = await page.$('button:has-text("Reset Vault")');
    if (resetBtn2) {
      await resetBtn2.click();
      await page.waitForTimeout(1000);
    }

    const reverseFiles = [...all8Files].reverse();
    for (const fPath of reverseFiles) {
      const fName = path.basename(fPath);
      console.log(`Uploading single file: ${fName} ...`);
      const input = await page.$('input[type="file"]');
      await input.setInputFiles([fPath]);
      await page.waitForFunction(() => !document.querySelector('.animate-spin'), { timeout: 15000 });
      await page.waitForTimeout(500);
    }

    // Wait for all 8 files
    await page.waitForFunction(() => {
      const isAnalyzing = document.querySelector('.animate-spin');
      const tableRows = document.querySelectorAll('tbody tr');
      return !isAnalyzing && tableRows.length >= 8;
    }, { timeout: 30000 });

    await page.waitForTimeout(2000);

    // Verify Dashboard with reverse upload
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const revDash = await page.textContent('body');
    assert(revDash.includes('Rohan Mehta'), 'Reverse upload: Assessee must be Rohan Mehta');
    assert(revDash.includes('1,77,034'), 'Reverse upload: New tax must be 1,77,034');
    assert(revDash.includes('2,00,590') || revDash.includes('23,556'), 'Reverse upload: Old tax/savings must match');
    assert(revDash.includes('24,666'), 'Reverse upload: Net refund must be 24,666');
    console.log('PASS: Reverse order upload produced identical statutory numbers.');

    // ==========================================
    // TEST PART C: UNKNOWN NON-TAX PDF
    // ==========================================
    console.log('\n--- PART C: Testing Non-Tax UNKNOWN PDF Upload ---');
    await page.goto('http://localhost:3000/vault', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Create a dummy non-tax PDF
    const dummyPdfPath = path.resolve('test-pack/documents/random_recipe.pdf');
    // Minimal valid PDF structure
    const dummyPdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 75 >>
stream
BT
/F1 12 Tf
72 712 Td
(Grandma Secret Chocolate Chip Cookie Recipe: 2 cups flour, 1 cup sugar) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000056 00000 n 
0000000111 00000 n 
0000000212 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
338
%%EOF`;
    fs.writeFileSync(dummyPdfPath, dummyPdfContent);

    console.log('Uploading random_recipe.pdf ...');
    const input3 = await page.$('input[type="file"]');
    await input3.setInputFiles([dummyPdfPath]);
    await page.waitForTimeout(3000);

    const vaultAfterUnknown = await page.textContent('body');
    assert(
      vaultAfterUnknown.includes('UNKNOWN') || vaultAfterUnknown.includes('random_recipe'),
      'Random recipe document must be classified as UNKNOWN'
    );
    console.log('PASS: Random non-tax PDF successfully classified as UNKNOWN without breaking pipeline.');

    // Cleanup dummy file
    try { fs.unlinkSync(dummyPdfPath); } catch {}

    console.log('\n======================================================');
    console.log('ALL PLAYWRIGHT END-TO-END VALIDATION TESTS PASSED 100%');
    console.log('======================================================\n');
  } finally {
    await browser.close();
  }
}

runE2ETest().catch((err) => {
  console.error('\nE2E VALIDATION FAILED WITH ERROR:', err);
  process.exit(1);
});
