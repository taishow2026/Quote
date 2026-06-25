import { useState, useEffect, MouseEvent, FormEvent } from 'react';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Save, 
  RotateCcw, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Building, 
  FileText, 
  Calendar, 
  User, 
  DollarSign, 
  Briefcase, 
  AlertCircle, 
  CreditCard,
  Settings,
  X,
  FilePlus,
  ArrowRightLeft,
  Image,
  Upload,
  FileSpreadsheet,
  Palette,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, QuoteItem, TaxType, SellerSettings } from './types';
import { SAMPLE_QUOTE } from './data/sampleQuote';

// Weight code validation function for Taiwan Uniform Business Number (統一編號/統編)
function validateTaiwanTaxId(taxId: string): { isValid: boolean; message: string } {
  if (!taxId) return { isValid: false, message: '尚未輸入' };
  if (!/^\d{8}$/.test(taxId)) {
    return { isValid: false, message: '統編必須為 8 位數字' };
  }
  
  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  const digits = taxId.split('').map(Number);
  
  let total = 0;
  for (let i = 0; i < 8; i++) {
    const prod = digits[i] * weights[i];
    total += Math.floor(prod / 10) + (prod % 10);
  }
  
  const isValid = total % 10 === 0 || (digits[6] === 7 && (total + 1) % 10 === 0);
  return {
    isValid,
    message: isValid ? '統編格式正確 (符合邏輯驗證)' : '邏輯檢查驗證未通過 (請確認號碼)'
  };
}

const DEFAULT_SELLER_PROFILES: SellerSettings[] = [
  {
    sellerName: '晉瑞國際開發股份有限公司',
    sellerTaxId: '2840758',
    sellerContact: '林欣潔',
    sellerPhone: '0927-378620',
    sellerEmail: 'service@taishow.com.tw',
    sellerAddress: '嘉義市西區新民路1號',
    bankName: '首選跨國商業銀行 (007)',
    bankCode: '007',
    bankAccountName: '晉瑞國際開發股份有限公司',
    bankAccountNumber: '123-456-78901'
  },
  {
    sellerName: '極光數位藝術設計有限公司',
    sellerTaxId: '83569102',
    sellerContact: '李佳穎',
    sellerPhone: '0912-345-678',
    sellerEmail: 'service@aurora-design.co',
    sellerAddress: '台中市西屯區台灣大道三段 99 號',
    bankName: '台新國際商業銀行 (812)',
    bankCode: '812',
    bankAccountName: '極光數位藝術設計有限公司',
    bankAccountNumber: '201-102-39485'
  },
  {
    sellerName: '山海創意多媒體整合行銷社',
    sellerTaxId: '54910283',
    sellerContact: '陳志豪',
    sellerPhone: '04-23456789',
    sellerEmail: 'service@shanhai.co',
    sellerAddress: '高雄市新興區中正三路 120 號',
    bankName: '合作金庫商業銀行 (006)',
    bankCode: '006',
    bankAccountName: '山海創意多媒體整合行銷社',
    bankAccountNumber: '503-450-987654'
  }
];

export default function App() {
  const [quote, setQuote] = useState<Quote>(SAMPLE_QUOTE);
  const [history, setHistory] = useState<Quote[]>([]);
  const [defaultSeller, setDefaultSeller] = useState<SellerSettings | null>(null);
  const [sellerProfiles, setSellerProfiles] = useState<SellerSettings[]>(DEFAULT_SELLER_PROFILES);
  const [editingProfileIdx, setEditingProfileIdx] = useState<number>(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [quoteLayout, setQuoteLayout] = useState<'classic' | 'modern' | 'editorial'>('classic');
  const [quoteVersion, setQuoteVersion] = useState<'standard' | 'economy' | 'premium'>('standard');

  // Temp settings state
  const [tempSellerName, setTempSellerName] = useState('');
  const [tempSellerTaxId, setTempSellerTaxId] = useState('');
  const [tempSellerContact, setTempSellerContact] = useState('');
  const [tempSellerPhone, setTempSellerPhone] = useState('');
  const [tempSellerEmail, setTempSellerEmail] = useState('');
  const [tempSellerAddress, setTempSellerAddress] = useState('');
  const [tempBankName, setTempBankName] = useState('');
  const [tempBankCode, setTempBankCode] = useState('');
  const [tempBankAccountName, setTempBankAccountName] = useState('');
  const [tempBankAccountNumber, setTempBankAccountNumber] = useState('');
  const [tempSellerLogo, setTempSellerLogo] = useState<string | undefined>(undefined);

  // Load initialized items from localStorage on mount
  useEffect(() => {
    // 1. History
    try {
      const storedHistory = localStorage.getItem('invoice_quote_history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }

    // 2. Default Seller Settings & Profiles Array
    try {
      const storedProfiles = localStorage.getItem('invoice_quote_seller_profiles');
      let loadedProfiles = DEFAULT_SELLER_PROFILES;
      if (storedProfiles) {
        loadedProfiles = JSON.parse(storedProfiles);
        setSellerProfiles(loadedProfiles);
      } else {
        localStorage.setItem('invoice_quote_seller_profiles', JSON.stringify(DEFAULT_SELLER_PROFILES));
      }

      const storedSeller = localStorage.getItem('invoice_quote_default_seller');
      if (storedSeller) {
        const parsed = JSON.parse(storedSeller) as SellerSettings;
        setDefaultSeller(parsed);
        // Sync first profile with legacy default if index 0 is present
        if (loadedProfiles[0]) {
          loadedProfiles[0] = parsed;
          setSellerProfiles([...loadedProfiles]);
        }
        
        setTempSellerName(parsed.sellerName || '');
        setTempSellerTaxId(parsed.sellerTaxId || '');
        setTempSellerContact(parsed.sellerContact || '');
        setTempSellerPhone(parsed.sellerPhone || '');
        setTempSellerEmail(parsed.sellerEmail || '');
        setTempSellerAddress(parsed.sellerAddress || '');
        setTempBankName(parsed.bankName || '');
        setTempBankCode(parsed.bankCode || '');
        setTempBankAccountName(parsed.bankAccountName || '');
        setTempBankAccountNumber(parsed.bankAccountNumber || '');
        setTempSellerLogo(parsed.logo || undefined);
      } else {
        const initialDefault = loadedProfiles[0] || DEFAULT_SELLER_PROFILES[0];
        setDefaultSeller(initialDefault);
        setTempSellerName(initialDefault.sellerName || '');
        setTempSellerTaxId(initialDefault.sellerTaxId || '');
        setTempSellerContact(initialDefault.sellerContact || '');
        setTempSellerPhone(initialDefault.sellerPhone || '');
        setTempSellerEmail(initialDefault.sellerEmail || '');
        setTempSellerAddress(initialDefault.sellerAddress || '');
        setTempBankName(initialDefault.bankName || '');
        setTempBankCode(initialDefault.bankCode || '');
        setTempBankAccountName(initialDefault.bankAccountName || '');
        setTempBankAccountNumber(initialDefault.bankAccountNumber || '');
        setTempSellerLogo(initialDefault.logo || undefined);
      }
    } catch (e) {
      console.error('Failed to load default seller settings', e);
    }

    // 3. Current draft
    try {
      const activeDraft = localStorage.getItem('invoice_quote_active_draft');
      if (activeDraft) {
        setQuote(JSON.parse(activeDraft));
      } else {
        // Fallback to sample
        setQuote(SAMPLE_QUOTE);
      }
    } catch (e) {
      setQuote(SAMPLE_QUOTE);
    }
  }, []);

  // Save active quote to Draft local storage automatically on changes
  useEffect(() => {
    if (quote && quote.id !== 'sample-quote-id') {
      localStorage.setItem('invoice_quote_active_draft', JSON.stringify(quote));
    }
  }, [quote]);

  // Handle Input Changes on Quote Level
  const updateMetaField = (key: keyof Quote, value: any) => {
    setQuote(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle Item Changes on specific row
  const updateItemField = (id: string, key: keyof QuoteItem, value: any) => {
    setQuote(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [key]: value };
          // Enforce non-negative values for quantity/price
          if (key === 'qty') updated.qty = Math.max(0, Number(value) || 0);
          if (key === 'price') updated.price = Math.max(0, Number(value) || 0);
          return updated;
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });
  };

  // Add a new raw row
  const addNewRow = () => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      unit: '式',
      qty: 1,
      price: 0
    };
    setQuote(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // Duplicate an existing row
  const duplicateRow = (id: string) => {
    setQuote(prev => {
      const idx = prev.items.findIndex(item => item.id === id);
      if (idx === -1) return prev;
      
      const copyItem = {
        ...prev.items[idx],
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
      };
      
      const updatedItems = [...prev.items];
      updatedItems.splice(idx + 1, 0, copyItem);
      return { ...prev, items: updatedItems };
    });
  };

  // Delete a specific row
  const deleteRow = (id: string) => {
    setQuote(prev => {
      // Must keep at least one row for neat layout
      if (prev.items.length <= 1) {
        return {
          ...prev,
          items: [{ id: `item-${Date.now()}`, name: '', unit: '式', qty: 1, price: 0 }]
        };
      }
      return {
        ...prev,
        items: prev.items.filter(item => item.id !== id)
      };
    });
  };

  // Move a row up
  const moveRowUp = (id: string) => {
    setQuote(prev => {
      const idx = prev.items.findIndex(item => item.id === id);
      if (idx <= 0) return prev; // Cannot move first item up
      const newItems = [...prev.items];
      const temp = newItems[idx];
      newItems[idx] = newItems[idx - 1];
      newItems[idx - 1] = temp;
      return { ...prev, items: newItems };
    });
  };

  // Move a row down
  const moveRowDown = (id: string) => {
    setQuote(prev => {
      const idx = prev.items.findIndex(item => item.id === id);
      if (idx === -1 || idx >= prev.items.length - 1) return prev; // Cannot move last item down
      const newItems = [...prev.items];
      const temp = newItems[idx];
      newItems[idx] = newItems[idx + 1];
      newItems[idx + 1] = temp;
      return { ...prev, items: newItems };
    });
  };

  // Calculate Subtotals and General Totals based on current state
  const calculateTotals = () => {
    const baseSubtotal = quote.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    
    // Apply scheme version modifier
    let versionAdjustment = 0;
    if (quoteVersion === 'economy') {
      versionAdjustment = -Math.round(baseSubtotal * 0.15); // 精簡版 85 折 (折抵 15%)
    } else if (quoteVersion === 'premium') {
      versionAdjustment = Math.round(baseSubtotal * 0.15);  // 尊榮版 +15% 頂規服務
    }

    const rawSubtotal = baseSubtotal + versionAdjustment;
    let tax = 0;
    let finalTotal = rawSubtotal;

    if (quote.taxType === 'EXTERNAL') {
      tax = Math.round(rawSubtotal * quote.taxRate);
      finalTotal = rawSubtotal + tax;
    } else if (quote.taxType === 'INTERNAL') {
      // Inside tax, means finalTotal is equal to rawSubtotal, and the tax is calculated as backwards:
      finalTotal = rawSubtotal;
      tax = Math.round(rawSubtotal - (rawSubtotal / (1 + quote.taxRate)));
    } else {
      // FREE or ZERO (Exempt)
      tax = 0;
      finalTotal = rawSubtotal;
    }

    return {
      baseSubtotal,
      versionAdjustment,
      subtotal: rawSubtotal,
      tax,
      finalTotal
    };
  };

  // Load a brand new empty Quote
  const resetToBlank = () => {
    const freshId = `QT-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-01`;
    const formatToday = new Date().toISOString().split('T')[0];
    const formatNextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const emptyQuote: Quote = {
      id: `quote-${Date.now()}`,
      quoteNo: freshId,
      date: formatToday,
      validUntil: formatNextMonth,
      
      // Load current default seller, or empty
      sellerName: defaultSeller?.sellerName || '',
      sellerTaxId: defaultSeller?.sellerTaxId || '',
      sellerContact: defaultSeller?.sellerContact || '',
      sellerPhone: defaultSeller?.sellerPhone || '',
      sellerEmail: defaultSeller?.sellerEmail || '',
      sellerAddress: defaultSeller?.sellerAddress || '',
      logo: defaultSeller?.logo,

      buyerName: '',
      buyerTaxId: '',
      buyerContact: '',
      buyerPhone: '',
      buyerAddress: '',

      items: [
        { id: `item-${Date.now()}-1`, name: '', unit: '式', qty: 1, price: 0 }
      ],
      taxType: 'EXTERNAL',
      taxRate: 0.05,
      showTaxId: true,

      notes: '1. 本報價單自開立起 30 天內有效。\n2. 付款方式：匯款交付。',
      
      bankName: defaultSeller?.bankName || '',
      bankCode: defaultSeller?.bankCode || '',
      bankAccountName: defaultSeller?.bankAccountName || '',
      bankAccountNumber: defaultSeller?.bankAccountNumber || '',

      showStampPlaceholder: true,
      stampText: defaultSeller?.sellerName 
        ? `${defaultSeller.sellerName.substring(0, 6)}\n統一發票專用章`
        : '公司寶號\n統一發票專用章'
    };

    setQuote(emptyQuote);
    localStorage.removeItem('invoice_quote_active_draft');
  };

  // Save current quote to history
  const saveQuoteToHistory = () => {
    // If it's a sample quote, give it a real ID to avoid clashing
    const quoteToSave = { ...quote };
    if (quoteToSave.id === 'sample-quote-id') {
      quoteToSave.id = `quote-${Date.now()}`;
    }

    setHistory(prev => {
      // Check if it already exists, overwrite if true
      const existsIdx = prev.findIndex(item => item.id === quoteToSave.id);
      let updated;
      if (existsIdx !== -1) {
        updated = [...prev];
        updated[existsIdx] = quoteToSave;
      } else {
        updated = [quoteToSave, ...prev];
      }
      localStorage.setItem('invoice_quote_history', JSON.stringify(updated));
      return updated;
    });

    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 2500);
  };

  // Load a quote from saved history
  const loadFromHistory = (savedQuote: Quote) => {
    setQuote(savedQuote);
    // Switch tab to edit on mobile for instant visibility
    setActiveTab('edit');
  };

  // Delete quote from history
  const deleteFromHistory = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (confirm('確定要刪除此筆報價單紀錄嗎？')) {
      setHistory(prev => {
        const filtered = prev.filter(item => item.id !== id);
        localStorage.setItem('invoice_quote_history', JSON.stringify(filtered));
        return filtered;
      });
    }
  };

  // Apply selected seller profile immediately to current editing quote
  const applySellerProfile = (idx: number, multiplier?: number) => {
    const profile = sellerProfiles[idx];
    if (!profile) return;

    if (idx === 0) setQuoteLayout('classic');
    else if (idx === 1) setQuoteLayout('modern');
    else if (idx === 2) setQuoteLayout('editorial');

    setQuote(prev => {
      let updatedItems = prev.items;
      if (multiplier && multiplier !== 1) {
        updatedItems = prev.items.map(item => ({
          ...item,
          price: Math.round(item.price * multiplier)
        }));
      }

      return {
        ...prev,
        sellerName: profile.sellerName || '',
        sellerTaxId: profile.sellerTaxId || '',
        sellerContact: profile.sellerContact || '',
        sellerPhone: profile.sellerPhone || '',
        sellerEmail: profile.sellerEmail || '',
        sellerAddress: profile.sellerAddress || '',
        bankName: profile.bankName || '',
        bankCode: profile.bankCode || '',
        bankAccountName: profile.bankAccountName || '',
        bankAccountNumber: profile.bankAccountNumber || '',
        logo: profile.logo || undefined,
        stampText: profile.sellerName 
          ? `${profile.sellerName.substring(0, 6)}\n報價專用章`
          : prev.stampText,
        items: updatedItems
      };
    });
  };

  // Multiply all item prices by a multiplier factor (ideal for quotation differentials)
  const applyPriceMultiplier = (factor: number) => {
    if (confirm(`確定要將目前報價單內所有項目的單價一鍵乘上 ${factor * 100}% 嗎？（系統將自動四捨五入取整整）`)) {
      setQuote(prev => ({
        ...prev,
        items: prev.items.map(item => ({
          ...item,
          price: Math.round(item.price * factor)
        }))
      }));
    }
  };

  // Switch between editing different seller profiles in Settings Modal (temporary cache current edits first)
  const switchEditingProfile = (newIdx: number) => {
    const currentFields: SellerSettings = {
      sellerName: tempSellerName,
      sellerTaxId: tempSellerTaxId,
      sellerContact: tempSellerContact,
      sellerPhone: tempSellerPhone,
      sellerEmail: tempSellerEmail,
      sellerAddress: tempSellerAddress,
      bankName: tempBankName,
      bankCode: tempBankCode,
      bankAccountName: tempBankAccountName,
      bankAccountNumber: tempBankAccountNumber,
      logo: tempSellerLogo
    };

    const updated = [...sellerProfiles];
    updated[editingProfileIdx] = currentFields;
    setSellerProfiles(updated);

    const target = updated[newIdx];
    if (target) {
      setTempSellerName(target.sellerName || '');
      setTempSellerTaxId(target.sellerTaxId || '');
      setTempSellerContact(target.sellerContact || '');
      setTempSellerPhone(target.sellerPhone || '');
      setTempSellerEmail(target.sellerEmail || '');
      setTempSellerAddress(target.sellerAddress || '');
      setTempBankName(target.bankName || '');
      setTempBankCode(target.bankCode || '');
      setTempBankAccountName(target.bankAccountName || '');
      setTempBankAccountNumber(target.bankAccountNumber || '');
      setTempSellerLogo(target.logo || undefined);
    }
    setEditingProfileIdx(newIdx);
  };

  // Update original settings profile of company
  const saveDefaultSellerSettings = (e: FormEvent) => {
    e.preventDefault();
    const settings: SellerSettings = {
      sellerName: tempSellerName,
      sellerTaxId: tempSellerTaxId,
      sellerContact: tempSellerContact,
      sellerPhone: tempSellerPhone,
      sellerEmail: tempSellerEmail,
      sellerAddress: tempSellerAddress,
      bankName: tempBankName,
      bankCode: tempBankCode,
      bankAccountName: tempBankAccountName,
      bankAccountNumber: tempBankAccountNumber,
      logo: tempSellerLogo
    };

    const updatedProfiles = [...sellerProfiles];
    updatedProfiles[editingProfileIdx] = settings;
    setSellerProfiles(updatedProfiles);
    localStorage.setItem('invoice_quote_seller_profiles', JSON.stringify(updatedProfiles));

    // Keep defaultSeller in sync if editing profile index 0
    if (editingProfileIdx === 0) {
      localStorage.setItem('invoice_quote_default_seller', JSON.stringify(settings));
      setDefaultSeller(settings);
    }

    setShowSettingsModal(false);

    // Prompt user to sync current quote
    if (confirm(`已儲存！是否將「${settings.sellerName || '本商號'}」的詳細設定值套用至目前正在編輯的報價單中？`)) {
      setQuote(prev => ({
        ...prev,
        sellerName: tempSellerName,
        sellerTaxId: tempSellerTaxId,
        sellerContact: tempSellerContact,
        sellerPhone: tempSellerPhone,
        sellerEmail: tempSellerEmail,
        sellerAddress: tempSellerAddress,
        bankName: tempBankName,
        bankCode: tempBankCode,
        bankAccountName: tempBankAccountName,
        bankAccountNumber: tempBankAccountNumber,
        logo: tempSellerLogo,
        stampText: tempSellerName 
          ? `${tempSellerName.substring(0, 6)}\n報價專用章`
          : prev.stampText
      }));
    }
  };

  // Open default settings modal
  const openSettingsModal = () => {
    setEditingProfileIdx(0);
    const profile = sellerProfiles[0];
    if (profile) {
      setTempSellerName(profile.sellerName || '');
      setTempSellerTaxId(profile.sellerTaxId || '');
      setTempSellerContact(profile.sellerContact || '');
      setTempSellerPhone(profile.sellerPhone || '');
      setTempSellerEmail(profile.sellerEmail || '');
      setTempSellerAddress(profile.sellerAddress || '');
      setTempBankName(profile.bankName || '');
      setTempBankCode(profile.bankCode || '');
      setTempBankAccountName(profile.bankAccountName || '');
      setTempBankAccountNumber(profile.bankAccountNumber || '');
      setTempSellerLogo(profile.logo || undefined);
    } else if (defaultSeller) {
      setTempSellerName(defaultSeller.sellerName || '');
      setTempSellerTaxId(defaultSeller.sellerTaxId || '');
      setTempSellerContact(defaultSeller.sellerContact || '');
      setTempSellerPhone(defaultSeller.sellerPhone || '');
      setTempSellerEmail(defaultSeller.sellerEmail || '');
      setTempSellerAddress(defaultSeller.sellerAddress || '');
      setTempBankName(defaultSeller.bankName || '');
      setTempBankCode(defaultSeller.bankCode || '');
      setTempBankAccountName(defaultSeller.bankAccountName || '');
      setTempBankAccountNumber(defaultSeller.bankAccountNumber || '');
      setTempSellerLogo(defaultSeller.logo || undefined);
    } else {
      setTempSellerName(quote.sellerName || '');
      setTempSellerTaxId(quote.sellerTaxId || '');
      setTempSellerContact(quote.sellerContact || '');
      setTempSellerPhone(quote.sellerPhone || '');
      setTempSellerEmail(quote.sellerEmail || '');
      setTempSellerAddress(quote.sellerAddress || '');
      setTempBankName(quote.bankName || '');
      setTempBankCode(quote.bankCode || '');
      setTempBankAccountName(quote.bankAccountName || '');
      setTempBankAccountNumber(quote.bankAccountNumber || '');
      setTempSellerLogo(quote.logo || undefined);
    }
    setShowSettingsModal(true);
  };

  // Preset loading templates
  const loadPreset = (type: 'design' | 'photo' | 'blank') => {
    if (type === 'blank') {
      resetToBlank();
      return;
    }

    let presetItems: QuoteItem[] = [];
    let presetNotes = '';
    let name = '';

    if (type === 'design') {
      name = '平面視覺與品牌企業形象設計案';
      presetItems = [
        { id: 'p-1', name: '品牌標誌 (Logo) 與企業核心識別系統設計', unit: '款', qty: 1, price: 28000 },
        { id: 'p-2', name: '企業標準名片、簡報 PPT 範本與信封周邊設計', unit: '套', qty: 1, price: 12000 },
        { id: 'p-3', name: '文宣摺頁、產品型錄平面美術排版與插畫繪製', unit: '頁', qty: 10, price: 1500 },
        { id: 'p-4', name: '專業印刷打樣與紙張材質挑選顧問服務', unit: '次', qty: 2, price: 3000 }
      ];
      presetNotes = '【設計類合約條款】\n1. 本合約自正式生效起，首階段提供三款 Logo 初稿供挑選。\n2. 設計草案修改次數限制為三次，超過三次將以每工時 NT$ 1,200 計薪。\n3. 所有權部分：驗收尾款付清後提供向量原始檔案(.AI / .PDF)。';
    } else if (type === 'photo') {
      name = '商業空間與企業年度宣傳短片拍攝專案';
      presetItems = [
        { id: 'v-1', name: '前置腳本策劃、場景勘查與分鏡腳本繪製', unit: '式', qty: 1, price: 15000 },
        { id: 'v-2', name: '商業空間高畫質平面攝影 (合規燈光與多角度拍攝)', unit: '天', qty: 1, price: 20000 },
        { id: 'v-3', name: '年度形象宣傳短片錄影 (4K 單眼、穩定器、無線麥克風)', unit: '天', qty: 2, price: 18000 },
        { id: 'v-4', name: '後期非線性剪輯、專業調色、襯樂授權與字幕特效', unit: '分鐘', qty: 3, price: 8000 }
      ];
      presetNotes = '【影像合約條款】\n1. 天災、雨天備案：如遇不可抗力之氣候因素導致戶外無法拍攝，可延期一次不收取額外服務費。\n2. 後續修剪：初剪完成後提供兩次「細節修改」，超出修改額度或更改原定分鏡需酌收剪輯費。\n3. 保證金與尾款：開拍前需付總額 50% 定金，交付最終母帶後 7 日內付清尾款。';
    }

    const freshId = `QT-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 90 + 10)}`;
    const formatToday = new Date().toISOString().split('T')[0];
    const formatNextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    setQuote({
      id: `quote-${Date.now()}`,
      quoteNo: freshId,
      date: formatToday,
      validUntil: formatNextMonth,
      sellerName: defaultSeller?.sellerName || '本島視覺整合工作室',
      sellerTaxId: defaultSeller?.sellerTaxId || '24681357',
      sellerContact: defaultSeller?.sellerContact || '王大明',
      sellerPhone: defaultSeller?.sellerPhone || '0987-654-321',
      sellerEmail: defaultSeller?.sellerEmail || 'contact@islandvisual.tw',
      sellerAddress: defaultSeller?.sellerAddress || '台北市信義區忠孝東路五段 1 號',
      buyerName: '鼎盛跨國創投集團有限公司',
      buyerTaxId: '13572468',
      buyerContact: '李特助',
      buyerPhone: '02-8765-4321',
      buyerAddress: '台北市內湖區瑞光路 256 號',
      items: presetItems,
      taxType: 'EXTERNAL',
      taxRate: 0.05,
      showTaxId: true,
      notes: presetNotes,
      bankName: defaultSeller?.bankName || '首選跨國商業銀行 (007)',
      bankCode: defaultSeller?.bankCode || '123-456-78901',
      bankAccountName: defaultSeller?.bankAccountName || '本島視覺整合工作室',
      bankAccountNumber: defaultSeller?.bankAccountNumber || '123-456-78901',
      showStampPlaceholder: true,
      stampText: defaultSeller?.sellerName 
        ? `${defaultSeller.sellerName.substring(0, 6)}\n報價發票專用章`
        : '本島視覺整合\n報價發票專用章'
    });
  };

  // Real-time calculated values
  const { baseSubtotal, versionAdjustment, subtotal, tax, finalTotal } = calculateTotals();
  const sellerTaxIdValidation = validateTaiwanTaxId(quote.sellerTaxId);
  const buyerTaxIdValidation = validateTaiwanTaxId(quote.buyerTaxId);

  // Taiwan Invoice Traditional Chinese Upper-Case Capital Numerals Parser
  const toTaiwanChineseBigNumber = (num: number): string => {
    if (isNaN(num) || num < 0) return '';
    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const units = ['', '拾', '佰', '仟'];
    const bigUnits = ['', '萬', '億', '兆'];
    let strNum = Math.floor(num).toString();
    if (strNum === '0') return '零';
    let result = '';
    let zeroCount = 0;
    for (let i = 0; i < strNum.length; i++) {
      let index = strNum.length - 1 - i;
      let digit = parseInt(strNum[i], 10);
      let unitIndex = index % 4;
      let bigUnitIndex = Math.floor(index / 4);
      if (digit === 0) {
        zeroCount++;
      } else {
        if (zeroCount > 0) {
          result += '零';
          zeroCount = 0;
        }
        result += digits[digit] + units[unitIndex];
      }
      if (unitIndex === 0 && bigUnitIndex > 0) {
        if (result.endsWith('零')) {
          result = result.slice(0, -1);
        }
        if (result.length > 0 && !result.endsWith(bigUnits[bigUnitIndex])) {
          result += bigUnits[bigUnitIndex];
        }
        zeroCount = 0;
      }
    }
    if (result.endsWith('零')) {
      result = result.slice(0, -1);
    }
    return result || '零';
  };

  // Dynamic Layout Theme styles for physical A4 simulation
  const layoutStyles = {
    topBarColor: 
      quoteLayout === 'modern' ? 'bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500' :
      quoteLayout === 'editorial' ? 'bg-amber-700 bg-[repeating-linear-gradient(45deg,#b45309,#b45309_10px,#92400e_10px,#92400e_20px)]' : 'bg-slate-800',
    fontFamily: 
      quoteLayout === 'editorial' ? 'font-serif' : 'font-sans',
    pageBgClass:
      quoteLayout === 'editorial' ? 'bg-[#fdf9f0] border-amber-900/10 text-[#423119] py-14 px-8 sm:py-16 sm:px-14 shadow-lg' :
      quoteLayout === 'modern' ? 'bg-[#fafefe] border-teal-200/40 py-10 px-6 sm:py-12 sm:px-10 shadow-md' :
      'bg-white border-slate-200/95 py-10 px-6 sm:py-14 sm:px-12 shadow-2xl',
    headerFlex:
      quoteLayout === 'modern' ? 'flex flex-col sm:flex-row-reverse justify-between items-start gap-6 w-full' :
      quoteLayout === 'editorial' ? 'flex flex-col items-center justify-center gap-4 text-center w-full' :
      'flex flex-col sm:flex-row justify-between items-start gap-4 w-full',
    headerBorder:
      quoteLayout === 'modern' ? 'border-b-4 border-teal-500/80 pb-5 mb-5' :
      quoteLayout === 'editorial' ? 'border-b-4 border-double border-amber-850 pb-5 mb-5' : 'border-b-2 border-slate-905 pb-6 mb-6',
    titleColor:
      quoteLayout === 'modern' ? 'text-teal-950 font-extrabold tracking-wide uppercase font-sans' :
      quoteLayout === 'editorial' ? 'text-amber-950 font-serif font-black tracking-[0.25em]' : 'text-slate-900 font-extrabold',
    tableHeaderBg:
      quoteLayout === 'modern' ? 'bg-teal-600 text-white font-semibold' :
      quoteLayout === 'editorial' ? 'bg-amber-100/50 text-amber-950 font-serif font-bold border-y border-amber-800' : 'bg-slate-55 text-slate-700 font-bold',
    tableHeaderTrClass:
      quoteLayout === 'modern' ? 'border-b border-teal-600 text-white' :
      quoteLayout === 'editorial' ? 'border-y border-amber-800 text-amber-950' : 'border-b-2 border-slate-900 bg-slate-50',
    buyerSectionClass:
      quoteLayout === 'editorial' ? 'grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-dashed divide-amber-800/25 p-5 gap-6 bg-amber-50/10 border-2 border-double border-amber-800/20 rounded-md font-serif' :
      quoteLayout === 'modern' ? 'grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-[#fafdfd] border-l-4 border-l-teal-600 border-y border-r border-teal-100/40 rounded-r-xl shadow-xs' :
      'grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 border border-slate-100/85 p-4 rounded-lg',
    remittanceBoxClass:
      quoteLayout === 'editorial' ? 'bg-amber-50/15 p-5 border border-dashed border-amber-200 rounded-md font-serif' :
      quoteLayout === 'modern' ? 'bg-teal-50/20 p-4 border border-teal-100/30 rounded-lg shadow-xs' :
      'bg-slate-50/60 p-4 border border-slate-100 rounded-lg',
    totalsBoxBg:
      quoteLayout === 'editorial' ? 'bg-amber-50/10 p-5 border-2 border-double border-amber-900/15 rounded-md font-serif' :
      quoteLayout === 'modern' ? 'bg-gradient-to-br from-teal-50/20 to-indigo-50/15 p-5 border border-teal-100/30 rounded-2xl shadow-xs' :
      'bg-slate-50/60 p-4 border border-slate-100 rounded-lg',
    notesBoxClass:
      quoteLayout === 'editorial' ? 'w-full text-xs text-amber-950/80 leading-relaxed bg-[#fbf8f0] p-4 rounded-none border border-dashed border-amber-300 focus:outline-none focus:border-amber-600 focus:bg-white resize-y print:border-none print:p-0 print:text-black print:bg-white print:resize-none font-serif' :
      quoteLayout === 'modern' ? 'w-full text-xs text-teal-900/80 leading-relaxed bg-[#f7fcfd] p-4 rounded-xl border border-teal-100 focus:outline-none focus:border-teal-400 focus:bg-white resize-y print:border-none print:p-0 print:text-black print:bg-white print:resize-none' :
      'w-full text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-150 focus:outline-none focus:border-slate-400 focus:bg-white resize-y print:border-none print:p-0 print:text-black print:bg-white print:resize-none',
    stampClass:
      quoteLayout === 'modern' ? 'w-[105px] h-[105px] border-4 border-red-500 text-red-500 font-mono font-bold flex flex-col justify-center items-center leading-normal select-none relative p-1.5 text-center text-xs' :
      quoteLayout === 'editorial' ? 'w-24 h-24 rounded-full border-2 border-double border-red-600 flex flex-col justify-center items-center text-red-600 font-serif font-bold text-[10.5px] leading-tight select-none relative bg-red-50/10' :
      'w-28 h-28 rounded-full border-2 border-dashed border-red-400/70 p-2 text-center text-red-500/80 flex flex-col justify-center items-center leading-none relative font-sans',
    stampOuterBorder:
      quoteLayout === 'modern' ? 'absolute inset-0.5 border border-red-500/50 pointer-events-none' :
      quoteLayout === 'editorial' ? 'absolute inset-0.5 rounded-full border border-red-600/35 pointer-events-none' : 'absolute inset-0 rounded-full border-2 border-red-400/30 scale-105 pointer-events-none'
  };

  // Trigger system Print dialog
  const handlePrint = () => {
    window.print();
  };

  // Export quote data to Excel sheet using sheetjs (XLSX)
  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      const taxLabel = quote.taxType === 'EXTERNAL' ? '5% 外加' :
                       quote.taxType === 'INTERNAL' ? '5% 內含' : '0% 免稅';
                       
      const subtotalVal = quote.taxType === 'INTERNAL' ? (subtotal - tax) : subtotal;

      const excelData = [
        ["新台幣電子報價單 (Quotation Sheet)"],
        [],
        ["一、 報價基礎資訊"],
        ["報價單號：", quote.quoteNo || "", "", "報價日期：", quote.date || ""],
        ["有效期限：", quote.validUntil || ""],
        [],
        ["二、 交易雙方資訊"],
        ["【賣方 / 報價商號】", "", "", "【買方 / 客戶】"],
        ["公司/商號名稱：", quote.sellerName || "", "", "公司/客戶名稱：", quote.buyerName || ""],
        ["統一編號：", quote.sellerTaxId || "", "", "統一編號：", quote.buyerTaxId || ""],
        ["聯絡人：", quote.sellerContact || "", "", "聯絡人：", quote.buyerContact || ""],
        ["聯絡電話：", quote.sellerPhone || "", "", "聯絡電話：", quote.buyerPhone || ""],
        ["聯絡信箱：", quote.sellerEmail || "", "", "聯絡信箱：", quote.buyerEmail || ""],
        ["通訊地址：", quote.sellerAddress || "", "", "通訊地址：", quote.buyerAddress || ""],
        [],
        ["三、 報價項目明細"],
        ["項次", "項目名稱 與 規格描述", "數量", "單位", "單價 (NT$)", "小計 (NT$)"],
        ...quote.items.map((item, index) => [
          index + 1,
          item.name || "",
          item.qty,
          item.unit || "",
          item.price,
          item.qty * item.price
        ]),
        [],
        ["", "", "", "", "項目小計金額 (稅前)：", subtotalVal],
        ["", "", "", "", `營業稅額 (${taxLabel})：`, tax],
        ["", "", "", "", "報價總計金額 (含稅)：", finalTotal],
        ["", "", "", "", "大寫金額語意：", `新台幣：整整 (${finalTotal.toLocaleString()} 元)`],
        [],
        ["四、 匯款資訊與備註"],
        ["銀行名稱：", quote.bankName || "", "", "備註說明："],
        ["銀行代碼：", quote.bankCode || "", "", quote.notes || "無"],
        ["戶名：", quote.bankAccountName || ""],
        ["帳號：", quote.bankAccountNumber || ""]
      ];

      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Set some nice column widths
      ws['!cols'] = [
        { wch: 12 }, // Column A
        { wch: 38 }, // Column B
        { wch: 10 }, // Column C
        { wch: 10 }, // Column D
        { wch: 15 }, // Column E
        { wch: 15 }  // Column F
      ];

      XLSX.utils.book_append_sheet(wb, ws, "報價單明細");
      
      // Generate filename based on seller name and quote number
      const filename = `${quote.sellerName || "報價單"}_${quote.quoteNo || "Export"}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (e) {
      console.error("匯出 Excel 失敗:", e);
      alert("匯出 Excel 檔案失敗，請檢查輸入內容是否包含特殊字元！");
    }
  };

  const filteredHistory = history.filter(q => 
    q.quoteNo.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
    q.buyerName.toLowerCase().includes(searchHistoryQuery.toLowerCase()) ||
    q.sellerName.toLowerCase().includes(searchHistoryQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased print:bg-white print:text-black">
      {/* Background decoration (hidden in printing) */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-slate-900 border-b border-slate-800 pointer-events-none no-print print:hidden z-0" />

      {/* Main Core Viewport Wrapper */}
      <div className="relative max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 z-10 print:p-0 print:max-w-none">
        
        {/* Header Ribbon (hidden in printing) */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-4 border-b border-white/10 no-print">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 text-teal-400 rounded-lg shadow-inner ring-1 ring-white/10">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">線上報價單生成器</h1>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Quotation Studio — 高規格台灣商業稅率與排版優化系統
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0 font-medium">
            <button
              onClick={openSettingsModal}
              id="set_default_profile_btn"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm transition-all focus:ring-2 focus:ring-teal-500/20"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>設定預設商號資料</span>
            </button>

            <button
              onClick={saveQuoteToHistory}
              id="save_draft_quote_btn"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm transition-all focus:ring-2 focus:ring-teal-500/20"
            >
              <Save className="w-4 h-4 text-teal-400" />
              <span>儲存歷史紀錄</span>
            </button>

            <button
              onClick={exportToExcel}
              id="export_excel_btn"
              className="flex items-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 hover:-translate-y-0.5 transition-all focus:ring-2 focus:ring-emerald-500"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>另存為 Excel 檔</span>
            </button>

            <button
              onClick={handlePrint}
              id="trigger_pdf_print_btn"
              className="flex items-center gap-1.5 px-4.5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-sm shadow-md shadow-teal-500/10 hover:shadow-teal-500/20 hover:-translate-y-0.5 transition-all focus:ring-2 focus:ring-teal-400"
            >
              <Printer className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>列印 / 另存 PDF</span>
            </button>
          </div>
        </header>

        {/* Global Save Indicator Alert */}
        <AnimatePresence>
          {showSaveSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-teal-500 text-teal-950 px-4 py-3 rounded-lg shadow-lg flex items-center justify-between font-semibold text-sm mb-4 no-print z-50 relative"
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 stroke-[2.5]" />
                本筆報價單：已成功儲存至「本機歷史紀錄」中 (隨時可再次載入或編輯)。
              </span>
              <button onClick={() => setShowSaveSuccess(false)} className="text-teal-950 hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile View Toggle Tabs (Only visible on screens &lt; lg, hidden in printing) */}
        <div className="flex border-b border-slate-200 mb-6 lg:hidden no-print">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex-1 text-center py-3 font-semibold border-b-2 text-sm transition-all ${
              activeTab === 'edit' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500'
            }`}
          >
            編輯設定與項目
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 text-center py-3 font-semibold border-b-2 text-sm transition-all ${
              activeTab === 'preview' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500'
            }`}
          >
            報價單預覽與列印
          </button>
        </div>

        {/* Desktop Split Grid / Mobile responsive content stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
          
          {/* =======================================================
              SIDEBAR PANEL: Drafts, Presets, Settings (Hidden in print)
              ======================================================= */}
          <section className={`lg:col-span-4 space-y-6 no-print ${activeTab === 'edit' ? 'block' : 'hidden lg:block'}`}>
            
            {/* Quick Presets Builder (Bento card style) */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-100">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-slate-900 text-sm">報價單整合範本庫</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                快速套用預設的商業整合報價單欄位格式，可在此基礎上依需求修改：
              </p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => loadPreset('design')}
                  className="w-full text-left py-2 px-3 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 border border-indigo-100/60 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <span>品牌形象與平面設計專案</span>
                  <span className="text-[10px] bg-indigo-200/50 text-indigo-900 px-1.5 py-0.5 rounded font-mono">5%加稅</span>
                </button>
                
                <button
                  onClick={() => loadPreset('photo')}
                  className="w-full text-left py-2 px-3 bg-purple-50/50 hover:bg-purple-50 text-purple-900 border border-purple-100/60 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <span>商業攝影與影像剪輯案</span>
                  <span className="text-[10px] bg-purple-200/50 text-purple-900 px-1.5 py-0.5 rounded font-mono">外加應稅</span>
                </button>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => loadPreset('blank')}
                    className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-medium text-center transition-colors flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>清空表單</span>
                  </button>
                  <button
                    onClick={resetToBlank}
                    className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>建立新單</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 三家商號快速比價與切換套用 (Three-Seller Quotation Selector) */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -tr-10 translate-x-4 -translate-y-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-indigo-900/60 z-10 relative">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm text-[13px]">💼 三社比價 / 商號快速切換</h3>
                </div>
                <button
                  type="button"
                  onClick={openSettingsModal}
                  className="text-[10px] text-indigo-300 hover:text-white border border-indigo-700 hover:border-indigo-500 rounded px-1.5 py-0.5 transition-all font-semibold"
                >
                  設定三社
                </button>
              </div>
              
              <p className="text-[11px] text-indigo-200/80 mb-4 leading-relaxed relative z-10">
                專為「<b>比價投標</b>」設計。可一鍵切換此項目的報價主商號，並選套專屬差價比例，一次輕鬆產生三家不同版本的報價單：
              </p>

              <div className="space-y-3 relative z-10">
                {sellerProfiles.map((profile, idx) => {
                  const isActive = quote.sellerName === profile.sellerName;
                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg border transition-all text-xs ${
                        isActive 
                          ? 'bg-indigo-600/35 border-indigo-500 shadow-inner' 
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1.5">
                        <span className="flex items-center gap-1.5 truncate max-w-[70%]">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-teal-400 animate-pulse' : 'bg-slate-500'}`} />
                          <span className="truncate">{profile.sellerName || `商號 ${idx + 1}`}</span>
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-indigo-950 font-mono text-indigo-300 transform scale-90 origin-right">
                          {idx === 0 ? '一號 · 標配組' : idx === 1 ? '二號 · 調整組' : '三號 · 備載組'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => applySellerProfile(idx, 1)}
                          className="py-1 px-1.5 bg-indigo-500/30 hover:bg-indigo-500 text-white border border-indigo-500/30 rounded text-[10px] font-bold text-center transition-all whitespace-nowrap"
                        >
                          原價套用 (100%)
                        </button>
                        <button
                          type="button"
                          onClick={() => applySellerProfile(idx, idx === 0 ? 1.03 : idx === 1 ? 1.05 : 1.12)}
                          className="py-1 px-1.5 bg-slate-900/60 hover:bg-slate-950 text-indigo-200 hover:text-white border border-slate-800 rounded text-[10px] font-bold text-center transition-all whitespace-nowrap"
                          title="套用該公司並同時對該表項目單價進行比例加成"
                        >
                          加成套用 ({idx === 0 ? '+3%' : idx === 1 ? '+5%' : '+12%'})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Incremental Multi-item Price Scaler Tool */}
              <div className="mt-4 pt-3.5 border-t border-indigo-900/60 relative z-10">
                <div className="flex items-center justify-between text-[11px] mb-2 font-semibold">
                  <span className="text-indigo-300">目前項目單價一鍵調整比例：</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { label: '-5% 低價', val: 0.95 },
                    { label: '原始價', val: 1.0 },
                    { label: '+5% 調整', val: 1.05 },
                    { label: '+10% 溢價', val: 1.10 }
                  ].map((btn, bidx) => (
                    <button
                      key={bidx}
                      type="button"
                      onClick={() => applyPriceMultiplier(btn.val)}
                      className="py-1 text-[9px] bg-slate-800 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-slate-700 hover:border-indigo-700 rounded text-center transition-all active:scale-95 leading-normal font-semibold"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-indigo-300/60 mt-1.5 text-center leading-normal">
                  點擊比例後，系統會自動將各項目「單價」增刪相乘並四捨五入取整整。
                </p>
              </div>
            </div>

            {/* 報價單外觀排版樣式＆自選比較方案 (Quotation Themes & Alternate Scheme Versions) */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
              {/* Part 1: Visually distinct templates */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-100">
                  <Palette className="w-4 h-4 text-pink-500" />
                  <h3 className="font-bold text-slate-800 text-sm">單據排版風格樣式 (三家特徵)</h3>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  系統在切換商辦時會<b>自動為您配置對應的排版</b>。您也可以在此手動變更，體驗不同字體與視覺風格：
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'classic', label: '典雅藍灰', desc: '標準專業' },
                    { id: 'modern', label: '極光雙色', desc: '科技現代' },
                    { id: 'editorial', label: '山海暖棕', desc: '文藝精緻' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setQuoteLayout(style.id as any)}
                      className={`py-2 px-1 rounded-lg border text-center transition-all ${
                        quoteLayout === style.id
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/10 font-bold'
                          : 'bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="text-xs">{style.label}</div>
                      <div className="text-[9px] opacity-75 scale-90">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Part 2: Buyer Selection Variants */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-100">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-bold text-slate-800 text-sm">報價方案版本自選 (供客戶比較)</h3>
                </div>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  提供<b>另兩個不同版本的報價方案</b>給客戶對比。在右側 A4 紙本上會即時試算出對應方案細則與合計：
                </p>
                <div className="space-y-1.5">
                  {[
                    { id: 'standard', label: '常規標準版 (100% 原始標配)', desc: '標準完備配置與工程最實用單價' },
                    { id: 'economy', label: '精簡特惠版 (85% 實惠省款)', desc: '精簡非核心規格，直接折扣 15%' },
                    { id: 'premium', label: '尊榮頂規版 (115% 頂配極致)', desc: '升級旗艦特規與全套耗材保固' }
                  ].map((ver) => (
                    <button
                      key={ver.id}
                      type="button"
                      onClick={() => setQuoteVersion(ver.id as any)}
                      className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                        quoteVersion === ver.id
                          ? 'bg-emerald-50/80 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500/10'
                          : 'bg-slate-50/40 border-slate-100 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="text-xs font-bold truncate">{ver.label}</div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{ver.desc}</div>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        quoteVersion === ver.id ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white'
                      }`}>
                        {quoteVersion === ver.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Calculation Settings (Tax Settings) */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3.5 pb-2 border-b border-slate-100">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-slate-900 text-sm">稅制與財務配置</h3>
              </div>
              
              <div className="space-y-4">
                {/* Tax Type Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">營業稅申報類別 (5%)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => updateMetaField('taxType', 'EXTERNAL')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                        quote.taxType === 'EXTERNAL'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      5% 加稅 (外部)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMetaField('taxType', 'INTERNAL')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                        quote.taxType === 'INTERNAL'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      5% 內含 (含稅)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMetaField('taxType', 'FREE')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                        quote.taxType === 'FREE'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      免稅 (0%)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateMetaField('taxType', 'ZERO')}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                        quote.taxType === 'ZERO'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      零稅率 (適用外銷)
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1.5 block leading-normal">
                    {quote.taxType === 'EXTERNAL' && '● 項目小計加總後，外加收取 5% 營業稅 (標準商業交易)'}
                    {quote.taxType === 'INTERNAL' && '● 報價金額已含 5% 營業稅，後端自動倒推稅額與不含稅小計'}
                    {quote.taxType === 'FREE' && '● 免徵營業稅，適用經特別核定免稅之貨物與勞務醫療教育學術'}
                    {quote.taxType === 'ZERO' && '● 零稅率適用於台灣貨物與勞務出口、外銷國外實體'}
                  </span>
                </div>

                {/* Show Stamp Checkbox */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <label htmlFor="stamp_check" className="text-xs font-semibold text-slate-700 block cursor-pointer">
                      顯示蓋章虛線框 (發票章處)
                    </label>
                    <span className="text-[10px] text-slate-400">印表機列印時可勾載以配合實體公司用章</span>
                  </div>
                  <input
                    id="stamp_check"
                    type="checkbox"
                    checked={quote.showStampPlaceholder}
                    onChange={(e) => updateMetaField('showStampPlaceholder', e.target.checked)}
                    className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-slate-500 border-slate-300"
                  />
                </div>

                {quote.showStampPlaceholder && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">印章框內預設文字</label>
                    <textarea
                      value={quote.stampText}
                      rows={2}
                      onChange={(e) => updateMetaField('stampText', e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded p-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white resize-none"
                      placeholder="公司名稱印章文字"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Saved History List */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col max-h-[420px]">
              <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <h3 className="font-bold text-slate-900 text-sm">本機歷史儲存庫 ({history.length})</h3>
                </div>
              </div>

              {history.length > 0 ? (
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {/* Search filter */}
                  <input 
                    type="text"
                    value={searchHistoryQuery}
                    onChange={(e) => setSearchHistoryQuery(e.target.value)}
                    placeholder="搜尋大名/單號..."
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:outline-none focus:bg-white text-slate-700"
                  />
                  <div className="space-y-1.5">
                    {filteredHistory.map((hQuote) => {
                      const isActive = q => q.id === hQuote.id;
                      return (
                        <div
                          key={hQuote.id}
                          onClick={() => loadFromHistory(hQuote)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between gap-1 group ${
                            quote.id === hQuote.id
                              ? 'bg-slate-100 border-slate-300 text-slate-900 shadow-inner'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold font-mono text-xs text-indigo-700 block truncate">
                                {hQuote.quoteNo || '無單號'}
                              </span>
                              {hQuote.id === 'sample-quote-id' && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-semibold">內建範本</span>
                              )}
                            </div>
                            <h4 className="text-xs font-semibold text-slate-800 mt-1 truncate">
                              {hQuote.buyerName || '（未命名客戶）'}
                            </h4>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              金額：NT$ {hQuote.items.reduce((sum, item) => sum + (item.qty * item.price), 0).toLocaleString()} | {hQuote.date}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => deleteFromHistory(hQuote.id, e)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="刪除紀錄"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    {filteredHistory.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-4">無符合搜尋結果</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 leading-normal">
                    尚未有任何儲存的報價單紀錄。<br />
                    填寫完畢後點擊上方的「<b>儲存歷史紀錄</b>」按鈕以妥善保存。
                  </p>
                </div>
              )}
            </div>

            {/* Quick Taiwan Tax Validation Guidelines card */}
            <div className="bg-slate-900 border border-slate-800 text-slate-400 p-4 rounded-xl text-xs space-y-1.5 font-mono leading-normal shadow-lg">
              <span className="text-white font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider pb-1.5 border-b border-slate-800">
                <AlertCircle className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                台灣報價單開立規範：
              </span>
              <p>● 台灣營業稅為 <b>5%</b> 隨地方銷售與租稅局申報。</p>
              <p>● 二聯式與三聯式：向一般大眾、跨企業。企業報價單請務必登錄雙方<b>統一編號</b>以利抵扣憑證申報。</p>
              <p>● 單據有效期限一般設定為 7 至 30 天，可保障賣方於原物料與工時異動之報價風險。</p>
            </div>
          </section>

          {/* =======================================================
              MAIN PREVIEW / EDIT CANVAS SECTION: The quotation page!
              ======================================================= */}
          <main className={`lg:col-span-8 print:col-span-12 ${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
            
            {/* The physical paper A4 simulation layout */}
            <article 
              id="quote-document-sheet"
              className={`w-full ${layoutStyles.pageBgClass} mx-auto relative overflow-hidden transition-all duration-300 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:bg-white print:text-black min-h-[1123px] flex flex-col justify-between ${layoutStyles.fontFamily}`}
            >
              {/* Slate accent top line for physical elegant visual touch (hidden in print) */}
              <div className={`absolute top-0 left-0 right-0 h-2 no-print ${layoutStyles.topBarColor}`} />

              <div>
                {/* 1. Header Area block */}
                <section className={`${layoutStyles.headerFlex} print:gap-1 print:border-b-2 print:pb-4 ${layoutStyles.headerBorder}`}>
                  {/* Left Head: Issuer identity */}
                  <div className="space-y-2 w-full sm:max-w-[62%]">
                    {/* Company Logo Display & Dynamic Upload Area */}
                    <div className="mb-2">
                      {quote.logo ? (
                        <div className="relative group/logo flex items-center gap-2 max-h-16 w-fit mb-1">
                          <img 
                            src={quote.logo} 
                            alt="公司 LOGO" 
                            className="h-12 max-w-[220px] object-contain"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => updateMetaField('logo', undefined)}
                            className="p-1 bg-slate-100 hover:bg-slate-200 hover:text-red-600 rounded text-slate-500 transition-colors shadow-xs no-print"
                            title="移除商標"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 text-xs text-slate-500 hover:text-indigo-600 cursor-pointer transition-all no-print mb-2"
                        >
                          <Image className="w-3.5 h-3.5" />
                          <span>上傳公司 LOGO</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  alert('圖片容量太大（最大允許 5MB），請壓縮後再行上傳！');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  updateMetaField('logo', event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={quote.sellerName}
                        onChange={(e) => updateMetaField('sellerName', e.target.value)}
                        placeholder="請輸入您的公司/商號名稱"
                        className="w-full text-xl sm:text-2xl font-bold text-slate-900 bg-white placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none py-1 transition-all rounded px-1 print:border-none print:p-0 print:text-xl"
                      />
                    </div>
                    
                    {/* Tiny issuer subinfo fields */}
                    <div className="text-xs text-slate-600 space-y-1 pl-1 print:space-y-0.5 print:-mt-1 print:text-black">
                      <div className="flex items-center gap-1.5 focus-within:text-slate-900">
                        <span className="text-slate-400 font-medium whitespace-nowrap print:text-black">統一編號：</span>
                        <input
                          type="text"
                          maxLength={8}
                          value={quote.sellerTaxId}
                          onChange={(e) => updateMetaField('sellerTaxId', e.target.value)}
                          placeholder="請輸入 8 位統編"
                          className="flex-1 text-slate-700 bg-white placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-0.5 rounded print:border-none print:p-0 print:text-black font-mono w-40"
                        />
                        {quote.sellerTaxId && (
                          <span className={`text-[9px] px-1 py-0.5 rounded font-semibold select-none no-print ${
                            sellerTaxIdValidation.isValid ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {sellerTaxIdValidation.isValid ? '✓ 合法格式' : '⚠ 格式未合'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium whitespace-nowrap print:text-black">聯絡地址：</span>
                        <input
                          type="text"
                          value={quote.sellerAddress}
                          onChange={(e) => updateMetaField('sellerAddress', e.target.value)}
                          placeholder="請輸入您的聯絡地址"
                          className="flex-1 text-slate-700 bg-white placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-0.5 rounded print:border-none print:p-0 print:text-black"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 font-sans focus-within:text-slate-900">
                        <span className="text-slate-400 font-medium whitespace-nowrap print:text-black">聯絡電話：</span>
                        <input
                          type="text"
                          value={quote.sellerPhone}
                          onChange={(e) => updateMetaField('sellerPhone', e.target.value)}
                          placeholder="請輸入您的聯絡電話"
                          className="flex-1 text-slate-700 bg-white placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-0.5 rounded print:border-none print:p-0 print:text-black"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 font-sans focus-within:text-slate-900">
                        <span className="text-slate-400 font-medium whitespace-nowrap print:text-black">聯絡信箱：</span>
                        <input
                          type="email"
                          value={quote.sellerEmail}
                          onChange={(e) => updateMetaField('sellerEmail', e.target.value)}
                          placeholder="聯絡信箱 Email"
                          className="flex-1 text-slate-700 bg-white placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-0.5 rounded print:border-none print:p-0 print:text-black"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Head: Custom styled giant title, version badge, and dates depending on chosen template */}
                  <div className={`space-y-2 w-full ${
                    quoteLayout === 'editorial' ? 'text-center border-t border-amber-900/10 pt-4 mt-2' :
                    quoteLayout === 'modern' ? 'text-left sm:max-w-[45%]' : 'text-left sm:text-right sm:max-w-[45%]'
                  }`}>
                    <h2 className={`text-2xl sm:text-3xl select-none print:m-0 ${layoutStyles.titleColor}`}>
                      {quoteLayout === 'editorial' ? '估 價 計 畫 說 明 暨 預 算 明 細' :
                       quoteLayout === 'modern' ? '專 案 報 價 單 / DIGITAL PROPOSAL' : '報 價 單'}
                    </h2>
                    
                    {/* Visual version scheme badge on the actual quotation paper */}
                    <div className={`pt-0.5 select-none flex no-print ${
                      quoteLayout === 'editorial' ? 'justify-center' :
                      quoteLayout === 'modern' ? 'justify-start' : 'sm:justify-end'
                    }`}>
                      {quoteVersion === 'standard' && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          標準常規版
                        </span>
                      )}
                      {quoteVersion === 'economy' && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs animate-pulse">
                          🍃 精簡超值版 (享 85 折)
                        </span>
                      )}
                      {quoteVersion === 'premium' && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/60 shadow-xs">
                          👑 尊榮頂規版 (加成 +15%)
                        </span>
                      )}
                    </div>
                    
                    <div className={`text-xs space-y-1 pt-1.5 print:space-y-0.5 ${
                      quoteLayout === 'editorial' 
                        ? 'text-amber-955 font-serif grid grid-cols-1 sm:grid-cols-3 gap-2 px-1 divide-y sm:divide-y-0 sm:divide-x divide-amber-900/15 py-1 border border-amber-900/10 rounded-lg bg-amber-50/10' 
                        : 'text-slate-600'
                    } print:text-black`}>
                      <div className={`flex items-center gap-1.5 ${
                        quoteLayout === 'editorial' ? 'justify-center py-1 sm:py-0' :
                        quoteLayout === 'modern' ? 'justify-start' : 'sm:justify-end'
                      }`}>
                        <span className="text-slate-400 font-medium whitespace-nowrap print:text-black">單號：</span>
                        <input
                          type="text"
                          value={quote.quoteNo}
                          onChange={(e) => updateMetaField('quoteNo', e.target.value)}
                          placeholder="單號QT-2026..."
                          className={`text-slate-800 bg-white font-mono placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-0.5 rounded print:border-none print:p-0 print:text-black font-bold h-5 ${
                            quoteLayout === 'editorial' ? 'text-center max-w-[90px]' :
                            quoteLayout === 'modern' ? 'text-left max-w-[110px]' : 'text-left sm:text-right max-w-[124px]'
                          }`}
                        />
                      </div>

                      <div className={`flex items-center gap-1.5 ${
                        quoteLayout === 'editorial' ? 'justify-center py-1 sm:py-0 px-1' :
                        quoteLayout === 'modern' ? 'justify-start' : 'sm:justify-end'
                      }`}>
                        <span className="text-slate-400 font-medium whitespace-nowrap print:text-black">日期：</span>
                        <input
                          type="date"
                          value={quote.date}
                          onChange={(e) => updateMetaField('date', e.target.value)}
                          className={`text-slate-800 bg-white font-mono placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-0.5 rounded print:border-none print:p-0 print:text-black h-5 ${
                            quoteLayout === 'editorial' ? 'text-center max-w-[110px]' :
                            quoteLayout === 'modern' ? 'text-left max-w-[110px]' : 'text-left sm:text-right max-w-[124px]'
                          }`}
                        />
                      </div>

                      <div className={`flex items-center gap-1.5 ${
                        quoteLayout === 'editorial' ? 'justify-center py-1 sm:py-0' :
                        quoteLayout === 'modern' ? 'justify-start' : 'sm:justify-end'
                      }`}>
                        <span className="text-slate-400 font-medium whitespace-nowrap print:text-black">效期：</span>
                        <input
                          type="text"
                          value={quote.validUntil}
                          onChange={(e) => updateMetaField('validUntil', e.target.value)}
                          placeholder="例如 30 天"
                          className={`text-slate-850 bg-white placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-0.5 rounded print:border-none print:p-0 print:text-black h-5 ${
                            quoteLayout === 'editorial' ? 'text-center max-w-[85px]' :
                            quoteLayout === 'modern' ? 'text-left max-w-[110px]' : 'text-left sm:text-right max-w-[124px]'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Client Identity / Buyer Information Block */}
                <section className={`${layoutStyles.buyerSectionClass} mb-6 print:bg-transparent print:border-none print:px-0 print:py-2 print:mb-4`}>
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 print:mb-1">
                      <User className="w-3.5 h-3.5 text-slate-500 print:hidden" />
                      <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase print:text-xs">
                        {quoteLayout === 'editorial' ? '貴 客 尊 稱 ＆ 對 象' :
                         quoteLayout === 'modern' ? '客戶資訊 / CLIENT PROFILE' : '報價對象（客戶資料）'}
                      </span>
                    </div>

                    <div className="space-y-1.5 pl-0.5 print:space-y-0.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium whitespace-nowrap print:text-black">公司名稱：</span>
                        <input
                          type="text"
                          value={quote.buyerName}
                          onChange={(e) => updateMetaField('buyerName', e.target.value)}
                          placeholder="請輸入客戶公司全銜"
                          className="flex-1 text-slate-800 font-bold bg-transparent placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none py-0.5 transition-all rounded print:border-none print:p-0 print:text-black"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium whitespace-nowrap print:text-black">統一編號：</span>
                        <input
                          type="text"
                          maxLength={8}
                          value={quote.buyerTaxId}
                          onChange={(e) => updateMetaField('buyerTaxId', e.target.value)}
                          placeholder="輸入客戶 8 位統編 (選填)"
                          className="flex-1 text-slate-700 bg-transparent placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-0.5 rounded print:border-none print:p-0 print:text-black font-mono"
                        />
                        {quote.buyerTaxId && (
                          <span className={`text-[9px] px-1 py-0.5 rounded font-semibold select-none no-print ${
                            buyerTaxIdValidation.isValid ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {buyerTaxIdValidation.isValid ? '✓ 格式正確' : '⚠ 檢查碼未符'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium whitespace-nowrap print:text-black">聯絡地址：</span>
                        <input
                          type="text"
                          value={quote.buyerAddress}
                          onChange={(e) => updateMetaField('buyerAddress', e.target.value)}
                          placeholder="輸入客戶聯絡地址 (選填)"
                          className="flex-1 text-slate-700 bg-transparent placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-0.5 rounded print:border-none print:p-0 print:text-black"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={`${
                    quoteLayout === 'editorial' ? 'sm:pl-6 pt-4 sm:pt-0 flex flex-col justify-end' :
                    quoteLayout === 'modern' ? 'md:bg-teal-50/15 md:p-3 md:rounded-lg flex flex-col justify-end' : 'md:border-l md:border-slate-200/80 md:pl-5 flex flex-col justify-end'
                  } print:border-none print:pl-0`}>
                    <div className="space-y-1.5 pl-0.5 print:space-y-0.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium whitespace-nowrap print:text-black">聯絡人員：</span>
                        <input
                          type="text"
                          value={quote.buyerContact}
                          onChange={(e) => updateMetaField('buyerContact', e.target.value)}
                          placeholder="請輸入客戶窗口姓名 / 職銜"
                          className="flex-1 text-slate-700 bg-transparent placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none py-0.5 transition-all rounded print:border-none print:p-0 print:text-black"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-medium whitespace-nowrap print:text-black">聯絡電話：</span>
                        <input
                          type="text"
                          value={quote.buyerPhone}
                          onChange={(e) => updateMetaField('buyerPhone', e.target.value)}
                          placeholder="例如 02-33115599 接 123"
                          className="flex-1 text-slate-700 bg-transparent placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none py-0.5 transition-all rounded print:border-none print:p-0 print:text-black"
                        />
                      </div>

                      <div className="text-amber-600 font-medium text-[11px] leading-tight select-none border-l-2 border-amber-300 pl-2 mt-2 py-0.5 md:block hidden print:hidden no-print">
                        請留意：輸入 8 碼統編時，系統會自動在背景進行中華民國標準統編權重校驗，確保單據資料無誤。
                      </div>
                    </div>
                  </div>
                </section>

                {/* 3. Items Quotation Table */}
                <section className="mt-4 mb-4">
                  <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-sm border-collapse print:text-black">
                      <thead>
                        <tr className={`print:bg-transparent print:border-black ${layoutStyles.tableHeaderTrClass} ${layoutStyles.tableHeaderBg}`}>
                          <th className="py-2.5 px-2 text-center w-[4%] font-bold print:text-black text-inherit">#</th>
                          <th className="py-2.5 px-2 text-center w-[12%] font-bold print:text-black text-inherit">
                            {quoteLayout === 'editorial' ? '圖樣畫稿' :
                             quoteLayout === 'modern' ? '示意圖 / PREVIEW' : '產品照片'}
                          </th>
                          <th className="py-2.5 px-3 text-left w-[37%] font-bold print:text-black text-inherit">
                            {quoteLayout === 'editorial' ? '項目創作者與內容說明' :
                             quoteLayout === 'modern' ? '項目描述與規格 / SPECIFICATION' : '項目名稱 與 規格描述'}
                          </th>
                          <th className="py-2.5 px-2 text-right w-[10%] font-bold print:text-black text-inherit">
                            {quoteLayout === 'editorial' ? '數額' :
                             quoteLayout === 'modern' ? '數量 / QTY' : '數量'}
                          </th>
                          <th className="py-2.5 px-2 text-center w-[10%] font-bold print:text-black text-inherit">
                            {quoteLayout === 'editorial' ? '單位' :
                             quoteLayout === 'modern' ? '單位 / UNIT' : '單位'}
                          </th>
                          <th className="py-2.5 px-2 text-right w-[12%] font-bold print:text-black text-inherit">
                            {quoteLayout === 'editorial' ? '單價' :
                             quoteLayout === 'modern' ? '單價 / PRICE' : '單價 (NT$)'}
                          </th>
                          <th className="py-2.5 px-3 text-right w-[10%] font-bold print:text-black text-inherit">
                            {quoteLayout === 'editorial' ? '合算' :
                             quoteLayout === 'modern' ? '小計 / AMOUNT' : '小計'}
                          </th>
                          <th className="py-2.5 px-2 text-center w-[5%] font-bold text-slate-400/80 no-print text-inherit">操作</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${quoteLayout === 'editorial' ? 'divide-amber-800/20' : quoteLayout === 'modern' ? 'divide-teal-100/40' : 'divide-slate-200'} print:divide-slate-300`}>
                        {quote.items.map((item, index) => {
                          const itemSubtotal = item.qty * item.price;
                          return (
                            <tr 
                              key={item.id} 
                              className={`group transition-colors ${
                                quoteLayout === 'editorial' 
                                  ? 'hover:bg-amber-50/10 font-serif' 
                                  : quoteLayout === 'modern' 
                                    ? `hover:bg-teal-50/15 ${index % 2 === 1 ? 'bg-teal-50/10' : ''}` 
                                    : 'hover:bg-slate-50/50'
                              } print:hover:bg-transparent`}
                            >
                              {/* Row index */}
                              <td className="py-2 px-1 text-center font-mono text-xs text-slate-400 print:text-black select-none">
                                {index + 1}
                              </td>

                              {/* Product Photo Upload Column */}
                              <td className="py-2 px-1 text-center align-middle">
                                <div className="relative group/photo flex items-center justify-center w-12 h-12 mx-auto">
                                  {item.image ? (
                                    <div className="relative w-12 h-12 rounded border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center hover:border-slate-400 transition-all shadow-sm">
                                      <img 
                                        src={item.image} 
                                        alt={item.name || '產品小圖'} 
                                        className="w-full h-full object-contain"
                                        referrerPolicy="no-referrer"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateItemField(item.id, 'image', undefined)}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center text-white transition-opacity no-print"
                                        title="清除圖片"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-white" />
                                      </button>
                                    </div>
                                  ) : (
                                    <label 
                                      className="w-12 h-12 rounded border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/30 flex flex-col items-center justify-center text-slate-400 cursor-pointer transition-all no-print"
                                      title="上傳商品照片"
                                    >
                                      <Upload className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600 transition-colors" />
                                      <span className="text-[8px] text-slate-450 mt-0.5 scale-90 font-medium">圖片</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            if (file.size > 5 * 1024 * 1024) {
                                              alert('圖片容量太大（最大允許 5MB），請壓縮後再行上傳！');
                                              return;
                                            }
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              updateItemField(item.id, 'image', event.target?.result);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                        className="hidden"
                                      />
                                    </label>
                                  )}
                                  {/* Print-only placeholder if no image */}
                                  {!item.image && (
                                    <div className="hidden print:flex w-12 h-12 rounded border border-slate-100 text-[8px] text-slate-300 items-center justify-center text-center font-mono">
                                      -
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Item Description Name */}
                              <td className="py-2 px-1.5">
                                <textarea
                                  value={item.name}
                                  rows={1}
                                  onChange={(e) => updateItemField(item.id, 'name', e.target.value)}
                                  placeholder="填寫項目名稱或詳細規格敘述..."
                                  className="w-full text-slate-800 bg-transparent placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-1 rounded text-sm resize-y leading-tight print:border-none print:p-0 print:text-black font-medium print:resize-none"
                                />
                              </td>

                              {/* Quantity */}
                              <td className="py-2 px-1 text-right">
                                <input
                                  type="number"
                                  value={item.qty === 0 ? '' : item.qty}
                                  onChange={(e) => updateItemField(item.id, 'qty', e.target.value)}
                                  placeholder="0"
                                  className="w-full text-slate-700 bg-transparent font-mono placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-1 rounded text-right text-sm print:border-none print:p-0 print:text-black"
                                />
                              </td>

                              {/* Unit */}
                              <td className="py-2 px-1 text-center">
                                <input
                                  type="text"
                                  value={item.unit}
                                  onChange={(e) => updateItemField(item.id, 'unit', e.target.value)}
                                  placeholder="例如：式"
                                  className="w-full text-slate-700 bg-transparent placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-1 rounded text-center text-xs print:border-none print:p-0 print:text-black"
                                />
                              </td>

                              {/* Unit Price */}
                              <td className="py-2 px-1 text-right">
                                <input
                                  type="number"
                                  value={item.price === 0 ? '' : item.price}
                                  onChange={(e) => updateItemField(item.id, 'price', e.target.value)}
                                  placeholder="0"
                                  className="w-full text-slate-700 bg-transparent font-mono placeholder-slate-300 border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none transition-all py-1 rounded text-right text-sm print:border-none print:p-0 print:text-black"
                                />
                              </td>

                              {/* Row Subtotal */}
                              <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 print:text-black">
                                {itemSubtotal.toLocaleString()}
                              </td>

                              {/* Row Actions list */}
                              <td className="py-2 px-1 text-center no-print align-middle">
                                <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => moveRowUp(item.id)}
                                    disabled={index === 0}
                                    className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 rounded"
                                    title="上移"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => moveRowDown(item.id)}
                                    disabled={index === quote.items.length - 1}
                                    className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 rounded"
                                    title="下移"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => duplicateRow(item.id)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                                    title="複製此列"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => deleteRow(item.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                                    title="刪除"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Row Button (Hidden in Printing) */}
                  <div className="mt-3 flex justify-start no-print">
                    <button
                      onClick={addNewRow}
                      id="add_new_quote_item_row_btn"
                      className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-3.5 py-1.5 rounded-lg transition-colors border border-indigo-100"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>新增項目欄位</span>
                    </button>
                  </div>
                </section>

                {/* 4. Total calculation section & Firm chop stamp */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-8 pt-4 border-t border-slate-200">
                  
                  {/* Left Side: Remittance Bank Account Box */}
                  <div className="md:col-span-7 space-y-4">
                    <div className={`${layoutStyles.remittanceBoxClass} text-xs print:bg-transparent print:border-none print:p-0`}>
                      <div className="flex items-center gap-1.5 font-bold text-slate-705 mb-2 print:text-black">
                        <CreditCard className="w-3.5 h-3.5 print:hidden" />
                        <span>
                          {quoteLayout === 'editorial' ? '指定撥款與解款帳務說明（劃撥付費款）' :
                           quoteLayout === 'modern' ? '解款與轉帳帳號 / WIRE TRANSFER DETAILS' : '匯款付費帳座（轉帳資訊）'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-600 print:text-black">
                        <div>
                          <span className="text-slate-400 font-medium block print:text-black text-[10px]">銀行代碼／名稱：</span>
                          <input
                            type="text"
                            value={quote.bankName}
                            onChange={(e) => updateMetaField('bankName', e.target.value)}
                            placeholder="例如：玉山銀行 (808)"
                            className="w-full text-slate-800 font-semibold bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none py-0.5 rounded transition-all print:border-none print:p-0 print:text-black text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block print:text-black text-[10px]">分行代碼／名稱：</span>
                          <input
                            type="text"
                            value={quote.bankCode}
                            onChange={(e) => updateMetaField('bankCode', e.target.value)}
                            placeholder="例如：北新分行"
                            className="w-full text-slate-800 font-semibold bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none py-0.5 rounded transition-all print:border-none print:p-0 print:text-black text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block print:text-black text-[10px]">戶名全銜：</span>
                          <input
                            type="text"
                            value={quote.bankAccountName}
                            onChange={(e) => updateMetaField('bankAccountName', e.target.value)}
                            placeholder="解付款帳戶戶名"
                            className="w-full text-slate-800 font-semibold bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none py-0.5 rounded transition-all print:border-none print:p-0 print:text-black text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium block print:text-black text-[10px]">帳務號碼：</span>
                          <input
                            type="text"
                            value={quote.bankAccountNumber}
                            onChange={(e) => updateMetaField('bankAccountNumber', e.target.value)}
                            placeholder="填寫匯款轉帳帳號"
                            className="w-full text-slate-800 font-semibold bg-transparent border-b border-transparent hover:border-slate-200 focus:border-slate-500 focus:outline-none py-0.5 rounded transition-all print:border-none print:p-0 print:text-black text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Calculation Sheet summaries */}
                  <div className={`md:col-span-5 flex flex-col justify-end p-4 sm:p-5 rounded-lg space-y-2.5 ${layoutStyles.totalsBoxBg} print:bg-transparent print:border-none print:p-0 print:shadow-none`}>
                    
                    {/* Item Aggregate subtotal */}
                    {quoteVersion !== 'standard' && (
                      <div className="flex justify-between items-center text-xs text-slate-500 print:text-black">
                        <span className="font-medium text-slate-400 print:text-black">原始品項合計 (原價)：</span>
                        <span className="font-mono text-slate-600 print:text-black">
                          NT$ {baseSubtotal.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {quoteVersion === 'economy' && (
                      <div className="flex justify-between items-center text-xs text-emerald-600 print:text-black">
                        <span className="font-bold print:text-black">🍂 方案折扣 (精簡 85 折)：</span>
                        <span className="font-mono font-bold">
                          - NT$ {Math.abs(versionAdjustment).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {quoteVersion === 'premium' && (
                      <div className="flex justify-between items-center text-xs text-indigo-600 print:text-black">
                        <span className="font-bold print:text-black">👑 尊享規格加值 (+15%)：</span>
                        <span className="font-mono font-bold">
                          + NT$ {Math.abs(versionAdjustment).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs text-slate-600 print:text-black">
                      <span className="font-medium text-slate-400 print:text-black">
                        {quoteVersion !== 'standard' ? '調整後小計 (稅前)：' : '項目小計金額 (稅前)：'}
                      </span>
                      <span className="font-mono font-semibold text-slate-800 print:text-black">
                        NT$ {quote.taxType === 'INTERNAL' 
                          ? (subtotal - tax).toLocaleString() 
                          : subtotal.toLocaleString()
                        }
                      </span>
                    </div>

                    {/* Tax aggregate label and value */}
                    <div className="flex justify-between items-center text-xs text-slate-600 print:text-black">
                      <span className="font-medium text-slate-400 print:text-black">
                        營業稅額 ({
                          quote.taxType === 'EXTERNAL' ? '5% 外加' :
                          quote.taxType === 'INTERNAL' ? '5% 內含' : '0% 免稅'
                        })：
                      </span>
                      <span className="font-mono font-semibold text-slate-800 print:text-black">
                        NT$ {tax.toLocaleString()}
                      </span>
                    </div>

                    {/* Bold Final Total aggregated */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 border-dashed print:border-black">
                      <span className="text-sm font-extrabold text-slate-900 print:text-black">
                        報價總計金額 (含稅)：
                      </span>
                      <span className="text-lg font-extrabold text-indigo-700 font-mono print:text-black print:text-lg">
                        NT$ {finalTotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Taiwan standard grand total word expression (Chinese number words for invoices) */}
                    <div className="text-[10px] text-right text-slate-500 font-medium block mt-1 print:text-black print:text-[10px]">
                      新台幣大寫：{toTaiwanChineseBigNumber(finalTotal)}元整
                    </div>
                  </div>
                </section>

                {/* 5. Terms / Explanations / Notes */}
                <section className="mt-8 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1 select-none print:text-xs print:text-black">
                    <span>備註欄及條款說明 (REMARKS AND TERMS)</span>
                  </div>
                  <textarea
                    value={quote.notes}
                    onChange={(e) => updateMetaField('notes', e.target.value)}
                    placeholder="請輸入其他報價備註事項、履行條款、驗收階段說明等..."
                    rows={4}
                    className={layoutStyles.notesBoxClass}
                  />
                </section>
              </div>

              {/* 6. Legal / Fine Foot & Seals */}
              <section className={`mt-14 pt-6 ${
                quoteLayout === 'editorial' ? 'border-t-2 border-double border-amber-900/25 flex flex-col items-center justify-center text-center gap-6 mt-16 pt-8 font-serif' :
                quoteLayout === 'modern' ? 'border-t border-teal-100/40 flex flex-col sm:flex-row justify-between items-center gap-6' :
                'border-t border-slate-100 flex flex-col sm:flex-row justify-between items-end gap-6'
              } print:mt-10 print:pt-4`}>

                {/* Seller confirmation box (now on the left) */}
                <div className={`text-slate-400 print:text-black text-[10px] space-y-1 sm:max-w-md w-full ${
                  quoteLayout === 'editorial' ? 'text-center' : 'text-left'
                }`}>
                  <div className={`flex gap-1.5 focus-within:text-slate-800 ${
                    quoteLayout === 'editorial' ? 'justify-center' : 'justify-start'
                  }`}>
                    <span className="font-bold text-slate-500 print:text-black">填表立案窗口 (手寫簽署或認章)：</span>
                    <input
                      type="text"
                      value={quote.sellerContact}
                      onChange={(e) => updateMetaField('sellerContact', e.target.value)}
                      placeholder="簽署人姓名"
                      className={`text-slate-700 bg-transparent border-b border-slate-200 placeholder-slate-300 focus:border-slate-500 focus:outline-none transition-all py-0.5 rounded text-[10px] w-24 print:border-none print:p-0 ${
                        quoteLayout === 'editorial' ? 'text-center' : 'text-left'
                      }`}
                    />
                  </div>
                  <p>● 報價經雙方蓋章確認後即具商業合約效力，請妥善收執保存。</p>
                  <p className="font-mono text-[9px] text-slate-300 print:text-black">產生自 線上報價單生成器 - {new Date().toISOString().split('T')[0]}</p>
                </div>

                {/* Visual Official Stamp Seal (now on the right) */}
                <div className="relative">
                  {quote.showStampPlaceholder && (
                    <div className={`${layoutStyles.stampClass} relative group select-none`}>
                      <span className="text-[9px] uppercase font-bold tracking-wider mb-1 text-red-500/80 print:text-red-500">
                        Chop Stamp
                      </span>
                      <span className="text-[10px] font-bold whitespace-pre-line leading-normal">
                        {quote.stampText}
                      </span>
                      <div className={layoutStyles.stampOuterBorder} />
                    </div>
                  )}
                </div>

              </section>

            </article>
          </main>
        </div>

        {/* =======================================================
            SETTINGS MODAL: Save Default Company Profile
            ======================================================= */}
        <AnimatePresence>
          {showSettingsModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-base">設定我司預設預載商號資料</h3>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={saveDefaultSellerSettings} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm text-slate-700">
                  <p className="text-xs text-slate-400 leading-normal pb-0.5">
                    在此處儲存您的 3 組公司商號資訊（方便投標比價、合約配套使用）。未來點擊「<b>建立新報價單</b>」或在左側邊欄將快速呼叫套用。
                  </p>

                  {/* Profile Switcher Tabs in Settings Modal */}
                  <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200/50 flex gap-2 mb-2">
                    {[
                      { label: '商號一 (預設主推)', name: sellerProfiles[0]?.sellerName || '本島視覺' },
                      { label: '商號二 (備用款式)', name: sellerProfiles[1]?.sellerName || '極光數位' },
                      { label: '商號三 (對照比價)', name: sellerProfiles[2]?.sellerName || '山海創意' }
                    ].map((tab, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => switchEditingProfile(idx)}
                        className={`flex-1 text-center py-2 px-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                          editingProfileIdx === idx
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                            : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/40'
                        }`}
                      >
                        <div className="text-[9px] opacity-75 uppercase tracking-wide truncate mb-0.5">{tab.label}</div>
                        <div className="truncate text-xs font-bold font-sans leading-tight">{tab.name}</div>
                      </button>
                    ))}
                  </div>

                  {/* Default Company Logo Selection */}
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-shrink-0">
                      {tempSellerLogo ? (
                        <div className="relative group/logo w-24 h-16 rounded border border-slate-200 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                          <img 
                            src={tempSellerLogo} 
                            alt="預覽 Logo" 
                            className="max-w-full max-h-full object-contain p-1"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setTempSellerLogo(undefined)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center text-white transition-opacity text-xs"
                            title="清除商標圖片"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-16 rounded border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-300">
                          <Image className="w-5 h-5 mb-1 text-slate-400" />
                          <span className="text-[10px] text-slate-400 font-medium">無 LOGO</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 text-center sm:text-left">
                      <h4 className="font-bold text-slate-800 text-xs">預設公司/商號 LOGO 圖片</h4>
                      <p className="text-xs text-slate-400 leading-normal">建議使用橫式透明背景的高解析度 PNG 或 JPG （尺寸不大於 5MB）</p>
                      <div className="flex justify-center sm:justify-start gap-2">
                        <label className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-semibold text-slate-700 cursor-pointer shadow-xs transition-all">
                          上傳圖片
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  alert('圖片容量太大（最大允許 5MB），請壓縮後再行上傳！');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setTempSellerLogo(event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {tempSellerLogo && (
                          <button
                            type="button"
                            onClick={() => setTempSellerLogo(undefined)}
                            className="px-3 py-1 bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 rounded text-xs font-semibold shadow-xs transition-all"
                          >
                            移除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">公司/商號名稱 *</label>
                      <input
                        type="text"
                        required
                        value={tempSellerName}
                        onChange={(e) => setTempSellerName(e.target.value)}
                        placeholder="例如：創藝數位科技有限公司"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">統一編號 (8碼) *</label>
                      <input
                        type="text"
                        maxLength={8}
                        required
                        value={tempSellerTaxId}
                        onChange={(e) => setTempSellerTaxId(e.target.value)}
                        placeholder="例如：83456789"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                      />
                      {tempSellerTaxId && (
                        <p className={`text-[10px] mt-1 font-semibold ${
                          validateTaiwanTaxId(tempSellerTaxId).isValid ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {validateTaiwanTaxId(tempSellerTaxId).message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">聯絡人員 (窗口)</label>
                      <input
                        type="text"
                        value={tempSellerContact}
                        onChange={(e) => setTempSellerContact(e.target.value)}
                        placeholder="例如：林育辰"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">聯絡電話</label>
                      <input
                        type="text"
                        value={tempSellerPhone}
                        onChange={(e) => setTempSellerPhone(e.target.value)}
                        placeholder="例如：02-2734-5678"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">聯絡電子郵件 Email</label>
                      <input
                        type="email"
                        value={tempSellerEmail}
                        onChange={(e) => setTempSellerEmail(e.target.value)}
                        placeholder="例如：service@creative-digital.com.tw"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">聯絡及登記地址</label>
                      <input
                        type="text"
                        value={tempSellerAddress}
                        onChange={(e) => setTempSellerAddress(e.target.value)}
                        placeholder="例如：台北市大安區信義路四段 100 號 5 樓"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs pt-3 border-t border-slate-100 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>預設匯款及轉帳金融帳戶</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">金融機構名稱 (代碼)</label>
                      <input
                        type="text"
                        value={tempBankName}
                        onChange={(e) => setTempBankName(e.target.value)}
                        placeholder="例如：玉山商業銀行 (808)"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">分行名稱 (或代碼)</label>
                      <input
                        type="text"
                        value={tempBankCode}
                        onChange={(e) => setTempBankCode(e.target.value)}
                        placeholder="例如：大安分行"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">帳戶名稱 (戶名全銜)</label>
                      <input
                        type="text"
                        value={tempBankAccountName}
                        onChange={(e) => setTempBankAccountName(e.target.value)}
                        placeholder="例如：創藝數位科技有限公司"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">金融帳號</label>
                      <input
                        type="text"
                        value={tempBankAccountNumber}
                        onChange={(e) => setTempBankAccountNumber(e.target.value)}
                        placeholder="例如：0123-4567-89012"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg text-xs text-indigo-700 leading-normal">
                    預載公司資料會儲存在您的瀏覽器安全空間（LocalStorage），本系統不傳輸任何資料至任何外部伺服器，安全且具私密隱私性。
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                    >
                      儲存變更並更新
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
