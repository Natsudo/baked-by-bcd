import { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import './App.css';

type Page = 'home' | 'order' | 'admin-login' | 'admin-dashboard';
type PaymentMode = 'gcash' | 'cash' | '';
type DeliveryMode = 'meetup' | 'maxim' | '';
type MeetupLocation = 'alijis' | 'lasalle' | '';
type MeetupTime = '10am - 12pm' | '3pm - 4pm' | '';




const FAQS = [
  { q: "How do I order?", a: "When preorders open, we post the order form link on our page and story. Slots are limited per batch and are available on a first come, first served basis. Once the form is closed, we no longer accept orders" },
  { q: "Can I order for today or tomorrow?", a: "We only accept PREORDERS. Same day or next day orders are not available. Delivery dates for each batch are announced in our posts along with a notice or teaser before opening." },
  { q: "Are you still available? Do you accept orders?", a: "If slots are posted on our page as SOLD OUT or the forms are closed, we no longer accept orders for that batch. Please follow our page and check our posts or bio for updates on preorder availability and the next preorder schedule." },
  { q: "When will you be available again?", a: "We post preorder schedules weekly on our page, along with a notice a few days before opening slots. Follow our page to stay updated." },
  { q: "Who is your courier? How much is the delivery fee and who shoulders it?", a: "Delivery fees for non meetup orders vary depending on your location. We use Maxim as our courier, pickup basis is either Lasalle or Alijis (Panaad). Maxim orders will be booked by us, and the delivery fee will be shouldered by the buyer." },
  { q: "What are your payment methods?", a: "We accept cash and GCash. A minimum of 50% nonrefundable downpayment is required to secure your slot and avoid bogus orders." },
  { q: "Where are you located? What is your mode of delivery?", a: "We are located in Bacolod City.\n• Via Maxim: Alijis (Panaad) or La Salle area\n• Meetups: La Salle area only" },
  { q: "What time are meetup orders?", a: "Available meetup time slots will be indicated in the preorder form. Kindly choose the time most convenient for you. Please be punctual when meeting up, as we are students and are only available at the selected time." },
  { q: "Do you accept reservations?", a: "We strictly DO NOT allow RESERVATIONS. To keep things fair for everyone, we only accept orders through our official form on a first come, first served basis." },
  { q: "Do you ship to Manila or outside Bacolod?", a: "We currently cater orders within Bacolod City only." },
  { q: "Do you offer boxes of 12 or 24?", a: "We currently offer boxes of 4 and 6 only. Box of 12 options will be available soon, so stay tuned for announcements." },
  { q: "How much are your products?", a: "• Solo - ₱70\n• Box of 4 - ₱285\n• Box of 6 - ₱425\n\nOur full price list is also pinned on our page, so kindly follow us to check for updates." },
  { q: "Can I change my order after submitting the form?", a: "Order information such as address or meetup details may still be updated if needed by messaging us through our Instagram handle @BAKEDBY.BCD. However, the quantity ordered cannot be changed since slots are limited." },
  { q: "Why are slots limited?", a: "We are a small student-run business and bake per batch to ensure quality and freshness. Slots are limited to maintain product quality." },
  { q: "Can I cancel my order?", a: "Cancellations are not allowed once payment is made. The 50% downpayment is strictly non-refundable as ingredients and slots are already allocated." }
];

/* ─── STOCK COUNTER COMPONENT ─── */
function StockCounter({ stock, loading }: { stock: number | null, loading: boolean }) {
  return (
    <div className="stock-counter-banner sparkle-banner">
      <span className="stock-dot" style={{ background: stock === 0 ? '#ef4444' : '#10b981' }}></span>
      <span className="stock-text sparkle-text-sm">
        {loading ? 'Checking stock...' : stock !== null ? (stock === 0 ? 'SOLD OUT! Stay tuned for the next batch.' : `${stock} Chewy Cookies left in stock!`) : 'Chewy Cookies available!'}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════ */
function HomePage({ onOrderClick, onAdminClick, stock, stockLoading }: { onOrderClick: () => void, onAdminClick: () => void, stock: number | null, stockLoading: boolean }) {
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
      <StockCounter stock={stock} loading={stockLoading} />

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
            className={`place-order-btn${stock === 0 ? ' sold-out' : ''}`}
            onClick={stock === 0 ? undefined : onOrderClick}
            disabled={stock === 0}
          >
            {stock === 0 ? 'SOLD OUT!' : 'Place Order!'}
          </button>

          <p className="location-note">
            We only cater @ Bacolod City for now.<br />
            Thank you for your support!
          </p>
        </div>
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
function OrderPage({ onBack, currentStock }: { onBack: () => void, currentStock: number | null }) {
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [instagram, setInstagram] = useState('');
  const [quantityBox4, setQuantityBox4] = useState(0);
  const [quantityBox6, setQuantityBox6] = useState(0);
  const [quantityBox12, setQuantityBox12] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('');

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

  const handleGcashPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setGcashNumber(formatted);
  };
  const [meetupLocation, setMeetupLocation] = useState<MeetupLocation>('');
  const [meetupTime, setMeetupTime] = useState<MeetupTime>('');
  const [maximAddress, setMaximAddress] = useState('');
  const [maximScreenshot, setMaximScreenshot] = useState<File | null>(null);
  const [gcashName, setGcashName] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [gcashScreenshot, setGcashScreenshot] = useState<File | null>(null);
  const [understood, setUnderstood] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maximFileInputRef = useRef<HTMLInputElement>(null);

  const isWeekend = new Date().getDay() === 6 || new Date().getDay() === 0;


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setGcashScreenshot(e.target.files[0]);
  };

  const handleMaximFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setMaximScreenshot(e.target.files[0]);
  };

  const totalPrice = (quantityBox4 * 285) + (quantityBox6 * 425) + (quantityBox12 * 845);
  const downpaymentPrice = totalPrice * 0.5;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full Name is required.';
    if (!contactNumber.trim()) errs.contactNumber = 'Contact Number is required.';
    if (!instagram.trim()) errs.instagram = 'Instagram Handle is required.';
    if (quantityBox4 === 0 && quantityBox6 === 0 && quantityBox12 === 0) errs.quantity = 'Please select at least one box.';
    if (!paymentMode) errs.paymentMode = 'Please select a payment method.';
    if (!deliveryMode) errs.deliveryMode = 'Please select a delivery method.';
    if (deliveryMode === 'meetup' && !meetupTime) errs.meetupTime = 'Please select a pick-up time.';
    if (deliveryMode === 'maxim') {
      if (!meetupLocation) errs.meetupLocation = 'Please select a pick-up location.';
      if (!meetupTime) errs.meetupTime = 'Please select a delivery time.';
      if (!maximAddress.trim()) errs.maximAddress = 'Delivery address is required.';
      if (!maximScreenshot) errs.maximScreenshot = 'Please upload a pin point screenshot.';
    }
    if (paymentMode) {
      if (!gcashName.trim()) errs.gcashName = 'GCash Name is required.';
      if (!gcashNumber.trim()) errs.gcashNumber = 'GCash Number is required.';
      if (!gcashScreenshot) errs.gcashScreenshot = 'Please upload your receipt screenshot.';
      if (!understood) errs.understood = 'Please tick the acknowledgement checkbox.';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setIsSubmitting(true);

    try {
      let uploadedMaximScreenshotPath = null;
      let uploadedGcashScreenshotPath = null;

      // Make a unique ID for the order folder to avoid overlapping names
      const folderId = Date.now().toString();

      if (maximScreenshot) {
        const { data, error } = await supabase.storage
          .from('receipts')
          .upload(`maxim/${folderId}_${maximScreenshot.name}`, maximScreenshot);
        if (!error && data) uploadedMaximScreenshotPath = data.path;
      }

      if (gcashScreenshot) {
        const { data, error } = await supabase.storage
          .from('receipts')
          .upload(`gcash/${folderId}_${gcashScreenshot.name}`, gcashScreenshot);
        if (!error && data) uploadedGcashScreenshotPath = data.path;
      }

      const totalPiecesOrdered = (quantityBox4 * 4) + (quantityBox6 * 6) + (quantityBox12 * 12);

      // Verify stock before inserting order
      const { data: stockCheckData } = await supabase
        .from('inventory')
        .select('stock_count')
        .eq('item_name', 'Chewy Cookie')
        .single();

      if (stockCheckData && stockCheckData.stock_count < totalPiecesOrdered) {
        alert('So sorry! Someone just grabbed the last pieces. We are now SOLD OUT! 😭');
        setIsSubmitting(false);
        return;
      }

      const { error: dbError } = await supabase
        .from('orders')
        .insert([{
          full_name: fullName,
          contact_number: contactNumber.replace(/\s/g, ''),
          instagram: instagram,
          quantity_type: `Box4: ${quantityBox4}, Box6: ${quantityBox6}, Box12: ${quantityBox12}`,
          quantity: 1, // Placeholder
          total_price: totalPrice,
          downpayment_price: downpaymentPrice,
          payment_mode: paymentMode,
          delivery_mode: deliveryMode,
          meetup_location: meetupLocation,
          meetup_time: meetupTime,
          maxim_address: maximAddress,
          maxim_screenshot_path: uploadedMaximScreenshotPath,
          gcash_name: gcashName,
          gcash_number: gcashNumber.replace(/\s/g, ''),
          gcash_screenshot_path: uploadedGcashScreenshotPath,
          special_instructions: specialInstructions
        }]);

      if (dbError) {
        console.error('Database Error:', dbError);
        alert(`Database Error: ${dbError.message}`);
        setIsSubmitting(false);
        return;
      }

      // ─── REDUCE STOCK ───
      if (stockCheckData) {
        const newStockCount = Math.max(0, stockCheckData.stock_count - totalPiecesOrdered);
        await supabase
          .from('inventory')
          .update({ stock_count: newStockCount })
          .eq('item_name', 'Chewy Cookie');
      }
    } catch (e: any) {
      console.error('Submission Exception:', e);
      alert(`Error: ${e.message || 'Network error'}`);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setSubmitted(true);

    // Trigger confetti upon successful valid submission
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7aa0f0', '#ffb6b9', '#fdf8c3', '#e8d840']
    });
  };

  /* ── SUCCESS STATE (INVOICE) ── */
  if (submitted) {
    return (
      <div className="order-page fade-in">
        <div className="op-card">
          <div className="op-logo">
            <img src="/baked-by-logo.png" alt="BAKED BY" className="op-logo-img" />
          </div>
          <div className="success-state invoice-state">
            <h1 className="success-title">Order Summary</h1>
            <p className="success-msg">Please save or screenshot this for your records.</p>

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
                    {quantityBox4 > 0 && `Box of 4 x ${quantityBox4}`}
                    {quantityBox4 > 0 && (quantityBox6 > 0 || quantityBox12 > 0) && <br />}
                    {quantityBox6 > 0 && `Box of 6 x ${quantityBox6}`}
                    {quantityBox6 > 0 && quantityBox12 > 0 && <br />}
                    {quantityBox12 > 0 && `Box of 12 x ${quantityBox12}`}
                  </small>
                </span>
              </div>

              <div className="invoice-row">
                <span className="inv-label">Total Price:</span>
                <span className="inv-val price-highlight">₱{totalPrice.toLocaleString()}</span>
              </div>

              <div className="invoice-divider" />

              <div className="invoice-row">
                <span className="inv-label">Delivery:</span>
                <span className="inv-val" style={{ textAlign: 'right' }}>
                  {deliveryMode === 'meetup' ? 'Meet-up (La Salle Area Only)' : `Delivery via Maxim`}
                </span>
              </div>
              {deliveryMode === 'meetup' && (
                <>
                  <div className="invoice-row">
                    <span className="inv-label">Meet-up Time:</span>
                    <span className="inv-val">{meetupTime}</span>
                  </div>
                  <div className="invoice-col" style={{ marginTop: '4px' }}>
                    <span className="inv-val box-val" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
                      <strong>Meet Up Location:</strong> Gate 6 Canteen
                    </span>
                  </div>
                </>
              )}
              {deliveryMode === 'maxim' && (
                <>
                  <div className="invoice-row">
                    <span className="inv-label">Maxim Pick-up:</span>
                    <span className="inv-val">{meetupLocation === 'alijis' ? 'Alijis – Panaad' : 'La Salle'}</span>
                  </div>
                  <div className="invoice-row">
                    <span className="inv-label">Delivery Time:</span>
                    <span className="inv-val">{meetupTime}</span>
                  </div>
                  <div className="invoice-row">
                    <span className="inv-label">Address:</span>
                    <span className="inv-val">{maximAddress}</span>
                  </div>
                  <div className="invoice-row">
                    <span className="inv-label">Pin Point:</span>
                    <span className="inv-val">{maximScreenshot ? 'Uploaded' : 'No'}</span>
                  </div>
                </>
              )}

              <div className="invoice-row">
                <span className="inv-label">Payment:</span>
                <span className="inv-val" style={{ textTransform: 'capitalize' }}>{paymentMode}</span>
              </div>

              {paymentMode === 'gcash' && (
                <>
                  <div className="invoice-row">
                    <span className="inv-label">GCash Name:</span>
                    <span className="inv-val">{gcashName}</span>
                  </div>
                  <div className="invoice-row">
                    <span className="inv-label">GCash No.:</span>
                    <span className="inv-val">{gcashNumber}</span>
                  </div>
                  <div className="invoice-row">
                    <span className="inv-label">50% Downpayment:</span>
                    <span className="inv-val price-highlight">₱{downpaymentPrice.toLocaleString()}</span>
                  </div>
                  <div className="invoice-row">
                    <span className="inv-label">Receipt Sent:</span>
                    <span className="inv-val">{gcashScreenshot ? 'Yes' : 'No'}</span>
                  </div>
                </>
              )}

              {specialInstructions && (
                <>
                  <div className="invoice-divider" />
                  <div className="invoice-col">
                    <span className="inv-label">Special Instructions:</span>
                    <span className="inv-val box-val">{specialInstructions}</span>
                  </div>
                </>
              )}
            </div>

            <div className="invoice-footer">
              <p className="success-msg">Thank you for ordering with us!</p>
              <div className="form-submit-row" style={{ width: '100%' }}>
                <button className="place-order-btn place-order-btn-sm btn-secondary" onClick={() => setSubmitted(false)}>Back</button>
                <button className="place-order-btn place-order-btn-sm" onClick={onBack}>Finish</button>
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

        {/* Mini BAKED BY logo */}
        <div className="op-logo">
          <img src="/baked-by-logo.png" alt="BAKED BY" className="op-logo-img" />
        </div>

        {/* Product info with real cookie icon */}
        <div className="op-product-info">
          <img src="/cookie-icon.png" alt="cookie" className="op-cookie-icon" />
          <div>
            <div className="op-product-title">Dubai Chewy Chocolate Pre-Order</div>
            <div className="op-product-sub">Delivery Date: February 28, 2026</div>
            <div className="op-product-sub">Batch 4</div>
            <div className="op-product-price-list">
              ₱285 for Box of 4 • ₱425 for Box of 6 • ₱845 for Box of 12
            </div>
            <div className="op-product-limit-note">
              Limit: 2 boxes per customer (B4) • 2 boxes (B6) • 1 box (B12)
            </div>
          </div>
        </div>

        <form className="order-form" onSubmit={handleSubmit} noValidate>

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
            <label className="form-label" htmlFor="instagram">Instagram:</label>
            <div className="form-field">
              <input id="instagram" className={`form-input pill${errors.instagram ? ' err' : ''}`} type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="" />
              {errors.instagram && <span className="err-msg">{errors.instagram}</span>}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="form-section">
            <div className="form-section-title">Order Quantity:</div>
            {errors.quantity && <span className="err-msg">{errors.quantity}</span>}

            <div className="qty-row-item">
              <div className="qty-info">
                <span className="qty-label">Box of 4</span>
                <span className="qty-sub">Max 2 boxes</span>
              </div>
              <div className="qty-stepper">
                <button type="button" className="qty-btn" onClick={() => setQuantityBox4(Math.max(0, quantityBox4 - 1))}>−</button>
                <span className="qty-val">{quantityBox4}</span>
                <button type="button" className="qty-btn" onClick={() => setQuantityBox4(Math.min(2, quantityBox4 + 1))}>+</button>
              </div>
            </div>

            <div className="qty-row-item" style={{ marginTop: '10px' }}>
              <div className="qty-info">
                <span className="qty-label">Box of 6</span>
                <span className="qty-sub">Max 2 boxes</span>
              </div>
              <div className="qty-stepper">
                <button type="button" className="qty-btn" onClick={() => setQuantityBox6(Math.max(0, quantityBox6 - 1))}>−</button>
                <span className="qty-val">{quantityBox6}</span>
                <button type="button" className="qty-btn" onClick={() => setQuantityBox6(Math.min(2, quantityBox6 + 1))}>+</button>
              </div>
            </div>

            <div className="qty-row-item" style={{ marginTop: '10px' }}>
              <div className="qty-info">
                <span className="qty-label">Box of 12</span>
                <span className="qty-sub">Max 1 box</span>
              </div>
              <div className="qty-stepper">
                <button type="button" className="qty-btn" onClick={() => setQuantityBox12(Math.max(0, quantityBox12 - 1))}>−</button>
                <span className="qty-val">{quantityBox12}</span>
                <button type="button" className="qty-btn" onClick={() => setQuantityBox12(Math.min(1, quantityBox12 + 1))}>+</button>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="form-row">
            <div className="form-field">
              <div className="price-summary-box">
                <div className="price-row">
                  <span className="price-label">Total Price:</span>
                  <span className="price-value">₱{totalPrice.toLocaleString()}</span>
                </div>
                <div className="price-row">
                  <span className="price-label">50% Downpayment:</span>
                  <span className="price-value">₱{downpaymentPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode of Payment */}
          <div className="form-section">
            <div className="form-section-title">Mode of Payment:</div>
            {errors.paymentMode && <span className="err-msg">{errors.paymentMode}</span>}
            <div className="payment-option">
              <span className="payment-label">GCash</span>
              <input type="radio" id="pay-gcash" name="payment" checked={paymentMode === 'gcash'} onChange={() => setPaymentMode('gcash')} className="radio-inp" />
            </div>
            <div className="payment-option">
              <span className="payment-label">Cash</span>
              <input type="radio" id="pay-cash" name="payment" checked={paymentMode === 'cash'} onChange={() => setPaymentMode('cash')} className="radio-inp" />
            </div>
            <div className="cash-note" style={{ marginTop: '5px', padding: '8px 12px', fontSize: '0.75rem', color: '#dc2626', fontWeight: 700 }}>
              * A 50% downpayment is REQUIRED for all orders to confirm your slot.
            </div>
          </div>

          {/* Mode of Delivery */}
          <div className="form-section" style={{ marginTop: '9px' }}>
            <div className="form-section-title">Mode of Delivery:</div>
            {errors.deliveryMode && <span className="err-msg">{errors.deliveryMode}</span>}

            <div className="payment-option">
              <span className="payment-label" style={{ lineHeight: '1.4' }}>Meet-up (La Salle Area Only)</span>
              <input type="radio" id="del-meetup" name="delivery" checked={deliveryMode === 'meetup'} onChange={() => setDeliveryMode('meetup')} className="radio-inp" />
            </div>

            {deliveryMode === 'meetup' && (
              <div className="gcash-section" style={{ marginTop: '5px', padding: '11px' }}>
                <div className="form-section-title" style={{ marginBottom: '7px' }}>Availability Time:</div>
                {errors.meetupTime && <span className="err-msg" style={{ paddingLeft: '0' }}>{errors.meetupTime}</span>}
                <div className="payment-option">
                  <span className="payment-label">10am - 12pm</span>
                  <input type="radio" id="time-10-12" name="meetupTime" checked={meetupTime === '10am - 12pm'} onChange={() => setMeetupTime('10am - 12pm')} className="radio-inp" />
                </div>
                <div className="payment-option">
                  <span className="payment-label">3pm - 4pm</span>
                  <input type="radio" id="time-3-4" name="meetupTime" checked={meetupTime === '3pm - 4pm'} onChange={() => setMeetupTime('3pm - 4pm')} className="radio-inp" />
                </div>

                <div className="cash-note" style={{ marginTop: '11px', padding: '11px 15px' }}>
                  <p style={{ margin: '0', fontSize: '0.8rem', color: '#111' }}>
                    <strong>Note:</strong> Meet Up Location is in Gate 6 Canteen
                  </p>
                </div>
              </div>
            )}

            <div className="payment-option" style={{ marginTop: '5px' }}>
              <span className="payment-label" style={{ lineHeight: '1.4' }}>
                Delivery via Maxim<br />
                <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: '700' }}>
                  For Maxim Delivery: Fee varies by location (buyer shoulders).<br />
                  Please send: complete address, gate color, nearest landmark, map pin, and contact number. 🚚✨
                </span>
              </span>
              <input type="radio" id="del-maxim" name="delivery" checked={deliveryMode === 'maxim'} onChange={() => setDeliveryMode('maxim')} className="radio-inp" />
            </div>

            {deliveryMode === 'maxim' && (
              <div className="gcash-section" style={{ marginTop: '5px', padding: '11px' }}>
                <div className="form-section-title" style={{ marginBottom: '7px' }}>Preferred Pick-up Location:</div>
                {errors.meetupLocation && <span className="err-msg" style={{ paddingLeft: '0' }}>{errors.meetupLocation}</span>}
                <div className="payment-option">
                  <span className="payment-label" style={{ color: !isWeekend ? '#aaa' : 'inherit' }}>
                    Alijis – Panaad <br /><span style={{ fontSize: '0.72rem', fontWeight: '600', color: !isWeekend ? '#aaa' : '#555' }}>(Every Saturday Orders Only)</span>
                  </span>
                  <input type="radio" id="loc-alijis" name="meetupLoc" checked={meetupLocation === 'alijis'} onChange={() => setMeetupLocation('alijis')} className="radio-inp" disabled={!isWeekend} />
                </div>
                <div className="payment-option">
                  <span className="payment-label">La Salle</span>
                  <input type="radio" id="loc-lasalle" name="meetupLoc" checked={meetupLocation === 'lasalle'} onChange={() => setMeetupLocation('lasalle')} className="radio-inp" />
                </div>

                {/* Maxim Availability Time */}
                <div className="form-section-title" style={{ marginTop: '11px', marginBottom: '7px' }}>Delivery Time:</div>
                {errors.meetupTime && <span className="err-msg" style={{ paddingLeft: '0' }}>{errors.meetupTime}</span>}
                <div className="payment-option">
                  <span className="payment-label">10am - 12pm</span>
                  <input type="radio" id="m-time-10-12" name="maximTime" checked={meetupTime === '10am - 12pm'} onChange={() => setMeetupTime('10am - 12pm')} className="radio-inp" />
                </div>
                <div className="payment-option">
                  <span className="payment-label">3pm - 4pm</span>
                  <input type="radio" id="m-time-3-4" name="maximTime" checked={meetupTime === '3pm - 4pm'} onChange={() => setMeetupTime('3pm - 4pm')} className="radio-inp" />
                </div>

                <div className="form-row" style={{ marginTop: '11px' }}>
                  <label className="form-label" style={{ minWidth: '88px', textAlign: 'left' }}>Exact Address:</label>
                  <div className="form-field">
                    <input className={`form-input pill${errors.maximAddress ? ' err' : ''}`} type="text" value={maximAddress} onChange={e => setMaximAddress(e.target.value)} placeholder="Full delivery address" />
                    {errors.maximAddress && <span className="err-msg">{errors.maximAddress}</span>}
                  </div>
                </div>

                <div className="form-row form-row-top" style={{ marginTop: '7px' }}>
                  <label className="form-label form-label-top" style={{ minWidth: '88px', textAlign: 'left' }}>Pin Point<br />Screenshot<br /><span style={{ fontSize: '0.72rem', fontWeight: '600' }}>(In Maxim App)</span>:</label>
                  <div className="form-field">
                    <div className={`upload-box${errors.maximScreenshot ? ' err' : ''}`} onClick={() => maximFileInputRef.current?.click()}>
                      {maximScreenshot
                        ? <span className="upload-done">✅ {maximScreenshot.name}</span>
                        : <span className="upload-hint">📎 Click to upload pinpoint</span>}
                    </div>
                    <input ref={maximFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMaximFileChange} />
                    {errors.maximScreenshot && <span className="err-msg">{errors.maximScreenshot}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Acknowledgement checkbox — always visible */}
          <div className="checkbox-row">
            <input type="checkbox" id="understood" checked={understood} onChange={e => setUnderstood(e.target.checked)} className="checkbox-inp" />
            <label htmlFor="understood" className="checkbox-label">
              I understand that my order is only confirmed once the 50% downpayment is sent. <strong>The Downpayment is NON-REFUNDABLE.</strong>
            </label>
          </div>
          {errors.understood && <span className="err-msg">{errors.understood}</span>}

          {/* GCash extra fields — Always required if payment mode is selected */}
          {paymentMode !== '' && (
            <div className="gcash-section">
              <div className="form-row">
                <label className="form-label" htmlFor="gcashName">GCash Name:</label>
                <div className="form-field">
                  <input id="gcashName" className={`form-input pill${errors.gcashName ? ' err' : ''}`} type="text" value={gcashName} onChange={e => setGcashName(e.target.value)} placeholder="Name on GCash account" />
                  {errors.gcashName && <span className="err-msg">{errors.gcashName}</span>}
                </div>
              </div>
              <div className="form-row">
                <label className="form-label" htmlFor="gcashNumber">GCash Number:</label>
                <div className="form-field">
                  <input
                    id="gcashNumber"
                    className={`form-input pill${errors.gcashNumber ? ' err' : ''}`}
                    type="tel"
                    value={gcashNumber}
                    onChange={handleGcashPhoneChange}
                    placeholder="09XX XXX XXXX"
                    maxLength={13}
                  />
                  {errors.gcashNumber && <span className="err-msg">{errors.gcashNumber}</span>}
                </div>
              </div>
              <div className="form-row form-row-top">
                <label className="form-label form-label-top">Upload Receipt<br />Screenshot:</label>
                <div className="form-field">
                  <div className={`upload-box${errors.gcashScreenshot ? ' err' : ''}`} onClick={() => fileInputRef.current?.click()}>
                    {gcashScreenshot
                      ? <span className="upload-done">✅ {gcashScreenshot.name}</span>
                      : <span className="upload-hint">📎 Click to upload screenshot</span>}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} id="gcashScreenshot" />
                  {errors.gcashScreenshot && <span className="err-msg">{errors.gcashScreenshot}</span>}
                </div>
              </div>

              <div className="gcash-payment-card">
                <div className="gcash-card-header">
                  <span className="gcash-card-title">Send Payment to:</span>
                </div>

                <div className="gcash-detail-row">
                  <div className="gcash-info">
                    <span className="gcash-label">GCash Name</span>
                    <span className="gcash-value">Elaisha Faith M.</span>
                  </div>
                </div>

                <div className="gcash-detail-row">
                  <div className="gcash-info">
                    <span className="gcash-label">GCash Number</span>
                    <span className="gcash-value">0906 065 9030</span>
                  </div>
                  <button
                    type="button"
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText('09060659030');
                      alert('GCash number copied! 📋');
                    }}
                  >
                    Copy
                  </button>
                </div>

                <div className="gcash-launch-container">
                  <a
                    href="gcash://"
                    className="launch-gcash-btn"
                  >
                    <span>Launch GCash App</span>
                    <span>🚀</span>
                  </a>

                  <div className="gcash-steps">
                    1. <strong>Copy</strong> the GCash number.<br />
                    2. Tap <strong>Launch GCash</strong> to open your app.<br />
                    3. <strong>Paste</strong> and send the exact downpayment: <strong>₱{downpaymentPrice.toLocaleString()}</strong>.
                  </div>
                </div>
              </div>

              <div className="gcash-qr-container" style={{ marginTop: '15px' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', color: '#555' }}>...or scan our QR code:</p>
                <img src="/gcash-qr.jpg" alt="GCash QR Code" className="gcash-qr-image" />
              </div>
            </div>
          )}

          {/* Special Instructions — bordered box */}
          <div className="form-section">
            <label className="form-section-title" htmlFor="specialInstructions">Special Instructions:</label>
            <textarea id="specialInstructions" className="form-textarea" value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} rows={5} placeholder="" />
          </div>

          {/* Submit */}
          <div className="form-submit-row">
            <button type="button" className="place-order-btn place-order-btn-sm btn-secondary" onClick={onBack} disabled={isSubmitting}>Back</button>
            <button type="submit" className="place-order-btn place-order-btn-sm" disabled={isSubmitting || currentStock === 0}>
              {isSubmitting ? 'Submitting...' : currentStock === 0 ? 'Sold Out' : 'Place Order!'}
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
function AdminDashboard({ onLogout, onBack }: { onLogout: () => void; onBack: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState<number>(0);
  const [updatingStock, setUpdatingStock] = useState(false);
  const [showToCollect, setShowToCollect] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeliveryList, setShowDeliveryList] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterDelivery, setFilterDelivery] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchOrders();
    fetchStock();
  }, []);

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
    const { data } = await supabase
      .from('inventory')
      .select('stock_count')
      .eq('item_name', 'Chewy Cookie')
      .single();
    if (data) setStock(data.stock_count);
  };

  const updateStock = async (newStock: number) => {
    setUpdatingStock(true);
    const { error } = await supabase
      .from('inventory')
      .update({ stock_count: newStock })
      .eq('item_name', 'Chewy Cookie');
    if (!error) setStock(newStock);
    setUpdatingStock(false);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);

    try {
      // 1. Calculate cookies to return
      let cookiesToReturn = 0;
      const typeVal = orderToDelete.quantity_type || '';
      if (typeVal.includes('Box4:')) {
        const parts = typeVal.split(', ');
        const b4 = parseInt(parts[0].split(': ')[1]) || 0;
        const b6 = parseInt(parts[1].split(': ')[1]) || 0;
        const b12 = parts[2] ? parseInt(parts[2].split(': ')[1]) : 0;
        cookiesToReturn = (b4 * 4) + (b6 * 6) + (b12 * 12);
      } else {
        const multiplier = orderToDelete.quantity_type === 'box-of-4' ? 4 : 6;
        cookiesToReturn = multiplier * (orderToDelete.quantity || 1);
      }

      // 2. Return to inventory
      const { data: stockData } = await supabase
        .from('inventory')
        .select('stock_count')
        .eq('item_name', 'Chewy Cookie')
        .single();

      if (stockData) {
        await supabase
          .from('inventory')
          .update({ stock_count: stockData.stock_count + cookiesToReturn })
          .eq('item_name', 'Chewy Cookie');
      }

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
      alert(`Order deleted and ${cookiesToReturn} cookies returned to stock.`);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert('Error deleting order: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = orders.map(order => ({
      'Date': new Date(order.created_at).toLocaleDateString(),
      'Customer Name': order.full_name,
      'Contact Number': order.contact_number,
      'Instagram': order.instagram || 'N/A',
      'Order Type': order.quantity_type,
      'Quantity': order.quantity,
      'Total Price': order.total_price,
      'Downpayment': order.downpayment_price,
      'Payment Mode': order.payment_mode,
      'Delivery Mode': order.delivery_mode,
      'Meetup Location': order.meetup_location === 'alijis' ? 'Alijis' : 'La Salle',
      'Meetup Time': order.meetup_time,
      'Maxim Address': order.maxim_address || 'N/A',
      'Special Instructions': order.special_instructions || 'N/A',
      'GCash Name': order.gcash_name || 'N/A',
      'GCash Number': order.gcash_number || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, `BakedBy_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getMediaUrl = (path: string | null) => {
    if (!path) return null;
    const { data } = supabase.storage.from('receipts').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDownloadImage = async (path: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('receipts').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download image');
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

    return matchesSearch && matchesPayment && matchesDelivery && matchesStatus;
  }).sort((a, b) => {
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
            <h1 className="admin-title">Admin Panel</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="place-order-btn place-order-btn-sm btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 15px' }} onClick={onBack}>Back to Site</button>
            <button className="place-order-btn place-order-btn-sm btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 15px' }} onClick={handleExportExcel}>Export Excel</button>
            <button className="place-order-btn place-order-btn-sm btn-secondary" style={{ fontSize: '0.82rem', padding: '6px 15px' }} onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>

      <div className="admin-content">
        {/* 1. Production Summary Card */}
        <div className="production-summary-card fade-in">
          {(() => {
            let b4 = 0, b6 = 0, b12 = 0;
            orders.forEach(o => {
              const typeVal = o.quantity_type || '';
              if (typeVal.includes('Box4:')) {
                const parts = typeVal.split(', ');
                b4 += parseInt(parts[0].split(': ')[1]) || 0;
                b6 += parseInt(parts[1].split(': ')[1]) || 0;
                b12 += parts[2] ? parseInt(parts[2].split(': ')[1]) : 0;
              }
            });
            const totalCookies = (b4 * 4) + (b6 * 6) + (b12 * 12);
            return (
              <>
                <div className="prod-item">
                  <span className="prod-label">Prep Box of 4</span>
                  <span className="prod-val">{b4}</span>
                </div>
                <div className="prod-item">
                  <span className="prod-label">Prep Box of 6</span>
                  <span className="prod-val">{b6}</span>
                </div>
                <div className="prod-item">
                  <span className="prod-label">Prep Box of 12</span>
                  <span className="prod-val">{b12}</span>
                </div>
                <div className="prod-item prod-total-box">
                  <span className="prod-label">Total Baking Goal</span>
                  <span className="prod-val" style={{ color: '#fbbf24' }}>{totalCookies} 🍪</span>
                </div>
              </>
            );
          })()}
        </div>

        <div className="admin-highlight-row">
          <div className="admin-stat-card admin-stat-card-sparkle">
            <h3>Total Gross Revenue</h3>
            <div className="admin-stat-val sparkle-text">
              ₱{orders.reduce((acc, o) => acc + o.total_price, 0).toLocaleString()}
            </div>
            <p className="admin-stat-sub">Overall value of all pre-orders</p>
          </div>
        </div>

        <div className="admin-stats-row">
          <div className="admin-stat-card">
            <h3>Live Stock</h3>
            <div className="admin-stock-control">
              <button className="qty-btn" onClick={() => updateStock(stock - 1)} disabled={updatingStock}>−</button>
              <span className="qty-val" style={{ fontSize: '1.5rem' }}>{stock}</span>
              <button className="qty-btn" onClick={() => updateStock(stock + 1)} disabled={updatingStock}>+</button>
            </div>
            <p className="admin-stat-sub">Chewy Cookies available</p>
          </div>
          <div className="admin-stat-card">
            <h3>Total Orders</h3>
            <div className="admin-stat-val">{orders.length}</div>
            <p className="admin-stat-sub">Recent orders in the system</p>
          </div>
          <div className="admin-stat-card">
            <h3 style={{ color: '#10b981' }}>Total Received</h3>
            <div className="admin-stat-val" style={{ color: '#10b981' }}>
              ₱{orders.reduce((acc, o) => {
                if (o.is_paid) return acc + o.total_price;
                if (o.payment_mode === 'gcash') return acc + o.downpayment_price;
                return acc;
              }, 0).toLocaleString()}
            </div>
            <p className="admin-stat-sub">Money already in hand</p>
          </div>
          <div className="admin-stat-card clickable" onClick={() => setShowToCollect(true)}>
            <h3 style={{ color: '#6366f1' }}>To be Received</h3>
            <div className="admin-stat-val" style={{ color: '#6366f1' }}>
              ₱{orders.reduce((acc, o) => {
                if (o.is_paid) return acc;
                const pending = o.payment_mode === 'gcash' ? (o.total_price - o.downpayment_price) : o.total_price;
                return acc + pending;
              }, 0).toLocaleString()}
            </div>
            <p className="admin-stat-sub">Remaining balance to collect (Click to view)</p>
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
                          <span className="pi-val">₱{order.payment_mode === 'gcash' ? (order.total_price - order.downpayment_price) : order.total_price}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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

                  {/* MEETUP SECTION */}
                  <div className="delivery-section-box">
                    <h3 className="delivery-section-title">🤝 La Salle Meetup</h3>

                    {['10am - 12pm', '3pm - 4pm'].map(timeSlot => (
                      <div className="delivery-time-block" key={timeSlot}>
                        <h4>{timeSlot === '10am - 12pm' ? '10:00 AM - 12:00 PM' : '3:00 PM - 4:00 PM'}</h4>
                        <div className="delivery-grid">
                          {orders.filter(o => o.delivery_mode === 'meetup' && o.meetup_time === timeSlot).length === 0 ? (
                            <p className="no-data">No meetups at this time.</p>
                          ) : (
                            orders.filter(o => o.delivery_mode === 'meetup' && o.meetup_time === timeSlot).map(o => (
                              <div key={o.id} className="delivery-card">
                                <div className="dc-header">
                                  <strong>{o.full_name}</strong>
                                  <span>{o.contact_number}</span>
                                </div>
                                <div className="dc-body">
                                  <div style={{ marginTop: '5px' }}>
                                    {o.instagram && (
                                      <a
                                        href={`https://www.instagram.com/${o.instagram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="chat-link"
                                        style={{ fontSize: '0.8rem' }}
                                      >
                                        📸 @{o.instagram.replace('@', '')}
                                      </a>
                                    )}
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
                                        <option value="Baking">Baking</option>
                                        <option value="Ready">Ready</option>
                                        <option value="Delivered">Delivered</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="dc-info-row">
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span className="pi-label">{o.payment_mode === 'gcash' ? 'GCash 50%' : 'Cash'}</span>
                                      {!o.is_paid && o.payment_mode === 'gcash' && (
                                        <span className="dc-balance">Bal: ₱{o.total_price - o.downpayment_price}</span>
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

                                  <div className="dc-screenshots">
                                    {o.gcash_screenshot_path && <a href={getMediaUrl(o.gcash_screenshot_path) || '#'} target="_blank" rel="noreferrer" className="dc-link">Receipt</a>}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* MAXIM SECTION */}
                  <div className="delivery-section-box" style={{ marginTop: '30px' }}>
                    <h3 className="delivery-section-title">🚚 Maxim Delivery</h3>

                    {['10am - 12pm', '3pm - 4pm'].map(timeSlot => (
                      <div className="delivery-time-block" key={timeSlot}>
                        <h4>{timeSlot === '10am - 12pm' ? '10:00 AM - 12:00 PM' : '3:00 PM - 4:00 PM'}</h4>
                        <div className="delivery-grid">
                          {orders.filter(o => o.delivery_mode === 'maxim' && o.meetup_time === timeSlot).length === 0 ? (
                            <p className="no-data">No deliveries at this time.</p>
                          ) : (
                            orders.filter(o => o.delivery_mode === 'maxim' && o.meetup_time === timeSlot).map(o => (
                              <div key={o.id} className="delivery-card dc-maxim">
                                <div className="dc-header">
                                  <strong>{o.full_name}</strong>
                                  <span>{o.contact_number}</span>
                                </div>
                                <div className="dc-body">
                                  <div className="dc-addr">📍 {o.maxim_address || 'No address'}</div>
                                  <div style={{ marginTop: '5px' }}>
                                    {o.instagram && (
                                      <a
                                        href={`https://www.instagram.com/${o.instagram.replace('@', '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="chat-link"
                                        style={{ fontSize: '0.8rem' }}
                                      >
                                        📸 @{o.instagram.replace('@', '')}
                                      </a>
                                    )}
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
                                        <option value="Baking">Baking</option>
                                        <option value="Ready">Ready</option>
                                        <option value="Delivered">Delivered</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="dc-info-row">
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span className="pi-label">{o.payment_mode === 'gcash' ? 'GCash 50%' : 'Cash'}</span>
                                      {!o.is_paid && o.payment_mode === 'gcash' && (
                                        <span className="dc-balance">Bal: ₱{o.total_price - o.downpayment_price}</span>
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

                                  <div className="dc-screenshots">
                                    {o.gcash_screenshot_path && <a href={getMediaUrl(o.gcash_screenshot_path) || '#'} target="_blank" rel="noreferrer" className="dc-link">Receipt</a>}
                                    {o.maxim_screenshot_path && <a href={getMediaUrl(o.maxim_screenshot_path) || '#'} target="_blank" rel="noreferrer" className="dc-link dc-link-pin">Pin Point</a>}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

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

        <div className="admin-controls-row">
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

        <div className="admin-table-container">
          <div className="admin-table-header">
            <h2>Recent Orders</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="place-order-btn place-order-btn-sm btn-purple" style={{ fontSize: '0.8rem', padding: '6px 15px' }} onClick={() => setShowDeliveryList(true)}>Delivery List</button>
              <button className="place-order-btn place-order-btn-sm" style={{ fontSize: '0.8rem', padding: '6px 15px' }} onClick={fetchOrders}>Refresh</button>
            </div>
          </div>
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="sortable-th" onClick={() => { setSortKey('created_at'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Date {sortKey === 'created_at' && <span className="sort-icon active">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th className="sortable-th" onClick={() => { setSortKey('full_name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Customer {sortKey === 'full_name' && <span className="sort-icon active">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th className="sortable-th">Order Details</th>
                  <th className="sortable-th" onClick={() => { setSortKey('delivery_mode'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Delivery {sortKey === 'delivery_mode' && <span className="sort-icon active">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th className="sortable-th">Payment</th>
                  <th>GCash Info</th>
                  <th className="sortable-th" onClick={() => { setSortKey('status'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Status {sortKey === 'status' && <span className="sort-icon active">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th>Screenshots</th>
                  <th className="sortable-th" onClick={() => { setSortKey('total_price'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                    Total {sortKey === 'total_price' && <span className="sort-icon active">{sortOrder === 'asc' ? '▲' : '▼'}</span>}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '40px' }}>Loading orders...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '40px' }}>No orders matching your criteria</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>
                        <strong>{order.full_name}</strong><br />
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>{order.contact_number}</span>
                        <br />
                        {order.instagram && (
                          <a
                            href={`https://www.instagram.com/${order.instagram.replace('@', '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="chat-link"
                          >
                            📸 @{order.instagram.replace('@', '')}
                          </a>
                        )}
                      </td>
                      <td>
                        {(() => {
                          const typeVal = order.quantity_type || '';
                          if (typeVal.includes('Box4:')) {
                            const parts = typeVal.split(', ');
                            const b4 = parseInt(parts[0].split(': ')[1]);
                            const b6 = parseInt(parts[1].split(': ')[1]);
                            const b12 = parts[2] ? parseInt(parts[2].split(': ')[1]) : 0;
                            const totalCookies = (b4 * 4) + (b6 * 6) + (b12 * 12);
                            return (
                              <>
                                {b4 > 0 && <div><strong>Box of 4 x {b4}</strong></div>}
                                {b6 > 0 && <div><strong>Box of 6 x {b6}</strong></div>}
                                {b12 > 0 && <div><strong>Box of 12 x {b12}</strong></div>}
                                <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 700 }}>
                                  ↳ {totalCookies} Total Cookies
                                </span>
                              </>
                            );
                          }
                          const multiplier = order.quantity_type === 'box-of-4' ? 4 : 6;
                          const typeLabel = order.quantity_type === 'box-of-4' ? 'Box of 4' : 'Box of 6';
                          return (
                            <>
                              <strong>{typeLabel} x {order.quantity}</strong><br />
                              <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 700 }}>
                                ↳ {multiplier * order.quantity} Total Cookies
                              </span>
                            </>
                          );
                        })()}
                        <br />
                        {order.special_instructions && (
                          <span
                            className="admin-note clickable"
                            title="Click to view full note"
                            onClick={() => setSelectedNote(order.special_instructions)}
                            style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'underline', fontSize: '0.85rem' }}
                          >
                            Note: {order.special_instructions.length > 20 ? order.special_instructions.substring(0, 20) + '...' : order.special_instructions}
                          </span>
                        )}
                      </td>
                      <td>
                        {order.delivery_mode === 'meetup' ? 'Meetup' : 'Maxim'}<br />
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>{order.meetup_time}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem' }}>{order.payment_mode}</span>
                          {order.payment_mode === 'gcash' ? (
                            <>
                              <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>50% Paid</span>
                              {!order.is_paid && (
                                <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                                  Balance: ₱{order.total_price - order.downpayment_price}
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: order.is_paid ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                              {order.is_paid ? 'Paid' : 'Pending Cash'}
                            </span>
                          )}

                          <div className="admin-pay-toggle">
                            <label className="switch">
                              <input
                                type="checkbox"
                                checked={!!order.is_paid}
                                onChange={async () => {
                                  const { error } = await supabase
                                    .from('orders')
                                    .update({ is_paid: !order.is_paid })
                                    .eq('id', order.id);
                                  if (!error) fetchOrders();
                                }}
                              />
                              <span className="slider round"></span>
                            </label>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{order.is_paid ? 'Paid' : 'Mark Paid'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
                          <strong>{order.gcash_name || '-'}</strong>
                          <span style={{ color: '#666' }}>{order.gcash_number || '-'}</span>
                        </div>
                      </td>
                      <td>
                        <div className={`status-badge status-${(order.status || 'Pending').toLowerCase()}`}>
                          <select
                            className="status-select"
                            value={order.status || 'Pending'}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              // Update locally first
                              setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                              // Update DB
                              await supabase.from('orders').update({ status: newStatus }).eq('id', order.id);
                            }}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Baking">Baking</option>
                            <option value="Ready">Ready</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="admin-screenshots-cell">
                          {order.gcash_screenshot_path && (
                            <div className="screenshot-actions">
                              <span className="screenshot-label">Receipt:</span>
                              <a href={getMediaUrl(order.gcash_screenshot_path) || '#'} target="_blank" rel="noreferrer" className="admin-action-link">View</a>
                              <button onClick={() => handleDownloadImage(order.gcash_screenshot_path, `receipt_${order.full_name}.png`)} className="admin-action-btn">Save</button>
                            </div>
                          )}
                          {order.maxim_screenshot_path && (
                            <div className="screenshot-actions">
                              <span className="screenshot-label">Pin Point:</span>
                              <a href={getMediaUrl(order.maxim_screenshot_path) || '#'} target="_blank" rel="noreferrer" className="admin-action-link">View</a>
                              <button onClick={() => handleDownloadImage(order.maxim_screenshot_path, `pinpoint_${order.full_name}.png`)} className="admin-action-btn">Save</button>
                            </div>
                          )}
                          {!order.gcash_screenshot_path && !order.maxim_screenshot_path && <span style={{ color: '#94a3b8' }}>None</span>}
                        </div>
                      </td>
                      <td><strong>₱{order.total_price}</strong></td>
                      <td>
                        <button
                          className="admin-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Delete icon clicked for order:', order.id);
                            setOrderToDelete(order);
                          }}
                          title="Delete Order"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}





/* ═══════════════════════════════════════
   MAINTENANCE / COUNTDOWN PAGE
═══════════════════════════════════════ */
function MaintenancePage({ onUnlock }: { onUnlock: (pass: string) => void }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });
  const [showBypass, setShowBypass] = useState(false);
  const [bypassPass, setBypassPass] = useState('');
  const TARGET_DATE = new Date('2026-02-26T19:00:00+08:00');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = TARGET_DATE.getTime() - now;

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
      if (TARGET_DATE.getTime() - now < 0) {
        clearInterval(timer);
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="maintenance-page">
      <div className="maintenance-container">
        <div className="maintenance-logo-wrapper">
          <img src="/baked-by-logo.png" alt="Baked By Logo" className="maintenance-logo" />
        </div>
        <h1 className="maintenance-title">Something Sweet is Coming!</h1>
        <p className="maintenance-subtitle">
          Our preorder forms for Dubai Chewy Cookie will open on February 26 at 7:00 PM
          <span className="highlight-text">THURSDAY</span>
        </p>

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

        <div className="maintenance-footer">
          Baked with love in Bacolod City
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
  const [isLocked, setIsLocked] = useState(true);
  const [bypassLocked, setBypassLocked] = useState(false);
  const [stock, setStock] = useState<number | null>(null);
  const [stockLoading, setStockLoading] = useState(true);
  const TARGET_DATE = new Date('2026-02-26T19:00:00+08:00');

  const fetchStock = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('stock_count')
        .eq('item_name', 'Chewy Cookie')
        .single();
      if (!error && data) setStock(data.stock_count);
      else if (error) console.error("Stock error:", error);
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
    const stockInterval = setInterval(fetchStock, 30000); // Poll every 30s
    const checkTime = () => {
      const now = new Date().getTime();
      setIsLocked(now < TARGET_DATE.getTime());
    };

    checkTime();
    const interval = setInterval(checkTime, 10000); // Check every 10s

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
      clearInterval(interval);
      clearInterval(stockInterval);
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

  // If locked, only allow admin pages or if bypassed
  const showLocked = isLocked && !bypassLocked && page !== 'admin-login' && page !== 'admin-dashboard';

  if (showLocked) {
    return <MaintenancePage onUnlock={handleUnlock} />;
  }

  return (
    <>
      {page === 'home' && <HomePage stock={stock} stockLoading={stockLoading} onOrderClick={() => setPage('order')} onAdminClick={() => setPage('admin-login')} />}
      {page === 'order' && <OrderPage currentStock={stock} onBack={() => setPage('home')} />}
      {page === 'admin-login' && <AdminLogin onLogin={() => setPage('admin-dashboard')} onBack={() => setPage('home')} />}
      {page === 'admin-dashboard' && <AdminDashboard onLogout={() => setPage('admin-login')} onBack={() => setPage('home')} />}
    </>
  );
}


