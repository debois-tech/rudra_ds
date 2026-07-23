"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, CheckCircle2, Shield, Bell, Receipt,
  Building2, Menu, X, ArrowRight, TrendingUp,
  FileText, Users, Phone, Loader2, Zap, BarChart3
} from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase";

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <Users className="w-5 h-5" />,
    title: "Customer CRM",
    desc: "Searchable records of every customer — contacts, services, and history at a glance.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Document Tracking",
    desc: "Track LL, DL, RC, Insurance, PUC, Fitness & Badge with colour-coded status badges.",
  },
  {
    icon: <Bell className="w-5 h-5" />,
    title: "WhatsApp Alerts",
    desc: "Automated reminders before documents expire — driving repeat business on autopilot.",
  },
  {
    icon: <Receipt className="w-5 h-5" />,
    title: "Invoicing",
    desc: "Generate professional invoices and track paid & outstanding amounts in real time.",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Revenue Dashboard",
    desc: "Monitor sales, outstanding payments, and performance — no spreadsheets needed.",
  },
  {
    icon: <Building2 className="w-5 h-5" />,
    title: "Multi-Branch",
    desc: "Manage multiple locations under one Super Admin with complete data isolation.",
  },
];

const documents = [
  "Learner's Licence",
  "Driving Licence",
  "Vehicle RC",
  "Insurance",
  "PUC",
  "Fitness Certificate",
  "Badge",
];

const howItWorks = [
  {
    step: "01",
    title: "Add Customer",
    desc: "Enter customer details and the services they purchased.",
  },
  {
    step: "02",
    title: "Auto-Track",
    desc: "MotoAdmin monitors every document expiry and sends WhatsApp reminders.",
  },
  {
    step: "03",
    title: "Grow Revenue",
    desc: "Customers return to renew. Record the sale, invoice, repeat.",
  },
];

const faqs = [
  {
    q: "What exactly does MotoAdmin do?",
    a: "MotoAdmin is a CRM and document reminder platform built specifically for driving school operators. You can add customers, record the services you sold them, track when their documents (LL, DL, RC, Insurance, PUC, etc.) are about to expire, and automatically send WhatsApp reminders to bring them back for renewal.",
  },
  {
    q: "How do the WhatsApp renewal reminders work?",
    a: "MotoAdmin runs automated background jobs that check document expiry dates daily. When a document is approaching its expiry, a WhatsApp message is automatically sent to your customer reminding them to renew — no manual action needed from you.",
  },
  {
    q: "Which documents can I track?",
    a: "You can track Learner's Licence (LL), Driving Licence (DL), Vehicle Registration Certificate (RC), Vehicle Insurance, PUC Certificate, Fitness Certificate, and Badge — with status badges showing active, expiring soon, or expired.",
  },
  {
    q: "Is there a free plan or trial?",
    a: "MotoAdmin is an enterprise-grade platform offered at a flat ₹999/month for a single driving school. There is no free plan. For chains managing multiple branches, contact us for a custom enterprise quote.",
  },
  {
    q: "Can I manage multiple branches?",
    a: "Yes. Our Enterprise plan lets you manage multiple driving school branches under one Super Admin account, with complete data isolation between branches. Contact us for a custom plan.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. All data is protected using Row-Level Security (RLS) at the database level. Every driving school's data is completely isolated — no one else can access your records.",
  },
];

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const jsonLdOrg = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MotoAdmin",
  url: "https://motoadmin.in",
  logo: "https://motoadmin.in/logo.png",
  sameAs: [
    "https://twitter.com/motoadmin",
    "https://linkedin.com/company/motoadmin",
  ],
};

// ─── Demo Modal ───────────────────────────────────────────────────────────────

function DemoModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ full_name: "", phone: "", school_name: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.from("demo_requests").insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        school_name: form.school_name.trim(),
      });

      if (error) throw error;
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again or email us at connect@deboistech.in");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl border border-gray-100"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {status === "success" ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">We&apos;ll be in touch!</h3>
            <p className="text-gray-500 leading-relaxed">
              Our team at{" "}
              <span className="text-amber-600 font-medium">connect@deboistech.in</span>{" "}
              will contact you within 24 hours.
            </p>
            <button
              onClick={onClose}
              className="mt-8 px-6 py-3 rounded-xl font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Book a Demo</h3>
              <p className="text-gray-500 text-sm">
                Fill in your details and we&apos;ll schedule a personalised walkthrough.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    required
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Driving School Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rudra Driving School"
                  value={form.school_name}
                  onChange={(e) => setForm({ ...form, school_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                />
              </div>

              {status === "error" && (
                <p className="text-red-500 text-sm">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-3.5 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting&hellip;</>
                ) : (
                  <>Request a Demo <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const year = new Date().getFullYear();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [showTopBtn, setShowTopBtn] = useState(false);
  const sectionsRef = useRef<string[]>(["features", "pricing", "faq"]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowTopBtn(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Active section tracking via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sectionsRef.current.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = demoOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [demoOpen]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }} />

      <AnimatePresence>
        {demoOpen && <DemoModal onClose={() => setDemoOpen(false)} />}
      </AnimatePresence>

      <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-amber-200 selection:text-amber-900">

        {/* ─── Navbar ─── */}
        <nav className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 rounded-2xl ${
          scrolled
            ? "top-3 w-[94%] max-w-6xl bg-white/90 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.08)] border border-gray-200/60 py-2"
            : "top-5 w-[94%] max-w-6xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 py-2.5"
        }`}>
          <div className="px-5 md:px-8 flex items-center justify-between">
            <div className="relative h-10 w-[120px] md:h-11 md:w-[170px]">
              <Image src="/logo_icon.png" alt="MotoAdmin" fill className="object-contain object-left" priority />
            </div>

            <div className="hidden md:flex items-center gap-1">
              {[
                { href: "#features", label: "Features", id: "features" },
                { href: "#pricing", label: "Pricing", id: "pricing" },
                { href: "#faq", label: "FAQ", id: "faq" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeSection === link.id
                      ? "text-amber-700 bg-amber-50"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-2"
              >
                Log In
              </Link>
              <button
                onClick={() => setDemoOpen(true)}
                className="px-5 py-2 rounded-full text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-sm"
              >
                Book a Demo
              </button>
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="md:hidden overflow-hidden"
              >
                <div className="px-5 pb-5 pt-3 flex flex-col gap-1 border-t border-gray-100 mt-2">
                  {["Features", "Pricing", "FAQ"].map((label) => (
                    <a
                      key={label}
                      href={`#${label.toLowerCase()}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-base font-medium text-gray-600 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      {label}
                    </a>
                  ))}
                  <div className="h-px bg-gray-100 my-2" />
                  <Link href="/login" className="text-base font-medium text-gray-600 py-2.5 px-3">Log In</Link>
                  <button
                    onClick={() => { setMobileMenuOpen(false); setDemoOpen(true); }}
                    className="py-3 rounded-xl font-semibold bg-gray-900 text-white text-sm mt-1"
                  >
                    Book a Demo
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* ─── Hero ─── */}
        <section className="relative pt-36 pb-20 md:pt-52 md:pb-32 overflow-hidden">
          {/* Subtle warm radial glow */}
          <div className="hero-bg-light" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative max-w-4xl mx-auto px-6 text-center z-10"
          >

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
            >
              <span className="text-gray-900">The Smartest Way to Run</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 gradient-shimmer">
                Your Driving School
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base md:text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed"
            >
              Manage customers, track documents, automate WhatsApp reminders, and grow revenue — all from one dashboard.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <button
                onClick={() => setDemoOpen(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/10 hover:shadow-xl hover:shadow-gray-900/15 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Book a Demo <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-center"
              >
                See Features
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-8 flex items-center justify-center gap-6 flex-wrap text-sm text-gray-400"
            >
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />&#8377;999/month</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />No setup fees</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />WhatsApp alerts</span>
            </motion.div>
          </motion.div>
        </section>

        {/* ─── Document Marquee ─── */}
        <div className="border-y border-gray-100 bg-gray-50/50 py-4 overflow-hidden">
          <div className="flex items-center gap-8 px-6 flex-wrap justify-center">
            <span className="text-amber-600/70 uppercase tracking-[0.2em] text-[11px] font-bold">
              Documents we track
            </span>
            {documents.map((doc, i) => (
              <span key={i} className="flex items-center gap-2 text-sm text-gray-400">
                <Shield className="w-3 h-3 text-amber-500/50" />
                {doc}
              </span>
            ))}
          </div>
        </div>

        {/* ─── Features ─── */}
        <section id="features" className="py-24 relative">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">
                Everything You Need
              </h2>
              <p className="text-gray-500 text-base">
                Built exclusively for driving school operators.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 group-hover:bg-amber-100 group-hover:scale-105 transition-all">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section className="py-24 bg-gray-50/70 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#d97706 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

          <div className="max-w-5xl mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">
                How It Works
              </h2>
              <p className="text-gray-500 text-base">Three steps. No IT team needed.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 relative">
              <div className="hidden md:block absolute top-[44px] left-[17%] right-[17%] h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />

              {howItWorks.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="w-[72px] h-[72px] mx-auto rounded-2xl bg-white border-2 border-amber-300 flex items-center justify-center text-2xl font-bold text-amber-600 mb-5 shadow-lg shadow-amber-100">
                    {s.step}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-[260px] mx-auto">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pricing ─── */}
        <section id="pricing" className="py-24 relative">
          <div className="max-w-5xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">
                Simple Pricing
              </h2>
              <p className="text-gray-500 text-base">
                One flat rate. No hidden fees, no feature paywalls.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Business Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative p-8 rounded-2xl bg-white border-2 border-gray-900 overflow-hidden shadow-xl shadow-gray-900/5 hover:shadow-2xl hover:shadow-gray-900/10 transition-shadow"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />
                <div className="flex items-center gap-2 mb-5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Business</span>
                </div>
                <div className="text-4xl font-black text-gray-900 mb-1">
                  &#8377;999<span className="text-lg text-gray-400 font-normal">/mo</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">For a single driving school.</p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Full Customer CRM",
                    "Document Tracking (All Types)",
                    "WhatsApp Renewal Alerts",
                    "Invoice & Billing",
                    "Revenue Dashboard",
                    "No Setup Fees",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setDemoOpen(true)}
                  className="w-full py-3 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800 transition-all"
                >
                  Book a Demo
                </button>
              </motion.div>

              {/* Enterprise Plan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-8 rounded-2xl bg-gray-50 border border-gray-200"
              >
                <div className="flex items-center gap-2 mb-5">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enterprise</span>
                </div>
                <div className="text-4xl font-black text-gray-900 mb-1">Custom</div>
                <p className="text-sm text-gray-500 mb-6">For multi-branch chains.</p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Everything in Business",
                    "Multiple Branch Management",
                    "Super Admin Dashboard",
                    "Full Data Isolation",
                    "Custom Integrations",
                    "Dedicated Account Manager",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-gray-500">
                      <CheckCircle2 className="w-4 h-4 text-gray-300 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:connect@deboistech.in?subject=MotoAdmin Enterprise Enquiry"
                  className="block w-full py-3 text-center rounded-xl font-semibold border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Contact Sales
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="py-24 bg-gray-50/70">
          <div className="max-w-2xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900">FAQ</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`border ${openFaq === i ? "border-amber-200 bg-white shadow-md shadow-amber-50" : "border-gray-200 bg-white"} rounded-xl transition-all duration-300`}
                >
                  <button
                    className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-medium text-gray-900"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform duration-300 shrink-0 ml-4 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`px-5 text-sm text-gray-500 leading-relaxed overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-56 pb-4 opacity-100" : "max-h-0 opacity-0"}`}>
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="relative py-24 overflow-hidden bg-gray-900">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(#fbbf24 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative max-w-3xl mx-auto px-6 text-center z-10"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-5 text-white">
              Ready to grow your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">driving school?</span>
            </h2>
            <p className="text-base text-gray-400 mb-8 max-w-lg mx-auto">
              Stop managing customers on paper. Let MotoAdmin handle records, reminders, and revenue.
            </p>
            <button
              onClick={() => setDemoOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold bg-white text-gray-900 hover:bg-gray-100 shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5"
            >
              Book a Demo <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-4 text-xs text-gray-500">&#8377;999/month &middot; No setup fees &middot; Enterprise plans available</p>
          </motion.div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-gray-100 bg-white pt-12 pb-6">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
              <div className="relative h-9 w-[130px]">
                <Image src="/logo_icon.png" alt="MotoAdmin" fill className="object-contain object-left" priority />
              </div>
              <div className="flex gap-6 text-sm text-gray-400">
                <a href="#features" className="hover:text-amber-600 transition-colors">Features</a>
                <a href="#pricing" className="hover:text-amber-600 transition-colors">Pricing</a>
                <a href="#faq" className="hover:text-amber-600 transition-colors">FAQ</a>
                <Link href="/login" className="hover:text-amber-600 transition-colors">Log In</Link>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-400 border-t border-gray-100 pt-6">
              <p>&#169; {year} MotoAdmin. All rights reserved.</p>
              <p>
                A product by{" "}
                <a
                  href="https://deboistech.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-amber-600 transition-colors underline underline-offset-2"
                >
                  deboistech.in
                </a>
              </p>
            </div>
          </div>
        </footer>

        {/* Scroll to top */}
        <AnimatePresence>
          {showTopBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="scroll-to-top"
              aria-label="Scroll to top"
            >
              <ChevronUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}
