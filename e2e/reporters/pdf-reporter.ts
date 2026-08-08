import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

interface TestEntry {
  title: string;
  suite: string;
  project: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  error?: string;
  screenshots: string[];
}

class PdfReporter implements Reporter {
  private entries: TestEntry[] = [];
  private startTime = Date.now();
  private outputDir = 'test-results';
  private outputFile = '';

  onBegin(_config: FullConfig, _suite: Suite) {
    this.startTime = Date.now();
    fs.mkdirSync(this.outputDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.outputFile = path.join(this.outputDir, `report-${ts}.pdf`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const screenshots: string[] = [];
    for (const attachment of result.attachments) {
      if (attachment.name === 'screenshot' && attachment.path && fs.existsSync(attachment.path)) {
        screenshots.push(attachment.path);
      }
    }

    this.entries.push({
      title: test.title,
      suite: test.titlePath().slice(1, -1).join(' › '),
      project: test.parent?.project()?.name ?? '',
      status: result.status as TestEntry['status'],
      duration: result.duration,
      error: result.error?.message,
      screenshots,
    });
  }

  async onEnd(_result: FullResult) {
    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const passed = this.entries.filter(e => e.status === 'passed').length;
    const failed = this.entries.filter(e => e.status === 'failed').length;
    const skipped = this.entries.filter(e => e.status === 'skipped').length;
    const total = this.entries.length;

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(this.outputFile);
    doc.pipe(stream);

    // ── Cover page ──────────────────────────────────────────────────────────
    doc.fontSize(28).fillColor('#111827').text('ecom — E2E Test Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#6b7280').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Summary box
    const summaryY = doc.y;
    doc.roundedRect(40, summaryY, 515, 80, 8).fillAndStroke('#f9fafb', '#e5e7eb');
    doc.fillColor('#111827').fontSize(13);
    const col = 515 / 4;
    [
      { label: 'Total', value: String(total), color: '#111827' },
      { label: 'Passed', value: String(passed), color: '#16a34a' },
      { label: 'Failed', value: String(failed), color: '#dc2626' },
      { label: 'Skipped', value: String(skipped), color: '#d97706' },
    ].forEach(({ label, value, color }, i) => {
      const x = 40 + i * col + col / 2;
      doc.fontSize(22).fillColor(color).text(value, x - 20, summaryY + 12, { width: 40, align: 'center' });
      doc.fontSize(10).fillColor('#6b7280').text(label, x - 20, summaryY + 50, { width: 40, align: 'center' });
    });
    doc.fillColor('#111827');
    doc.moveDown(5);
    doc.fontSize(10).fillColor('#6b7280').text(`Total duration: ${totalDuration}s`, { align: 'center' });
    doc.addPage();

    // ── Test results ─────────────────────────────────────────────────────────
    doc.fontSize(16).fillColor('#111827').text('Test Results', { underline: true });
    doc.moveDown(0.8);

    let currentSuite = '';
    for (const entry of this.entries) {
      // Suite header
      if (entry.suite !== currentSuite) {
        currentSuite = entry.suite;
        doc.fontSize(12).fillColor('#1d4ed8').text(`▸ ${currentSuite}`, { continued: false });
        doc.moveDown(0.3);
      }

      // Status colour
      const statusColor = entry.status === 'passed' ? '#16a34a'
        : entry.status === 'failed' ? '#dc2626'
        : '#d97706';
      const statusIcon = entry.status === 'passed' ? '✓' : entry.status === 'failed' ? '✗' : '–';

      // Check page space
      if (doc.y > 720) doc.addPage();

      // Row
      doc.fontSize(10).fillColor(statusColor).text(`  ${statusIcon}`, { continued: true });
      doc.fillColor('#111827').text(`  ${entry.title}`, { continued: true });
      doc.fillColor('#9ca3af').text(`  (${(entry.duration / 1000).toFixed(2)}s)  [${entry.project}]`, { align: 'right' });

      if (entry.error) {
        doc.fontSize(8).fillColor('#dc2626')
          .text(`     ${entry.error.split('\n')[0].slice(0, 120)}`, { indent: 20 });
      }
      doc.moveDown(0.3);

      // Screenshots
      for (const screenshotPath of entry.screenshots) {
        try {
          const imgData = fs.readFileSync(screenshotPath);
          if (doc.y > 600) doc.addPage();
          doc.moveDown(0.3);
          doc.image(imgData, { fit: [515, 300], align: 'center' });
          doc.moveDown(0.5);
        } catch { /* skip unreadable images */ }
      }
    }

    // ── Failure details page ─────────────────────────────────────────────────
    const failures = this.entries.filter(e => e.status === 'failed');
    if (failures.length > 0) {
      doc.addPage();
      doc.fontSize(16).fillColor('#dc2626').text('Failed Tests — Detail', { underline: true });
      doc.moveDown(0.8);

      for (const f of failures) {
        if (doc.y > 700) doc.addPage();
        doc.fontSize(12).fillColor('#111827').text(`✗ ${f.title}`);
        doc.fontSize(9).fillColor('#6b7280').text(`Suite: ${f.suite}  |  Project: ${f.project}`);
        if (f.error) {
          doc.moveDown(0.2);
          doc.fontSize(9).fillColor('#dc2626')
            .text(f.error.slice(0, 600), { indent: 10 });
        }
        for (const screenshotPath of f.screenshots) {
          try {
            const imgData = fs.readFileSync(screenshotPath);
            if (doc.y > 580) doc.addPage();
            doc.moveDown(0.3);
            doc.image(imgData, { fit: [515, 320], align: 'center' });
            doc.moveDown(0.5);
          } catch { /* skip */ }
        }
        doc.moveDown(0.8);
      }
    }

    doc.end();
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    console.log(`\n📄 PDF report saved → ${this.outputFile}\n`);
  }
}

export default PdfReporter;
