import React, { useState, useRef, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx-js-style';
import './App.css';

// ─── GLOBAL LOCK CONFIGURATION ───
const MANUAL_LOCK_DEFAULT = false;
const FALLBACK_TARGET_DATE = new Date('2026-03-27T20:30:00+08:00');

type Page = 'home' | 'order' | 'history' | 'admin-login' | 'admin-dashboard';

const FAQS = [
  { q: "How do I order?", a: "When preorders open, we post the order form link on our page and story. Slots are limited per batch and are available on a first come, first served basis. Once the form is closed, we no longer accept orders" },
  { q: "Can I order for today or tomorrow?", a: "We only accept PREORDERS. Same day or next day orders are not available. Delivery dates for each batch are announced in our posts along with a notice or teaser before opening." },
  { q: "Are you still available? Do you accept orders?", a: "If slots are posted on our page as SOLD OUT or the forms are closed, we no longer accept orders for that batch. Please follow our page and check our posts or bio for updates on preorder availability and the next preorder schedule." },
  { q: "When will you be available again?", a: "We post preorder schedules weekly on our page, along with a notice a few days before opening slots. Follow our page to stay updated." },
  { q: "What are your payment methods?", a: "We accept GCash and Bank Transfers. A minimum of 50% nonrefundable downpayment is required to secure your slot and avoid bogus orders." },
  { q: "Where are you located? What is your mode of delivery?", a: "We are located in Bacolod City. Our mode of delivery is 📍 meetups at lasalle gate 6." },
  { q: "What time are meetup orders?", a: "meetups at lasalle gate 6 - 9am-10am, March 31 tuesday. Please message us regarding the schedule as we are only available at selected times." },
  { q: "Do you accept reservations?", a: "We strictly DO NOT allow RESERVATIONS. To keep things fair for everyone, we only accept orders through our official form on a first come, first served basis." },
  { q: "Do you ship to Manila or outside Bacolod?", a: "We currently cater orders within Bacolod City only." },
  { q: "What is your refund policy for stock issues?", a: "In the rare event that stock runs out during your payment, we will track your GCash info and process a full refund within 24 hours. You will be notified via IG DM." },
  { q: "Do you offer boxes of 12 or 24?", a: "We currently offer boxes of 4 and 6 only. Box of 12 options will be available soon, so stay tuned for announcements." },
  { q: "How much are your products?", a: "• Box of 3 - ₱265\n• Box of 4 - ₱350\n• Box of 6 - ₱525\n• Biscoff Box of 4 - ₱330\n• Biscoff & Pistacio Mixed Box of 4 - ₱342\n\nOur full price list is also pinned on our page, so kindly follow us to check for updates." },
  { q: "Can I change my order after submitting the form?", a: "Order information such as address or meetup details may still be updated if needed by messaging us through our Instagram handle @BAKEDBY.BCD. However, the quantity ordered cannot be changed since slots are limited." },
  { q: "Why are slots limited?", a: "We are a small student-run business and bake per batch to ensure quality and freshness. Slots are limited to maintain product quality." },
  { q: "Can I cancel my order?", a: "Cancellations are not allowed once payment is made. The 50% downpayment is strictly non-refundable as ingredients and slots are already allocated." }
];

/* ─── STOCK COUNTER COMPONENT ─── */
function StockCounter({ b3, b4, b6, biscoff4, mixed4, loading }: { b3: number | null, b4: number | null, b6: number | null, biscoff4: number | null, mixed4: number | null, loading: boolean }) {
  const isSoldOut = b3 === 0 && b4 === 0 && b6 === 0 && biscoff4 === 0 && mixed4 === 0;
  const totalPcs = (b3 ?? 0) * 3 + (b4 ?? 0) * 4 + (b6 ?? 0) * 6 + (biscoff4 ?? 0) * 4 + (mixed4 ?? 0) * 4;
  return (
    <div className="stock-counter-banner sparkle-banner">
      <span className="stock-dot" style={{ background: isSoldOut ? '#ef4444' : '#10b981' }}></span>
      <span className="stock-text sparkle-text-sm">
        {loading ? 'Checking slots...' : isSoldOut ? 'SOLD OUT! Stay tuned for the next batch.' : `Slots Available: ${totalPcs} pieces available`}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════ */
function HomePage({ onOrderClick, onAdminClick, onViewHistory, b3, b4, b6, biscoff4, mixed4, loading }: { onOrderClick: () => void, onAdminClick: () => void, onViewHistory: () => void, b3: number | null, b4: number | null, b6: number | null, biscoff4: number | null, mixed4: number | null, loading: boolean }) {
  const isSoldOut = b3 === 0 && b4 === 0 && b6 === 0 && biscoff4 === 0 && mixed4 === 0;
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const tapCount = useRef(0);
  const resetTimer = useRef<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };


  const handleLogoClick = () => {
    tapCount.current += 1;
    if (tapCount.current === 5) {
      onAdminClick();
      tapCount.current = 0;
    }

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      tapCount.current = 0;
    }, 3000);
  };

  return (
    <div className="home-page">
      <StockCounter b3={b3} b4={b4} b6={b6} biscoff4={biscoff4} mixed4={mixed4} loading={loading} />

      {/* Full-width clouds banner — no wrapper, scales naturally */}
      <img src="/clouds.png" alt="" className="clouds-banner" />

      {/* Single centered hero block — welcome-to overlaps its top-left */}
      <div className="home-main">
        <div className="hero-content">

          {/* "Welcome to" floats over the top-left of the card */}
          <img src="/welcome-to.png" alt="Welcome to" className="welcome-img" />

          {/* Card */}
          <div className="hero-card" onClick={handleLogoClick}>
            <img
              src="/baked-by-logo.png"
              alt="BAKED BY logo with kids illustration"
              className="hero-logo-img"
              style={{ cursor: 'default' }}
            />
          </div>

          <button
            className={`place-order-btn${isSoldOut ? ' sold-out' : ''}`}
            onClick={isSoldOut ? undefined : onOrderClick}
            disabled={isSoldOut}
          >
            {isSoldOut ? 'SOLD OUT!' : 'Place Order!'}
          </button>



          <div className="location-note" style={{ fontSize: '0.9rem', lineHeight: '1.6', marginTop: '15px' }}>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}><span>📍</span> <strong>meetups at lasalle gate 6</strong></div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}><span>🕒</span> <span>9am-10am, March 31 tuesday</span></div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}><span>📦</span> <span>Limited boxes available</span></div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}><span>📝</span> <span>Orders via website only</span></div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}><span>💳</span> <span>Full payment basis</span></div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '25px', padding: '15px', background: '#f8fafc', borderRadius: '15px', border: '1px dashed #cbd5e1' }}>
        <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0 }}>
          Paid but didn't finish the form?{' '}
          <button
            onClick={() => onViewHistory()}
            style={{ background: 'none', border: 'none', color: '#1e3a8a', cursor: 'pointer', fontWeight: 800, textDecoration: 'underline', padding: 0 }}
          >
            Recover your order here
          </button>
        </p>
      </div>

      <div className="notepad-faq-container">
        <h2 className="faq-title">FAQs</h2>
        <div className="faq-list">
          {FAQS.map((faq, i) => (
            <div className={`faq-item ${expandedFaq === i ? 'expanded' : ''}`} key={i}>
              <div className="faq-q" onClick={() => toggleFaq(i)}>
                {faq.q}
                <span className="faq-icon">{expandedFaq === i ? '−' : '+'}</span>
              </div>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="home-bottom" />
    </div>
  );
}

/* ═══════════════════════════════════════
   ORDER PAGE
═══════════════════════════════════════ */
function OrderPage({ onBack, recoveryOrder }: { onBack: () => void, recoveryOrder?: any }) {
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [instagram, setInstagram] = useState('');
  const [holdingOrderId, setHoldingOrderId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState({ Box3: 0, Box4: 0, Box6: 0, Biscoff4: 0, Mixed4: 0 });
  const [boxStocks, setBoxStocks] = useState({ Box3: 0, Box4: 0, Box6: 0, Biscoff4: 0, Mixed4: 0 });
  const [boxLoading, setBoxLoading] = useState(true);
  const [paymentNumber, setPaymentNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<'meetup' | 'maxim'>('meetup');
  const [maximAddress, setMaximAddress] = useState('');
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    if (recoveryOrder) {
      setFullName(recoveryOrder.full_name);
      setContactNumber(recoveryOrder.contact_number);
      setInstagram(recoveryOrder.instagram || '');
      setHoldingOrderId(recoveryOrder.id);
      setDeliveryMode(recoveryOrder.delivery_mode || 'meetup');
      setMaximAddress(recoveryOrder.maxim_address || '');

      const typeVal = recoveryOrder.quantity_type || '';
      const b3 = (typeVal.match(/Box3:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box3:\s(\d+)/)![1]) : 0;
      const b4 = (typeVal.match(/Box4:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box4:\s(\d+)/)![1]) : 0;
      const b6 = (typeVal.match(/Box6:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box6:\s(\d+)/)![1]) : 0;
      const biscoff4 = (typeVal.match(/Biscoff4:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Biscoff4:\s(\d+)/)![1]) : 0;
      const mixed4 = (typeVal.match(/Mixed4:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Mixed4:\s(\d+)/)![1]) : 0;

      setQuantities({ Box3: b3, Box4: b4, Box6: b6, Biscoff4: biscoff4, Mixed4: mixed4 });
      setSubmitted(true); // Skip to step 2 (Payment)
      
      // Calculate remaining time
      const created = new Date(recoveryOrder.created_at).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - created) / 1000);
      setTimeLeft(Math.max(0, 600 - elapsed));
    }
  }, [recoveryOrder]);

  // Phone Masking Logic
  const formatPhoneNumber = (val: string) => {
    const numbers = val.replace(/\D/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
    return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setContactNumber(formatted);
  };

  // ─── PERSISTENCE: Save to LocalStorage as user types ───
  useEffect(() => {
    if (fullName) localStorage.setItem('baked_draft_fullName', fullName);
    if (contactNumber) localStorage.setItem('baked_draft_contactNumber', contactNumber);
    if (instagram) localStorage.setItem('baked_draft_instagram', instagram);
  }, [fullName, contactNumber, instagram]);

  useEffect(() => {
    if (holdingOrderId) {
      localStorage.setItem('baked_draft_holdingOrderId', holdingOrderId);
    } else {
      localStorage.removeItem('baked_draft_holdingOrderId');
    }
  }, [holdingOrderId]);

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  // ─── ACTIVE STOCK MONITORING (Real-time & Polling Backup) ───
  useEffect(() => {
    const fetchBoxStock = async () => {
      try {
        const { data: b3 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Box of 3').single();
        const { data: b4 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Box of 4').single();
        const { data: b6 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Box of 6').single();
        const { data: biscoff4 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Biscoff Box of 4').single();
        const { data: mixed4 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Biscoff and Pistacio Mixed').single();

        const stocks = {
          Box3: b3?.stock_count ?? 0,
          Box4: b4?.stock_count ?? 0,
          Box6: b6?.stock_count ?? 0,
          Biscoff4: biscoff4?.stock_count ?? 0,
          Mixed4: mixed4?.stock_count ?? 0
        };
        setBoxStocks(stocks);
        setBoxLoading(false);

        if (stocks.Box3 === 0 && stocks.Box4 === 0 && stocks.Box6 === 0 && stocks.Biscoff4 === 0 && stocks.Mixed4 === 0 && !submitted) {
          alert("🚨 UPDATE: Everything just sold out while you were here! \n\nRedirecting you back to the home page...");
          onBack();
        }
      } catch (e) {
        console.error("Poll error:", e);
      }
    };

    fetchBoxStock();
    const poller = setInterval(fetchBoxStock, 60000); // 1-min backstop

    // Real-time Sub
    const sub = supabase.channel('order-page-inventory')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'inventory' }, fetchBoxStock)
      .subscribe();

    return () => {
      clearInterval(poller);
      sub.unsubscribe();
    };
  }, [onBack, submitted]);

  // Janitor effect for expired holding orders
  useEffect(() => {
    const cleanupHoldingOrders = async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: expiredHolds, error } = await supabase
        .from('orders')
        .select('id, quantity_type')
        .eq('status', 'Holding')
        .lt('created_at', tenMinutesAgo);

      if (error) {
        console.error("Error fetching expired holding orders:", error);
        return;
      }

      if (expiredHolds && expiredHolds.length > 0) {
        console.log(`Cleaning up ${expiredHolds.length} expired holding orders.`);
        for (const hold of expiredHolds) {
          const typeVal = hold.quantity_type || '';
          const b3 = (typeVal.match(/Box3:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box3:\s(\d+)/)![1]) : 0;
          const b4 = (typeVal.match(/Box4:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box4:\s(\d+)/)![1]) : 0;
          const b6 = (typeVal.match(/Box6:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box6:\s(\d+)/)![1]) : 0;
          const biscoff4 = (typeVal.match(/Biscoff4:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Biscoff4:\s(\d+)/)![1]) : 0;

          if (b3 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 3', p_amount: b3 });
          if (b4 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 4', p_amount: b4 });
          if (b6 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 6', p_amount: b6 });
          if (biscoff4 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Biscoff Box of 4', p_amount: biscoff4 });

          await supabase.from('orders').delete().eq('id', hold.id);
        }
      }
    };

    // Run once on mount and then every 30 seconds
    cleanupHoldingOrders();
    const interval = setInterval(cleanupHoldingOrders, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── PRO-ACTIVE STOCK RELEASE ───
  const releaseReservation = async () => {
    if (!holdingOrderId) return;
    try {
      // Re-add stock
      if (quantities.Box3 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 3', p_amount: quantities.Box3 });
      if (quantities.Box4 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 4', p_amount: quantities.Box4 });
      if (quantities.Box6 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 6', p_amount: quantities.Box6 });
      if (quantities.Biscoff4 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Biscoff Box of 4', p_amount: quantities.Biscoff4 });
      if (quantities.Mixed4 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Biscoff and Pistacio Mixed', p_amount: quantities.Mixed4 });
      
      // Delete holding record
      await supabase.from('orders').delete().eq('id', holdingOrderId);
      setHoldingOrderId(null);
      localStorage.removeItem('baked_draft_holdingOrderId');
    } catch (e) {
      console.error("Pro-active release failed:", e);
    }
  };

  const handleExitOrder = async () => {
    if (holdingOrderId && !isConfirmed) {
      await releaseReservation();
    }
    onBack();
  };

  const handleEditOrder = async () => {
    if (holdingOrderId) {
      setIsCheckingStock(true);
      await releaseReservation();
      setIsCheckingStock(false);
    }
    setSubmitted(false);
    setIsPaying(false);
  };



  // 10-minute payment timer
  useEffect(() => {
    let timer: any;
    if (isPaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPaying) {
      alert("⚠️ Time's up! Your 10-minute payment window has expired and your reservation has been released.");
      onBack();
    }
    return () => clearInterval(timer);
  }, [isPaying, timeLeft, onBack]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalPrice = (quantities.Box3 * 265) + (quantities.Box4 * 350) + (quantities.Box6 * 525) + (quantities.Biscoff4 * 330) + (quantities.Mixed4 * 342);
  const downpaymentPrice = totalPrice;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full Name is required.';
    if (!contactNumber.trim()) errs.contactNumber = 'Contact Number is required.';
    if (!instagram.trim()) errs.instagram = 'Instagram Handle is required.';
    if (quantities.Box3 === 0 && quantities.Box4 === 0 && quantities.Box6 === 0 && quantities.Biscoff4 === 0 && quantities.Mixed4 === 0) errs.quantity = 'Please select at least one box.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTimeout(() => {
        const firstErrorKey = Object.keys(errs)[0];
        const errorElement = document.getElementById(firstErrorKey);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }
    setErrors({});
    
    // Suggestion 2: Create Record/Reserve stock EARLY (on Review Order)
    try {
      setIsCheckingStock(true);
      const { data: rpcData, error: rpcError } = await supabase.rpc('reserve_stock_and_create_order', {
        p_full_name: fullName,
        p_contact_number: contactNumber.replace(/\s/g, ''),
        p_instagram: instagram,
        p_quantity_type: `Box3: ${quantities.Box3}, Box4: ${quantities.Box4}, Box6: ${quantities.Box6}, Biscoff4: ${quantities.Biscoff4}, Mixed4: ${quantities.Mixed4}`,
        p_total_price: totalPrice,
        p_downpayment_price: downpaymentPrice,
        p_needs3: quantities.Box3,
        p_needs4: quantities.Box4,
        p_needs6: quantities.Box6
      });

      // Special handling for Biscoff since RPC may not support it yet
      if (rpcData?.success && quantities.Biscoff4 > 0) {
        const { error: biscoffError } = await supabase.rpc('increment_box_stock', {
          p_item: 'Biscoff Box of 4',
          p_amount: -quantities.Biscoff4
        });
        if (biscoffError) console.error("Error deducting Biscoff stock:", biscoffError);
      }

      if (quantities.Mixed4 > 0) {
        const { error: mixedError } = await supabase.rpc('increment_box_stock', {
          p_item: 'Biscoff and Pistacio Mixed',
          p_amount: -quantities.Mixed4
        });
        if (mixedError) console.error("Error deducting Mixed stock:", mixedError);
      }

      if (rpcError) throw rpcError;

      // Update delivery mode and address since RPC might not handle them
      if (rpcData.new_order_id) {
        await supabase.from('orders').update({
          delivery_mode: deliveryMode,
          maxim_address: deliveryMode === 'maxim' ? maximAddress : null,
          meetup_location: deliveryMode === 'meetup' ? 'lasalle' : 'alijis'
        }).eq('id', rpcData.new_order_id);
      }

      if (!rpcData.success) {
        setIsCheckingStock(false);
        if (rpcData.avail3 <= 0 && rpcData.avail4 <= 0 && rpcData.avail6 <= 0) {
          alert("🚨 SOLD OUT! \n\nAll remaining boxes were just reserved. Please stay tuned for the next batch!");
          onBack();
        } else {
          alert(`🚨 NOT ENOUGH STOCK! \n\nOnly ${Math.max(0, rpcData.avail3)} Box of 3, ${Math.max(0, rpcData.avail4)} Box of 4, and ${Math.max(0, rpcData.avail6)} Box of 6 are currently available.\n\nPlease adjust your order quantity.`);
        }
        return;
      }

      setHoldingOrderId(rpcData.order_id);
      setIsCheckingStock(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      alert(`Could not reserve slot: ${err.message || 'Unknown error'}`);
      setIsCheckingStock(false);
    }
  };

  const handleQuantityChange = (boxType: 'Box3' | 'Box4' | 'Box6' | 'Biscoff4' | 'Mixed4', change: number) => {
    setQuantities(prev => {
      const currentQty = prev[boxType];
      const newQty = Math.max(0, currentQty + change);

      const available = boxStocks[boxType];
      if (change > 0 && newQty > available) {
        const label = boxType === 'Box3' ? 'Box of 3' : boxType === 'Box4' ? 'Box of 4' : boxType === 'Box6' ? 'Box of 6' : boxType === 'Biscoff4' ? 'Biscoff Box of 4' : 'Biscoff and Pistacio Mixed Box of 4';
        alert(`Sorry, only ${available} ${label} left!`);
        return prev;
      }

      return { ...prev, [boxType]: newQty };
    });
  };

  const handleProceedToPayment = async () => {
    setIsPaying(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handleConfirmOrder = async () => {
    // paymentNumber is now optional (for bank transfers)
    if (!receiptFile) {
      alert("Please upload your payment receipt.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload Receipt Screenshot to Supabase Storage
      let screenshotPath = '';
      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop() || 'jpg';
        // Prefix with batch9/ for organization
        const fileName = `batch9/${fullName.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, receiptFile);

        if (uploadError) throw uploadError;
        screenshotPath = uploadData?.path || fileName;
      }

      // 2. Update Existing HOLDING Reservation to real Order
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          full_name: fullName,
          contact_number: contactNumber.replace(/\s/g, ''),
          instagram: instagram,
          quantity_type: `Box3: ${quantities.Box3}, Box4: ${quantities.Box4}, Box6: ${quantities.Box6}, Biscoff4: ${quantities.Biscoff4}, Mixed4: ${quantities.Mixed4}`,
          quantity: 1,
          status: 'Pending',
          payment_mode: 'gcash',
          delivery_mode: 'meetup',
          gcash_number: paymentNumber,
          gcash_screenshot_path: screenshotPath, // Important: save path for admin
          is_paid: false,
          special_instructions: '',
          created_at: new Date().toISOString()
        })
        .eq('id', holdingOrderId);

      if (orderError) throw orderError;


    } catch (e: any) {
      console.error('Submission Exception:', e);
      alert(`Error: ${e.message || 'Network error'}`);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsConfirmed(true);

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7aa0f0', '#ffb6b9', '#fdf8c3', '#e8d840']
    });
  };



  /* ── SUCCESS STATE (INVOICE) ── */
  if (submitted) {
    if (isConfirmed) {

      return (
        <div className="order-page fade-in">
          <div className="op-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="op-logo">
              <img src="/baked-by-logo.png" alt="BAKED BY" className="op-logo-img" style={{ width: '100px' }} />
            </div>

            <span style={{ fontSize: '3rem', marginBottom: '10px', display: 'block' }}>✅</span>
            <h2 className="success-header" style={{ fontSize: '2.2rem', color: '#10b981', fontFamily: 'Patrick Hand', marginBottom: '10px' }}>See you!</h2>

            <div className="success-state invoice-state" style={{ marginTop: '20px', border: 'none', boxShadow: 'none' }}>
              <p className="success-msg" style={{ fontSize: '1rem', color: '#475569', fontWeight: 600, marginBottom: '20px' }}>
                Your order has been recorded. Please save a screenshot of this invoice!
              </p>

              <div className="invoice-details" style={{ textAlign: 'left', background: '#fff', border: '2px solid #eef2ff' }}>
                <div className="invoice-row">
                  <span className="inv-label">Customer:</span>
                  <span className="inv-val">{fullName}</span>
                </div>
                <div className="invoice-row">
                  <span className="inv-label">Items:</span>
                  <span className="inv-val item-val">
                    {quantities.Box3 > 0 && `Box of 3 x ${quantities.Box3}`}
                    {(quantities.Box3 > 0 && (quantities.Box4 > 0 || quantities.Box6 > 0 || quantities.Biscoff4 > 0 || quantities.Mixed4 > 0)) && <br />}
                    {quantities.Box4 > 0 && `Box of 4 x ${quantities.Box4}`}
                    {(quantities.Box4 > 0 && (quantities.Box6 > 0 || quantities.Biscoff4 > 0 || quantities.Mixed4 > 0)) && <br />}
                    {quantities.Box6 > 0 && `Box of 6 x ${quantities.Box6}`}
                    {(quantities.Box6 > 0 && (quantities.Biscoff4 > 0 || quantities.Mixed4 > 0)) && <br />}
                    {quantities.Biscoff4 > 0 && `Biscoff Box of 4 x ${quantities.Biscoff4}`}
                    {(quantities.Biscoff4 > 0 && quantities.Mixed4 > 0) && <br />}
                    {quantities.Mixed4 > 0 && `Biscoff & Pistacio Mixed Box of 4 x ${quantities.Mixed4}`}
                  </span>
                </div>
                <div className="invoice-row">
                  <span className="inv-label">Total Paid:</span>
                  <span className="inv-val price-highlight">₱{totalPrice.toLocaleString()}</span>
                </div>
                <div className="invoice-divider" />
                <div style={{ padding: '10px 0' }}>
                  <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#142376', fontWeight: 800 }}>📍 {deliveryMode === 'maxim' ? 'Maxim Delivery (Self-Book):' : 'Meet-up Location:'}</p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#475569' }}>
                    {deliveryMode === 'maxim' ? (
                      <>
                        <strong style={{ color: '#92400e' }}>📍 Maxim pickup: Terra Nova Subdivision Swimming Pool</strong><br />
                        <span style={{ fontSize: '0.9rem' }}>📞 Rider Contact: (0995) 500 4044</span><br />
                        <span style={{ fontSize: '0.9rem' }}>🕒 Time: Book any time 12:00 PM - 3:00 PM (March 31, Tuesday)</span>
                        <div style={{ marginTop: '12px' }}>
                          <img 
                            src="/assets/maxim-location.jpg" 
                            alt="Maxim Pickup Pin" 
                            style={{ width: '100%', borderRadius: '12px', border: '1px solid #eef2ff' }} 
                          />
                        </div>
                      </>
                    ) : (
                      'meetups at lasalle gate 6 - 9am-10am, March 31 tuesday'
                    )}
                  </p>
                </div>
              </div>
            </div>


            <div style={{ background: '#f8fafc', padding: '25px', borderRadius: '25px', marginTop: '30px', border: '2px dotted #3b82f6' }}>
              <p style={{ color: '#1e3a8a', fontSize: '1.1rem', fontWeight: 900, marginBottom: '20px', lineHeight: '1.4' }}>
                LAST STEP: DM US YOUR ORDER & PAYMENT RECEIPT TO CONFIRM! 📥
              </p>
              <a
                href="https://ig.me/m/bakedby.bcd"
                className="place-order-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  textDecoration: 'none',
                  fontSize: '1.1rem',
                  padding: '14px 28px'
                }}
              >
                <span>Message @BAKEDBY.BCD</span>
                <span style={{ fontSize: '1.4rem' }}>💬</span>
              </a>
            </div>

            <button className="bg-btn-secondary" onClick={onBack} style={{ marginTop: '20px', textDecoration: 'none', color: '#94a3b8', fontSize: '0.9rem' }}>
              Back to Website
            </button>
          </div>
        </div>
      );
    }

    if (isPaying) {
      return (
        <div className="order-page fade-in">
          <div className="op-card">
            <div className="op-logo">
              <img src="/baked-by-logo.png" alt="BAKED BY" className="op-logo-img" />
            </div>
            <div className="success-state invoice-state">
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', marginBottom: '5px' }}>Payment Window Closes In</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#dc2626', fontFamily: 'monospace' }}>{formatTime(timeLeft)}</div>
                <p style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '5px', fontWeight: 600 }}>
                  ⚠️ If payment is not sent within 10 minutes, your order will be automatically removed to free up stock for others.
                </p>
              </div>

              <h1 className="success-title">Payment</h1>
              <div style={{ background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '15px', padding: '20px', marginBottom: '25px', textAlign: 'center', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>Total Amount to Pay</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1d4ed8' }}>₱{totalPrice.toLocaleString()}</div>
              </div>

              <p className="success-msg" style={{ marginBottom: '15px' }}>Scan any QR below to pay the amount above.</p>

              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', padding: '12px', marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 800, margin: 0 }}>
                  💡 Use the other QR Code / Mode of payment in case of sending problems.
                </p>
              </div>

              <div className="qr-container">
                <div className="qr-item">
                  <img src="/assets/qrs/gcash_qr1.jpg" alt="GCash QR 1" className="qr-img" style={{ border: '2px solid #3b82f6' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 900, marginTop: '8px', textAlign: 'center', color: '#1e3a8a', marginBottom: '4px' }}>GCASH (LE**H)</p>
                  <div
                    onClick={() => { navigator.clipboard.writeText('09922538266'); alert('Number copied!'); }}
                    style={{ background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1d4ed8' }}>0992 253 8266</span>
                    <span style={{ fontSize: '0.8rem' }}>📋</span>
                  </div>
                </div>
                <div className="qr-item">
                  <img src="/assets/qrs/gotyme_qr.jpg" alt="GoTyme QR" className="qr-img" style={{ border: '2px solid #10b981' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 900, marginTop: '8px', textAlign: 'center', color: '#065f46', marginBottom: '4px' }}>GOTYME (LEIGH M.)</p>
                  <div
                    onClick={() => { navigator.clipboard.writeText('09922538266'); alert('Number copied!'); }}
                    style={{ background: '#f0fdf4', border: '1px solid #10b981', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d' }}>0992 253 8266</span>
                    <span style={{ fontSize: '0.8rem' }}>📋</span>
                  </div>
                </div>
                <div className="qr-item">
                  <img src="/assets/qrs/gcash_qr2.jpg" alt="GCash QR 2" className="qr-img" style={{ border: '2px solid #3b82f6' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: 900, marginTop: '8px', textAlign: 'center', color: '#1e3a8a', marginBottom: '4px' }}>GCASH (MA***H)</p>
                  <div
                    onClick={() => { navigator.clipboard.writeText('09944842605'); alert('Number copied!'); }}
                    style={{ background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '8px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1d4ed8' }}>0994 484 2605</span>
                    <span style={{ fontSize: '0.8rem' }}>📋</span>
                  </div>
                </div>
              </div>

              <div className="form-section" style={{ marginTop: '30px' }}>
                <div className="input-group">
                  <label>GCash Number <small>(Optional if Bank Transfer)</small></label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. 0912 345 6789"
                    value={paymentNumber}
                    onChange={(e) => setPaymentNumber(e.target.value)}
                  />
                </div>
                <div className="input-group" style={{ marginTop: '15px' }}>
                  <label>Upload Payment Receipt</label>
                  <label className="receipt-upload-box" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files ? e.target.files[0] : null;
                        setReceiptFile(file);
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setReceiptPreview(reader.result as string);
                          reader.readAsDataURL(file);
                        } else {
                          setReceiptPreview(null);
                        }
                      }}
                      style={{ display: 'none' }}
                    />
                    {receiptPreview ? (
                      <img
                        src={receiptPreview}
                        alt="Receipt Preview"
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '10px', marginBottom: '10px' }}
                      />
                    ) : (
                      <span style={{ fontSize: '2rem' }}>📸</span>
                    )}
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: receiptFile ? '#1e293b' : '#dc2626' }}>
                      {receiptFile ? '✅ Screenshot Attached' : 'Tap to upload receipt screenshot (REQUIRED) ‼️'}
                    </span>
                    {receiptFile && <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800 }}>✓ {receiptFile.name}</span>}
                  </label>
                </div>
              </div>

              <div className="invoice-footer" style={{ marginTop: '30px' }}>
                <div className="form-submit-row" style={{ width: '100%' }}>
                  <button className="place-order-btn place-order-btn-sm btn-secondary" disabled={isSubmitting} onClick={handleEditOrder}>Back to Details</button>
                  <button
                    className="place-order-btn place-order-btn-sm"
                    disabled={isSubmitting || !receiptFile}
                    onClick={handleConfirmOrder}
                    style={{
                      opacity: (isSubmitting || !receiptFile) ? 0.6 : 1,
                      cursor: (isSubmitting || !receiptFile) ? 'not-allowed' : 'pointer',
                      background: (!receiptFile) ? '#94a3b8' : ''
                    }}
                  >
                    {isSubmitting ? 'Processing...' : 'Complete Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="order-page fade-in">
        <div className="op-card">
          <div className="op-logo">
            <img src="/baked-by-logo.png" alt="BAKED BY" className="op-logo-img" />
          </div>
          <div className="success-state invoice-state">
            <h1 className="success-title">Order Summary</h1>
            <p className="success-msg">Please review your order details before paying.</p>

            <div className="invoice-details">
              <div className="invoice-row">
                <span className="inv-label">Name:</span>
                <span className="inv-val">{fullName}</span>
              </div>
              <div className="invoice-row">
                <span className="inv-label">Contact:</span>
                <span className="inv-val">{contactNumber}</span>
              </div>
              {instagram && (
                <div className="invoice-row">
                  <span className="inv-label">Instagram:</span>
                  <span className="inv-val">{instagram}</span>
                </div>
              )}

              <div className="invoice-divider" />

              <div className="invoice-row">
                <span className="inv-label">Item:</span>
                <span className="inv-val item-val">
                    Dubai Chewy Chocolate<br />
                    <small>
                      {quantities.Box3 > 0 && `Box of 3 x ${quantities.Box3}`}
                      {(quantities.Box3 > 0 && (quantities.Box4 > 0 || quantities.Box6 > 0 || quantities.Biscoff4 > 0 || quantities.Mixed4 > 0)) && <br />}
                      {quantities.Box4 > 0 && `Box of 4 x ${quantities.Box4}`}
                      {(quantities.Box4 > 0 && (quantities.Box6 > 0 || quantities.Biscoff4 > 0 || quantities.Mixed4 > 0)) && <br />}
                      {quantities.Box6 > 0 && `Box of 6 x ${quantities.Box6}`}
                    </small>
                    {(quantities.Biscoff4 > 0 || quantities.Mixed4 > 0) && (
                      <>
                        <br />
                        Other Variants<br />
                        <small>
                          {quantities.Biscoff4 > 0 && `Biscoff Box of 4 x ${quantities.Biscoff4}`}
                          {(quantities.Biscoff4 > 0 && quantities.Mixed4 > 0) && <br />}
                          {quantities.Mixed4 > 0 && `Biscoff & Pistacio Mixed x ${quantities.Mixed4}`}
                        </small>
                      </>
                    )}
                </span>
              </div>

              <div className="invoice-row">
                <span className="inv-label">Total Price:</span>
                <span className="inv-val price-highlight">₱{totalPrice.toLocaleString()}</span>
              </div>

            </div>

            <div className="invoice-footer">
              <div className="form-submit-row" style={{ width: '100%' }}>
                <button className="place-order-btn place-order-btn-sm btn-secondary" disabled={isSubmitting} onClick={handleEditOrder}>Edit Order</button>
                <button className="place-order-btn place-order-btn-sm" disabled={isSubmitting || isCheckingStock} onClick={handleProceedToPayment}>
                  {isCheckingStock ? 'Checking...' : 'Pay Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="order-page fade-in">

      {/* Narrow white card centered over the background */}
      <div className="op-card">

        {/* Top level back button (Internal to Card) */}
        {!isConfirmed && (
          <button
            type="button"
            className="op-back-btn"
            onClick={handleExitOrder}
            style={{ position: 'absolute', top: '15px', left: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', zIndex: 10, color: '#94a3b8' }}
          >
            ← Back
          </button>
        )}

        {/* Mini BAKED BY logo */}
        <div className="op-logo">
          <img src="/baked-by-logo.png" alt="BAKED BY" className="op-logo-img" />
        </div>

        {/* Product info with real cookie icon */}
        <div className="op-product-info">
          <img src="/cookie-icon.png" alt="cookie" className="op-cookie-icon" />
          <div>
            <div className="op-product-title">Dubai Chewy Chocolate Pre-Order</div>
            <div className="op-product-sub">Batch 9</div>
            <div className="op-product-price-list" style={{ color: '#1e3a8a', fontSize: '0.9rem', fontWeight: 900, background: '#eff6ff', padding: '6px 12px', borderRadius: '8px', display: 'inline-block', marginTop: '6px', border: '1px solid #bfdbfe' }}>
              📍 meetups at lasalle gate 6 - 9am-10am, March 31 tuesday
            </div>
            <div className="op-product-price-list" style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: 900, background: '#ecfdf5', padding: '4px 10px', borderRadius: '8px', display: 'block', marginTop: '6px', border: '1px solid #a7f3d0' }}>
              ₱265 for Box of 3 • ₱350 for Box of 4 • ₱525 for Box of 6
            </div>
            <div className="op-product-price-list" style={{ color: '#d97706', fontSize: '0.9rem', fontWeight: 900, background: '#fffbeb', padding: '4px 10px', borderRadius: '8px', display: 'block', marginTop: '6px', border: '1px solid #fde68a' }}>
              ₱330 for Biscoff Box of 4
            </div>
            <div className="op-product-limit-note">
              First come, first served.
            </div>
          </div>
        </div>

        <form className="order-form" onSubmit={handleSubmit} noValidate>

          {/* Customer Details */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="form-step-badge">1</span>
              Customer Details:
            </div>

            {/* Full Name */}
            <div className="form-row">
              <label className="form-label" htmlFor="fullName">Full Name:</label>
              <div className="form-field">
                <input id="fullName" className={`form-input pill${errors.fullName ? ' err' : ''}`} type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="" />
                {errors.fullName && <span className="err-msg">{errors.fullName}</span>}
              </div>
            </div>

            {/* Contact Number */}
            <div className="form-row">
              <label className="form-label" htmlFor="contactNumber">Contact Number:</label>
              <div className="form-field">
                <input
                  id="contactNumber"
                  className={`form-input pill${errors.contactNumber ? ' err' : ''}`}
                  type="tel"
                  value={contactNumber}
                  onChange={handlePhoneChange}
                  placeholder="09XX XXX XXXX"
                  maxLength={13}
                />
                {errors.contactNumber && <span className="err-msg">{errors.contactNumber}</span>}
              </div>
            </div>

            {/* Instagram */}
            <div className="form-row">
              <label className="form-label" htmlFor="instagram">Instagram Handle:</label>
              <div className="form-field">
                <input id="instagram" className={`form-input pill${errors.instagram ? ' err' : ''}`} type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="" />
                {errors.instagram && <span className="err-msg">{errors.instagram}</span>}
              </div>
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="form-section">
            <div className="form-section-title" id="quantity">
              <span className="form-step-badge">2</span>
              Order Quantity:
            </div>
            {errors.quantity && <span className="err-msg">{errors.quantity}</span>}
            
            <div style={{ color: '#7ca95c', fontWeight: 900, fontSize: '1.2rem', marginTop: '10px', marginBottom: '10px', fontFamily: 'Patrick Hand, cursive' }}>Dubai Chewy Cookie</div>

            <div className="qty-row-item">
              <div className="qty-info">
                <span className="qty-label">Box of 3</span>
                <span className="qty-sub">
                  <span style={{ color: boxStocks.Box3 === 0 ? '#ef4444' : '#10b981', fontWeight: 800, marginLeft: '0px' }}>
                    {boxLoading ? 'Checking...' : `${boxStocks.Box3} left`}
                  </span>
                </span>
              </div>
              <div className="qty-stepper">
                <button type="button" className="qty-btn" onClick={() => handleQuantityChange('Box3', -1)}>−</button>
                <span className="qty-val">{quantities.Box3}</span>
                <button type="button" className="qty-btn" onClick={() => handleQuantityChange('Box3', 1)}>+</button>
              </div>
            </div>

            <div className="qty-row-item">
              <div className="qty-info">
                <span className="qty-label">Box of 4</span>
                <span className="qty-sub">
                  <span style={{ color: boxStocks.Box4 === 0 ? '#ef4444' : '#10b981', fontWeight: 800, marginLeft: '0px' }}>
                    {boxLoading ? 'Checking...' : `${boxStocks.Box4} left`}
                  </span>
                </span>
              </div>
              <div className="qty-stepper">
                <button type="button" className="qty-btn" onClick={() => handleQuantityChange('Box4', -1)}>−</button>
                <span className="qty-val">{quantities.Box4}</span>
                <button type="button" className="qty-btn" onClick={() => handleQuantityChange('Box4', 1)}>+</button>
              </div>
            </div>

            <div className="qty-row-item" style={{ marginTop: '10px' }}>
              <div className="qty-info">
                <span className="qty-label">Box of 6</span>
                <span className="qty-sub">
                  <span style={{ color: boxStocks.Box6 === 0 ? '#ef4444' : '#10b981', fontWeight: 800, marginLeft: '0px' }}>
                    {boxLoading ? 'Checking...' : `${boxStocks.Box6} left`}
                  </span>
                </span>
              </div>
              <div className="qty-stepper">
                <button type="button" className="qty-btn" onClick={() => handleQuantityChange('Box6', -1)}>−</button>
                <span className="qty-val">{quantities.Box6}</span>
                <button type="button" className="qty-btn" onClick={() => handleQuantityChange('Box6', 1)}>+</button>
              </div>
            </div>

            <div className="qty-row-item" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #e2e8f0' }}>
              <div className="qty-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="qty-label">Biscoff Chewy Cookie</span>
                  <span style={{ fontSize: '0.7rem', background: '#fde68a', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>NEW</span>
                </div>
                <span className="qty-sub">
                  <span className="qty-price" style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Box of 4 • ₱330</span>
                  <br />
                  <span style={{ color: boxStocks.Biscoff4 === 0 ? '#ef4444' : '#10b981', fontWeight: 800, marginLeft: '0px' }}>
                    {boxLoading ? 'Checking...' : `${boxStocks.Biscoff4} left`}
                  </span>
                </span>
              </div>
              <div className="qty-stepper">
                <button type="button" className="qty-btn" onClick={() => handleQuantityChange('Biscoff4', -1)} style={{ borderColor: '#fde68a', color: '#111' }}>−</button>
                <span className="qty-val">{quantities.Biscoff4}</span>
                <button type="button" className="qty-btn" onClick={() => handleQuantityChange('Biscoff4', 1)} style={{ borderColor: '#fde68a', color: '#111' }}>+</button>
              </div>
            </div>

            <div className="qty-row-item" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #e2e8f0' }}>
              <div className="qty-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="qty-label">Biscoff & Pistacio Mixed</span>
                  <span style={{ fontSize: '0.7rem', background: '#f5d0fe', color: '#701a75', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>NEW</span>
                </div>
                <span className="qty-sub">
                  <span className="qty-price" style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>Box of 4 • ₱342</span>
                  <br />
                  <span style={{ color: boxStocks.Mixed4 === 0 ? '#ef4444' : '#10b981', fontWeight: 800, marginLeft: '0px' }}>
                    {boxLoading ? 'Checking...' : `${boxStocks.Mixed4} left`}
                  </span>
                </span>
              </div>
              <div className="qty-stepper">
                <button type="button" className="qty-btn" onClick={() => handleQuantityChange('Mixed4', -1)} style={{ borderColor: '#f5d0fe', color: '#111' }}>−</button>
                <span className="qty-val">{quantities.Mixed4}</span>
                <button type="button" className="qty-btn" onClick={() => handleQuantityChange('Mixed4', 1)} style={{ borderColor: '#f5d0fe', color: '#111' }}>+</button>
              </div>
            </div>
          </div>

          {/* Step 3: Delivery Method */}
          <div className="form-section">
            <div className="form-section-title" id="delivery">
              <span className="form-step-badge">3</span>
              Delivery Method:
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                type="button"
                className={`place-order-btn pill ${deliveryMode === 'meetup' ? '' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.9rem', padding: '10px' }}
                onClick={() => setDeliveryMode('meetup')}
              >
                🤝 Meetup (La Salle)
              </button>
              <button
                type="button"
                className={`place-order-btn pill ${deliveryMode === 'maxim' ? '' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.9rem', padding: '10px' }}
                onClick={() => setDeliveryMode('maxim')}
              >
                🚚 Maxim (Self-Book)
              </button>
            </div>

            {deliveryMode === 'meetup' ? (
              <div style={{ marginTop: '15px', padding: '15px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#1e40af', display: 'block', marginBottom: '4px' }}>📍 Pickup Details</strong>
                <span style={{ color: '#1e3a8a' }}>meetups at lasalle gate 6 - 9am-10am, March 31 tuesday</span>
              </div>
            ) : (
              <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '15px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#92400e', display: 'block', marginBottom: '8px' }}>⚠️ Maxim Instructions</strong>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#92400e', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li><strong>Book your own Maxim rider!</strong></li>
                    <li>Book anytime between <strong>12:00 PM - 3:00 PM</strong> only on <strong>March 31, Tuesday</strong>.</li>
                    <li>📍 Pickup: <strong>Terra Nova Subdivision Swimming Pool</strong></li>
                    <li>📞 Number for rider: <strong>(0995) 500 4044</strong></li>
                  </ul>
                </div>

                <div style={{ marginTop: '5px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>Reference Location Pin:</span>
                  <img 
                    src="/assets/maxim-location.jpg" 
                    alt="Maxim Pickup Pin" 
                    style={{ width: '100%', borderRadius: '12px', border: '2px solid #e2e8f0' }} 
                  />
                  <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '6px', textAlign: 'center' }}>
                    Pin: Terra Nova Subdivision Swimming Pool
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="form-submit-row" style={{ marginTop: '20px' }}>
            <button
              type="submit"
              disabled={isCheckingStock}
              className="place-order-btn fade-in pulse-button"
              style={{
                width: '100%',
                fontSize: '1.1rem',
                background: isCheckingStock ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: isCheckingStock ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span style={{ fontSize: '1.3rem', marginRight: '6px' }}>👀</span> {isCheckingStock ? 'Checking...' : 'Review Order Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ADMIN LOGIN
 ═══════════════════════════════════════ */
function AdminLogin({ onLogin, onBack }: { onLogin: () => void; onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else onLogin();
    setLoading(false);
  };

  return (
    <div className="order-page fade-in">
      <div className="op-card" style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="op-logo">
          <img src="/baked-by-logo.png" alt="BAKED BY" className="op-logo-img" />
        </div>
        <h2 className="success-title" style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Admin Login</h2>
        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-field">
            <label className="form-label" style={{ textAlign: 'left', minWidth: 'auto', marginBottom: '5px' }}>Email</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-field">
            <label className="form-label" style={{ textAlign: 'left', minWidth: 'auto', marginBottom: '5px' }}>Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="err-msg" style={{ padding: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onBack} className="place-order-btn place-order-btn-sm btn-secondary" style={{ flex: 1 }}>Back</button>
            <button type="submit" className="place-order-btn place-order-btn-sm" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ADMIN DASHBOARD
 ═══════════════════════════════════════ */
function AdminDashboard({ onLogout, onBack, isLocked, onToggleLock, targetDate, onUpdateReleaseTime }: { onLogout: () => void; onBack: () => void; isLocked: boolean; onToggleLock: () => void; targetDate: Date; onUpdateReleaseTime: (newDate: Date) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [b3Stock, setB3Stock] = useState<number>(0);
  const [b4Stock, setB4Stock] = useState<number>(0);
  const [b6Stock, setB6Stock] = useState<number>(0);
  const [biscoff4Stock, setBiscoff4Stock] = useState<number>(0);
  const [mixed4Stock, setMixed4Stock] = useState<number>(0);
  const [updatingStock, setUpdatingStock] = useState(false);
  const [showToCollect, setShowToCollect] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeliveryList, setShowDeliveryList] = useState(false);
  const [showProductionDetails, setShowProductionDetails] = useState(false);
  const [activeDeliveryTab, setActiveDeliveryTab] = useState<'meetup' | 'maxim' | 'refund' | null>(null);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [showFinanceHistory, setShowFinanceHistory] = useState(false);
  const [showHoldingModal, setShowHoldingModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<number>(9); // Default to current batch

  // Release Schedule State
  const [newTargetDate, setNewTargetDate] = useState(targetDate.toISOString().slice(0, 16));

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterDelivery, setFilterDelivery] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortKey] = useState('created_at');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchOrders();
    fetchStock();
  }, []);

  // Sync state with props
  useEffect(() => {
    setNewTargetDate(targetDate.toISOString().slice(0, 16));
  }, [targetDate]);

  // --- CALCULATIONS (Batching & Stats) ---
  const { activeOrders, holdingOrders, expiredOrders, activeStats, s4, s5, s6, s7, s8, s9, recentNotes } = useMemo(() => {
                        const cutoff5 = new Date('2026-03-12T00:00:00+08:00').getTime();
                        const cutoff6 = new Date('2026-03-16T00:00:00+08:00').getTime();
                        const cutoff7 = new Date('2026-03-19T00:00:00+08:00').getTime();
                        const cutoff8 = new Date('2026-03-24T18:00:00+08:00').getTime();
                        const cutoff9 = new Date('2026-03-30T17:00:00+08:00').getTime();
    const batch4Orders = orders.filter(o => new Date(o.created_at).getTime() < cutoff5);
    const batch5Orders = orders.filter(o => {
      const t = new Date(o.created_at).getTime();
      return t >= cutoff5 && t < cutoff6;
    });
    const batch6Orders = orders.filter(o => {
      const t = new Date(o.created_at).getTime();
      return t >= cutoff6 && t < cutoff7;
    });
    const batch7Orders = orders.filter(o => {
      const t = new Date(o.created_at).getTime();
      return t >= cutoff7 && t < cutoff8;
    });
    const batch8Orders = orders.filter(o => {
      const t = new Date(o.created_at).getTime();
      return t >= cutoff8 && t < cutoff9;
    });
    const batch9Orders = orders.filter(o => new Date(o.created_at).getTime() >= cutoff9);

    const getStats = (list: any[]) => {
      let b3 = 0, b4 = 0, b6 = 0, b12 = 0, biscoff4 = 0, mixed4 = 0;
      let rev = 0;
      list.forEach(o => {
        const typeVal = o.quantity_type || '';
        if (typeVal.includes('Box3:') || typeVal.includes('Biscoff4:') || typeVal.includes('Mixed4:')) {
          const b3Match = typeVal.match(/Box3:\s(\d+)/);
          const b4Match = typeVal.match(/Box4:\s(\d+)/);
          const b6Match = typeVal.match(/Box6:\s(\d+)/);
          const b12Match = typeVal.match(/Box12:\s(\d+)/);
          const biscoffMatch = typeVal.match(/Biscoff4:\s(\d+)/);
          const mixedMatch = typeVal.match(/Mixed4:\s(\d+)/);

          b3 += b3Match ? parseInt(b3Match[1]) : 0;
          b4 += b4Match ? parseInt(b4Match[1]) : 0;
          b6 += b6Match ? parseInt(b6Match[1]) : 0;
          b12 += b12Match ? parseInt(b12Match[1]) : 0;
          biscoff4 += biscoffMatch ? parseInt(biscoffMatch[1]) : 0;
          mixed4 += mixedMatch ? parseInt(mixedMatch[1]) : 0;
        }
        rev += o.total_price || 0;
      });
      return { b3, b4, b6, b12, biscoff4, mixed4, cookies: (b3 * 3) + (b4 * 4) + (b6 * 6) + (b12 * 12) + (biscoff4 * 4) + (mixed4 * 4), revenue: rev, count: list.length };
    };

    const s4Comp = getStats(batch4Orders);
    const s5Comp = getStats(batch5Orders);
    const s6Comp = getStats(batch6Orders);
    const s7Comp = getStats(batch7Orders);
    const s8Comp = getStats(batch8Orders);
    const s9Comp = getStats(batch9Orders);

    const activeList = selectedBatch === 9 ? batch9Orders : (selectedBatch === 8 ? batch8Orders : (selectedBatch === 7 ? batch7Orders : (selectedBatch === 6 ? batch6Orders : (selectedBatch === 5 ? batch5Orders : batch4Orders))));
    const stats = getStats(activeList.filter(o => !(o.status === 'Delivered' && o.is_paid)));
    const holding = activeList.filter(o => o.status === 'Holding');
    const expired = activeList.filter(o => o.status === 'Expired');

    let notes: { name: string, note: string }[] = [];
    activeList.forEach(o => {
      if (o.status === 'Delivered' && o.is_paid) return;
      if (o.status === 'Holding' || o.status === 'Expired') return;
      if (o.special_instructions && o.special_instructions.trim()) {
        if (!notes.some(rn => rn.note === o.special_instructions)) {
          notes.push({ name: o.full_name, note: o.special_instructions });
        }
      }
    });

    return {
      activeOrders: activeList.filter(o => o.status !== 'Expired'),
      holdingOrders: holding,
      expiredOrders: expired,
      activeStats: stats,
      s4: s4Comp,
      s5: s5Comp,
      s6: s6Comp,
      s7: s7Comp,
      s8: s8Comp,
      s9: s9Comp,
      recentNotes: notes
    };
  }, [orders, selectedBatch]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  const fetchStock = async () => {
    const { data: b3 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Box of 3').single();
    const { data: b4 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Box of 4').single();
    const { data: b6 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Box of 6').single();
    const { data: biscoff4 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Biscoff Box of 4').single();
    const { data: mixed4 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Biscoff and Pistacio Mixed').single();
    if (b3) setB3Stock(b3.stock_count);
    if (b4) setB4Stock(b4.stock_count);
    if (b6) setB6Stock(b6.stock_count);
    if (biscoff4) setBiscoff4Stock(biscoff4.stock_count);
    if (mixed4) setMixed4Stock(mixed4.stock_count);
  };

  const updateStock = async (boxType: 'Box of 3' | 'Box of 4' | 'Box of 6' | 'Biscoff Box of 4' | 'Biscoff and Pistacio Mixed', newStock: number) => {
    setUpdatingStock(true);
    const { error } = await supabase
      .from('inventory')
      .update({ stock_count: newStock })
      .eq('item_name', boxType);
    if (!error) {
      if (boxType === 'Box of 3') setB3Stock(newStock);
      else if (boxType === 'Box of 4') setB4Stock(newStock);
      else if (boxType === 'Box of 6') setB6Stock(newStock);
      else if (boxType === 'Biscoff Box of 4') setBiscoff4Stock(newStock);
      else setMixed4Stock(newStock);
    }
    setUpdatingStock(false);
  };

  const handleRestoreOrder = async (order: any) => {
    const confirmation = window.confirm(`Restore this order for ${order.full_name}? \n\nThis will automatically REDUCE current stock levels to accommodate the boxes.`);
    if (!confirmation) return;
    
    try {
      setUpdatingStock(true);
      const typeVal = order.quantity_type || '';
      const b3Match = typeVal.match(/Box3:\s(\d+)/);
      const b4Match = typeVal.match(/Box4:\s(\d+)/);
      const b6Match = typeVal.match(/Box6:\s(\d+)/);
      const b12Match = typeVal.match(/Box12:\s(\d+)/);
      const biscoff4Match = typeVal.match(/Biscoff4:\s(\d+)/);
      const mixed4Match = typeVal.match(/Mixed4:\s(\d+)/);

      const b3 = b3Match ? parseInt(b3Match[1]) : 0;
      const b4 = b4Match ? parseInt(b4Match[1]) : 0;
      const b6 = b6Match ? parseInt(b6Match[1]) : 0;
      const b12 = b12Match ? parseInt(b12Match[1]) : 0;
      const biscoff4 = biscoff4Match ? parseInt(biscoff4Match[1]) : 0;
      const mixed4 = mixed4Match ? parseInt(mixed4Match[1]) : 0;

      // Decrement using RPC (negative amount)
      if (b3 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 3', p_amount: -b3 });
      if (b4 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 4', p_amount: -b4 });
      if (b6 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 6', p_amount: -b6 });
      if (b12 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 12', p_amount: -b12 });
      if (biscoff4 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Biscoff Box of 4', p_amount: -biscoff4 });
      if (mixed4 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Biscoff and Pistacio Mixed', p_amount: -mixed4 });

      const { error } = await supabase.from('orders').update({ status: 'Pending' }).eq('id', order.id);
      if (error) throw error;

      alert("Order successfully restored to Pending! Stock has been deducted.");
      fetchOrders();
      fetchStock();
    } catch (e: any) {
      console.error(e);
      alert("Error restoring order: " + e.message);
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleMarkAsRefunded = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to mark this order as 'Refunded'? This action cannot be undone.")) {
      return;
    }
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Refunded' })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders(); // Refresh orders to show updated status
      alert('Order marked as Refunded.');
    } catch (err: any) {
      console.error('Error marking order as refunded:', err);
      alert('Failed to mark order as refunded: ' + err.message);
    }
  };

  const handleConfirmHoldingOrder = async (orderId: string) => {
    if (!window.confirm("This customer may have paid but didn't finish the form. Confirming will move them to the 'Pending' list. Continue?")) {
      return;
    }
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Pending' })
        .eq('id', orderId);

      if (error) throw error;
      
      // Update local state and refresh
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Pending' } : o));
      alert('Reservation confirmed! Order is now in the Pending list. ✅');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);

    try {
      // 1. Calculate cookies to return
      const typeVal = orderToDelete.quantity_type || '';
      const b3Match = typeVal.match(/Box3:\s(\d+)/);
      const b4Match = typeVal.match(/Box4:\s(\d+)/);
      const b6Match = typeVal.match(/Box6:\s(\d+)/);
      const b12Match = typeVal.match(/Box12:\s(\d+)/);
      const biscoff4Match = typeVal.match(/Biscoff4:\s(\d+)/);
      const mixed4Match = typeVal.match(/Mixed4:\s(\d+)/);

      const b3Return = b3Match ? parseInt(b3Match[1]) : 0;
      const b4Return = b4Match ? parseInt(b4Match[1]) : 0;
      const b6Return = b6Match ? parseInt(b6Match[1]) : 0;
      const b12Return = b12Match ? parseInt(b12Match[1]) : 0;
      const biscoff4Return = biscoff4Match ? parseInt(biscoff4Match[1]) : 0;
      const mixed4Return = mixed4Match ? parseInt(mixed4Match[1]) : 0;

      if (b3Return > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 3', p_amount: b3Return });
      if (b4Return > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 4', p_amount: b4Return });
      if (b6Return > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 6', p_amount: b6Return });
      if (b12Return > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 12', p_amount: b12Return });
      if (biscoff4Return > 0) await supabase.rpc('increment_box_stock', { p_item: 'Biscoff Box of 4', p_amount: biscoff4Return });
      if (mixed4Return > 0) await supabase.rpc('increment_box_stock', { p_item: 'Biscoff and Pistacio Mixed', p_amount: mixed4Return });

      // 3. Delete order
      const { error: deleteError, count } = await supabase
        .from('orders')
        .delete({ count: 'exact' })
        .eq('id', orderToDelete.id);

      if (deleteError) throw deleteError;

      // If count is 0, it means RLS probably blocked it
      if (count === 0) {
        throw new Error('Deletion failed. You might not have permission to delete orders in Supabase RLS.');
      }

      // 4. Update local state immediately for snappy UI
      setOrders(prev => prev.filter(o => o.id !== orderToDelete.id));

      // 5. Refresh from server to stay in sync
      fetchOrders();
      fetchStock();

      setOrderToDelete(null);
      alert(`Order deleted and stock returned to inventory.`);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Error deleting order: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    // Helper: parse quantity_type string into readable quantity and total pieces
    const parseQuantity = (quantityType: string) => {
      let totalPieces = 0;
      const parts: string[] = [];
      if (quantityType && quantityType.includes(':')) {
        const items = quantityType.split(', ');
        items.forEach((item: string) => {
          const p = item.split(': ');
          const type = p[0];
          const count = parseInt(p[1]) || 0;
          if (count > 0) {
            const label = type === 'Box3' ? 'Box of 3' : type === 'Box4' ? 'Box of 4' : type === 'Box6' ? 'Box of 6' : type === 'Box12' ? 'Box of 12' : type === 'Biscoff4' ? 'Biscoff Box of 4' : type === 'Mixed4' ? 'Biscoff & Pistacio Mixed' : type;
            parts.push(`${count}x ${label}`);
            const multiplier = type === 'Box3' ? 3 : type === 'Box4' ? 4 : type === 'Box6' ? 6 : type === 'Box12' ? 12 : (type === 'Biscoff4' || type === 'Mixed4') ? 4 : 0;
            totalPieces += (count * multiplier);
          }
        });
      }
      return { display: parts.join(', ') || 'N/A', totalPieces };
    };

    // ── Style definitions for colored section headers ──
    const headerStyleOrange = { fill: { fgColor: { rgb: 'F4B084' } }, font: { bold: true, sz: 11, color: { rgb: '000000' } }, alignment: { horizontal: 'left' as const } };
    const headerStyleGreen = { fill: { fgColor: { rgb: 'A9D18E' } }, font: { bold: true, sz: 11, color: { rgb: '000000' } }, alignment: { horizontal: 'left' as const } };
    const headerStyleTeal = { fill: { fgColor: { rgb: '4BACC6' } }, font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'left' as const } };
    const headerStyleOrange2 = { fill: { fgColor: { rgb: 'ED7D31' } }, font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, alignment: { horizontal: 'left' as const } };

    // Apply a style to every cell in a given row
    const styleRow = (ws: any, rowIdx: number, colCount: number, style: any) => {
      for (let c = 0; c < colCount; c++) {
        const ref = XLSX.utils.encode_cell({ r: rowIdx, c });
        if (!ws[ref]) ws[ref] = { v: '', t: 's' };
        ws[ref].s = style;
      }
    };

    // Auto-fit column widths from AOA data
    const autoFitAoa = (ws: any, aoa: any[][]) => {
      if (aoa.length === 0) return;
      const colCount = Math.max(...aoa.map(r => r.length));
      ws['!cols'] = Array.from({ length: colCount }, (_, i) => {
        const maxLen = Math.max(...aoa.map(row => String(row[i] ?? '').length));
        return { wch: Math.min(Math.max(maxLen + 2, 10), 55) };
      });
    };

    const workbook = XLSX.utils.book_new();
    const timeSlots = ['10am - 12pm', '2pm - 3pm'];

    // ═══════════════════════════════════════
    //  SHEET 1: Maxim Deliveries
    // ═══════════════════════════════════════
    const maximOrders = orders.filter(o => o.delivery_mode === 'maxim' && o.status !== 'Refund Needed' && o.status !== 'Refunded');
    const maximCols = ['', 'Name', 'Quantity', 'Total Pieces', 'Total Price', 'Payment Status', 'Remaining Balance', 'Contact', 'Instagram'];
    const maximAoa: any[][] = [];

    const pickupLocations = [
      { filter: (o: any) => o.meetup_location !== 'rolling-hills', label: 'LASALLE' },
      { filter: (o: any) => o.meetup_location === 'rolling-hills', label: 'ROLLING HILLS' },
    ];

    for (const timeSlot of timeSlots) {
      for (const loc of pickupLocations) {
        const groupOrders = maximOrders.filter(o => o.meetup_time === timeSlot && loc.filter(o));
        if (groupOrders.length === 0) continue;

        const timeLabel = timeSlot === '10am - 12pm' ? '10am - 12pm' : '2pm - 3pm';
        // Blank separator row before each group (except the first)
        if (maximAoa.length > 0) maximAoa.push([]);
        // Section header row
        maximAoa.push([`${timeLabel} (${loc.label})`, ...maximCols.slice(1)]);
        // Data rows
        for (const o of groupOrders) {
          const qty = parseQuantity(o.quantity_type);
          maximAoa.push([
            o.maxim_address || 'No address',
            o.full_name,
            qty.display,
            qty.totalPieces,
            `₱${(o.total_price || 0).toLocaleString()}`,
            o.is_paid ? 'PAID FULL' : 'DP ONLY',
            o.is_paid ? '₱0' : `₱${Math.round(o.total_price - o.downpayment_price).toLocaleString()}`,
            o.contact_number || 'N/A',
            o.instagram || 'N/A',
          ]);
        }
      }
    }

    if (maximAoa.length > 0) {
      const maximSheet = XLSX.utils.aoa_to_sheet(maximAoa);
      autoFitAoa(maximSheet, maximAoa);
      // Color each section header row
      const maximHeaderRows: { row: number; location: string }[] = [];
      let ri = 0;
      for (const timeSlot of timeSlots) {
        for (const loc of pickupLocations) {
          const cnt = maximOrders.filter(o => o.meetup_time === timeSlot && loc.filter(o)).length;
          if (cnt === 0) continue;
          if (ri > 0) ri++; // blank separator
          maximHeaderRows.push({ row: ri, location: loc.label });
          ri += cnt + 1;
        }
      }
      for (const h of maximHeaderRows) {
        styleRow(maximSheet, h.row, maximCols.length, h.location === 'ROLLING HILLS' ? headerStyleGreen : headerStyleOrange);
      }
      XLSX.utils.book_append_sheet(workbook, maximSheet, 'Maxim Deliveries');
    }

    // ═══════════════════════════════════════
    //  SHEET 2: La Salle Meetup
    // ═══════════════════════════════════════
    const meetupOrders = orders.filter(o => o.delivery_mode === 'meetup' && o.status !== 'Refund Needed' && o.status !== 'Refunded');
    const meetupCols = ['', 'Quantity', 'Total Pieces', 'Total Price', 'Payment Status', 'Remaining Balance', 'Contact', 'Instagram'];
    const meetupAoa: any[][] = [];

    for (const timeSlot of timeSlots) {
      const groupOrders = meetupOrders.filter(o => o.meetup_time === timeSlot);
      if (groupOrders.length === 0) continue;

      const timeLabel = timeSlot === '10am - 12pm' ? '10AM-12PM' : '2PM-3PM';
      // Blank separator row before each group (except the first)
      if (meetupAoa.length > 0) meetupAoa.push([]);
      // Section header row
      meetupAoa.push([timeLabel, ...meetupCols.slice(1)]);
      // Data rows
      for (const o of groupOrders) {
        const qty = parseQuantity(o.quantity_type);
        meetupAoa.push([
          o.full_name,
          qty.display,
          qty.totalPieces,
          `₱${(o.total_price || 0).toLocaleString()}`,
          o.is_paid ? 'PAID FULL' : 'DP ONLY',
          o.is_paid ? '₱0' : `₱${Math.round(o.total_price - o.downpayment_price).toLocaleString()}`,
          o.contact_number || 'N/A',
          o.instagram || 'N/A',
        ]);
      }
    }

    if (meetupAoa.length > 0) {
      const meetupSheet = XLSX.utils.aoa_to_sheet(meetupAoa);
      autoFitAoa(meetupSheet, meetupAoa);
      // Color each section header row
      let mri = 0;
      const meetupHeaderRows: { row: number; timeSlot: string }[] = [];
      for (const timeSlot of timeSlots) {
        const cnt = meetupOrders.filter(o => o.meetup_time === timeSlot).length;
        if (cnt === 0) continue;
        if (mri > 0) mri++; // blank separator
        meetupHeaderRows.push({ row: mri, timeSlot });
        mri += cnt + 1;
      }
      for (const h of meetupHeaderRows) {
        styleRow(meetupSheet, h.row, meetupCols.length, h.timeSlot === '10am - 12pm' ? headerStyleTeal : headerStyleOrange2);
      }
      XLSX.utils.book_append_sheet(workbook, meetupSheet, 'La Salle Meetup');
    }

    // ═══════════════════════════════════════
    //  SHEET 3: All Orders (Full Accounting)
    // ═══════════════════════════════════════
    const allOrdersData = orders.map(order => {
      const remainingBalance = order.is_paid ? 0 : (order.total_price - order.downpayment_price);
      const qty = parseQuantity(order.quantity_type);
      return {
        'Date': new Date(order.created_at).toLocaleDateString(),
        'Order Status': order.status || 'Pending',
        'Customer Name': order.full_name,
        'Instagram': order.instagram || 'N/A',
        'Quantity': qty.display,
        'Total Pieces': qty.totalPieces,
        'Total Price': order.total_price,
        'Amount Paid': order.is_paid ? order.total_price : order.downpayment_price,
        'Remaining Balance': remainingBalance,
        'Payment Status': order.is_paid ? 'PAID FULL' : 'DP ONLY',
        'Payment Mode': order.payment_mode,
        'Delivery Mode': order.delivery_mode === 'meetup' ? 'La Salle Meetup' : 'Maxim Delivery',
        'Location': order.delivery_mode === 'meetup'
          ? `USLS Gate 6 (${order.meetup_time})`
          : `${order.maxim_address} (${order.meetup_time})`,
        'Contact Number': order.contact_number,
        'Special Instructions': order.special_instructions || 'N/A',
      };
    });

    if (allOrdersData.length > 0) {
      const allSheet = XLSX.utils.json_to_sheet(allOrdersData);
      const allKeys = Object.keys(allOrdersData[0]);
      allSheet['!cols'] = allKeys.map(key => {
        const maxLen = Math.max(key.length, ...allOrdersData.map(r => String((r as any)[key] ?? '').length));
        return { wch: Math.min(maxLen + 2, 45) };
      });
      XLSX.utils.book_append_sheet(workbook, allSheet, 'All Orders');
    }

    XLSX.writeFile(workbook, `BakedBy_Accounting_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportInvoices = () => {
    const meetupOrders = orders.filter(o => o.delivery_mode === 'meetup' && o.status !== 'Refund Needed' && o.status !== 'Refunded');

    if (meetupOrders.length === 0) {
      alert("No meetup orders to export.");
      return;
    }

    let content = "";
    meetupOrders.forEach((o) => {
      const remainingBalance = o.is_paid ? 0 : (o.total_price - o.downpayment_price);

      // Format quantity_type (e.g., "Box4: 1, Box6: 1") into readable text
      const orderSummary = (o.quantity_type || "").split(', ')
        .filter((item: string) => {
          const count = item.split(': ')[1];
          return count !== '0' && count !== undefined;
        })
        .map((item: string) => {
          const parts = item.split(': ');
          const type = parts[0];
          const count = parts[1];
          const label = type === 'Box3' ? 'Box of 3' : type === 'Box4' ? 'Box of 4' : type === 'Box6' ? 'Box of 6' : type === 'Box12' ? 'Box of 12' : type === 'Biscoff4' ? 'Biscoff Box of 4' : type;
          return `${count}x ${label}`;
        }).join(', ');

      content += `🧾 𝗜𝗡𝗩𝗢𝗜𝗖𝗘\n`;
      content += `Name: ${o.full_name}\n`;
      content += `Order: ${orderSummary || 'N/A'}\n`;
      content += `Mode of Payment: ${o.payment_mode === 'cash' ? 'Cash' : 'GCash'}\n`;
      content += `Total Amount: ₱${(o.total_price || 0).toLocaleString()}\n`;
      content += `Downpayment Paid via GCash: ₱${(o.downpayment_price || 0).toLocaleString()}\n`;
      content += `Remaining Balance: ₱${Math.round(remainingBalance).toLocaleString()}\n`;
      content += `------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Meetup_Invoices_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getMediaUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('receipts').getPublicUrl(path);
    return data.publicUrl;
  };

  // const handleDownloadImage = async (path: string, fileName: string) => {
  //   try {
  //     const { data, error } = await supabase.storage.from('receipts').download(path);
  //     if (error) throw error;
  //     const url = URL.createObjectURL(data);
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = fileName;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //   } catch (err) {
  //     console.error('Download error:', err);
  //     alert('Failed to download image');
  //   }
  // };

  const handleConfirmAndDM = (o: any) => {
    // If IS_PAID is false, we are confirming receiving the Downpayment (regardless of cash/gcash mode)
    // If IS_PAID is true, we are confirming the Full Payment
    const isDP = !o.is_paid;
    const payLabel = isDP ? 'downpayment' : 'full payment';
    const amt = isDP ? o.downpayment_price : o.total_price;

    // Format quantities into bullet points
    // Expected format: "Box4: 1, Box6: 1, Box12: 0"
    let orderList = '';
    if (o.quantity_type) {
      const items = o.quantity_type.split(', ');
      items.forEach((item: string) => {
        const parts = item.split(': ');
        const type = parts[0];
            const count = parseInt(parts[1]);
          if (count > 0) {
            const label = type === 'Box3' ? 'Box of 3' : type === 'Box4' ? 'Box of 4' : type === 'Box6' ? 'Box of 6' : type === 'Box12' ? 'Box of 12' : type === 'Biscoff4' ? 'Biscoff Box of 4' : type === 'Mixed4' ? 'Biscoff & Pistacio Mixed' : type;
            orderList += `\n• ${label} x ${count}`;
          }
      });
    }

    const msg = `Hi ${o.full_name}! 🍪✨

Great news — we’ve successfully received your ${payLabel} of ₱${amt.toLocaleString()}.

Your order is now officially CONFIRMED:${orderList}

We’re so excited for you to enjoy your cookies! 🤍

Thank you for supporting Baked By BCD.`;

    // 1. Copy to clipboard immediately
    navigator.clipboard.writeText(msg);

    // 2. Open Instagram - Try Deep Link first for App, then Web
    const username = o.instagram.replace('@', '').trim();
    const webUrl = `https://www.instagram.com/${username}/`;
    const appUrl = `instagram://user?username=${username}`;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isIOS) {
      // iOS: Strictly open app if possible, no fallback, no alerts
      window.location.href = appUrl;
    } else if (isAndroid) {
      // Android: Use Intent to force open app directly
      const androidIntent = `intent://www.instagram.com/_u/${username}/#Intent;package=com.instagram.android;scheme=https;end`;
      window.location.href = androidIntent;
    } else {
      // Desktop: Keep fallback and alert
      alert('Confirmation message copied! 📋\nOpening Instagram...');
      window.open(webUrl, '_blank');
    }
  };

  const handleCopyMaximInfo = (o: any) => {
    // Add City for better geolocation in the Maxim App
    const fromClean = 'Terra Nova Subdivision Swimming Pool, Alijis, Bacolod';
    const toClean = (o.maxim_address || '') + ', Bacolod';

    const text = `FROM: ${fromClean}\nTO: ${toClean}\nCUSTOMER: ${o.full_name}`;
    navigator.clipboard.writeText(text);

    // Deep linking for Maxim (Taxsee) using official parameter names
    const encodedFrom = encodeURIComponent(fromClean);
    const encodedTo = encodeURIComponent(toClean);

    // Web Fallback
    const webUrl = `https://taximaxim.com/ph/order/?from=${encodedFrom}&to=${encodedTo}`;

    // Android/iOS App Scheme
    // taxsee://order?from_address=...&to_address=... is the standard format for Taxsee engine apps
    const appSchemeUrl = `taxsee://order?from_address=${encodedFrom}&to_address=${encodedTo}`;

    const isAndroid = /android/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // We trigger the launch immediately to ensure it's within the user gesture window
    if (isAndroid) {
      // Intent scheme is more reliable for Android Chrome
      const androidIntent = `intent://order?from_address=${encodedFrom}&to_address=${encodedTo}#Intent;scheme=taxsee;package=com.taxsee.taxsee;S.browser_fallback_url=${encodeURIComponent(webUrl)};end;`;
      window.location.href = androidIntent;
    } else if (isIOS) {
      window.location.href = appSchemeUrl;
      // Simple timeout fallback for iOS if app isn't installed
      setTimeout(() => {
        if (!document.hidden) window.location.href = webUrl;
      }, 2000);
    } else {
      window.open(webUrl, '_blank');
    }

    // Alert at the end so it doesn't block the initial navigation logic
    alert(`Maxim Info Copied! 🚚\n\nFROM: ${fromClean}\nTO: ${toClean}\n\nLaunching Maxim App...`);
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    try {
      // Reconstruct quantity_type from box counts
      const b3 = editingOrder._box3 ?? 0;
      const b4 = editingOrder._box4 ?? 0;
      const b6 = editingOrder._box6 ?? 0;
      const b12 = editingOrder._box12 ?? 0;
      const biscoff4 = editingOrder._biscoff4 ?? 0;
      const mixed4 = editingOrder._mixed4 ?? 0;
      const quantityType = `Box3: ${b3}, Box4: ${b4}, Box6: ${b6}, Box12: ${b12}, Biscoff4: ${biscoff4}, Mixed4: ${mixed4}`;

      const updates: any = {
        full_name: editingOrder.full_name,
        instagram: editingOrder.instagram,
        contact_number: editingOrder.contact_number,
        special_instructions: editingOrder.special_instructions || '',
        meetup_time: editingOrder.meetup_time,
        quantity_type: quantityType,
        total_price: Number(editingOrder.total_price) || 0,
        downpayment_price: Number(editingOrder.downpayment_price) || 0,
      };
      if (editingOrder.delivery_mode === 'maxim') {
        updates.maxim_address = editingOrder.maxim_address;
      }

      const { error } = await supabase.from('orders').update(updates).eq('id', editingOrder.id);
      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...o, ...updates } : o));
      setEditingOrder(null);
      alert('Order updated successfully! ✅');
    } catch (err: any) {
      console.error('Edit error:', err);
      alert('Failed to update order: ' + err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const filteredOrders = orders.filter(o => {
    const searchQueryLower = searchQuery.toLowerCase();
    const matchesSearch = o.full_name.toLowerCase().includes(searchQueryLower) ||
      (o.instagram || '').toLowerCase().includes(searchQueryLower);

    const matchesPayment = filterPayment === 'all' ||
      (filterPayment === 'paid' && o.is_paid) ||
      (filterPayment === 'unpaid' && !o.is_paid) ||
      (o.payment_mode === filterPayment);

    const matchesDelivery = filterDelivery === 'all' || o.delivery_mode === filterDelivery;
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;

    // --- Virtual Batching ---
    const cutoff5 = new Date('2026-03-12T00:00:00+08:00').getTime();
    const cutoff6 = new Date('2026-03-16T00:00:00+08:00').getTime();
    const cutoff7 = new Date('2026-03-19T00:00:00+08:00').getTime();
    const cutoff8 = new Date('2026-03-24T18:00:00+08:00').getTime();
    const cutoff9 = new Date('2026-03-27T12:00:00+08:00').getTime();
    const orderTime = new Date(o.created_at).getTime();
    let batchNumber = 4;
    if (orderTime >= cutoff9) batchNumber = 9;
    else if (orderTime >= cutoff8) batchNumber = 8;
    else if (orderTime >= cutoff7) batchNumber = 7;
    else if (orderTime >= cutoff6) batchNumber = 6;
    else if (orderTime >= cutoff5) batchNumber = 5;
    const matchesBatch = selectedBatch === 0 || selectedBatch === batchNumber;

    return matchesSearch && matchesPayment && matchesDelivery && matchesStatus && matchesBatch;
  }).sort((a, b) => {
    // Priority sorting: unfinished on top
    const aFinished = a.status === 'Delivered' && a.is_paid;
    const bFinished = b.status === 'Delivered' && b.is_paid;
    if (aFinished !== bFinished) return aFinished ? 1 : -1;

    let valA = a[sortKey];
    let valB = b[sortKey];
    if (sortKey === 'created_at') {
      valA = new Date(a.created_at).getTime();
      valB = new Date(b.created_at).getTime();
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="admin-dashboard-page fade-in">
      <nav className="admin-nav">
        <div className="admin-nav-content">
          <div className="admin-logo-row">
            <img src="/baked-by-logo.png" alt="BB" className="admin-nav-logo" />
            <h1 className="admin-title">Admin Panel v2.1</h1>
          </div>
          <div className="admin-nav-actions">
            <button className="admin-nav-btn admin-nav-btn-secondary" onClick={() => setShowFinanceHistory(true)}>
              <span>💰</span> Finance History
            </button>
            <button className="admin-nav-btn admin-nav-btn-secondary" onClick={() => setShowDeliveryList(true)}>
              <span>🚚</span> Delivery List
            </button>
            <button className="admin-nav-btn admin-nav-btn-primary" onClick={handleExportExcel}>
              <span>📊</span> Export Excel
            </button>
            <button className="admin-nav-btn admin-nav-btn-secondary" onClick={onBack}>
              <span>←</span> Back
            </button>
            <button className="admin-nav-btn admin-nav-btn-danger" onClick={handleLogout}>
              Logout <span>🚪</span>
            </button>
          </div>
        </div>
      </nav>

      {/* QUICK ACTIONS BAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '10px 20px', display: 'flex', gap: '25px', alignItems: 'center', position: 'sticky', top: '70px', zIndex: 90, flexWrap: 'wrap' }}>

        {/* Website Lock Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: isLocked ? '#fef2f2' : '#f0fdf4', padding: '8px 15px', borderRadius: '12px', border: `1px solid ${isLocked ? '#fee2e2' : '#dcfce7'}` }}>
          <span style={{ fontSize: '1.2rem' }}>{isLocked ? '🔒' : '🔓'}</span>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isLocked ? '#991b1b' : '#166534', textTransform: 'uppercase' }}>Website Status</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: isLocked ? '#dc2626' : '#10b981' }}>{isLocked ? 'LOCKED (MANUAL)' : 'LIVE'}</div>
          </div>
          <button
            onClick={onToggleLock}
            style={{
              marginLeft: '15px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              background: isLocked ? '#ef4444' : '#10b981',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {isLocked ? 'UNLOCK NOW' : 'LOCK WEBSITE'}
          </button>
        </div>

        {/* Scheduled Release */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f5f3ff', padding: '8px 15px', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
          <span style={{ fontSize: '1.2rem' }}>⏰</span>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase' }}>Scheduled Release</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input
                type="datetime-local"
                value={newTargetDate}
                onChange={e => setNewTargetDate(e.target.value)}
                style={{
                  border: '1px solid #c4b5fd',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  outline: 'none',
                  color: '#4c1d95'
                }}
              />
              <button
                onClick={() => onUpdateReleaseTime(new Date(newTargetDate))}
                style={{
                  background: '#8b5cf6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Set Release
              </button>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#6d28d9', marginTop: '4px', fontStyle: 'italic' }}>
              Currently set to: {targetDate.toLocaleString()} {new Date() < targetDate ? '(Awaiting)' : '(Passed)'}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <>
          <div className="admin-stats-row" style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {/* Batch 9 Card */}
            <div
              className={`admin-stat-card clickable ${selectedBatch === 9 ? 'active-batch-card' : ''}`}
              onClick={() => setSelectedBatch(9)}
              style={{
                background: selectedBatch === 9 ? '#eff6ff' : '#fff',
                border: selectedBatch === 9 ? '3px solid #3b82f6' : '1px solid #e2e8f0',
                transform: selectedBatch === 9 ? 'scale(1.02)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: '#1e40af' }}>🍪 Current (Batch 9)</h3>
                {selectedBatch === 9 && <span style={{ background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontSize: '0.6rem' }}>ACTIVE VIEW</span>}
              </div>
              <div className="admin-stat-val" style={{ fontSize: '1.8rem', color: '#1e40af' }}>{s9.cookies} <small style={{ fontSize: '0.8rem' }}>Cookies</small></div>
              <p className="admin-stat-sub">Revenue: ₱{s9.revenue.toLocaleString()} • {s9.count} Orders</p>
            </div>

            {/* Batch 8 Card */}
            <div
              className={`admin-stat-card clickable ${selectedBatch === 8 ? 'active-batch-card' : ''}`}
              onClick={() => setSelectedBatch(8)}
              style={{
                background: selectedBatch === 8 ? '#f0fdf4' : '#fff',
                border: selectedBatch === 8 ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
                transform: selectedBatch === 8 ? 'scale(1.02)' : 'none'
              }}
            >
              <h3 style={{ color: '#166534' }}>📊 Previous (Batch 8)</h3>
              <div className="admin-stat-val" style={{ fontSize: '1.8rem', color: '#166534' }}>{s8.cookies} <small style={{ fontSize: '0.8rem' }}>Cookies</small></div>
              <p className="admin-stat-sub">Revenue: ₱{s8.revenue.toLocaleString()} • {s8.count} Orders</p>
            </div>

            {/* Batch 7 Card */}
            <div
              className={`admin-stat-card clickable ${selectedBatch === 7 ? 'active-batch-card' : ''}`}
              onClick={() => setSelectedBatch(7)}
              style={{
                background: selectedBatch === 7 ? '#fef3c7' : '#fff',
                border: selectedBatch === 7 ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
                transform: selectedBatch === 7 ? 'scale(1.02)' : 'none'
              }}
            >
              <h3 style={{ color: '#92400e' }}>📊 Previous (Batch 7)</h3>
              <div className="admin-stat-val" style={{ fontSize: '1.8rem', color: '#92400e' }}>{s7.cookies} <small style={{ fontSize: '0.8rem' }}>Cookies</small></div>
              <p className="admin-stat-sub">Revenue: ₱{s7.revenue.toLocaleString()} • {s7.count} Orders</p>
            </div>

            {/* Batch 5 Card (Keep for reference) */}
            <div
              className={`admin-stat-card clickable ${selectedBatch === 5 ? 'active-batch-card' : ''}`}
              onClick={() => setSelectedBatch(5)}
              style={{
                background: selectedBatch === 5 ? '#f8fafc' : '#fff',
                border: selectedBatch === 5 ? '1px solid #e2e8f0' : '1px solid #e2e8f0',
                transform: selectedBatch === 5 ? 'scale(1.02)' : 'none'
              }}
            >
              <h3 style={{ color: '#4b5563' }}>📊 Previous (Batch 5)</h3>
              <div className="admin-stat-val" style={{ fontSize: '1.8rem', color: '#4b5563' }}>{s5.cookies} <small style={{ fontSize: '0.8rem' }}>Cookies</small></div>
              <p className="admin-stat-sub">Revenue: ₱{s5.revenue.toLocaleString()} • {s5.count} Orders</p>
            </div>

            <div
              className={`admin-stat-card clickable ${selectedBatch === 0 ? 'active-batch-card' : ''}`}
              onClick={() => setSelectedBatch(0)}
              style={{
                background: selectedBatch === 0 ? '#fefce8' : '#fff',
                border: selectedBatch === 0 ? '3px solid #eab308' : '1px solid #e2e8f0'
              }}
            >
              <h3 style={{ color: '#854d0e' }}>🏢 Master List (All)</h3>
              <div className="admin-stat-val" style={{ fontSize: '1.8rem', color: '#854d0e' }}>{(s4.cookies + s5.cookies + s6.cookies + s7.cookies + s8.cookies)}</div>
              <p className="admin-stat-sub">Total Orders: {(s4.count + s5.count + s6.count + s7.count + s8.count)}</p>
            </div>
          </div>

          {/* ─── LEVEL 1: TOP PRIORITY STATS (Dynamic to Selected Batch) ─── */}
          <div style={{ marginBottom: '15px', color: '#64748b', fontSize: '0.85rem', fontWeight: 800 }}>
            DETAILS FOR: {selectedBatch === 0 ? 'ALL BATCHES' : `BATCH ${selectedBatch}`}
          </div>
          <div className="admin-stats-row">
            <div className="admin-stat-card clickable" style={{ background: '#f5feff', borderColor: '#0ea5e9' }} onClick={() => setShowDeliveryList(true)}>
              <h3 style={{ color: '#0369a1' }}>🚚 Delivery List</h3>
              <div className="admin-stat-val" style={{ color: '#0369a1', fontSize: '1.4rem' }}>
                {activeOrders.filter(o => o.delivery_mode === 'meetup').length} • {activeOrders.filter(o => o.delivery_mode === 'maxim' && o.status !== 'Refund Needed').length}
              </div>
              <p className="admin-stat-sub">Meetup • Maxim (Tap to View)</p>
            </div>

            <div className="admin-stat-card clickable" style={{ background: '#fffbeb', borderColor: '#f59e0b' }} onClick={() => setShowProductionDetails(true)}>
              <h3 style={{ color: '#d97706' }}>🍪 Unfinished Cookies</h3>
              <div className="admin-stat-val" style={{ color: '#d97706' }}>{activeStats.cookies}</div>
              <p className="admin-stat-sub">Across pending {selectedBatch === 0 ? 'All' : `B${selectedBatch}`} orders</p>
            </div>

            <div className="admin-stat-card clickable" style={{ background: '#fef2f2', borderColor: '#ef4444' }} onClick={() => setShowToCollect(true)}>
              <h3 style={{ color: '#dc2626' }}>💰 To be Received</h3>
              <div className="admin-stat-val" style={{ color: '#dc2626' }}>
                ₱{Math.round(activeOrders.reduce((acc, o) => {
                  if (o.is_paid) return acc;
                  return acc + (o.payment_mode === 'gcash' ? (o.total_price - o.downpayment_price) : o.total_price);
                }, 0)).toLocaleString()}
              </div>
              <p className="admin-stat-sub">Unpaid Balances (Tap to View)</p>
            </div>

            <div className="admin-stat-card clickable" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }} onClick={() => setShowHoldingModal(true)}>
              <h3 style={{ color: '#475569' }}>⏳ Reservations</h3>
              <div className="admin-stat-val" style={{ color: '#475569' }}>{holdingOrders.length}</div>
              <p className="admin-stat-sub">Active 10-min holds</p>
            </div>

            <div className="admin-stat-card clickable" style={{ background: '#fff1f2', borderColor: '#fda4af' }} onClick={() => setShowExpiredModal(true)}>
              <h3 style={{ color: '#be123c' }}>📉 Incomplete</h3>
              <div className="admin-stat-val" style={{ color: '#be123c' }}>{expiredOrders.length}</div>
              <p className="admin-stat-sub">Expired Holds (Tap to View)</p>
            </div>
          </div>

          {/* ─── LEVEL 2: SECONDARY HIGHLIGHTS ─── */}
          <div className="admin-highlight-section" style={{ marginTop: '20px' }}>
            <div className="admin-stat-card admin-stat-card-sparkle">
              <h3>Batch Revenue</h3>
              <div className="admin-stat-val sparkle-text">
                ₱{Math.round(activeOrders.reduce((acc, o) => acc + (o.total_price || 0), 0)).toLocaleString()}
              </div>
              <p className="admin-stat-sub">Total gross {selectedBatch === 0 ? 'overall' : `B${selectedBatch}`} revenue</p>
            </div>

            <div className="production-summary-card">
              <div className="prod-card-header">
                <span className="prod-card-icon">🏗️</span>
                <h3>Inventory Management</h3>
              </div>
              <div className="prod-grid">
                <div className="prod-item" style={{ background: '#f0fdf4' }}>
                  <span className="prod-label">Paid Received</span>
                  <span className="prod-val" style={{ color: '#10b981', fontSize: '1.2rem' }}>
                    ₱{Math.round(activeOrders.reduce((acc, o) => {
                      if (o.is_paid) return acc + o.total_price;
                      if (o.payment_mode === 'gcash') return acc + o.downpayment_price;
                      return acc;
                    }, 0)).toLocaleString()}
                  </span>
                </div>
                <div className="prod-item" style={{ background: '#fef3c7' }}>
                  <span className="prod-label">Current Stock</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '5px', flexWrap: 'wrap' }}>
                    <div className="mini-stock-badge">
                      <span>B3:</span> <strong>{b3Stock}</strong>
                      <div className="stock-adj">
                        <button onClick={() => updateStock('Box of 3', b3Stock + 1)} disabled={updatingStock}>+</button>
                        <button onClick={() => updateStock('Box of 3', Math.max(0, b3Stock - 1))} disabled={updatingStock}>-</button>
                      </div>
                    </div>
                    <div className="mini-stock-badge">
                      <span>B4:</span> <strong>{b4Stock}</strong>
                      <div className="stock-adj">
                        <button onClick={() => updateStock('Box of 4', b4Stock + 1)} disabled={updatingStock}>+</button>
                        <button onClick={() => updateStock('Box of 4', Math.max(0, b4Stock - 1))} disabled={updatingStock}>-</button>
                      </div>
                    </div>
                    <div className="mini-stock-badge">
                      <span>B6:</span> <strong>{b6Stock}</strong>
                      <div className="stock-adj">
                        <button onClick={() => updateStock('Box of 6', b6Stock + 1)} disabled={updatingStock}>+</button>
                        <button onClick={() => updateStock('Box of 6', Math.max(0, b6Stock - 1))} disabled={updatingStock}>-</button>
                      </div>
                    </div>
                    <div className="mini-stock-badge" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <span style={{ color: '#92400e' }}>Biscoff4:</span> <strong style={{ color: '#92400e' }}>{biscoff4Stock}</strong>
                      <div className="stock-adj">
                        <button onClick={() => updateStock('Biscoff Box of 4', biscoff4Stock + 1)} disabled={updatingStock} style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>+</button>
                        <button onClick={() => updateStock('Biscoff Box of 4', Math.max(0, biscoff4Stock - 1))} disabled={updatingStock} style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>-</button>
                      </div>
                    </div>
                    <div className="mini-stock-badge" style={{ background: '#f5d0fe', border: '1px solid #f5d0fe' }}>
                      <span style={{ color: '#701a75' }}>Mixed4:</span> <strong style={{ color: '#701a75' }}>{mixed4Stock}</strong>
                      <div className="stock-adj">
                        <button onClick={() => updateStock('Biscoff and Pistacio Mixed', mixed4Stock + 1)} disabled={updatingStock} style={{ background: '#f5d0fe', color: '#701a75', borderColor: '#f5d0fe' }}>+</button>
                        <button onClick={() => updateStock('Biscoff and Pistacio Mixed', Math.max(0, mixed4Stock - 1))} disabled={updatingStock} style={{ background: '#f5d0fe', color: '#701a75', borderColor: '#f5d0fe' }}>-</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- RECENT NOTES LOG --- */}
            {recentNotes.length > 0 && (
              <div className="prod-summary-card" style={{ marginTop: '20px', width: '100%', maxWidth: '100%', flex: '1 1 100%' }}>
                <div className="prod-card-header">
                  <span className="prod-card-icon">📝</span>
                  <h3>Special Instructions Log</h3>
                </div>
                <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '10px' }}>
                  {recentNotes.map((rn, idx) => (
                    <div key={idx} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                      <strong style={{ color: '#1e3a8a' }}>{rn.name}:</strong> <span style={{ color: '#475569' }}>{rn.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      </div>

      {/* Filters and Search */}
      <div className="admin-controls-row" style={{ marginTop: '30px' }}>
          <div className="admin-search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search Customer or Instagram..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="admin-filter-group">
            <select className="admin-select" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)}>
              <option value="all">All Payments</option>
              <option value="gcash">GCash</option>
              <option value="cash">Cash</option>
              <option value="paid">Paid Only</option>
              <option value="unpaid">Unpaid Only</option>
            </select>
            <select className="admin-select" value={filterDelivery} onChange={(e) => setFilterDelivery(e.target.value)}>
              <option value="all">All Delivery</option>
              <option value="meetup">Meetup</option>
              <option value="maxim">Maxim</option>
            </select>
            <select className="admin-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Baking">Baking</option>
              <option value="Ready">Ready</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>
        {showToCollect && (
          <div className="admin-modal-overlay" onClick={() => setShowToCollect(false)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Pending Collections</h2>
                <button className="close-btn" onClick={() => setShowToCollect(false)}>&times;</button>
              </div>
              <div className="admin-modal-content">
                <div className="pending-list">
                  {orders.filter(o => !o.is_paid).length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '20px' }}>No pending collections! 🎉</p>
                  ) : (
                    orders.filter(o => !o.is_paid).map(order => (
                      <div key={order.id} className="pending-item">
                        <div className="pi-info">
                          <span className="pi-name">{order.full_name}</span>
                          <span className="pi-ig">@{order.instagram || 'No IG'}</span>
                          <span className="pi-contact">{order.contact_number}</span>
                        </div>
                        <div className="pi-amount">
                          <span className="pi-label">{order.payment_mode === 'gcash' ? 'Remaining GCash' : 'Pending Cash'}</span>
                          <span className="pi-val">₱{Math.round(order.payment_mode === 'gcash' ? (order.total_price - order.downpayment_price) : order.total_price).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showFinanceHistory && (
          <div className="admin-modal-overlay" onClick={() => setShowFinanceHistory(false)}>
            <div className="admin-modal" style={{ maxWidth: '700px', width: '95%' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Finance & Payment History</h2>
                <button className="close-btn" onClick={() => setShowFinanceHistory(false)}>&times;</button>
              </div>
              <div className="admin-modal-content">
                <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '15px', border: '1px solid #bbf7d0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Total Accumulated</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>
                      ₱{Math.round(orders.reduce((acc, o) => {
                        if (o.is_paid) return acc + o.total_price;
                        if (o.payment_mode === 'gcash') return acc + o.downpayment_price;
                        return acc;
                      }, 0)).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Total Transactions</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>{orders.length}</div>
                  </div>
                </div>

                <div className="finance-log" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🕒</span> Chronological Payment Log
                  </h3>
                  <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                    {[...orders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((order, index, arr) => {
                      // Calculate accumulation up to this point
                      let runningTotal = 0;
                      for (let i = 0; i <= index; i++) {
                        const o = arr[i];
                        if (o.is_paid) runningTotal += o.total_price;
                        else if (o.payment_mode === 'gcash') runningTotal += o.downpayment_price;
                      }

                      const amtPaid = order.is_paid ? order.total_price : (order.payment_mode === 'gcash' ? order.downpayment_price : 0);
                      const isFull = order.is_paid;

                      return (
                        <div key={order.id} style={{
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '12px',
                          marginBottom: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: isFull ? '#10b981' : '#f59e0b' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e3a8a' }}>{order.full_name}</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {new Date(order.created_at).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#1e293b' }}>+₱{amtPaid.toLocaleString()}</div>
                            <div style={{ fontSize: '0.65rem', color: isFull ? '#10b981' : '#f59e0b', fontWeight: 800 }}>{isFull ? 'FULL' : 'DP ONLY'}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Accumulated</div>
                            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#10b981' }}>₱{Math.round(runningTotal).toLocaleString()}</div>
                          </div>
                        </div>
                      );
                    }).reverse()}
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
                <button className="place-order-btn place-order-btn-sm" onClick={() => setShowFinanceHistory(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {showHoldingModal && (
          <div className="admin-modal-overlay" onClick={() => setShowHoldingModal(false)}>
            <div className="admin-modal" style={{ maxWidth: '800px', width: '95%' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Active Reservations (Holding)</h2>
                <button className="close-btn" onClick={() => setShowHoldingModal(false)}>&times;</button>
              </div>
              <div className="admin-modal-content">
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px' }}>
                  These are customers who have reached the payment screen and have a 10-minute slot reserved.
                </p>
                <div className="holding-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {holdingOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                       <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>⏳</span>
                       <p>No active reservations at the moment.</p>
                    </div>
                  ) : (
                    holdingOrders.map(order => (
                      <div key={order.id} style={{
                        background: 'white',
                        padding: '15px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 800, color: '#1e3a8a', fontSize: '1rem' }}>{order.full_name}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>IG: @{order.instagram || 'none'} • {order.contact_number}</span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Reserved at: {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                         <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <div style={{ textAlign: 'right' }}>
                               <div style={{ fontWeight: 800, color: '#475569', fontSize: '0.85rem', marginBottom: '4px' }}>{order.quantity_type}</div>
                               <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10b981' }}>₱{order.total_price.toLocaleString()}</div>
                            </div>
                            <button 
                              className="btn-confirm-holding"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmHoldingOrder(order.id);
                              }}
                            >
                              Confirm Order
                            </button>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="admin-modal-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
                <button className="place-order-btn place-order-btn-sm" onClick={() => setShowHoldingModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {showExpiredModal && (
          <div className="admin-modal-overlay" onClick={() => setShowExpiredModal(false)}>
            <div className="admin-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Incomplete/Expired Orders</h2>
                <button className="close-btn" onClick={() => setShowExpiredModal(false)}>&times;</button>
              </div>
              <div className="admin-modal-content">
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
                  These orders timed out. Customer details are preserved here in case they already sent their payment.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {expiredOrders.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>No expired orders in this batch. 🍃</p>
                  ) : (
                    expiredOrders.map((order: any) => (
                      <div key={order.id} style={{
                        background: '#fff1f2',
                        padding: '15px',
                        borderRadius: '12px',
                        border: '1px solid #fda4af',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 800, color: '#9f1239', fontSize: '1rem' }}>{order.full_name}</span>
                            <span style={{ fontSize: '0.8rem', color: '#be123c' }}>IG: @{order.instagram || 'none'} • {order.contact_number}</span>
                            <span style={{ fontSize: '0.7rem', color: '#e11d48', fontWeight: 600 }}>Expired: {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                         <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <div style={{ textAlign: 'right' }}>
                               <div style={{ fontWeight: 800, color: '#be123c', fontSize: '0.75rem', marginBottom: '4px' }}>{order.quantity_type}</div>
                               <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#e11d48' }}>₱{order.total_price.toLocaleString()}</div>
                            </div>
                            <button 
                              className="place-order-btn place-order-btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreOrder(order);
                              }}
                              style={{ background: '#e11d48', border: 'none', padding: '6px 10px', fontSize: '0.7rem' }}
                            >
                              Restore & Confirm
                            </button>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="admin-modal-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
                <button className="place-order-btn place-order-btn-sm btn-secondary" onClick={() => setShowExpiredModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {showProductionDetails && (
          <div className="admin-modal-overlay" onClick={() => setShowProductionDetails(false)}>
            <div className="admin-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Baking Checklist</h2>
                <button className="close-btn" onClick={() => setShowProductionDetails(false)}>&times;</button>
              </div>
              <div className="admin-modal-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div className="prod-badge-item">
                    <div className="prod-badge-label">BOX OF 3</div>
                    <div className="prod-badge-val">{activeStats.b3}</div>
                  </div>
                  <div className="prod-badge-item">
                    <div className="prod-badge-label">BOX OF 4</div>
                    <div className="prod-badge-val">{activeStats.b4}</div>
                  </div>
                  <div className="prod-badge-item">
                    <div className="prod-badge-label">BOX OF 6</div>
                    <div className="prod-badge-val">{activeStats.b6}</div>
                  </div>
                  <div className="prod-badge-item">
                    <div className="prod-badge-label">BOX OF 12</div>
                    <div className="prod-badge-val">{activeStats.b12}</div>
                  </div>
                  <div className="prod-badge-item" style={{ background: '#fff1f2', border: '1px solid #fda4af' }}>
                    <div className="prod-badge-label" style={{ color: '#be123c' }}>MIXED B4</div>
                    <div className="prod-badge-val" style={{ color: '#be123c' }}>{activeStats.mixed4}</div>
                  </div>
                </div>
                <div style={{ background: '#f5f3ff', padding: '20px', borderRadius: '16px', border: '1px solid #ddd6fe', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#5b21b6', marginBottom: '5px' }}>TOTAL COOKIES TO BAKE</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#4c1d95' }}>{activeStats.cookies}</div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="place-order-btn" onClick={() => setShowProductionDetails(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {selectedNote && (
          <div className="admin-modal-overlay" onClick={() => setSelectedNote(null)}>
            <div className="admin-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Special Instructions</h2>
                <button className="close-btn" onClick={() => setSelectedNote(null)}>&times;</button>
              </div>
              <div className="admin-modal-content">
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1rem', color: '#333' }}>
                  {selectedNote}
                </p>
              </div>
              <div className="admin-modal-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
                <button className="place-order-btn place-order-btn-sm" onClick={() => setSelectedNote(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {showDeliveryList && (
          <div className="admin-modal-overlay" onClick={() => setShowDeliveryList(false)}>
            <div className="admin-modal" style={{ maxWidth: '800px', width: '95%' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Delivery & Meetup Summary</h2>
                <button className="close-btn" onClick={() => setShowDeliveryList(false)}>&times;</button>
              </div>
              <div className="admin-modal-content">
                <div className="delivery-summary-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0', gap: '15px' }}>
                    <div
                      onClick={() => setActiveDeliveryTab('meetup')}
                      style={{
                        textAlign: 'center',
                        flex: 1,
                        cursor: 'pointer',
                        padding: '10px',
                        borderRadius: '10px',
                        transition: 'all 0.2s',
                        background: activeDeliveryTab === 'meetup' ? '#eef2ff' : 'transparent',
                        border: activeDeliveryTab === 'meetup' ? '2px solid #6366f1' : '2px solid transparent'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>La Salle Meetups</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#6366f1' }}>{orders.filter(o => o.delivery_mode === 'meetup').length}</div>
                    </div>
                    <div
                      onClick={() => setActiveDeliveryTab('maxim')}
                      style={{
                        textAlign: 'center',
                        flex: 1,
                        cursor: 'pointer',
                        padding: '10px',
                        borderRadius: '10px',
                        transition: 'all 0.2s',
                        background: activeDeliveryTab === 'maxim' ? '#fffbeb' : 'transparent',
                        border: activeDeliveryTab === 'maxim' ? '2px solid #f59e0b' : '2px solid transparent'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Maxim Deliveries</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>{orders.filter(o => o.delivery_mode === 'maxim' && o.status !== 'Refund Needed').length}</div>
                    </div>
                    <div
                      onClick={() => setActiveDeliveryTab('refund')}
                      style={{
                        textAlign: 'center',
                        flex: 1,
                        cursor: 'pointer',
                        padding: '10px',
                        borderRadius: '10px',
                        transition: 'all 0.2s',
                        background: activeDeliveryTab === 'refund' ? '#fef2f2' : (orders.some(o => o.status === 'Refund Needed') ? 'rgba(239, 68, 68, 0.05)' : 'transparent'),
                        border: activeDeliveryTab === 'refund' ? '2px solid #ef4444' : (orders.some(o => o.status === 'Refund Needed') ? '2px dashed #ef4444' : '2px solid transparent')
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>To Refund</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ef4444' }}>{orders.filter(o => o.status === 'Refund Needed').length}</div>
                    </div>
                  </div>

                  {!activeDeliveryTab && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      <p>Select a category above to view the list 👆</p>
                    </div>
                  )}

                  {activeDeliveryTab === 'meetup' && (
                    <div className="delivery-section-box toggle-meetup">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 className="delivery-section-title" style={{ margin: 0 }}>🤝 La Salle Meetup List</h3>
                        <button
                          onClick={handleExportInvoices}
                          className="place-order-btn place-order-btn-sm"
                          style={{ padding: '6px 15px', fontSize: '0.8rem', background: '#475569' }}
                        >
                          📄 Export Invoices (.doc)
                        </button>
                      </div>

                      {['10am - 12pm', '2pm - 3pm'].map(timeSlot => {
                        const slotOrders = orders.filter(o => o.delivery_mode === 'meetup' && o.meetup_time === timeSlot && o.status !== 'Refund Needed');
                        const slotTotalBalance = slotOrders.reduce((acc, o) => {
                          if (o.is_paid) return acc;
                          return acc + (o.total_price - o.downpayment_price);
                        }, 0);

                        return (
                          <div className="delivery-time-block" key={timeSlot}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', marginBottom: '15px', paddingBottom: '5px' }}>
                              <h4 style={{ margin: 0 }}>{timeSlot === '10am - 12pm' ? '10:00 AM - 12:00 PM' : '2:00 PM - 3:00 PM'}</h4>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '4px 12px', borderRadius: '20px', border: '1px solid #10b981' }}>
                                Total Bal: ₱{Math.round(slotTotalBalance).toLocaleString()}
                              </div>
                            </div>
                            <div className="delivery-grid">
                              {slotOrders.length === 0 ? (
                                <p className="no-data">No meetups at this time.</p>
                              ) : (
                                slotOrders
                                  .sort((a, b) => {
                                    const af = a.status === 'Delivered' && a.is_paid;
                                    const bf = b.status === 'Delivered' && b.is_paid;
                                    if (af !== bf) return af ? 1 : -1;
                                    return 0;
                                  })
                                  .map(o => (
                                    <div key={o.id} className={`delivery-card ${o.status === 'Delivered' && o.is_paid ? 'finished-card' : ''}`}>
                                      <div className="dc-header">
                                        <strong>{o.full_name}</strong>
                                        <span>{o.contact_number}</span>
                                      </div>
                                      <div className="dc-body">
                                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const typeVal = o.quantity_type || '';
                                              let _box3 = 0, _box4 = 0, _box6 = 0, _box12 = 0, _biscoff4 = 0;
                                              if (typeVal.includes('Box3:') || typeVal.includes('Biscoff4:')) {
                                                const b3Match = typeVal.match(/Box3:\s(\d+)/);
                                                const b4Match = typeVal.match(/Box4:\s(\d+)/);
                                                const b6Match = typeVal.match(/Box6:\s(\d+)/);
                                                const b12Match = typeVal.match(/Box12:\s(\d+)/);
                                                const biscoffMatch = typeVal.match(/Biscoff4:\s(\d+)/);

                                                _box3 = b3Match ? parseInt(b3Match[1]) : 0;
                                                _box4 = b4Match ? parseInt(b4Match[1]) : 0;
                                                _box6 = b6Match ? parseInt(b6Match[1]) : 0;
                                                _box12 = b12Match ? parseInt(b12Match[1]) : 0;
                                                _biscoff4 = biscoffMatch ? parseInt(biscoffMatch[1]) : 0;
                                              }
                                              setEditingOrder({ ...o, _box3, _box4, _box6, _box12, _biscoff4 });
                                            }}
                                            className="dc-link"
                                            style={{ background: '#64748b', border: 'none', cursor: 'pointer' }}
                                          >
                                            ✏️ Edit
                                          </button>
                                          {o.instagram && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleConfirmAndDM(o); }}
                                              className="dc-link"
                                              style={{ background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)', border: 'none', cursor: 'pointer' }}
                                            >
                                              ✅ Confirm & DM
                                            </button>
                                          )}
                                          <a
                                            href={`https://www.instagram.com/${o.instagram.replace('@', '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="chat-link"
                                            style={{ fontSize: '0.8rem', marginTop: 0 }}
                                          >
                                            📸 Profile
                                          </a>
                                        </div>

                                        <div className="dc-info-row">
                                          <span className="pi-label">Status</span>
                                          <div className={`status-badge status-${(o.status || 'Pending').toLowerCase()}`} style={{ transform: 'scale(0.9)', transformOrigin: 'right' }}>
                                            <select
                                              className="status-select"
                                              value={o.status || 'Pending'}
                                              onChange={async (e) => {
                                                const newStatus = e.target.value;
                                                setOrders(prev => prev.map(order => order.id === o.id ? { ...order, status: newStatus } : order));
                                                await supabase.from('orders').update({ status: newStatus }).eq('id', o.id);
                                              }}
                                            >
                                              <option value="Pending">Pending</option>
                                              <option value="Delivered">Delivered</option>
                                              <option value="Refund Needed">Refund Needed</option>
                                            </select>
                                          </div>
                                        </div>

                                        <div className="dc-info-row">
                                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '15px' }}>
                                              <span className="pi-label">{o.payment_mode === 'gcash' ? 'GCash 50%' : 'Cash'}</span>
                                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b' }}>Total: ₱{(o.total_price || 0).toLocaleString()}</span>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: o.is_paid ? '#10b981' : '#f59e0b', marginTop: '2px' }}>
                                              {o.status === 'Refund Needed' ? '⚠️ REFUND NEEDED' : (o.is_paid ? 'PAID FULL' : 'DP RECEIVED')}
                                            </span>
                                            {!o.is_paid && (
                                              <span className="dc-balance" style={{ color: '#dc2626', fontWeight: 900, fontSize: '0.9rem' }}>Bal: ₱{Math.round(o.total_price - o.downpayment_price).toLocaleString()}</span>
                                            )}
                                          </div>
                                          <div className="admin-pay-toggle" style={{ margin: 0 }}>
                                            <label className="switch" style={{ transform: 'scale(0.8)' }}>
                                              <input
                                                type="checkbox"
                                                checked={!!o.is_paid}
                                                onChange={async () => {
                                                  const newPaid = !o.is_paid;
                                                  setOrders(prev => prev.map(order => order.id === o.id ? { ...order, is_paid: newPaid } : order));
                                                  await supabase.from('orders').update({ is_paid: newPaid }).eq('id', o.id);
                                                }}
                                              />
                                              <span className="slider round"></span>
                                            </label>
                                          </div>
                                        </div>

                                        <div className="dc-boxes" style={{ fontSize: '0.75rem', marginTop: '8px', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                          <strong style={{ display: 'block', marginBottom: '2px', color: '#64748b' }}>Boxes Ordered:</strong>
                                          {o.quantity_type ? o.quantity_type.split(', ').map((bit: string) => {
                                            const bits = bit.split(': ');
                                            const type = bits[0];
                                            const count = bits[1];
                                            if (count === '0') return null;
                                            const label = type === 'Box3' ? 'Box of 3' : type === 'Box4' ? 'Box of 4' : type === 'Box6' ? 'Box of 6' : type === 'Box12' ? 'Box of 12' : type === 'Biscoff4' ? 'Biscoff Box of 4' : type === 'Mixed4' ? 'Biscoff & Pistacio Mixed' : type;
                                            return <div key={type} style={{ fontWeight: 700 }}>{count}x {label}</div>;
                                          }) : 'No data'}
                                        </div>

                                        <div className="dc-screenshots" style={{ marginTop: '10px' }}>
                                          {o.gcash_screenshot_path && (
                                            <a
                                              href={getMediaUrl(o.gcash_screenshot_path) || '#'}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="dc-link"
                                              style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                            >
                                              📸 View Receipt
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeDeliveryTab === 'maxim' && (
                    <div className="delivery-section-box toggle-maxim" style={{ marginTop: '30px' }}>
                      <h3 className="delivery-section-title">🚚 Maxim Delivery List</h3>

                      {['10am - 12pm', '2pm - 3pm'].map(timeSlot => {
                        const slotOrders = orders.filter(o => o.delivery_mode === 'maxim' && o.meetup_time === timeSlot && o.status !== 'Refund Needed');
                        const slotTotalBalance = slotOrders.reduce((acc, o) => {
                          if (o.is_paid) return acc;
                          return acc + (o.total_price - o.downpayment_price);
                        }, 0);

                        return (
                          <div className="delivery-time-block" key={timeSlot}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', marginBottom: '15px', paddingBottom: '5px' }}>
                              <h4 style={{ margin: 0 }}>{timeSlot === '10am - 12pm' ? '10:00 AM - 12:00 PM' : '2:00 PM - 3:00 PM'}</h4>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#059669', background: '#ecfdf5', padding: '4px 12px', borderRadius: '20px', border: '1px solid #10b981' }}>
                                Total Bal: ₱{Math.round(slotTotalBalance).toLocaleString()}
                              </div>
                            </div>
                            <div className="delivery-grid">
                              {slotOrders.length === 0 ? (
                                <p className="no-data">No deliveries at this time.</p>
                              ) : (
                                slotOrders
                                  .sort((a, b) => {
                                    const af = a.status === 'Delivered' && a.is_paid;
                                    const bf = b.status === 'Delivered' && b.is_paid;
                                    if (af !== bf) return af ? 1 : -1;
                                    return 0;
                                  })
                                  .map(o => (
                                    <div key={o.id} className={`delivery-card dc-maxim ${o.status === 'Delivered' && o.is_paid ? 'finished-card' : ''}`}>
                                      <div className="dc-header">
                                        <strong>{o.full_name}</strong>
                                        <span>{o.contact_number}</span>
                                      </div>
                                      <div className="dc-body">
                                        <div className="dc-addr">📍 {o.maxim_address || 'No address'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: '700', marginBottom: '5px' }}>📦 Pickup: {o.meetup_location === 'rolling-hills' ? 'Rolling Hills' : 'La Salle'}</div>
                                        <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const typeVal = o.quantity_type || '';
                                              let _box3 = 0, _box4 = 0, _box6 = 0, _box12 = 0, _biscoff4 = 0, _mixed4 = 0;
                                              if (typeVal.includes('Box3:') || typeVal.includes('Biscoff4:') || typeVal.includes('Mixed4:')) {
                                                const b3Match = typeVal.match(/Box3:\s(\d+)/);
                                                const b4Match = typeVal.match(/Box4:\s(\d+)/);
                                                const b6Match = typeVal.match(/Box6:\s(\d+)/);
                                                const b12Match = typeVal.match(/Box12:\s(\d+)/);
                                                const biscoffMatch = typeVal.match(/Biscoff4:\s(\d+)/);
                                                const mixedMatch = typeVal.match(/Mixed4:\s(\d+)/);

                                                _box3 = b3Match ? parseInt(b3Match[1]) : 0;
                                                _box4 = b4Match ? parseInt(b4Match[1]) : 0;
                                                _box6 = b6Match ? parseInt(b6Match[1]) : 0;
                                                _box12 = b12Match ? parseInt(b12Match[1]) : 0;
                                                _biscoff4 = biscoffMatch ? parseInt(biscoffMatch[1]) : 0;
                                                _mixed4 = mixedMatch ? parseInt(mixedMatch[1]) : 0;
                                              }
                                              setEditingOrder({ ...o, _box3, _box4, _box6, _box12, _biscoff4, _mixed4 });
                                            }}
                                            className="dc-link"
                                            style={{ background: '#64748b', border: 'none', cursor: 'pointer' }}
                                          >
                                            ✏️ Edit
                                          </button>
                                          {o.instagram && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleConfirmAndDM(o); }}
                                              className="dc-link"
                                              style={{ background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)', border: 'none', cursor: 'pointer' }}
                                            >
                                              ✅ Confirm & DM
                                            </button>
                                          )}
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleCopyMaximInfo(o); }}
                                            className="dc-link"
                                            style={{ background: '#0ea5e9', border: 'none', cursor: 'pointer' }}
                                          >
                                            🚚 Copy Maxim Info
                                          </button>
                                        </div>

                                        <div className="dc-info-row">
                                          <span className="pi-label">Status</span>
                                          <div className={`status-badge status-${(o.status || 'Pending').toLowerCase()}`} style={{ transform: 'scale(0.9)', transformOrigin: 'right' }}>
                                            <select
                                              className="status-select"
                                              value={o.status || 'Pending'}
                                              onChange={async (e) => {
                                                const newStatus = e.target.value;
                                                setOrders(prev => prev.map(order => order.id === o.id ? { ...order, status: newStatus } : order));
                                                await supabase.from('orders').update({ status: newStatus }).eq('id', o.id);
                                              }}
                                            >
                                              <option value="Pending">Pending</option>
                                              <option value="Delivered">Delivered</option>
                                              <option value="Refund Needed">Refund Needed</option>
                                            </select>
                                          </div>
                                        </div>

                                        <div className="dc-info-row">
                                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '15px' }}>
                                              <span className="pi-label">{o.payment_mode === 'gcash' ? 'GCash 50%' : 'Cash'}</span>
                                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b' }}>Total: ₱{(o.total_price || 0).toLocaleString()}</span>
                                            </div>
                                            {!o.is_paid && (
                                              <span className="dc-balance" style={{ color: '#dc2626', fontWeight: 900, fontSize: '0.9rem' }}>Bal: ₱{Math.round(o.total_price - o.downpayment_price).toLocaleString()}</span>
                                            )}
                                          </div>
                                          <div className="admin-pay-toggle" style={{ margin: 0 }}>
                                            <label className="switch" style={{ transform: 'scale(0.8)' }}>
                                              <input
                                                type="checkbox"
                                                checked={!!o.is_paid}
                                                onChange={async () => {
                                                  const newPaid = !o.is_paid;
                                                  setOrders(prev => prev.map(order => order.id === o.id ? { ...order, is_paid: newPaid } : order));
                                                  await supabase.from('orders').update({ is_paid: newPaid }).eq('id', o.id);
                                                }}
                                              />
                                              <span className="slider round"></span>
                                            </label>
                                          </div>
                                        </div>

                                        <div className="dc-boxes" style={{ fontSize: '0.75rem', marginTop: '8px', padding: '6px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                          <strong style={{ display: 'block', marginBottom: '2px', color: '#64748b' }}>Boxes Ordered:</strong>
                                          {o.quantity_type ? o.quantity_type.split(', ').map((bit: string) => {
                                            const bits = bit.split(': ');
                                            const type = bits[0];
                                            const count = bits[1];
                                            if (count === '0') return null;
                                            const label = type === 'Box3' ? 'Box of 3' : type === 'Box4' ? 'Box of 4' : type === 'Box6' ? 'Box of 6' : type === 'Box12' ? 'Box of 12' : type === 'Biscoff4' ? 'Biscoff Box of 4' : type === 'Mixed4' ? 'Biscoff & Pistacio Mixed' : type;
                                            return <div key={type} style={{ fontWeight: 700 }}>{count}x {label}</div>;
                                          }) : 'No data'}
                                        </div>

                                        <div className="dc-screenshots" style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                          {o.gcash_screenshot_path && (
                                            <a
                                              href={getMediaUrl(o.gcash_screenshot_path) || '#'}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="dc-link"
                                              style={{ background: '#3b82f6', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                            >
                                              📸 Receipt
                                            </a>
                                          )}
                                          {o.maxim_screenshot_path && (
                                            <a
                                              href={getMediaUrl(o.maxim_screenshot_path) || '#'}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="dc-link dc-link-pin"
                                              style={{ background: '#f59e0b', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                            >
                                              📍 Pin
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeDeliveryTab === 'refund' && (
                    <div className="delivery-section-box toggle-refund" style={{ marginTop: '30px' }}>

                      {/* ── PENDING REFUNDS ── */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #fee2e2', marginBottom: '15px', paddingBottom: '5px' }}>
                        <h3 className="delivery-section-title" style={{ color: '#ef4444', margin: 0 }}>⚠️ Needs Refund</h3>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#991b1b', background: '#fef2f2', padding: '4px 12px', borderRadius: '20px', border: '1px solid #fecaca' }}>
                          Total to Refund: ₱{orders.filter(o => o.status === 'Refund Needed').reduce((acc, o) => acc + (o.total_price || 0), 0).toLocaleString()}
                        </div>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>Verify if they paid and DM them. Click "Mark Refunded" once money is returned.</p>
                      <div className="delivery-grid">
                        {orders.filter(o => o.status === 'Refund Needed').length === 0 ? (
                          <p className="no-data">✅ No pending refunds. Great!</p>
                        ) : (
                          orders
                            .filter(o => o.status === 'Refund Needed')
                            .map(o => (
                              <div key={o.id} className="delivery-card refund-card" style={{ borderLeft: '4px solid #ef4444', background: '#fff1f2' }}>
                                <div className="dc-header">
                                  <strong>{o.full_name}</strong>
                                  <span style={{ color: '#ef4444' }}>{o.contact_number}</span>
                                </div>
                                <div className="dc-body">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#991b1b' }}>IG: @{o.instagram}</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#ef4444' }}>₱{(o.total_price || 0).toLocaleString()}</div>
                                  </div>
                                  <div style={{ padding: '8px', background: '#fff', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.75rem', marginBottom: '10px' }}>
                                    {o.special_instructions || 'No notes'}
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {o.gcash_screenshot_path && <a href={getMediaUrl(o.gcash_screenshot_path) || '#'} target="_blank" rel="noreferrer" className="dc-link" style={{ background: '#ef4444' }}>View Receipt</a>}
                                    {o.instagram && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleConfirmAndDM(o); }}
                                        className="dc-link"
                                        style={{ background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)', border: 'none', cursor: 'pointer' }}
                                      >
                                        DM Customer
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleMarkAsRefunded(o.id); }}
                                      className="dc-link"
                                      style={{ background: '#10b981', border: 'none', cursor: 'pointer' }}
                                    >
                                      ✅ Mark Refunded
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                      </div>

                      {/* ── COMPLETED REFUNDS HISTORY ── */}
                      {orders.some(o => o.status === 'Refunded') && (
                        <>
                          <h3 className="delivery-section-title" style={{ color: '#10b981', marginTop: '30px' }}>✅ Completed Refunds</h3>
                          <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>These refunds have been processed. Kept for your records.</p>
                          <div className="delivery-grid">
                            {orders
                              .filter(o => o.status === 'Refunded')
                              .map(o => (
                                <div key={o.id} className="delivery-card" style={{ borderLeft: '4px solid #10b981', background: '#f0fdf4', opacity: 0.85 }}>
                                  <div className="dc-header">
                                    <strong>{o.full_name}</strong>
                                    <span style={{ color: '#10b981' }}>{o.contact_number}</span>
                                  </div>
                                  <div className="dc-body">
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#065f46', marginBottom: '6px' }}>IG: @{o.instagram}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>💚 Refund Completed</div>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </>
                      )}
                    </div>
                  )}

                </div>
              </div>
              <div className="admin-modal-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
                <button className="place-order-btn place-order-btn-sm" onClick={() => setShowDeliveryList(false)}>Close Summary</button>
              </div>
            </div>
          </div>
        )}

        {orderToDelete && (
          <div className="admin-modal-overlay" onClick={() => !isDeleting && setOrderToDelete(null)}>
            <div className="admin-modal" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 style={{ color: '#ef4444' }}>Confirm Deletion</h2>
                <button className="close-btn" onClick={() => !isDeleting && setOrderToDelete(null)}>&times;</button>
              </div>
              <div className="admin-modal-content">
                <p style={{ lineHeight: '1.6', fontSize: '1rem', color: '#333' }}>
                  Are you sure you want to delete <strong>{orderToDelete.full_name}'s</strong> order?
                  <br /><br />
                  <span style={{ color: '#6366f1', fontWeight: '700' }}>This will return the cookies back to the live stock counter.</span>
                </p>
              </div>
              <div className="admin-modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  className="place-order-btn place-order-btn-sm btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setOrderToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="place-order-btn place-order-btn-sm"
                  style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#dc2626' }}
                  onClick={confirmDeleteOrder}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Order'}
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ── EDIT ORDER MODAL ── */}
        {editingOrder && (
          <div className="admin-modal-overlay" onClick={() => setEditingOrder(null)}>
            <div className="admin-modal" style={{ maxWidth: '520px', width: '95%' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>✏️ Edit Order</h2>
                <button className="close-btn" onClick={() => setEditingOrder(null)}>&times;</button>
              </div>
              <div className="admin-modal-content" style={{ maxHeight: '70vh' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                  {/* Name */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Full Name</label>
                    <input
                      className="form-input pill"
                      type="text"
                      value={editingOrder.full_name || ''}
                      onChange={e => setEditingOrder({ ...editingOrder, full_name: e.target.value })}
                      style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                    />
                  </div>

                  {/* Instagram & Contact */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Instagram</label>
                      <input
                        className="form-input pill"
                        type="text"
                        value={editingOrder.instagram || ''}
                        onChange={e => setEditingOrder({ ...editingOrder, instagram: e.target.value })}
                        style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Contact Number</label>
                      <input
                        className="form-input pill"
                        type="tel"
                        value={editingOrder.contact_number || ''}
                        onChange={e => setEditingOrder({ ...editingOrder, contact_number: e.target.value })}
                        style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                      />
                    </div>
                  </div>

                  {/* Maxim Address (only for maxim orders) */}
                  {editingOrder.delivery_mode === 'maxim' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Maxim Address</label>
                      <input
                        className="form-input pill"
                        type="text"
                        value={editingOrder.maxim_address || ''}
                        onChange={e => setEditingOrder({ ...editingOrder, maxim_address: e.target.value })}
                        style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                      />
                    </div>
                  )}

                  {/* Meetup Time & Location */}
                  {editingOrder.delivery_mode === 'meetup' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Meetup Time</label>
                        <input
                          className="form-input pill"
                          type="text"
                          value={editingOrder.meetup_time || ''}
                          onChange={e => setEditingOrder({ ...editingOrder, meetup_time: e.target.value })}
                          style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Meetup Location</label>
                        <select
                          className="form-input pill"
                          value={editingOrder.meetup_location || ''}
                          onChange={e => setEditingOrder({ ...editingOrder, meetup_location: e.target.value })}
                          style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                        >
                          <option value="rolling-hills">Rolling Hills</option>
                          <option value="la-salle">La Salle</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Quantity (Boxes) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Quantity (Boxes)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Box of 3</span>
                        <input
                          className="form-input pill"
                          type="number"
                          min="0"
                          value={editingOrder._box3 ?? 0}
                          onChange={e => setEditingOrder({ ...editingOrder, _box3: parseInt(e.target.value) || 0 })}
                          style={{ fontSize: '1rem', padding: '8px', textAlign: 'center', fontWeight: 800 }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Box of 4</span>
                        <input
                          className="form-input pill"
                          type="number"
                          min="0"
                          value={editingOrder._box4 ?? 0}
                          onChange={e => setEditingOrder({ ...editingOrder, _box4: parseInt(e.target.value) || 0 })}
                          style={{ fontSize: '1rem', padding: '8px', textAlign: 'center', fontWeight: 800 }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Box of 6</span>
                        <input
                          className="form-input pill"
                          type="number"
                          min="0"
                          value={editingOrder._box6 ?? 0}
                          onChange={e => setEditingOrder({ ...editingOrder, _box6: parseInt(e.target.value) || 0 })}
                          style={{ fontSize: '1rem', padding: '8px', textAlign: 'center', fontWeight: 800 }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Box of 12</span>
                        <input
                          className="form-input pill"
                          type="number"
                          min="0"
                          value={editingOrder._box12 ?? 0}
                          onChange={e => setEditingOrder({ ...editingOrder, _box12: parseInt(e.target.value) || 0 })}
                          style={{ fontSize: '1rem', padding: '8px', textAlign: 'center', fontWeight: 800 }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Biscoff4</span>
                        <input
                          className="form-input pill"
                          type="number"
                          min="0"
                          value={editingOrder._biscoff4 ?? 0}
                          onChange={e => setEditingOrder({ ...editingOrder, _biscoff4: parseInt(e.target.value) || 0 })}
                          style={{ fontSize: '1rem', padding: '8px', textAlign: 'center', fontWeight: 800 }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>Mixed4</span>
                        <input
                          className="form-input pill"
                          type="number"
                          min="0"
                          value={editingOrder._mixed4 ?? 0}
                          onChange={e => setEditingOrder({ ...editingOrder, _mixed4: parseInt(e.target.value) || 0 })}
                          style={{ fontSize: '1rem', padding: '8px', textAlign: 'center', fontWeight: 800 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total Price & Downpayment */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Price (₱)</label>
                      <input
                        className="form-input pill"
                        type="number"
                        min="0"
                        value={editingOrder.total_price || 0}
                        onChange={e => setEditingOrder({ ...editingOrder, total_price: parseInt(e.target.value) || 0 })}
                        style={{ fontSize: '0.9rem', padding: '8px 12px', fontWeight: 800 }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Downpayment (₱)</label>
                      <input
                        className="form-input pill"
                        type="number"
                        min="0"
                        value={editingOrder.downpayment_price || 0}
                        onChange={e => setEditingOrder({ ...editingOrder, downpayment_price: parseInt(e.target.value) || 0 })}
                        style={{ fontSize: '0.9rem', padding: '8px 12px', fontWeight: 800 }}
                      />
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Special Instructions</label>
                    <textarea
                      className="form-textarea"
                      value={editingOrder.special_instructions || ''}
                      onChange={e => setEditingOrder({ ...editingOrder, special_instructions: e.target.value })}
                      rows={3}
                      style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                    />
                  </div>

                </div>
              </div>
              <div className="admin-modal-footer" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button
                  className="place-order-btn place-order-btn-sm btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setEditingOrder(null)}
                >
                  Cancel
                </button>
                <button
                  className="place-order-btn place-order-btn-sm"
                  style={{ flex: 1 }}
                  onClick={handleSaveEdit}
                >
                  💾 Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── ORDERS TABLE ─── */}
        <div className="admin-table-container" style={{ marginTop: '25px' }}>
          <div className="admin-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e3a8a' }}>Recent Orders</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="admin-nav-btn admin-nav-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setShowDeliveryList(true)}
              >
                <span>🚚</span> Delivery List
              </button>
              <button
                className="admin-nav-btn admin-nav-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={fetchOrders}
              >
                <span>🔄</span> Refresh
              </button>
            </div>
          </div>

          {/* Mobile Order Cards (Hidden on Desktop) */}
          <div className="admin-mobile-cards mobile-only">
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>No matching orders found.</div>
            ) : (
              filteredOrders.map(order => (
                <div key={order.id} className={`admin-order-card ${order.status === 'Refund Needed' ? 'row-refund' : ''}`}>
                  <div className="order-card-header">
                    <div className="order-card-date">
                      <span style={{ fontWeight: 800, color: '#1e3a8a' }}>{new Date(order.created_at).toLocaleDateString()}</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <select
                      className="status-select-table"
                      value={order.status || 'Pending'}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                        await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
                      }}
                      style={{ 
                        padding: '4px 8px',
                        background: order.status === 'Delivered' ? '#dcfce7' : order.status === 'Baking' ? '#fef3c7' : '#fff'
                      }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Baking">Baking</option>
                      <option value="Ready">Ready</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Refund Needed">Refund Needed</option>
                      <option value="Refunded">Refunded ✅</option>
                    </select>
                  </div>

                  <div className="order-card-customer">
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#1e3a8a' }}>{order.full_name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px', fontWeight: 600 }}>
                      IG: @{order.instagram || 'none'} • {order.contact_number}
                    </div>
                  </div>

                  <div className="order-card-details">
                    {(() => {
                      const typeVal = order.quantity_type || '';
                      let b3 = 0, b4 = 0, b6 = 0, b12 = 0, biscoff4 = 0, mixed4 = 0;
                      if (typeVal.includes('Box3:') || typeVal.includes('Biscoff4:') || typeVal.includes('Mixed4:')) {
                        const b3Match = typeVal.match(/Box3:\s(\d+)/);
                        const b4Match = typeVal.match(/Box4:\s(\d+)/);
                        const b6Match = typeVal.match(/Box6:\s(\d+)/);
                        const b12Match = typeVal.match(/Box12:\s(\d+)/);
                        const biscoffMatch = typeVal.match(/Biscoff4:\s(\d+)/);
                        const mixedMatch = typeVal.match(/Mixed4:\s(\d+)/);

                        b3 = b3Match ? parseInt(b3Match[1]) : 0;
                        b4 = b4Match ? parseInt(b4Match[1]) : 0;
                        b6 = b6Match ? parseInt(b6Match[1]) : 0;
                        b12 = b12Match ? parseInt(b12Match[1]) : 0;
                        biscoff4 = biscoffMatch ? parseInt(biscoffMatch[1]) : 0;
                        mixed4 = mixedMatch ? parseInt(mixedMatch[1]) : 0;
                      }
                      const total = (b3 * 3) + (b4 * 4) + (b6 * 6) + (b12 * 12) + (biscoff4 * 4) + (mixed4 * 4);
                      return (
                        <div style={{ fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                            {b3 > 0 && <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>B3 x {b3}</span>}
                            {b4 > 0 && <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>B4 x {b4}</span>}
                            {b6 > 0 && <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>B6 x {b6}</span>}
                            {b12 > 0 && <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '6px', fontWeight: 800 }}>B12 x {b12}</span>}
                            {biscoff4 > 0 && <span style={{ background: '#fffbeb', color: '#92400e', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, border: '1px solid #fde68a' }}>Biscoff4 x {biscoff4}</span>}
                            {mixed4 > 0 && <span style={{ background: '#fef2f2', color: '#991b1b', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, border: '1px solid #fecaca' }}>Mixed x {mixed4}</span>}
                          </div>
                          <div style={{ color: '#6366f1', fontWeight: 900, fontSize: '0.8rem' }}>↳ {total} cookies total</div>
                        </div>
                      );
                    })()}
                    {order.special_instructions && (
                      <div 
                        onClick={() => setSelectedNote(order.special_instructions)}
                        style={{ marginTop: '8px', padding: '8px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fef3c7', fontSize: '0.75rem', color: '#92400e', cursor: 'pointer' }}
                      >
                        📝 <strong>Note:</strong> {order.special_instructions.substring(0, 50)}{order.special_instructions.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </div>

                  <div className="order-card-info-grid">
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155' }}>
                        {order.delivery_mode === 'meetup' ? '🤝 Meetup' : '🚚 Maxim'}
                        <div style={{ color: '#64748b', fontWeight: 600 }}>{order.meetup_time}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 900, color: order.is_paid ? '#10b981' : '#ef4444' }}>
                        {order.is_paid ? 'PAID FULL' : `BAL: ₱${(order.total_price - order.downpayment_price).toLocaleString()}`}
                      </div>
                    </div>
                  </div>

                  <div className="order-card-actions">
                    <button
                      className="admin-action-mini"
                      onClick={() => {
                        const typeVal = order.quantity_type || '';
                        let _box3 = 0, _box4 = 0, _box6 = 0, _box12 = 0, _biscoff4 = 0, _mixed4 = 0;
                        if (typeVal.includes('Box3:') || typeVal.includes('Biscoff4:') || typeVal.includes('Mixed4:')) {
                           const b3Match = typeVal.match(/Box3:\s(\d+)/);
                           const b4Match = typeVal.match(/Box4:\s(\d+)/);
                           const b6Match = typeVal.match(/Box6:\s(\d+)/);
                           const b12Match = typeVal.match(/Box12:\s(\d+)/);
                           const biscoffMatch = typeVal.match(/Biscoff4:\s(\d+)/);
                           const mixedMatch = typeVal.match(/Mixed4:\s(\d+)/);

                           _box3 = b3Match ? parseInt(b3Match[1]) : 0;
                           _box4 = b4Match ? parseInt(b4Match[1]) : 0;
                           _box6 = b6Match ? parseInt(b6Match[1]) : 0;
                           _box12 = b12Match ? parseInt(b12Match[1]) : 0;
                           _biscoff4 = biscoffMatch ? parseInt(biscoffMatch[1]) : 0;
                           _mixed4 = mixedMatch ? parseInt(mixedMatch[1]) : 0;
                        }
                        setEditingOrder({ ...order, _box3, _box4, _box6, _box12, _biscoff4, _mixed4 });
                      }}
                    >✏️</button>
                    <button className="admin-action-mini" onClick={() => handleConfirmAndDM(order)}>💬</button>
                    {order.delivery_mode === 'maxim' && (
                       <button className="admin-action-mini" onClick={() => handleCopyMaximInfo(order)}>🚚</button>
                    )}
                    {order.gcash_screenshot_path && (
                       <a href={getMediaUrl(order.gcash_screenshot_path) || '#'} target="_blank" rel="noreferrer" className="admin-action-mini">📸</a>
                    )}
                    <button className="admin-action-mini del" onClick={() => setOrderToDelete(order)}>🗑️</button>
                    
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ fontSize: '0.65rem', fontWeight: 900, color: order.is_paid ? '#10b981' : '#94a3b8' }}>{order.is_paid ? 'PAID' : 'UNPAID'}</span>
                       <label className="switch" style={{ transform: 'scale(0.85)' }}>
                          <input
                             type="checkbox"
                             checked={!!order.is_paid}
                             onChange={async () => {
                                const newPaid = !order.is_paid;
                                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, is_paid: newPaid } : o));
                                await supabase.from('orders').update({ is_paid: newPaid }).eq('id', order.id);
                             }}
                          />
                          <span className="slider round"></span>
                       </label>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (Hidden on Mobile) */}
          <div className="admin-table-scroll desktop-only" style={{ borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Order Details</th>
                  <th>Delivery</th>
                  <th>Payment</th>
                  <th>GCash Info</th>
                  <th>Status</th>
                  <th>Media</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No matching orders found.</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className={order.status === 'Refund Needed' ? 'row-refund' : ''}>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{new Date(order.created_at).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#1e3a8a' }}>{order.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>IG: @{order.instagram || 'none'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{order.contact_number}</div>
                      </td>
                      <td>
                        {(() => {
                          const typeVal = order.quantity_type || '';
                          let b3 = 0, b4 = 0, b6 = 0, b12 = 0, biscoff4 = 0, mixed4 = 0;
                          if (typeVal.includes('Box3:') || typeVal.includes('Biscoff4:') || typeVal.includes('Mixed4:')) {
                            const b3Match = typeVal.match(/Box3:\s(\d+)/);
                            const b4Match = typeVal.match(/Box4:\s(\d+)/);
                            const b6Match = typeVal.match(/Box6:\s(\d+)/);
                            const b12Match = typeVal.match(/Box12:\s(\d+)/);
                            const biscoffMatch = typeVal.match(/Biscoff4:\s(\d+)/);
                            const mixedMatch = typeVal.match(/Mixed4:\s(\d+)/);

                            b3 = b3Match ? parseInt(b3Match[1]) : 0;
                            b4 = b4Match ? parseInt(b4Match[1]) : 0;
                            b6 = b6Match ? parseInt(b6Match[1]) : 0;
                            b12 = b12Match ? parseInt(b12Match[1]) : 0;
                            biscoff4 = biscoffMatch ? parseInt(biscoffMatch[1]) : 0;
                            mixed4 = mixedMatch ? parseInt(mixedMatch[1]) : 0;
                          }
                          const total = (b3 * 3) + (b4 * 4) + (b6 * 6) + (b12 * 12) + (biscoff4 * 4) + (mixed4 * 4);
                          // Legacy Fallback
                          if (!typeVal.includes('Box') && !typeVal.includes('Biscoff')) {
                            const mult = order.quantity_type === 'box-of-4' ? 4 : (order.quantity_type === 'box-of-6' ? 6 : 12);
                            return (
                              <div style={{ fontSize: '0.85rem' }}>
                                <strong>{order.quantity_type === 'box-of-12' ? 'Box of 12' : (order.quantity_type === 'box-of-4' ? 'Box of 4' : 'Box of 6')} x {order.quantity || 1}</strong>
                                <div style={{ color: '#6366f1', fontWeight: 800 }}>↳ {mult * (order.quantity || 1)} cookies</div>
                              </div>
                            );
                          }
                          return (
                            <div style={{ fontSize: '0.85rem' }}>
                              {b3 > 0 && <div>Box 3 x {b3}</div>}
                              {b4 > 0 && <div>Box 4 x {b4}</div>}
                              {b6 > 0 && <div>Box 6 x {b6}</div>}
                              {b12 > 0 && <div>Box 12 x {b12}</div>}
                              {biscoff4 > 0 && <div style={{ color: '#92400e', fontWeight: 700 }}>Biscoff4 x {biscoff4}</div>}
                              {mixed4 > 0 && <div style={{ color: '#991b1b', fontWeight: 700 }}>Mixed x {mixed4}</div>}
                              <div style={{ color: '#6366f1', fontWeight: 800 }}>↳ {total} cookies</div>
                            </div>
                          );
                        })()}
                        {order.special_instructions && (
                          <div
                            className="note-trigger"
                            onClick={() => setSelectedNote(order.special_instructions)}
                            style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '0.75rem', textDecoration: 'underline', marginTop: '4px' }}
                          >
                            📝 View Note
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          <div style={{ fontWeight: 800 }}>{order.delivery_mode === 'meetup' ? '🤝 Meetup' : '🚚 Maxim'}</div>
                          <div style={{ color: '#64748b' }}>🕒 {order.meetup_time}</div>
                          {order.delivery_mode === 'maxim' && (
                            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, marginTop: '2px' }}>📍 {order.maxim_address?.substring(0, 15)}...</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ fontWeight: 900, color: order.is_paid ? '#10b981' : '#f59e0b', fontSize: '0.65rem', textTransform: 'uppercase' }}>{order.is_paid ? 'PAID FULL' : 'DP RECEIVED'}</div>
                          {!order.is_paid && <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>Bal: ₱{(order.total_price - order.downpayment_price).toLocaleString()}</div>}
                          <label className="switch" style={{ transform: 'scale(0.7)', transformOrigin: 'left' }}>
                            <input
                              type="checkbox"
                              checked={!!order.is_paid}
                              onChange={async () => {
                                const newPaid = !order.is_paid;
                                setOrders(prev => prev.map(o => o.id === order.id ? { ...o, is_paid: newPaid } : o));
                                await supabase.from('orders').update({ is_paid: newPaid }).eq('id', order.id);
                              }}
                            />
                            <span className="slider round"></span>
                          </label>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>
                        <div style={{ fontWeight: 700 }}>{order.gcash_name || '-'}</div>
                        <div style={{ color: '#64748b' }}>{order.gcash_number || '-'}</div>
                      </td>
                      <td>
                        <select
                          className="status-select-table"
                          value={order.status || 'Pending'}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                            await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
                          }}
                          style={{
                            padding: '4px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Baking">Baking</option>
                          <option value="Ready">Ready</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Refund Needed">Refund Needed</option>
                          <option value="Refunded">Refunded ✅</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {order.gcash_screenshot_path && (
                             <a href={getMediaUrl(order.gcash_screenshot_path) || '#'} target="_blank" rel="noreferrer" className="admin-action-mini" title="Receipt">📸</a>
                          )}
                          {order.maxim_screenshot_path && (
                             <a href={getMediaUrl(order.maxim_screenshot_path) || '#'} target="_blank" rel="noreferrer" className="admin-action-mini" title="Address Pin">📍</a>
                          )}
                          {!order.gcash_screenshot_path && !order.maxim_screenshot_path && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>None</span>}
                        </div>
                      </td>
                      <td><strong style={{ color: '#1e3a8a' }}>₱{order.total_price.toLocaleString()}</strong></td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="admin-action-mini"
                            onClick={() => {
                              const typeVal = order.quantity_type || '';
                              let _box3 = 0, _box4 = 0, _box6 = 0, _box12 = 0, _biscoff4 = 0, _mixed4 = 0;
                              if (typeVal.includes('Box3:') || typeVal.includes('Biscoff4:') || typeVal.includes('Mixed4:')) {
                                _box3 = (typeVal.match(/Box3:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box3:\s(\d+)/)![1]) : 0;
                                _box4 = (typeVal.match(/Box4:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box4:\s(\d+)/)![1]) : 0;
                                _box6 = (typeVal.match(/Box6:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box6:\s(\d+)/)![1]) : 0;
                                _box12 = (typeVal.match(/Box12:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box12:\s(\d+)/)![1]) : 0;
                                _biscoff4 = (typeVal.match(/Biscoff4:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Biscoff4:\s(\d+)/)![1]) : 0;
                                _mixed4 = (typeVal.match(/Mixed4:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Mixed4:\s(\d+)/)![1]) : 0;
                              }
                              setEditingOrder({ ...order, _box3, _box4, _box6, _box12, _biscoff4, _mixed4 });
                            }}
                            title="Edit"
                          >✏️</button>
                          <button className="admin-action-mini" onClick={() => handleConfirmAndDM(order)} title="DM Customer">💬</button>
                          {order.delivery_mode === 'maxim' && (
                             <button className="admin-action-mini" onClick={() => handleCopyMaximInfo(order)} title="Copy Maxim Info">🚚</button>
                          )}
                          <button className="admin-action-mini del" onClick={() => setOrderToDelete(order)} title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}





/* ═══════════════════════════════════════
   MAINTENANCE / COUNTDOWN PAGE
═══════════════════════════════════════ */
function MaintenancePage({ onUnlock, targetDate }: { onUnlock: (pass: string) => void; targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });
  const [showBypass, setShowBypass] = useState(false);
  const [bypassPass, setBypassPass] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        return { d: 0, h: 0, m: 0, s: 0 };
      }

      return {
        d: Math.floor(distance / (1000 * 60 * 60 * 24)),
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000),
      };
    };

    // Initial calculation
    setTimeLeft(calculateTime());

    const timer = setInterval(() => {
      const remaining = calculateTime();
      setTimeLeft(remaining);

      const now = new Date().getTime();
      if (targetDate.getTime() - now < 0) {
        clearInterval(timer);
        // Countdown finished — do not reload (MANUAL_LOCK controls visibility)
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="maintenance-page">
      <div className="maintenance-container">
        <div className="maintenance-logo-wrapper">
          <img src="/baked-by-logo.png" alt="Baked By Logo" className="maintenance-logo" />
        </div>
        <h1 className="maintenance-title">Something Sweet is Coming!</h1>
        <div className="maintenance-warning" style={{
          marginTop: '0px',
          marginBottom: '35px',
          padding: '25px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: 600,
          lineHeight: '1.7',
          textAlign: 'center',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ color: '#facc15', fontSize: '1.25rem', marginBottom: '15px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900 }}>📝 Preorder Details</h3>
          <ul style={{ padding: 0, margin: '0 auto', listStyleType: 'none', display: 'inline-block', textAlign: 'left' }}>
            <li style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}><span>•</span> <span>Limited boxes available</span></li>
            <li style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}><span>•</span> <span>meetups at lasalle gate 6 - 9am-10am, March 31 tuesday</span></li>
            <li style={{ marginBottom: '10px', display: 'flex', gap: '8px' }}><span>•</span> <span>Orders via website only</span></li>
            <li style={{ marginBottom: '0px', display: 'flex', gap: '8px' }}><span>•</span> <span>Full payment basis</span></li>
          </ul>
          <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px', color: '#93c5fd', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
            📍 Bacolod City orders only.
          </div>
        </div>

        {new Date() < targetDate && (
          <>
            <div className="countdown-timer">
              <div className="countdown-box">
                <span className="countdown-value">{timeLeft.d}</span>
                <span className="countdown-label">Days</span>
              </div>
              <div className="countdown-box">
                <span className="countdown-value">{timeLeft.h}</span>
                <span className="countdown-label">Hours</span>
              </div>
              <div className="countdown-box">
                <span className="countdown-value">{timeLeft.m}</span>
                <span className="countdown-label">Mins</span>
              </div>
              <div className="countdown-box">
                <span className="countdown-value">{timeLeft.s}</span>
                <span className="countdown-label">Secs</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', color: '#3b82f6', fontWeight: 800, fontSize: '1.2rem', marginTop: '25px', marginBottom: '30px', textShadow: '0 0 10px rgba(59, 130, 246, 0.5)', width: '100%', letterSpacing: '0.5px' }}>
              Reserve early — boxes sell out fast.
            </div>
          </>
        )}

        <div className="admin-bypass-section">
          {!showBypass ? (
            <button className="bypass-btn-toggle" onClick={() => setShowBypass(true)}>Admin Unlock</button>
          ) : (
            <div className="bypass-input-group">
              <input
                type="password"
                className="bypass-input"
                placeholder="Enter pastry..."
                value={bypassPass}
                onChange={(e) => setBypassPass(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // Blur to hide keyboard and prevent zoom-lock on mobile
                    (e.target as HTMLInputElement).blur();
                    onUnlock(bypassPass);
                  }
                }}
              />
              <button className="bypass-btn" onClick={() => {
                // Blur anything focused to prevent transition issues
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                onUnlock(bypassPass);
              }}>Unlock</button>
            </div>
          )}
        </div>

        <div className="notepad-faq-container" style={{ textAlign: 'left', marginTop: '40px', background: 'rgba(20, 35, 118, 0.3)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h2 className="faq-title" style={{ color: '#facc15', textShadow: '0 0 20px rgba(250, 204, 21, 0.5)' }}>FAQs</h2>
          <div className="faq-list">
            {FAQS.map((faq, i) => (
              <div className={`faq-item ${expandedFaq === i ? 'expanded' : ''}`} key={i} style={{ background: 'rgba(28, 53, 153, 0.1)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div className="faq-q" onClick={() => toggleFaq(i)} style={{ color: '#ecf4ff' }}>
                  {faq.q}
                  <span className="faq-icon" style={{ background: '#facc15', color: '#000', boxShadow: '0 0 15px rgba(250, 204, 21, 0.4)', fontWeight: 800, borderRadius: '50%', minWidth: '26px', minHeight: '26px' }}>{expandedFaq === i ? '−' : '+'}</span>
                </div>
                <div className="faq-a" style={{ color: '#bfdbfe', opacity: expandedFaq === i ? 1 : 0, maxHeight: expandedFaq === i ? '500px' : '0', padding: expandedFaq === i ? '0 20px 16px 20px' : '0 20px' }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="maintenance-footer" style={{ marginTop: '30px' }}>
          Baked with love in Bacolod City
        </div>
      </div>
    </div>
  );
}



/* ═══════════════════════════════════════
   BROWSER GUARD (INSTAGRAM/FB)
═══════════════════════════════════════ */
function BrowserGuard() {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const siteUrl = "https://bakedbybcd.vercel.app";

  const handleOpenExternal = () => {
    if (isAndroid) {
      // Direct intent to force Chrome on Android
      window.location.href = `intent://${siteUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      // iOS fallback - copy to clipboard and notify
      navigator.clipboard.writeText(siteUrl);
      alert("Link copied! 📋\n\nNow tap the '...' at the top right and select 'Open in Safari' or paste this into your browser.");
    }
  };

  return (
    <div className="bg-overlay fade-in">
      <div className="bg-card">
        <div className="bg-icon">🚀</div>
        <h2 className="bg-title">Almost There!</h2>
        <p className="bg-text">
          Instagram blocks GCash payments. To continue, open this page in your regular browser.
        </p>

        <div className="bg-steps">
          <div className="bg-step-item">
            <div className="bg-step-num">1</div>
            <div className="bg-step-text">Tap the <strong>three dots (⋮ / ...)</strong> at the top right.</div>
          </div>
          <div className="bg-step-item">
            <div className="bg-step-num">2</div>
            <div className="bg-step-text">Select <strong>"Open in Browser"</strong> or <strong>"Open in Safari"</strong>.</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="bg-btn-primary" onClick={handleOpenExternal}>
            {isAndroid ? 'Open in Chrome Directly 🚀' : 'Copy Link & Instructions 📋'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HISTORY PAGE
   Allow users to view their past orders by phone number
═══════════════════════════════════════ */
function HistoryPage({ onBack, onRecover }: { onBack: () => void, onRecover: (order: any) => void }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const formatPhoneNumber = (val: string) => {
    const numbers = val.replace(/\D/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 4)} ${numbers.slice(4)}`;
    return `${numbers.slice(0, 4)} ${numbers.slice(4, 7)} ${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const fetchHistory = async () => {
    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (cleanPhone.length < 10) {
      alert("Please enter a valid phone number.");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('contact_number', cleanPhone)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error("History fetch error:", err);
      alert("Failed to fetch history: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseQuantity = (qtyStr: string) => {
    if (!qtyStr) return 'N/A';
    return qtyStr.split(', ')
      .filter(item => !item.includes(': 0'))
      .map(item => {
        const [type, count] = item.split(': ');
        const label = type === 'Box3' ? 'Box of 3' : type === 'Box4' ? 'Box of 4' : type === 'Box6' ? 'Box of 6' : 'Box of 12';
        return `${count}x ${label}`;
      }).join(', ');
  };

  return (
    <div className="order-page fade-in">
      <div className="op-card" style={{ maxWidth: '500px' }}>
        <div className="op-logo">
          <img src="/baked-by-logo.png" alt="BAKED BY" className="op-logo-img" />
        </div>

        <h2 className="success-header" style={{ textAlign: 'center', color: '#142376', marginBottom: '20px' }}>
          Transaction History
        </h2>

        {!searched || (searched && orders.length > 0) ? (
          <div style={{ marginBottom: '30px' }}>
            <p style={{ textAlign: 'center', color: '#444', marginBottom: '15px', fontSize: '1.1rem' }}>
              Enter your contact number to see your past orders.
            </p>
            <div className="form-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                className="form-input pill"
                style={{ width: '100%', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '1px' }}
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="09XX XXX XXXX"
                maxLength={13}
              />
              <button
                className="place-order-btn"
                style={{ width: '100%', marginTop: '10px' }}
                onClick={fetchHistory}
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search Transactions'}
              </button>
            </div>
          </div>
        ) : null}

        {searched && !loading && (
          <div className="history-results">
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <span style={{ fontSize: '3rem' }}>🔍</span>
                <h3 style={{ color: '#64748b', marginTop: '15px' }}>No orders found for this number.</h3>
                <button
                  className="bg-btn-secondary"
                  onClick={() => { setSearched(false); setPhoneNumber(''); }}
                  style={{ marginTop: '20px', color: '#7aa0f0' }}
                >
                  Try another number
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: '#1e3a8a', fontSize: '1.1rem' }}>Found {orders.length} Order(s)</h3>
                  <button
                    onClick={() => { setSearched(false); setPhoneNumber(''); }}
                    style={{ background: 'none', border: 'none', color: '#7aa0f0', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}
                  >
                    Change Number
                  </button>
                </div>
                {orders.map(order => (
                  <div key={order.id} className="history-item-card" style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '15px',
                    padding: '15px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 800, color: '#1e3a8a' }}>
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className={`status-badge status-${(order.status || 'Pending').toLowerCase().replace(' ', '-')}`} style={{ margin: 0, padding: '2px 8px', fontSize: '0.7rem' }}>
                        {order.status || 'Pending'}
                      </span>
                    </div>

                    {order.status === 'Holding' && (
                      <button
                        onClick={() => {
                          onRecover(order);
                        }}
                        style={{
                          marginBottom: '15px',
                          display: 'block',
                          width: '100%',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                        }}
                      >
                        Finish & Upload Receipt →
                      </button>
                    )}

                    <div style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '10px', lineHeight: '1.4' }}>
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 600 }}>Items:</span>
                        <span>{parseQuantity(order.quantity_type)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        <span style={{ fontWeight: 600 }}>Total:</span>
                        <span style={{ fontWeight: 900, color: '#142376' }}>₱{order.total_price.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        <span style={{ fontWeight: 600 }}>Time:</span>
                        <span>{new Date(order.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div style={{ background: 'white', borderRadius: '10px', padding: '8px 12px', fontSize: '0.8rem', border: '1px dashed #cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Mode: {order.delivery_mode === 'meetup' ? '🤝 Meetup' : '🚚 Maxim'}</span>
                        <span style={{ color: order.is_paid ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                          {order.is_paid ? 'PAID FULL' : 'DP RECEIVED'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
          <button className="bg-btn-secondary" onClick={onBack} style={{ color: '#94a3b8' }}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   ROOT
═══════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [isLocked, setIsLocked] = useState<boolean>(MANUAL_LOCK_DEFAULT);
  const [targetDate, setTargetDate] = useState<Date>(FALLBACK_TARGET_DATE);
  const [bypassLocked, setBypassLocked] = useState(false);
  const [b3Stock, setB3Stock] = useState<number | null>(null);
  const [b4Stock, setB4Stock] = useState<number | null>(null);
  const [b6Stock, setB6Stock] = useState<number | null>(null);
  const [biscoffStock, setBiscoffStock] = useState<number | null>(null);
  const [mixedStock, setMixedStock] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(true);
  const [showBrowserGuard, setShowBrowserGuard] = useState(false);
  const [recoveryOrder, setRecoveryOrder] = useState<any>(null);

  const fetchStock = async () => {
    try {
      const { data: b3 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Box of 3').single();
      const { data: b4 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Box of 4').single();
      const { data: b6 } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Box of 6').single();
      const { data: biscoff } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Biscoff Box of 4').single();
      const { data: mixed } = await supabase.from('inventory').select('stock_count').eq('item_name', 'Biscoff and Pistacio Mixed').single();
      if (b3) setB3Stock(b3.stock_count);
      if (b4) setB4Stock(b4.stock_count);
      if (b6) setB6Stock(b6.stock_count);
      if (biscoff) setBiscoffStock(biscoff.stock_count);
      if (mixed) setMixedStock(mixed.stock_count);

      // Also Fetch Site Lock Status
      const { data: lock } = await supabase.from('inventory').select('stock_count').eq('item_name', 'SITE_LOCK').single();
      if (lock) {
        setIsLocked(lock.stock_count === 1);
      }

      // Fetch Scheduled Release Time (Unix Epoch in seconds)
      const { data: releaseTime } = await supabase.from('inventory').select('stock_count').eq('item_name', 'RELEASE_TIME').single();
      if (releaseTime && releaseTime.stock_count > 0) {
        setTargetDate(new Date(releaseTime.stock_count * 1000));
      }
    } finally {
      setStockLoading(false);
    }
  };

  const handleToggleLock = async () => {
    const newStatus = !isLocked;
    const { error } = await supabase
      .from('inventory')
      .upsert({ item_name: 'SITE_LOCK', stock_count: newStatus ? 1 : 0 }, { onConflict: 'item_name' });

    if (!error) {
      setIsLocked(newStatus);
      alert(`Website is now ${newStatus ? 'LOCKED' : 'LIVE'}!`);
    } else {
      alert("Error updating site status: " + error.message);
    }
  };

  const handleUpdateReleaseTime = async (newDate: Date) => {
    const epochSeconds = Math.floor(newDate.getTime() / 1000);
    const { error } = await supabase
      .from('inventory')
      .upsert({ item_name: 'RELEASE_TIME', stock_count: epochSeconds }, { onConflict: 'item_name' });

    if (!error) {
      setTargetDate(newDate);
      alert(`Release time updated to: ${newDate.toLocaleString()}`);
    } else {
      alert("Error updating release time: " + error.message);
    }
  };

  useEffect(() => {
    // ─── JANITOR: Clean Expired Holds & Poll Stock (Real-time Sync Attached) ───
    const janitor = async () => {
      // 1. Mark Holding orders older than 10 mins as Expired & Return Stock
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: expired } = await supabase.from('orders').select('*').eq('status', 'Holding').lt('created_at', tenMinsAgo);
      if (expired && expired.length > 0) {
        for (const hold of expired) {
          // Return stock
          const typeVal = hold.quantity_type || '';
          const b3 = (typeVal.match(/Box3:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box3:\s(\d+)/)![1]) : 0;
          const b4 = (typeVal.match(/Box4:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box4:\s(\d+)/)![1]) : 0;
          const b6 = (typeVal.match(/Box6:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Box6:\s(\d+)/)![1]) : 0;
          const biscoff = (typeVal.match(/Biscoff4:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Biscoff4:\s(\d+)/)![1]) : 0;
          
          if (b3 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 3', p_amount: b3 });
          if (b4 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 4', p_amount: b4 });
          if (b6 > 0) await supabase.rpc('increment_box_stock', { p_item: 'Box of 6', p_amount: b6 });
          if (biscoff > 0) await supabase.rpc('increment_box_stock', { p_item: 'Biscoff Box of 4', p_amount: biscoff });
          
          const mixed = (typeVal.match(/Mixed4:\s(\d+)/) || [])[1] ? parseInt(typeVal.match(/Mixed4:\s(\d+)/)![1]) : 0;
          if (mixed > 0) await supabase.rpc('increment_box_stock', { p_item: 'Biscoff and Pistacio Mixed', p_amount: mixed });

          // Update status to Expired
          await supabase.from('orders').update({ status: 'Expired' }).eq('id', hold.id);
        }
      }

      // 2. Refresh Stock
      fetchStock();
    };

    janitor();
    const poller = setInterval(janitor, 60000); // Backstop polling every 60s

    const inventorySub = supabase
      .channel('app-inventory-sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'inventory' }, (payload) => {
        const { item_name, stock_count } = payload.new as any;
        if (item_name === 'Box of 3') setB3Stock(stock_count);
        if (item_name === 'Box of 4') setB4Stock(stock_count);
        if (item_name === 'Box of 6') setB6Stock(stock_count);
        if (item_name === 'Biscoff Box of 4') setBiscoffStock(stock_count);
        if (item_name === 'Biscoff and Pistacio Mixed') setMixedStock(stock_count);
      })
      .subscribe();

    // ─── RESUME DRAFT SESSION ───
    const draftId = localStorage.getItem('baked_draft_holdingOrderId');
    const resumeDraft = async () => {
      if (!draftId) return;
      const { data: order } = await supabase.from('orders').select('*').eq('id', draftId).eq('status', 'Holding').single();
      if (order) {
        const created = new Date(order.created_at).getTime();
        const now = Date.now();
        if (now - created < 10 * 60 * 1000) {
          setRecoveryOrder(order);
          setPage('order');
          alert("Resuming your unfinished order! 🍪");
        }
      }
    };
    resumeDraft();

    // Instagram / FB Browser Detection
    const isInApp = /Instagram|FBAN|FBAV/i.test(navigator.userAgent);
    const hasSeenGuard = sessionStorage.getItem('baked_browser_guard_seen');
    if (isInApp && !hasSeenGuard) {
      setShowBrowserGuard(true);
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && page === 'admin-login') {
        setPage('admin-dashboard');
      }
    });

    window.scrollTo(0, 0); // Reset scroll on page change

    // Handle key listener for hidden admin access (Ctrl + Alt + A)
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') {
        setPage('admin-login');
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      clearInterval(poller);
      inventorySub.unsubscribe();
    };
  }, [page]);

  const handleUnlock = (pass: string) => {
    if (pass.toLowerCase() === 'budaichewy') {
      window.scrollTo(0, 0); // Scroll to top before unlocking
      setBypassLocked(true);
    } else {
      alert('Wrong pastry! 🧁');
    }
  };


  const showLocked = (isLocked || new Date() < targetDate) && !bypassLocked && page !== 'admin-login' && page !== 'admin-dashboard';

  return (
    <>
      {showBrowserGuard && <BrowserGuard />}
      {showLocked ? (
        <MaintenancePage onUnlock={handleUnlock} targetDate={targetDate} />
      ) : (
        <>
          {page === 'home' && (
            <HomePage
              b3={b3Stock}
              b4={b4Stock}
              b6={b6Stock}
              biscoff4={biscoffStock}
              mixed4={mixedStock}
              loading={stockLoading}
              onOrderClick={() => setPage('order')}
              onAdminClick={() => setPage('admin-login')}
              onViewHistory={() => setPage('history')}
            />
          )}
          {page === 'order' && (
            <OrderPage
              onBack={() => {
                setPage('home');
                setRecoveryOrder(null);
              }}
              recoveryOrder={recoveryOrder}
            />
          )}
          {page === 'history' && (
            <HistoryPage
              onBack={() => setPage('home')}
              onRecover={(order) => {
                setRecoveryOrder(order);
                setPage('order');
              }}
            />
          )}
          {page === 'admin-login' && <AdminLogin onLogin={() => setPage('admin-dashboard')} onBack={() => setPage('home')} />}
          {page === 'admin-dashboard' && (
            <AdminDashboard
              onLogout={() => setPage('admin-login')}
              onBack={() => setPage('home')}
              isLocked={isLocked}
              onToggleLock={handleToggleLock}
              targetDate={targetDate}
              onUpdateReleaseTime={handleUpdateReleaseTime}
            />
          )}
        </>
      )}
    </>
  );
}



