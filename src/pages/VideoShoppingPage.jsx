import { useState, useEffect } from "react";
import { apiFetch, toQuery } from "../api"; // ✅ use shared API utility

// ─── Time slots: 9:00 AM to 8:30 PM in 30-min intervals ─────────────────────
function generateSlots() {
  const slots = [];
  let hour = 9;
  let min = 0;
  while (hour < 20 || (hour === 20 && min === 30)) {
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 ? "AM" : "PM";
    const label = `${h12}:${min === 0 ? "00" : "30"} ${ampm}`;
    const value = `${String(hour).padStart(2, "0")}:${min === 0 ? "00" : "30"}`;
    slots.push({ label, value });
    if (min === 0) {
      min = 30;
    } else {
      min = 0;
      hour += 1;
    }
  }
  return slots;
}
const TIME_SLOTS = generateSlots();

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function formatDate(str) {
  if (!str) return "";
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = ["Pick a Date", "Choose a Time", "Your Details", "Confirmed"];

export default function VideoShoppingPage() {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);

  // ✅ Use apiFetch — hits https://dillo.dreamcapture.in/api/video-shopping/booked-slots/?date=…
  useEffect(() => {
    if (!date) return;
    setBookedSlots([]);
    setSlot(null);
    apiFetch(`/video-shopping/booked-slots/${toQuery({ date })}`)
      .then((d) => setBookedSlots(d?.booked_slots || []))
      .catch(() => {}); // silently ignore — worst case all slots show as available
  }, [date]);

  function handleDateNext() {
    if (!date) return setError("Please select a date.");
    setError("");
    setStep(1);
  }

  function handleSlotNext() {
    if (!slot) return setError("Please pick a time slot.");
    setError("");
    setStep(2);
  }

  // ✅ Use apiFetch — hits https://dillo.dreamcapture.in/api/video-shopping/book/
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      return setError("Name and email are required.");
    }
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/video-shopping/book/", {
        method: "POST",
        body: JSON.stringify({
          date,
          time_slot: slot.value,
          name: form.name,
          email: form.email,
          phone: form.phone,
          note: form.note,
        }),
      });
      setBooking(data);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden bg-dillo-charcoal text-white"
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)" }}
      >
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(255,200,100,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(200,100,255,0.2) 0%, transparent 50%)",
            }}
          />
        </div>
        <div className="relative container mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-sm font-body text-white/90 tracking-wide">Live Slots Available</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Shop Sarees
            <span className="block text-amber-300 italic font-light mt-1">Over Video Call</span>
          </h1>
          <p className="font-body text-white/70 text-lg max-w-xl mx-auto mb-2">
            Browse our full collection with a personal stylist — live, from the comfort of your home.
          </p>
          <p className="font-body text-white/50 text-sm">
            30-minute sessions · 9 AM – 8:30 PM · Google Meet link sent to your email
          </p>
        </div>
      </div>

      {/* ── Booking Card ── */}
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 -z-0" />
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-2 relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                  i < step
                    ? "bg-green-500 border-green-500 text-white"
                    : i === step
                    ? "bg-dillo-charcoal border-dillo-charcoal text-white"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span
                className={`text-xs font-body hidden sm:block ${
                  i === step ? "text-dillo-charcoal font-semibold" : "text-gray-400"
                }`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* ── Step 0: Pick Date ── */}
          {step === 0 && (
            <div className="p-8">
              <h2 className="font-display text-2xl font-bold text-dillo-charcoal mb-1">Choose a Date</h2>
              <p className="font-body text-gray-500 text-sm mb-6">Sessions are available from tomorrow onwards</p>
              <input
                type="date"
                min={getMinDate()}
                value={date}
                onChange={(e) => { setDate(e.target.value); setError(""); }}
                className="w-full border-2 border-gray-200 focus:border-dillo-charcoal rounded-2xl px-4 py-3 font-body text-dillo-charcoal outline-none transition-all text-base cursor-pointer"
              />
              {date && (
                <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3 font-body text-sm text-amber-800">
                  📅 {formatDate(date)}
                </div>
              )}
              {error && <p className="mt-3 text-red-500 font-body text-sm">{error}</p>}
              <button
                onClick={handleDateNext}
                className="btn-primary mt-6 w-full py-3 rounded-2xl font-body font-semibold text-base"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 1: Pick Time ── */}
          {step === 1 && (
            <div className="p-8">
              <button onClick={() => { setStep(0); setError(""); }} className="text-gray-400 hover:text-gray-600 font-body text-sm mb-4 flex items-center gap-1">
                ← {formatDate(date)}
              </button>
              <h2 className="font-display text-2xl font-bold text-dillo-charcoal mb-1">Pick a Time Slot</h2>
              <p className="font-body text-gray-500 text-sm mb-6">Each session is 30 minutes</p>

              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((s) => {
                  const booked = bookedSlots.includes(s.value);
                  const selected = slot?.value === s.value;
                  return (
                    <button
                      key={s.value}
                      disabled={booked}
                      onClick={() => { setSlot(s); setError(""); }}
                      className={`py-2.5 rounded-xl text-sm font-body font-medium border-2 transition-all duration-150 ${
                        booked
                          ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed line-through"
                          : selected
                          ? "bg-dillo-charcoal border-dillo-charcoal text-white shadow-md scale-105"
                          : "bg-white border-gray-200 text-gray-700 hover:border-dillo-charcoal hover:text-dillo-charcoal"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-5 text-xs font-body text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded border-2 border-gray-200 bg-gray-50 inline-block" /> Booked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded border-2 border-dillo-charcoal bg-white inline-block" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-dillo-charcoal inline-block" /> Selected
                </span>
              </div>

              {error && <p className="mt-3 text-red-500 font-body text-sm">{error}</p>}
              <button
                onClick={handleSlotNext}
                className="btn-primary mt-6 w-full py-3 rounded-2xl font-body font-semibold text-base"
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="p-8">
              <button type="button" onClick={() => { setStep(1); setError(""); }} className="text-gray-400 hover:text-gray-600 font-body text-sm mb-4 flex items-center gap-1">
                ← {slot?.label} on {formatDate(date)}
              </button>
              <h2 className="font-display text-2xl font-bold text-dillo-charcoal mb-1">Your Details</h2>
              <p className="font-body text-gray-500 text-sm mb-6">
                We'll send your Google Meet link to the email below
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block font-body text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="Meena Krishnamurthy"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border-2 border-gray-200 focus:border-dillo-charcoal rounded-xl px-4 py-3 font-body text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    placeholder="meena@gmail.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border-2 border-gray-200 focus:border-dillo-charcoal rounded-xl px-4 py-3 font-body text-sm outline-none transition-all"
                  />
                  <p className="text-xs text-gray-400 font-body mt-1">Your Google Meet link will be sent here</p>
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-gray-700 mb-1">Phone Number (optional)</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border-2 border-gray-200 focus:border-dillo-charcoal rounded-xl px-4 py-3 font-body text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-gray-700 mb-1">What are you looking for? (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Silk sarees for a wedding, or something for daily wear under ₹3000…"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    className="w-full border-2 border-gray-200 focus:border-dillo-charcoal rounded-xl px-4 py-3 font-body text-sm outline-none transition-all resize-none"
                  />
                </div>
              </div>

              <div className="mt-5 bg-gray-50 border border-gray-100 rounded-2xl p-4 font-body text-sm">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Your Booking Summary</p>
                <div className="flex items-center gap-3 text-dillo-charcoal">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="font-semibold">{formatDate(date)}</p>
                    <p className="text-gray-500 text-xs">{slot?.label} — 30 minute session</p>
                  </div>
                </div>
              </div>

              {error && <p className="mt-3 text-red-500 font-body text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-6 w-full py-3 rounded-2xl font-body font-semibold text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Booking your session…
                  </>
                ) : (
                  "Confirm & Send Meet Link →"
                )}
              </button>
            </form>
          )}

          {/* ── Step 3: Confirmed ── */}
          {step === 3 && booking && (
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 text-4xl">
                ✅
              </div>
              <h2 className="font-display text-2xl font-bold text-dillo-charcoal mb-2">You're Booked!</h2>
              <p className="font-body text-gray-500 mb-6">
                A Google Meet link has been sent to <span className="text-dillo-charcoal font-semibold">{booking.email}</span>.
                Check your inbox (and spam folder just in case).
              </p>

              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left font-body text-sm space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-semibold text-dillo-charcoal">{formatDate(booking.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="font-semibold text-dillo-charcoal">{booking.time_slot_display}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-semibold text-dillo-charcoal">30 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Booking ID</span>
                  <span className="font-mono text-xs text-gray-700 bg-gray-200 px-2 py-0.5 rounded">{booking.id}</span>
                </div>
                {booking.meet_link && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-500 mb-1">Google Meet Link</p>
                    <a
                      href={booking.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 font-medium break-all hover:underline text-xs"
                    >
                      {booking.meet_link}
                    </a>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm font-body text-amber-800 text-left mb-6">
                <p className="font-semibold mb-1">What happens next?</p>
                <p>Our stylist will join you on Google Meet at the scheduled time. Have any specific saree styles, colours, or occasions in mind ready to share!</p>
              </div>

              <button
                onClick={() => {
                  setStep(0);
                  setDate("");
                  setSlot(null);
                  setForm({ name: "", email: "", phone: "", note: "" });
                  setBooking(null);
                  setError("");
                }}
                className="text-gray-500 hover:text-gray-700 font-body text-sm underline"
              >
                Book another session
              </button>
            </div>
          )}
        </div>

        {/* FAQs */}
        {step < 3 && (
          <div className="mt-10">
            <h3 className="font-display text-lg font-bold text-dillo-charcoal mb-4">Common Questions</h3>
            <div className="space-y-3">
              {[
                ["What happens during the session?", "Our stylist will show you sarees from our collection over video call — you can ask to see specific drapes, colours, and materials up close before deciding."],
                ["How do I join the call?", "A Google Meet link is emailed to you after booking. Just click it at the scheduled time — no app download needed."],
                ["Can I cancel or reschedule?", "Yes, you can cancel up to 2 hours before the session. Email us at hello@dillo.in with your booking ID."],
                ["Is there a cost to book?", "The video shopping session is completely free. You only pay for sarees you choose to purchase."],
              ].map(([q, a]) => (
                <details key={q} className="bg-white border border-gray-100 rounded-2xl p-5 group cursor-pointer">
                  <summary className="font-body font-semibold text-sm text-dillo-charcoal list-none flex justify-between items-center">
                    {q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform duration-200">▾</span>
                  </summary>
                  <p className="font-body text-sm text-gray-500 mt-3 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}