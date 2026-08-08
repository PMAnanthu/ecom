import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import fs from 'node:fs';
import path from 'node:path';
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
  private readonly entries: TestEntry[] = [];
  private startTime = Date.now();
  private readonly outputDir = 'test-results';
  private outputFile = '';

  onBegin(_config: FullConfig, _suite: Suite) {
    this.startTime = Date.now();
    fs.mkdirSync(this.outputDir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    this.outputFile = path.join(this.outputDir, `report-${ts}.pdf`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const screenshots = result.attachments
      .filter(a => a.name === 'screenshot' && a.path && fs.existsSync(a.path))
      .map(a => a.path as string);

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

    this.writeCoverPage(doc, { total, passed, failed, skipped, totalDuration });
    doc.addPage();
    this.writeResultsSection(doc);

    const failures = this.entries.filter(e => e.status === 'failed');
    if (failures.length > 0) {
      doc.addPage();
      this.writeFailureDetails(doc, failures);
    }

    doc.end();
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    console.log(`\n📄 PDF report saved → ${this.outputFile}\n`);
  }

  private writeCoverPage(doc: PDFKit.PDFDocument, stats: {
    total: number; passed: number; failed: number; skipped: number; totalDuration: string;
  }) {
    doc.fontSize(28).fillColor('#111827').text('ecom — E2E Test Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#6b7280').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    const summaryY = doc.y;
    doc.roundedRect(40, summaryY, 515, 80, 8).fillAndStroke('#f9fafb', '#e5e7eb');
    const col = 515 / 4;
    const summaryItems = [
      { label: 'Total', value: String(stats.total), color: '#111827' },
      { label: 'Passed', value: String(stats.passed), color: '#16a34a' },
      { label: 'Failed', value: String(stats.failed), color: '#dc2626' },
      { label: 'Skipped', value: String(stats.skipped), color: '#d97706' },
    ];
    summaryItems.forEach(({ label, value, color }, i) => {
      const x = 40 + i * col + col / 2;
      doc.fontSize(22).fillColor(color).text(value, x - 20, summaryY + 12, { width: 40, align: 'center' });
      doc.fontSize(10).fillColor('#6b7280').text(label, x - 20, summaryY + 50, { width: 40, align: 'center' });
    });
    doc.fillColor('#111827');
    doc.moveDown(5);
    doc.fontSize(10).fillColor('#6b7280').text(`Total duration: ${stats.totalDuration}s`, { align: 'center' });
  }

  private writeResultsSection(doc: PDFKit.PDFDocument) {
    doc.fontSize(16).fillColor('#111827').text('Test Results', { underline: true });
    doc.moveDown(0.8);

    let currentSuite = '';
    for (const entry of this.entries) {
      if (entry.suite !== currentSuite) {
        currentSuite = entry.suite;
        doc.fontSize(12).fillColor('#1d4ed8').text(`▸ ${currentSuite}`);
        doc.moveDown(0.3);
      }
      if (doc.y > 720) doc.addPage();
      this.writeTestRow(doc, entry);
      this.writeScreenshots(doc, entry.screenshots, 300);
    }
  }

  private writeTestRow(doc: PDFKit.PDFDocument, entry: TestEntry) {
    const statusColor = statusToColor(entry.status);
    const statusIcon = statusToIcon(entry.status);

    doc.fontSize(10).fillColor(statusColor).text(`  ${statusIcon}`, { continued: true });
    doc.fillColor('#111827').text(`  ${entry.title}`, { continued: true });
    doc.fillColor('#9ca3af').text(`  (${(entry.duration / 1000).toFixed(2)}s)  [${entry.project}]`, { align: 'right' });

    if (entry.error) {
      doc.fontSize(8).fillColor('#dc2626').text(`     ${entry.error.split('\n')[0].slice(0, 120)}`, { indent: 20 });
    }
    doc.moveDown(0.3);
  }

  private writeFailureDetails(doc: PDFKit.PDFDocument, failures: TestEntry[]) {
    doc.fontSize(16).fillColor('#dc2626').text('Failed Tests — Detail', { underline: true });
    doc.moveDown(0.8);

    for (const f of failures) {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(12).fillColor('#111827').text(`✗ ${f.title}`);
      doc.fontSize(9).fillColor('#6b7280').text(`Suite: ${f.suite}  |  Project: ${f.project}`);
      if (f.error) {
        doc.moveDown(0.2);
        doc.fontSize(9).fillColor('#dc2626').text(f.error.slice(0, 600), { indent: 10 });
      }
      this.writeScreenshots(doc, f.screenshots, 320);
      doc.moveDown(0.8);
    }
  }

  private writeScreenshots(doc: PDFKit.PDFDocument, screenshots: string[], maxHeight: number) {
    for (const screenshotPath of screenshots) {
      try {
        const imgData = fs.readFileSync(screenshotPath);
        if (doc.y > 720 - maxHeight) doc.addPage();
        doc.moveDown(0.3);
        doc.image(imgData, { fit: [515, maxHeight], align: 'center' });
        doc.moveDown(0.5);
      } catch { /* skip unreadable images */ }
    }
  }
}

function statusToColor(status: TestEntry['status']): string {
  if (status === 'passed') return '#16a34a';
  if (status === 'failed') return '#dc2626';
  return '#d97706';
}

function statusToIcon(status: TestEntry['status']): string {
  if (status === 'passed') return '✓';
  if (status === 'failed') return '✗';
  return '–';
}

export default PdfReporter;
