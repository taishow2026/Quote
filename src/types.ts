export type TaxType = 'EXTERNAL' | 'INTERNAL' | 'FREE' | 'ZERO';

export interface QuoteItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  image?: string; // Base64 data URI or image URL
}

export interface Quote {
  id: string;
  quoteNo: string;
  date: string;
  validUntil: string;
  logo?: string; // Base64 data URI of the logo image
  
  // Seller (Issuer) info
  sellerName: string;
  sellerTaxId: string;
  sellerContact: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerAddress: string;

  // Buyer (Client) info
  buyerName: string;
  buyerTaxId: string;
  buyerContact: string;
  buyerPhone: string;
  buyerAddress: string;

  // Items and pricing
  items: QuoteItem[];
  taxType: TaxType;
  taxRate: number; // usually 5% in Taiwan (0.05)
  showTaxId: boolean;
  
  // Additional info
  notes: string;
  bankName: string;
  bankCode: string;
  bankAccountName: string;
  bankAccountNumber: string;

  // Signature/Stamp options
  showStampPlaceholder: boolean;
  stampText: string;
}

export interface SellerSettings {
  sellerName: string;
  sellerTaxId: string;
  sellerContact: string;
  sellerPhone: string;
  sellerEmail: string;
  sellerAddress: string;
  bankName: string;
  bankCode: string;
  bankAccountName: string;
  bankAccountNumber: string;
  logo?: string; // Base64 data URI of the logo image
}
