import { Quote } from '../types';

export const SAMPLE_QUOTE: Quote = {
  id: 'sample-quote-id',
  quoteNo: 'QT-20260601',
  date: '2026-06-22',
  validUntil: '2026-07-22',
  
  // Seller
  sellerName: '創藝數位科技有限公司',
  sellerTaxId: '83456789',
  sellerContact: '林育辰',
  sellerPhone: '02-2734-5678',
  sellerEmail: 'service@creative-digital.com.tw',
  sellerAddress: '台北市大安區信義路四段 100 號 5 樓',

  // Buyer
  buyerName: '飛黃國際行銷股份有限公司',
  buyerTaxId: '54321098',
  buyerContact: '張經理',
  buyerPhone: '02-2511-9988',
  buyerAddress: '台北市中正區南京東路二段 45 號 12 樓',

  // Items
  items: [
    {
      id: 'item-1',
      name: '專業 UI/UX 形象與介面設計 (包含 RWD 規格)',
      unit: '式',
      qty: 1,
      price: 45000,
    },
    {
      id: 'item-2',
      name: '響應式網頁前端開發 (React / Tailwind CSS 整合)',
      unit: '式',
      qty: 1,
      price: 38000,
    },
    {
      id: 'item-3',
      name: '後台內容管理系統與 RESTful API 串接開發',
      unit: '式',
      qty: 1,
      price: 52000,
    },
    {
      id: 'item-4',
      name: '雲端主機環境配置與 SSL 憑證安全部署 (Cloud Run / AWS)',
      unit: '式',
      qty: 1,
      price: 15000,
    },
    {
      id: 'item-5',
      name: '專案保固、雲端系統監控與後續技術諮詢服務',
      unit: '個月',
      qty: 6,
      price: 3000,
    }
  ],
  
  taxType: 'EXTERNAL',
  taxRate: 0.05,
  showTaxId: true,

  notes: '【收付款辦法】\n1. 本報價單自開立起 30 天內有效。\n2. 本專案採 3-4-3 階段付費：簽約定金 30%、前端驗收 40%、上線驗收 30%。\n3. 專案上線後提供 6 個月的免費系統缺陷保固維護，保固期滿後可另簽維護合約。',
  
  bankName: '玉山商業銀行 (808)',
  bankCode: '0123-4567-89012',
  bankAccountName: '創藝數位科技有限公司',
  bankAccountNumber: '0123-4567-89012',

  showStampPlaceholder: true,
  stampText: '創藝數位科技\n統一發票專用章'
};
