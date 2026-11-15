import { PrintAdapter, LabelData, LabelSize } from './types';

/**
 * Browser-based Label Print Adapter
 * Renders an exact-size printable document with CSS @page rules
 * and triggers window.print().
 */
export class BrowserPrintAdapter implements PrintAdapter {
  readonly id = 'browser-default';
  readonly name = 'Browser Print Dialog (Default)';
  readonly isConfigured = false; // "Printer: not configured" in settings

  async printLabel(label: LabelData, size: LabelSize = '50x25mm'): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    const isCompact = size === '50x25mm';
    const widthMm = isCompact ? 50 : 75;
    const heightMm = isCompact ? 25 : 50;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = `${widthMm}mm`;
    printFrame.style.height = `${heightMm}mm`;
    printFrame.style.border = 'none';

    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc) {
      document.body.removeChild(printFrame);
      return false;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${label.sku}</title>
          <style>
            @page {
              size: ${widthMm}mm ${heightMm}mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              font-family: monospace, sans-serif;
            }
            body {
              width: ${widthMm}mm;
              height: ${heightMm}mm;
              padding: 2mm 3mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
              background: #fff;
              color: #000;
            }
            .header {
              display: flex;
              justify-content: space-between;
              font-size: ${isCompact ? '8px' : '11px'};
              font-weight: bold;
              border-bottom: 1px solid #000;
              padding-bottom: 1mm;
            }
            .brand {
              text-transform: uppercase;
            }
            .sku {
              font-size: ${isCompact ? '10px' : '14px'};
              font-weight: 900;
              margin: 1mm 0;
              text-align: center;
              letter-spacing: -0.2px;
            }
            .desc {
              font-size: ${isCompact ? '7px' : '10px'};
              text-align: center;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .barcode-box {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              margin: 1mm 0;
            }
            .barcode-digits {
              font-size: ${isCompact ? '8px' : '11px'};
              font-weight: bold;
              letter-spacing: 1.5px;
              margin-top: 0.5mm;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              font-size: ${isCompact ? '6px' : '9px'};
              border-top: 1px solid #ccc;
              padding-top: 0.5mm;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="brand">${label.brand}</span>
            <span>ATUL GLASS NAGPUR</span>
          </div>
          <div class="sku">${label.sku}</div>
          <div class="desc">${label.carBrand} ${label.carModel} • ${label.glassType}</div>
          <div class="barcode-box">
            <svg id="barcode-svg" style="max-height: ${isCompact ? '7mm' : '18mm'}; width: 100%;"></svg>
            <div class="barcode-digits">${label.barcode}</div>
          </div>
          <div class="footer">
            <span>LOC: ${label.location || 'MAIN'}</span>
            <span>${new Date().toLocaleDateString('en-IN')}</span>
          </div>
        </body>
      </html>
    `;

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    // Render SVG barcode in frame using JsBarcode if available, else standard fallback
    const script = frameDoc.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
    script.onload = () => {
      try {
        (printFrame.contentWindow as unknown as { JsBarcode: (el: string, code: string, opts: object) => void }).JsBarcode(
          '#barcode-svg',
          label.barcode,
          {
            format: 'CODE128',
            displayValue: false,
            margin: 0,
            width: isCompact ? 1.2 : 1.8,
            height: isCompact ? 25 : 55,
          }
        );
      } catch {
        // Fallback gracefully
      }
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 2000);
    };

    script.onerror = () => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(printFrame)) {
          document.body.removeChild(printFrame);
        }
      }, 2000);
    };

    frameDoc.head.appendChild(script);
    return true;
  }
}

export const browserPrintAdapter = new BrowserPrintAdapter();
