"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  ChevronDown, CheckCircle2, Shield, Users, Car, CreditCard, 
  LayoutDashboard, Building2, Menu, X, ArrowRight, TrendingUp
} from "lucide-react";

const features = [
  {
    icon: <Users className="w-8 h-8 text-amber-400" />,
    title: "Student Management",
    desc: "Track student progress, contact details, schedules, and documents in one centralized hub.",
  },
  {
    icon: <Car className="w-8 h-8 text-amber-400" />,
    title: "Fleet & Vehicle",
    desc: "Manage your entire vehicle fleet, PUC, insurance, and fitness certificates with automated alerts.",
  },
  {
    icon: <LayoutDashboard className="w-8 h-8 text-amber-400" />,
    title: "Service & Scheduling",
    desc: "Create service records, assign instructors, track payments, and automate follow-ups.",
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-amber-400" />,
    title: "Revenue Tracking",
    desc: "Monitor total revenue, outstanding payments, and business performance in real-time.",
  },
  {
    icon: <Shield className="w-8 h-8 text-amber-400" />,
    title: "Document Tracking",
    desc: "Track expiring licences and insurances with instant status badges.",
  },
  {
    icon: <Building2 className="w-8 h-8 text-amber-400" />,
    title: "Multi-School Support",
    desc: "Run a chain? We support multiple organizations with strict tenant data isolation.",
  },
];

const stats = [
  { value: "500+", label: "Driving Schools" },
  { value: "50k+", label: "Students Managed" },
  { value: "2 Min", label: "Setup Time" },
  { value: "99.9%", label: "Uptime SLA" },
];

const faqs = [
  {
    q: "What is MotoAdmin?",
    a: "MotoAdmin is a cloud-based driving school management platform that helps driving school owners manage their students, fleet, documents, services, and revenue from one central dashboard.",
  },
  {
    q: "Is MotoAdmin free to use?",
    a: "We offer a generous free plan for small driving schools. Premium plans with advanced features like multi-branch support and WhatsApp notifications are available.",
  },
  {
    q: "Does MotoAdmin work on mobile?",
    a: "Yes! MotoAdmin is fully responsive and works seamlessly on mobile, tablet, and desktop browsers.",
  },
  {
    q: "Can I manage multiple driving schools?",
    a: "Absolutely. MotoAdmin's Super Admin panel lets you manage multiple branches from a single login with complete data isolation.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is protected using Row-Level Security (RLS) at the database level. Each driving school's data is completely isolated.",
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

export default function LandingPage() {
  const year = new Date().getFullYear();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }} />

      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-amber-400/30 selection:text-amber-200">
        
        {/* Navbar */}
        <nav className={`fixed left-1/2 -translate-x-1/2 w-[96%] max-w-7xl z-50 transition-all duration-500 rounded-2xl border ${scrolled ? "top-4 bg-[#fdfbf7]/95 backdrop-blur-md shadow-xl border-slate-200 py-5" : "top-6 bg-[#fdfbf7] shadow-lg border-transparent py-6"}`}>
          <div className="px-6 md:px-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-24 w-[360px]">
                 <Image src="/icon.png" alt="MotoAdmin" fill className="object-cover object-left" priority />
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors">Pricing</a>
              <a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-amber-600 transition-colors">FAQ</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-sm font-bold text-slate-900 hover:text-amber-600 transition-colors">
                Log In
              </Link>
              <Link href="/login" className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-[0_0_10px_rgba(251,191,36,0.2)] hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all hover:-translate-y-0.5">
                Get Started Free
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-[#fdfbf7] border-b border-slate-200 p-6 flex flex-col gap-4 shadow-2xl rounded-b-2xl mt-4">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-600 hover:text-amber-600">Features</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-600 hover:text-amber-600">Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-slate-600 hover:text-amber-600">FAQ</a>
              <div className="h-px bg-slate-200 my-2"></div>
              <Link href="/login" className="text-lg font-bold text-slate-900">Log In</Link>
              <Link href="/login" className="mt-2 text-center py-3 rounded-xl font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-black">
                Get Started Free
              </Link>
            </div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-300/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="relative max-w-7xl mx-auto px-6 md:px-12 text-center z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400 text-xs md:text-sm font-semibold tracking-wide mb-8 animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              India&apos;s #1 Driving School Management Platform
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              The Smartest Way to Run <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
                Your Driving School
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Manage students, vehicles, documents, services & revenue — all from one powerful, modern dashboard. Built for scale, designed for simplicity.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login" className="w-full sm:w-auto px-8 py-4 rounded-full font-bold bg-amber-400 text-black hover:bg-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
                Start for Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-full font-bold border border-white/20 text-white hover:bg-white/5 transition-all flex items-center justify-center">
                See Features
              </a>
            </div>
            
            <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-4 flex-wrap">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-amber-400"/> Free forever plan</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-amber-400"/> No setup fees</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-amber-400"/> Cancel anytime</span>
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-white/10 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/5">
              {stats.map((s, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span className="text-4xl md:text-5xl font-black text-white mb-2">{s.value}</span>
                  <span className="text-amber-400/80 font-medium tracking-wide uppercase text-sm">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Everything Your <span className="text-amber-400">School Needs</span></h2>
              <p className="text-gray-400 text-lg">
                We&apos;ve built the ultimate platform for driving schools to manage customers, track expiring documents, and grow revenue.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <div key={i} className="group p-8 rounded-2xl bg-[#0f0f0f] border border-white/5 hover:border-amber-400/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(251,191,36,0.05)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-3xl group-hover:bg-amber-400/10 transition-colors"></div>
                  <div className="mb-6 inline-flex p-3 rounded-xl bg-[#1a1a1a] border border-white/5 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                  <p className="text-gray-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
           {/* Abstract lines */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#d4af37 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
           
           <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Up and Running in <span className="text-amber-400">Minutes</span></h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                No IT team needed. No complex setup. Just sign up and start managing.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"></div>
              
              {[
                { step: "01", title: "Create Your School", desc: "Sign up and set up your driving school profile in under 2 minutes." },
                { step: "02", title: "Add Students & Fleet", desc: "Import or manually add your active students, vehicles, and documents." },
                { step: "03", title: "Manage & Grow", desc: "Track services, receive alerts, and monitor revenue from your dashboard." },
              ].map((s, i) => (
                <div key={i} className="relative text-center pt-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#141414] border-2 border-amber-400 flex items-center justify-center text-xl font-bold text-amber-400 mb-6 shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                    {s.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-gray-400">{s.desc}</p>
                </div>
              ))}
            </div>
           </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple, Transparent <span className="text-amber-400">Pricing</span></h2>
              <p className="text-gray-400 text-lg">
                Start for free. Upgrade when you need more power. No hidden fees.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
              {/* Starter */}
              <div className="p-8 rounded-3xl bg-[#0f0f0f] border border-white/10">
                <h3 className="text-gray-400 font-semibold tracking-wider uppercase mb-2">Starter</h3>
                <div className="text-4xl font-black text-white mb-4">Free</div>
                <p className="text-sm text-gray-500 mb-8">Perfect for single driving schools getting started.</p>
                <ul className="space-y-4 mb-8">
                  {["1 Driving School", "Up to 100 Students", "Basic Vehicle Management", "Standard Reports"].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-amber-400/50" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="block w-full py-3 px-4 text-center rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors">
                  Get Started Free
                </Link>
              </div>

              {/* Pro */}
              <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-2 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.15)] relative transform md:-translate-y-4">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
                <h3 className="text-amber-400 font-semibold tracking-wider uppercase mb-2">Pro</h3>
                <div className="text-4xl font-black text-white mb-1">₹999<span className="text-xl text-gray-500 font-normal">/mo</span></div>
                <p className="text-sm text-gray-400 mb-8 mt-3">For growing schools that need automation.</p>
                <ul className="space-y-4 mb-8">
                  {["Unlimited Students", "Multi-Vehicle Fleet", "WhatsApp Alerts", "Advanced Analytics", "Priority Support"].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-white font-medium">
                      <CheckCircle2 className="w-5 h-5 text-amber-400" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="block w-full py-4 px-4 text-center rounded-xl font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:shadow-[0_0_25px_rgba(251,191,36,0.5)] transition-all hover:-translate-y-1">
                  Start Pro Trial
                </Link>
              </div>

              {/* Enterprise */}
              <div className="p-8 rounded-3xl bg-[#0f0f0f] border border-white/10">
                <h3 className="text-gray-400 font-semibold tracking-wider uppercase mb-2">Enterprise</h3>
                <div className="text-4xl font-black text-white mb-4">Custom</div>
                <p className="text-sm text-gray-500 mb-8">For chains managing multiple branches.</p>
                <ul className="space-y-4 mb-8">
                  {["Unlimited Schools", "Super Admin Panel", "API Access", "Custom Integrations", "Dedicated Account Mgr"].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-amber-400/50" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login" className="block w-full py-3 px-4 text-center rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-[#0a0a0a]">
          <div className="max-w-3xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Frequently Asked <span className="text-amber-400">Questions</span></h2>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div 
                  key={i} 
                  className={`border ${openFaq === i ? 'border-amber-400/30 bg-[#141414]' : 'border-white/10 bg-[#0f0f0f]'} rounded-2xl overflow-hidden transition-all duration-300`}
                >
                  <button 
                    className="w-full px-6 py-5 text-left flex items-center justify-between font-medium text-white"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-amber-400 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  <div 
                    className={`px-6 text-gray-400 overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 overflow-hidden border-t border-white/5">
           <div className="absolute inset-0 bg-gradient-to-b from-[#141414] to-black"></div>
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[300px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

           <div className="relative max-w-4xl mx-auto px-6 text-center z-10">
             <h2 className="text-4xl md:text-6xl font-black mb-6 text-white">
               Ready to Transform Your <br/> <span className="text-amber-400">Driving School?</span>
             </h2>
             <p className="text-xl text-gray-400 mb-10">
               Join 500+ driving schools already using MotoAdmin to save time, reduce paperwork, and grow their business.
             </p>
             <Link href="/login" className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full font-bold text-lg bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_50px_rgba(251,191,36,0.5)] transition-all hover:-translate-y-1">
               Get Started Free Today
               <ArrowRight className="w-6 h-6" />
             </Link>
           </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
              <div className="flex items-center gap-3">
                 <div className="relative h-20 w-[300px]">
                   <Image src="/icon.png" alt="MotoAdmin" fill className="object-cover object-left opacity-90" />
                 </div>
              </div>
              <div className="flex gap-6 text-sm font-medium text-gray-400">
                <a href="#features" className="hover:text-amber-400 transition-colors">Features</a>
                <a href="#pricing" className="hover:text-amber-400 transition-colors">Pricing</a>
                <a href="#faq" className="hover:text-amber-400 transition-colors">FAQ</a>
                <Link href="/login" className="hover:text-amber-400 transition-colors">Log In</Link>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600 border-t border-white/5 pt-8">
              <p>© {year} MotoAdmin. All rights reserved. <br className="md:hidden" />Made with ♥ for India&apos;s driving schools.</p>
              <p>India&apos;s Premium Driving School Management Platform</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
