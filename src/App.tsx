import { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import './App.css';

type Page = 'home' | 'order' | 'admin-login' | 'admin-dashboard';
type PaymentMode = 'gcash' | 'cash' | '';
type DeliveryMode = 'meetup' | 'maxim' | '';
type MeetupLocation = 'rolling-hills' | 'lasalle' | '';
type MeetupTime = '10am - 12pm' | '3pm - 4pm' | '';




const FAQS = [
  { q: "How do I order?", a: "When preorders open, we post the order form link on our page and story. Slots are limited per batch and are available on a first come, first served basis. Once the form is closed, we no longer accept orders" },
  { q: "Can I order for today or tomorrow?", a: "We only accept PREORDERS. Same day or next day orders are not available. Delivery dates for each batch are announced in our posts along with a notice or teaser before opening." },
  { q: "Are you still available? Do you accept orders?", a: "If slots are posted on our page as SOLD OUT or the forms are closed, we no longer accept orders for that batch. Please follow our page and check our posts or bio for updates on preorder availability and the next preorder schedule." },
  { q: "When will you be available again?", a: "We post preorder schedules weekly on our page, along with a notice a few days before opening slots. Follow our page to stay updated." },
  { q: "Who is your courier? How much is the delivery fee and who shoulders it?", a: "Delivery fees for non meetup orders vary depending on your location. We use Maxim as our courier, pickup basis is either Lasalle or Rolling Hills. Maxim orders will be booked by us, and the delivery fee will be shouldered by the buyer." },
  { q: "What are your payment methods?", a: "We accept cash and GCash. A minimum of 50% nonrefundable downpayment is required to secure your slot and avoid bogus orders." },
  { q: "Where are you located? What is your mode of delivery?", a: "We are located in Bacolod City.\n• Via Maxim: Rolling Hills (Estefania) or La Salle area\n• Meetups: La Salle area only" },
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
  const [paymentOption, setPaymentOption] = useState<'down' | 'full'>('down');

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


  const [meetupLocation, setMeetupLocation] = useState<MeetupLocation>('');
  const [meetupTime, setMeetupTime] = useState<MeetupTime>('');
  const [maximAddress, setMaximAddress] = useState('');
  const [maximDetails, setMaximDetails] = useState('');
  const [maximScreenshot, setMaximScreenshot] = useState<File | null>(null);

  const [gcashName, setGcashName] = useState('');
  const [gcashNumber, setGcashNumber] = useState('');
  const [gcashScreenshot, setGcashScreenshot] = useState<File | null>(null);

  const handleGcashPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGcashNumber(formatPhoneNumber(e.target.value));
  };
  const [understood, setUnderstood] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maximFileInputRef = useRef<HTMLInputElement>(null);




  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setGcashScreenshot(e.target.files[0]);
  };

  const handleMaximFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setMaximScreenshot(e.target.files[0]);
  };

  const totalPrice = (quantityBox4 * 285) + (quantityBox6 * 425) + (quantityBox12 * 845);
  const downpaymentPrice = paymentOption === 'full' ? totalPrice : Math.round(totalPrice * 0.5);

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
    if (!gcashName.trim()) errs.gcashName = 'GCash Sender Name is required.';
    if (!gcashNumber.trim()) errs.gcashNumber = 'GCash Number is required.';
    if (!gcashScreenshot) errs.gcashScreenshot = 'Please upload your receipt screenshot.';
    if (!understood) errs.understood = 'Please tick the acknowledgement checkbox.';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
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
    setSubmitted(true);
  };

  const handleConfirmOrder = async () => {
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
          maxim_address: maximAddress + (maximDetails ? ` (Additional: ${maximDetails})` : ''),
          maxim_screenshot_path: uploadedMaximScreenshotPath,
          gcash_name: gcashName,
          gcash_number: gcashNumber.replace(/\s/g, ''),
          gcash_screenshot_path: uploadedGcashScreenshotPath,
          is_paid: paymentOption === 'full',
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
    setIsConfirmed(true);

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
    if (isConfirmed) {
      return (
        <div className="order-page fade-in">
          <div className="op-card" style={{ textAlign: 'center', padding: '50px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src="/baked-by-logo.png" alt="BAKED BY" style={{ width: '130px', marginBottom: '20px' }} />
            <span style={{ fontSize: '3.5rem', marginBottom: '10px' }}>✅</span>
            <h2 className="success-header" style={{ fontSize: '2.5rem', color: '#10b981', fontFamily: 'Patrick Hand', marginBottom: '10px' }}>Order Submitted!</h2>
            <p className="success-msg" style={{ fontSize: '1.2rem', color: '#475569', lineHeight: '1.5', marginBottom: '30px', fontWeight: 600 }}>
              Thank you for ordering with us! <br />We have officially received your order and we'll start baking soon!
            </p>
            <button className="place-order-btn place-order-btn-sm" onClick={onBack} style={{ minWidth: '200px' }}>Return Home</button>
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
                      <strong>Meet Up Location:</strong> USLS Gate 6 Canteen
                    </span>
                  </div>
                </>
              )}
              {deliveryMode === 'maxim' && (
                <>
                  <div className="invoice-row">
                    <span className="inv-label">Maxim Pick-up:</span>
                    <span className="inv-val">{meetupLocation === 'rolling-hills' ? 'Rolling Hills (Estefania)' : 'La Salle'}</span>
                  </div>
                  <div className="invoice-row">
                    <span className="inv-label">Delivery Time:</span>
                    <span className="inv-val">{meetupTime}</span>
                  </div>
                  <div className="invoice-row">
                    <span className="inv-label">Address:</span>
                    <span className="inv-val">{maximAddress}{maximDetails ? ` (Additional: ${maximDetails})` : ''}</span>
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

              {paymentMode !== '' && (
                <>
                  <div className="invoice-row">
                    <span className="inv-label">{paymentOption === 'full' ? 'Amount Settled:' : '50% Downpayment:'}</span>
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
              <div className="form-submit-row" style={{ width: '100%' }}>
                <button className="place-order-btn place-order-btn-sm btn-secondary" disabled={isSubmitting} onClick={() => setSubmitted(false)}>Back to Form</button>
                <button className="place-order-btn place-order-btn-sm" disabled={isSubmitting} onClick={handleConfirmOrder}>
                  {isSubmitting ? 'Confirming...' : 'Confirm Order'}
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

          {/* Customer Details */}
          <div className="form-section">
            <div className="form-section-title">Customer Details:</div>

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
            <div className="form-section-title" id="quantity">Order Quantity:</div>
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



          {/* Service Mode — Smart Toggle */}
          {totalPrice > 0 && (
            <div className="form-section fade-in">
              <div className="form-section-title" id="deliveryMode">How should we get it to you?</div>
              {errors.deliveryMode && <span className="err-msg">{errors.deliveryMode}</span>}

              <div className="service-mode-grid">
                <div className={`svc-opt ${deliveryMode === 'meetup' && paymentMode === 'cash' ? 'active' : ''}`}
                  onClick={() => { setDeliveryMode('meetup'); setPaymentMode('cash'); setPaymentOption('down'); }}>
                  <div className="svc-header">🤝 Meetup + Cash</div>
                  <div className="svc-desc">Pay 50% DP (GCash) now, cash balance on meetup.</div>
                </div>
                <div className={`svc-opt ${deliveryMode === 'meetup' && paymentMode === 'gcash' ? 'active' : ''}`}
                  onClick={() => { setDeliveryMode('meetup'); setPaymentMode('gcash'); setPaymentOption('full'); }}>
                  <div className="svc-header">🤝 Meetup + GCash</div>
                  <div className="svc-desc">Pay 100% via GCash upfront. Used for convenience!</div>
                </div>
                <div className={`svc-opt ${deliveryMode === 'maxim' ? 'active' : ''}`}
                  onClick={() => { setDeliveryMode('maxim'); setPaymentMode('gcash'); }}>
                  <div className="svc-header">🚚 Maxim Delivery</div>
                  <div className="svc-desc">Buyer shoulders fee. GCash Payment only.</div>
                </div>
              </div>

              {/* Meetup time sub-section */}
              {deliveryMode === 'meetup' && (
                <div className="sub-section fade-in" style={{ marginTop: '12px' }} id="meetupTime">
                  <div className="form-section-title" style={{ marginBottom: '7px' }}>Pick-up Time (USLS Gate 6 Canteen):</div>
                  {errors.meetupTime && <span className="err-msg">{errors.meetupTime}</span>}
                  <div className="payment-option">
                    <span className="payment-label">10am – 12pm</span>
                    <input type="radio" name="meetupTime" checked={meetupTime === '10am - 12pm'} onChange={() => setMeetupTime('10am - 12pm')} className="radio-inp" />
                  </div>
                  <div className="payment-option" style={{ marginTop: '5px' }}>
                    <span className="payment-label">3pm – 4pm</span>
                    <input type="radio" name="meetupTime" checked={meetupTime === '3pm - 4pm'} onChange={() => setMeetupTime('3pm - 4pm')} className="radio-inp" />
                  </div>
                </div>
              )}

              {/* Maxim delivery sub-section */}
              {deliveryMode === 'maxim' && (
                <div className="sub-section fade-in" style={{ marginTop: '12px' }}>
                  <div className="form-section-title" style={{ marginBottom: '7px' }}>Maxim Delivery Details:</div>
                  {errors.meetupLocation && <span className="err-msg">{errors.meetupLocation}</span>}
                  <select id="meetupLocation" className="form-input pill" value={meetupLocation} onChange={e => setMeetupLocation(e.target.value as MeetupLocation)} style={{ marginBottom: '8px' }}>
                    <option value="">-- Choose Pickup Location --</option>
                    <option value="rolling-hills">Rolling Hills (Estefania)</option>
                    <option value="lasalle">La Salle Area</option>
                  </select>
                  {errors.meetupTime && <span className="err-msg">{errors.meetupTime}</span>}
                  <select id="meetupTime" className="form-input pill" value={meetupTime} onChange={e => setMeetupTime(e.target.value as MeetupTime)} style={{ marginBottom: '8px' }}>
                    <option value="">-- Choose Delivery Time --</option>
                    <option value="10am - 12pm">10:00 AM – 12:00 PM</option>
                    <option value="3pm - 4pm">3:00 PM – 4:00 PM</option>
                  </select>
                  {errors.maximAddress && <span className="err-msg">{errors.maximAddress}</span>}
                  <input id="maximAddress" className="form-input pill" type="text" value={maximAddress} onChange={e => setMaximAddress(e.target.value)} placeholder="Complete Delivery Address" style={{ marginBottom: '8px' }} />
                  <input className="form-input pill" type="text" value={maximDetails} onChange={e => setMaximDetails(e.target.value)} placeholder="Additional (Gate color, building, etc.) (Optional)" style={{ marginBottom: '8px' }} />
                  <div id="maximScreenshot" className={`upload-box${errors.maximScreenshot ? ' err' : ''}`} onClick={() => maximFileInputRef.current?.click()}>
                    {maximScreenshot ? <span className="upload-done">✅ {maximScreenshot.name}</span> : <span className="upload-hint">📎 Upload Pin Point Screenshot (Maxim App)</span>}
                  </div>
                  <input ref={maximFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleMaximFileChange} />
                  {errors.maximScreenshot && <span className="err-msg">{errors.maximScreenshot}</span>}
                </div>
              )}
            </div>
          )}

          {/* Payment Section */}
          {deliveryMode !== '' && (
            <div className="form-section fade-in">
              <div className="form-section-title">Complete Your Payment:</div>

              <div className="price-summary-box" style={{ marginBottom: '14px' }}>
                <div className="price-row">
                  <span className="price-label">Order Total:</span>
                  <span className="price-value">₱{totalPrice.toLocaleString()}</span>
                </div>
                {(paymentMode === 'gcash' || deliveryMode === 'maxim') && (
                  <div className="payment-type-selector" style={{ margin: '8px 0' }}>
                    <div className={`pay-opt ${paymentOption === 'down' ? 'active' : ''}`} onClick={() => setPaymentOption('down')}>
                      <div className="pay-opt-circle"></div>
                      <span className="pay-opt-title">Pay 50% DP</span>
                    </div>
                    <div className={`pay-opt ${paymentOption === 'full' ? 'active' : ''}`} onClick={() => setPaymentOption('full')}>
                      <div className="pay-opt-circle"></div>
                      <span className="pay-opt-title">Pay in Full</span>
                    </div>
                  </div>
                )}
                <div className="price-row price-row-main" style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
                  <span className="price-label">{paymentOption === 'full' ? 'Amount to Pay Now:' : 'Minimum DP to Pay Now:'}</span>
                  <span className="price-value">₱{downpaymentPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="gcash-payment-card" style={{ background: '#eff6ff', borderRadius: '15px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div className="gcash-info">
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, marginBottom: '2px' }}>SEND GCASH TO:</div>
                    <div style={{ fontSize: '1.05rem', color: '#1e40af', fontWeight: 900 }}>Maicah Faith M.</div>
                    <div style={{ fontSize: '0.95rem', color: '#1e40af', fontWeight: 700 }}>0994 484 2605</div>
                  </div>
                  <button type="button" className="copy-btn" onClick={() => { navigator.clipboard.writeText('09944842605'); alert('GCash number copied! 📋'); }}
                    style={{ padding: '8px 14px', background: '#3b82f6', color: '#fff', borderRadius: '10px', fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                    Copy
                  </button>
                </div>

                <div className="gcash-section" style={{ marginTop: '10px', marginBottom: '15px', background: '#fff', padding: '10px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                  <div className="form-row" style={{ marginBottom: '8px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }} htmlFor="gcashName">GCash Name:</label>
                    <div className="form-field">
                      <input id="gcashName" className={`form-input pill${errors.gcashName ? ' err' : ''}`} type="text" value={gcashName} onChange={e => setGcashName(e.target.value)} placeholder="Name on GCash account" style={{ fontSize: '0.9rem', padding: '8px 12px' }} />
                      {errors.gcashName && <span className="err-msg">{errors.gcashName}</span>}
                    </div>
                  </div>
                  <div className="form-row">
                    <label className="form-label" style={{ fontSize: '0.8rem' }} htmlFor="gcashNumber">GCash Number:</label>
                    <div className="form-field">
                      <input
                        id="gcashNumber"
                        className={`form-input pill${errors.gcashNumber ? ' err' : ''}`}
                        type="tel"
                        value={gcashNumber}
                        onChange={handleGcashPhoneChange}
                        placeholder="09XX XXX XXXX"
                        maxLength={13}
                        style={{ fontSize: '0.9rem', padding: '8px 12px' }}
                      />
                      {errors.gcashNumber && <span className="err-msg">{errors.gcashNumber}</span>}
                    </div>
                  </div>

                  <div className="gcash-launch-container" style={{ marginBottom: '15px' }}>
                    <a
                      href={/android/i.test(navigator.userAgent || navigator.vendor || (window as any).opera)
                        ? "intent://#Intent;scheme=gcash;package=com.globe.gcash.android;S.browser_fallback_url=https%3A%2F%2Fwww.gcash.com;end;"
                        : "gcash://"}
                      className="launch-gcash-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ width: '100%', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' }}
                    >
                      <span>Launch GCash App</span>
                      <span>🚀</span>
                    </a>

                    {/Instagram|FBAN|FBAV/i.test(navigator.userAgent) && (
                      <div className="ig-browser-tip" style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: '#fff7ed',
                        border: '2px solid #ffedd5',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        color: '#9a3412',
                        textAlign: 'center',
                        lineHeight: '1.5'
                      }}>
                        <div style={{ fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                          <span>⚠️</span> Instagram Limitation
                        </div>
                        If the app doesn't open, tap the <strong>three dots (⋮ / ...)</strong> at the top right and select <strong>"Open in Browser"</strong> or <strong>"Open in Safari/Chrome"</strong>.
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', marginBottom: '10px' }}>
                    1. Send <strong>₱{downpaymentPrice.toLocaleString()}</strong> via GCash to the number above.<br />
                    2. Screenshot the receipt and upload it below.
                  </div>

                  <div id="gcashScreenshot" className={`upload-box${errors.gcashScreenshot ? ' err' : ''}`} onClick={() => fileInputRef.current?.click()} style={{ background: '#fff' }}>
                    {gcashScreenshot ? <span className="upload-done">✅ {gcashScreenshot.name}</span> : <span className="upload-hint">📎 Click to Upload GCash Receipt</span>}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                  {errors.gcashScreenshot && <span className="err-msg">{errors.gcashScreenshot}</span>}

                  <div className="gcash-qr-container" style={{ marginTop: '15px', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px', color: '#555' }}>...or scan our QR code:</p>
                    <img src="/gcash-qr.jpg?v=2" alt="GCash QR Code" className="gcash-qr-image" style={{ maxWidth: '180px', borderRadius: '10px' }} />
                  </div>
                </div>
              </div>

              <div className="checkbox-row" style={{ marginTop: '10px' }}>
                <input type="checkbox" id="understood" checked={understood} onChange={e => setUnderstood(e.target.checked)} className="checkbox-inp" />
                <label htmlFor="understood" className="checkbox-label">
                  I understand that my slot is only confirmed after payment is sent. <strong>The downpayment is NON-REFUNDABLE.</strong>
                </label>
              </div>
              {errors.understood && <span className="err-msg" style={{ marginLeft: '25px' }}>{errors.understood}</span>}
            </div>
          )}

          {/* Notes + Submit (revealed after screenshot) */}
          {gcashScreenshot && (
            <div className="form-section fade-in" style={{ marginTop: '16px' }}>
              <label className="form-section-title" htmlFor="specialInstructions">Special Instructions (Optional):</label>
              <textarea
                id="specialInstructions"
                className="form-textarea"
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
                rows={4}
                placeholder="Any special notes for your order?"
              />
              <div className="form-submit-row" style={{ marginTop: '20px' }}>
                <button type="button" className="place-order-btn place-order-btn-sm btn-secondary" onClick={onBack}>Back</button>
                <button type="submit" className="place-order-btn place-order-btn-sm" disabled={currentStock === 0}>
                  {currentStock === 0 ? 'Sold Out' : 'Review Order'}
                </button>
              </div>
            </div>
          )}
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
  const [showProductionDetails, setShowProductionDetails] = useState(false);
  const [activeDeliveryTab, setActiveDeliveryTab] = useState<'meetup' | 'maxim' | null>(null);

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
            <h1 className="admin-title">Admin Panel</h1>
          </div>
          <div className="admin-nav-actions">
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

      <div className="admin-content">
        {(() => {
          let b4 = 0, b6 = 0, b12 = 0;
          let recentNotes: { name: string, note: string }[] = [];
          orders.forEach(o => {
            if (o.status === 'Delivered' && o.is_paid) return;
            const typeVal = o.quantity_type || '';
            if (typeVal.includes('Box4:')) {
              const parts = typeVal.split(', ');
              b4 += parseInt(parts[0].split(': ')[1]) || 0;
              b6 += parseInt(parts[1].split(': ')[1]) || 0;
              b12 += parts[2] ? parseInt(parts[2].split(': ')[1]) : 0;
            }
            if (o.special_instructions && o.special_instructions.trim()) {
              if (!recentNotes.some(rn => rn.note === o.special_instructions)) {
                recentNotes.push({ name: o.full_name, note: o.special_instructions });
              }
            }
          });
          const totalCookiesVal = (b4 * 4) + (b6 * 6) + (b12 * 12);
          return (
            <>
              {/* ─── LEVEL 1: TOP PRIORITY STATS ─── */}
              <div className="admin-stats-row">
                <div className="admin-stat-card clickable" style={{ background: '#f5feff', borderColor: '#0ea5e9' }} onClick={() => setShowDeliveryList(true)}>
                  <h3 style={{ color: '#0369a1' }}>🚚 Delivery List</h3>
                  <div className="admin-stat-val" style={{ color: '#0369a1', fontSize: '1.4rem' }}>
                    {orders.filter(o => o.delivery_mode === 'meetup').length} • {orders.filter(o => o.delivery_mode === 'maxim').length}
                  </div>
                  <p className="admin-stat-sub">Meetup • Maxim (Tap to View)</p>
                </div>

                <div className="admin-stat-card clickable" style={{ background: '#fffbeb', borderColor: '#f59e0b' }} onClick={() => setShowProductionDetails(true)}>
                  <h3 style={{ color: '#d97706' }}>🍪 Total Cookies</h3>
                  <div className="admin-stat-val" style={{ color: '#d97706' }}>{totalCookiesVal}</div>
                  <p className="admin-stat-sub">Across all pending orders</p>
                </div>

                <div className="admin-stat-card clickable" style={{ background: '#fef2f2', borderColor: '#ef4444' }} onClick={() => setShowToCollect(true)}>
                  <h3 style={{ color: '#dc2626' }}>💰 To be Received</h3>
                  <div className="admin-stat-val" style={{ color: '#dc2626' }}>
                    ₱{Math.round(orders.reduce((acc, o) => {
                      if (o.is_paid) return acc;
                      return acc + (o.payment_mode === 'gcash' ? (o.total_price - o.downpayment_price) : o.total_price);
                    }, 0)).toLocaleString()}
                  </div>
                  <p className="admin-stat-sub">Unpaid Balances (Tap to View)</p>
                </div>

                <div className="admin-stat-card" style={{ background: '#f8fafc', borderColor: '#cbd5e1' }}>
                  <h3 style={{ color: '#475569' }}>📝 Order Notes</h3>
                  <div className="admin-stat-sub" style={{ textAlign: 'left', maxHeight: '50px', overflow: 'hidden', fontSize: '0.65rem' }}>
                    {recentNotes.length > 0 ? (
                      recentNotes.slice(0, 2).map((rn, i) => (
                        <div key={i} className="clickable" onClick={() => setSelectedNote(rn.note)} style={{ borderBottom: '1px solid #e2e8f0', padding: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <strong>{rn.name}:</strong> {rn.note}
                        </div>
                      ))
                    ) : 'No pending notes'}
                  </div>
                  <p className="admin-stat-sub" style={{ marginTop: 'auto' }}>Latest instructions</p>
                </div>
              </div>

              {/* ─── LEVEL 2: SECONDARY HIGHLIGHTS ─── */}
              <div className="admin-highlight-section" style={{ marginTop: '20px' }}>
                <div className="admin-stat-card admin-stat-card-sparkle">
                  <h3>Overall Revenue</h3>
                  <div className="admin-stat-val sparkle-text">
                    ₱{Math.round(orders.reduce((acc, o) => acc + o.total_price, 0)).toLocaleString()}
                  </div>
                  <p className="admin-stat-sub">Total gross revenue</p>
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
                        ₱{Math.round(orders.reduce((acc, o) => {
                          if (o.is_paid) return acc + o.total_price;
                          if (o.payment_mode === 'gcash') return acc + o.downpayment_price;
                          return acc;
                        }, 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="prod-item">
                      <span className="prod-label">Chewy Cookies Left</span>
                      <div className="admin-stock-control" style={{ margin: 0, padding: 0, background: 'transparent' }}>
                        <button className="qty-btn" style={{ padding: '2px 8px' }} onClick={() => updateStock(stock - 1)} disabled={updatingStock}>−</button>
                        <span className="qty-val" style={{ fontSize: '1.1rem', margin: '0 8px' }}>{stock}</span>
                        <button className="qty-btn" style={{ padding: '2px 8px' }} onClick={() => updateStock(stock + 1)} disabled={updatingStock}>+</button>
                      </div>
                    </div>
                    <div className="prod-item">
                      <span className="prod-label">Total Orders</span>
                      <span className="prod-val" style={{ fontSize: '1.2rem' }}>{orders.length}</span>
                    </div>
                  </div>
                </div>
              </div>


              {showProductionDetails && (
                <div className="admin-modal-overlay" onClick={() => setShowProductionDetails(false)}>
                  <div className="admin-modal" style={{ maxWidth: '700px', width: '95%' }} onClick={e => e.stopPropagation()}>
                    <div className="admin-modal-header">
                      <h2>Production Details</h2>
                      <button className="close-btn" onClick={() => setShowProductionDetails(false)}>&times;</button>
                    </div>
                    <div className="admin-modal-content" style={{ maxHeight: '75vh' }}>
                      <div className="production-details-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '12px', border: '1px solid #bae6fd', marginBottom: '10px' }}>
                          <h3 style={{ fontSize: '1rem', marginBottom: '10px', color: '#0369a1', fontFamily: 'Patrick Hand' }}>Quick Production Summary</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {['10am - 12pm', '3pm - 4pm'].map(time => (
                              <div key={time}>
                                <h4 style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px', borderBottom: '1px solid #e0f2fe' }}>🕒 {time === '10am - 12pm' ? 'Morning Batch' : 'Afternoon Batch'}</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                                  {['Box of 4', 'Box of 6', 'Box of 12'].map(type => {
                                    const typeKey = type === 'Box of 4' ? 'Box4' : type === 'Box of 6' ? 'Box6' : 'Box12';
                                    let metCount = 0;
                                    let maxCount = 0;
                                    orders.forEach(o => {
                                      if (o.status === 'Delivered' && o.is_paid) return;
                                      if (o.meetup_time !== time || !o.quantity_type) return;
                                      const q = parseInt(o.quantity_type.split(`${typeKey}: `)[1]) || 0;
                                      if (o.delivery_mode === 'maxim') maxCount += q; else metCount += q;
                                    });
                                    if (metCount === 0 && maxCount === 0) return null;
                                    return (
                                      <div key={type} style={{ background: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>{type}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#6366f1' }}>{metCount + maxCount} <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>total</span></div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px', lineHeight: '1.2' }}>
                                          🤝 Meetup: {metCount}<br />
                                          🚚 Maxim: {maxCount}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {(() => {
                          const boxTypes = ['Box of 4', 'Box of 6', 'Box of 12'];
                          return boxTypes.map(type => {
                            const typeKey = type === 'Box of 4' ? 'Box4' : type === 'Box of 6' ? 'Box6' : 'Box12';
                            const typeOrders = orders.filter(o => {
                              if (o.status === 'Delivered' && o.is_paid) return false;
                              const typeVal = o.quantity_type || '';
                              return typeVal.includes(`${typeKey}:`) && parseInt(typeVal.split(`${typeKey}: `)[1]) > 0;
                            }).sort((a, b) => {
                              if (a.meetup_time !== b.meetup_time) return a.meetup_time.localeCompare(b.meetup_time);
                              return a.delivery_mode.localeCompare(b.delivery_mode);
                            });

                            if (typeOrders.length === 0) return null;

                            return (
                              <div key={type} className="prod-detail-group">
                                <h3 style={{ borderBottom: '2px solid #6366f1', paddingBottom: '5px', color: '#1e293b' }}>{type}</h3>
                                <div className="prod-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                                  {typeOrders.map(o => {
                                    const qty = parseInt((o.quantity_type || '').split(`${typeKey}: `)[1]);
                                    return (
                                      <div key={o.id} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
                                        <div style={{ fontWeight: 800 }}>{o.full_name} <span style={{ color: '#6366f1' }}>({qty})</span></div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                          🕒 {o.meetup_time}<br />
                                          {o.delivery_mode === 'maxim' ? '🚚 Maxim' : '🤝 Meetup'}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    <div className="admin-modal-footer" style={{ padding: '15px', textAlign: 'center' }}>
                      <button className="place-order-btn place-order-btn-sm" onClick={() => setShowProductionDetails(false)}>Close</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}

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
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>{orders.filter(o => o.delivery_mode === 'maxim').length}</div>
                    </div>
                  </div>

                  {!activeDeliveryTab && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      <p>Select a category above to view the list 👆</p>
                    </div>
                  )}

                  {activeDeliveryTab === 'meetup' && (
                    <div className="delivery-section-box fade-in">
                      <h3 className="delivery-section-title">🤝 La Salle Meetup List</h3>

                      {['10am - 12pm', '3pm - 4pm'].map(timeSlot => (
                        <div className="delivery-time-block" key={timeSlot}>
                          <h4>{timeSlot === '10am - 12pm' ? '10:00 AM - 12:00 PM' : '3:00 PM - 4:00 PM'}</h4>
                          <div className="delivery-grid">
                            {orders.filter(o => o.delivery_mode === 'meetup' && o.meetup_time === timeSlot).length === 0 ? (
                              <p className="no-data">No meetups at this time.</p>
                            ) : (
                              orders
                                .filter(o => o.delivery_mode === 'meetup' && o.meetup_time === timeSlot)
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
                                            <option value="Delivered">Delivered</option>
                                          </select>
                                        </div>
                                      </div>

                                      <div className="dc-info-row">
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <span className="pi-label">{o.payment_mode === 'gcash' ? 'GCash 50%' : 'Cash'}</span>
                                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: o.is_paid ? '#10b981' : '#f59e0b', marginTop: '2px' }}>
                                            {o.is_paid ? 'PAID FULL' : o.payment_mode === 'gcash' ? 'DP ONLY' : 'UNPAID'}
                                          </span>
                                          {!o.is_paid && (
                                            <span className="dc-balance">Bal: ₱{Math.round(o.total_price - o.downpayment_price)}</span>
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
                                          const label = type === 'Box4' ? 'Box of 4' : type === 'Box6' ? 'Box of 6' : 'Box of 12';
                                          return <div key={type} style={{ fontWeight: 700 }}>{count}x {label}</div>;
                                        }) : 'No data'}
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
                  )}

                  {activeDeliveryTab === 'maxim' && (
                    <div className="delivery-section-box toggle-maxim" style={{ marginTop: '30px' }}>
                      <h3 className="delivery-section-title">🚚 Maxim Delivery List</h3>

                      {['10am - 12pm', '3pm - 4pm'].map(timeSlot => (
                        <div className="delivery-time-block" key={timeSlot}>
                          <h4>{timeSlot === '10am - 12pm' ? '10:00 AM - 12:00 PM' : '3:00 PM - 4:00 PM'}</h4>
                          <div className="delivery-grid">
                            {orders.filter(o => o.delivery_mode === 'maxim' && o.meetup_time === timeSlot).length === 0 ? (
                              <p className="no-data">No deliveries at this time.</p>
                            ) : (
                              orders
                                .filter(o => o.delivery_mode === 'maxim' && o.meetup_time === timeSlot)
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
                                            <option value="Delivered">Delivered</option>
                                          </select>
                                        </div>
                                      </div>

                                      <div className="dc-info-row">
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                          <span className="pi-label">{o.payment_mode === 'gcash' ? 'GCash 50%' : 'Cash'}</span>
                                          {!o.is_paid && (
                                            <span className="dc-balance">Bal: ₱{Math.round(o.total_price - o.downpayment_price)}</span>
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
                                          const label = type === 'Box4' ? 'Box of 4' : type === 'Box6' ? 'Box of 6' : 'Box of 12';
                                          return <div key={type} style={{ fontWeight: 700 }}>{count}x {label}</div>;
                                        }) : 'No data'}
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



        <div className="admin-table-container">
          <div className="admin-table-header">
            <h2>Recent Orders</h2>
            <div className="admin-table-actions">
              <button className="admin-nav-btn admin-nav-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setShowDeliveryList(true)}>
                <span>🚚</span> Delivery List
              </button>
              <button className="admin-nav-btn admin-nav-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={fetchOrders}>
                <span>🔄</span> Refresh
              </button>
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
                    <tr key={order.id} className={order.status === 'Delivered' && order.is_paid ? 'finished-row' : ''}>
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
                                  Balance: ₱{Math.round(order.total_price - order.downpayment_price)}
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
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };
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
          Our preorder forms for Dubai Chewy Cookie will open on February 26
          <span className="highlight-text">THURSDAY, 7:00 PM</span>
        </p>

        <div className="maintenance-warning gcash-warning" style={{ marginTop: '-25px', marginBottom: '35px', padding: '15px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '15px', color: '#ff7070', fontSize: '0.9rem', fontWeight: 700, lineHeight: '1.4' }}>
          🚨 A 50% downpayment in GCASH is REQUIRED for all orders to confirm your slot.
          <br /><br />
          🚚 Maxim Orders: Only GCash payments are allowed. Please screenshot in advance your pinpoint location.
          <br /><br />
          <span style={{ color: '#ffde59' }}>📍 We only accept Bacolod City orders for now. Thank you for your understanding!</span>
        </div>

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
function BrowserGuard({ onDismiss }: { onDismiss: () => void }) {
  const isAndroid = /Android/i.test(navigator.userAgent);

  const handleOpenExternal = () => {
    if (isAndroid) {
      // Intent trick for Android to try and force open Chrome
      window.location.href = "intent://bakedbybcd.vercel.app#Intent;scheme=https;package=com.android.chrome;end";
    } else {
      // iOS cannot be forced easily, so we just show the native instructions
      alert("Tap the three dots (...) at the top right and select 'Open in Browser' or 'Open in Safari'.");
    }
  };

  return (
    <div className="bg-overlay fade-in">
      <div className="bg-card">
        <div className="bg-icon">🍪</div>
        <h2 className="bg-title">Almost There!</h2>
        <p className="bg-text">
          To pay with <span style={{ color: '#3b82f6', fontWeight: 800 }}>GCash</span>, you need to open this page in your regular browser.
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

        <button className="bg-btn-primary" onClick={handleOpenExternal}>
          {isAndroid ? 'Try Opening in Chrome 🚀' : 'Got it! 👍'}
        </button>
        <button className="bg-btn-secondary" onClick={onDismiss}>
          Wait, let me browse here first
        </button>
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
  const [showBrowserGuard, setShowBrowserGuard] = useState(false);
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

  const dismissBrowserGuard = () => {
    setShowBrowserGuard(false);
    sessionStorage.setItem('baked_browser_guard_seen', 'true');
  };

  // If locked, only allow admin pages or if bypassed
  const showLocked = isLocked && !bypassLocked && page !== 'admin-login' && page !== 'admin-dashboard';

  if (showLocked) {
    return <MaintenancePage onUnlock={handleUnlock} />;
  }

  return (
    <>
      {showBrowserGuard && <BrowserGuard onDismiss={dismissBrowserGuard} />}
      {page === 'home' && <HomePage stock={stock} stockLoading={stockLoading} onOrderClick={() => setPage('order')} onAdminClick={() => setPage('admin-login')} />}
      {page === 'order' && <OrderPage currentStock={stock} onBack={() => setPage('home')} />}
      {page === 'admin-login' && <AdminLogin onLogin={() => setPage('admin-dashboard')} onBack={() => setPage('home')} />}
      {page === 'admin-dashboard' && <AdminDashboard onLogout={() => setPage('admin-login')} onBack={() => setPage('home')} />}
    </>
  );
}


