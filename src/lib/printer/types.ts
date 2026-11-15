/**
 * Label Printing Adapter Interface
 */

export type LabelSize = '50x25mm' | '75x50mm';

export interface LabelData {
  sku: string;
  barcode: string;
  brand: string;
  carBrand: string;
  carModel: string;
  glassType: string;
  location?: string;
  size?: LabelSize;
}

export interface PrintAdapter {
  readonly id: string;
  readonly name: string;
  readonly isConfigured: boolean;
  printLabel(label: LabelData, size?: LabelSize): Promise<boolean>;
}
