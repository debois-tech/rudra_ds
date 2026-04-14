"use client";

import Link from "next/link";
import Image from "next/image";

const BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "https://motoadmin.in";

const features = [
  {
    icon: "👨‍🎓",
    title: "Student Management",
    desc: "Track student progress, contact details, schedules, and documents in one place. Never lose track of a learner again.",
  },
  {
    icon: "🚗",
    title: "Fleet & Vehicle Management",
    desc: "Manage your entire vehicle fleet, PUC, insurance, and fitness certificates with automated expiry alerts.",
  },
  {
    icon: "📋",
    title: "Service & Scheduling",
    desc: "Create service records for both driving and licence services. Assign instructors, track payments, and follow up.",
  },
  {
    icon: "💰",
    title: "Revenue Tracking",
    desc: "Monitor total revenue, outstanding payments, and business performance from your real-time dashboard.",
  },
  {
    icon: "📄",
    title: "Document Tracking",
    desc: "Track expiring licences, insurance, PUCs with instant status badges — never miss an important renewal.",
  },
  {
    icon: "🏢",
    title: "Multi-School Support",
    desc: "Run a chain of driving schools? MotoAdmin supports multiple organizations with strict tenant isolation.",
  },
];

const stats = [
  { value: "500+", label: "Driving Schools" },
  { value: "50,000+", label: "Students Managed" },
  { value: "2 Min", label: "Setup Time" },
  { value: "99.9%", label: "Uptime SLA" },
];

const faqs = [
  {
    q: "What is MotoAdmin?",
    a: "MotoAdmin is a cloud-based driving school management platform (SaaS) that helps driving school owners manage their students, fleet, documents, services, and revenue from one central dashboard.",
  },
  {
    q: "Is MotoAdmin free to use?",
    a: "MotoAdmin offers a free plan for small driving schools. Premium plans with advanced features like multi-branch support, WhatsApp notifications, and analytics are available at affordable pricing.",
  },
  {
    q: "Does MotoAdmin work on mobile?",
    a: "Yes! MotoAdmin is fully responsive and works seamlessly on mobile, tablet, and desktop browsers. No app installation required.",
  },
  {
    q: "Can I manage multiple driving schools?",
    a: "Absolutely. MotoAdmin's Super Admin panel lets you manage multiple driving school branches from a single login with complete data isolation between each school.",
  },
  {
    q: "How is MotoAdmin different from other driving school software?",
    a: "MotoAdmin is built specifically for Indian driving schools with RTO-friendly document tracking, Indian Rupee billing, WhatsApp notifications, and multi-tenant architecture. It's modern, fast, and designed to scale.",
  },
  {
    q: "Is my data secure on MotoAdmin?",
    a: "Yes. All data is protected using Row-Level Security (RLS) at the database level. Each driving school's data is completely isolated and only accessible to authorized users.",
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
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    areaServed: "IN",
    availableLanguage: ["English", "Hindi"],
  },
};

export default function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <>
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
      />

      <div
        className="min-h-screen bg-white"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* ─── NAV ─── */}
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderBottom: "1px solid #f1f0ff",
            padding: "0 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Image
              src="/logo.png"
              alt="MotoAdmin Logo"
              width={32}
              height={32}
              style={{ objectFit: "contain" }}
            />
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "#1e1b4b" }}>
              MotoAdmin
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <a href="#features" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
              Features
            </a>
            <a href="#pricing" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
              Pricing
            </a>
            <a href="#faq" style={{ color: "#64748b", textDecoration: "none", fontSize: "0.9rem", fontWeight: 500 }}>
              FAQ
            </a>
            <Link
              href="/login"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#fff",
                padding: "0.5rem 1.25rem",
                borderRadius: "0.6rem",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              Get Started Free →
            </Link>
          </div>
        </nav>

        {/* ─── HERO ─── */}
        <section
          style={{
            background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 40%, #e0e7ff 100%)",
            padding: "6rem 2rem",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", top: "-80px", right: "-80px",
            width: "400px", height: "400px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)",
          }} />
          <div style={{
            position: "absolute", bottom: "-60px", left: "-60px",
            width: "300px", height: "300px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
          }} />

          <div style={{ position: "relative", maxWidth: "800px", margin: "0 auto" }}>
            <span style={{
              display: "inline-block", background: "#ede9fe", color: "#7c3aed",
              padding: "0.35rem 1rem", borderRadius: "999px", fontSize: "0.8rem",
              fontWeight: 700, letterSpacing: "0.05em", marginBottom: "1.5rem",
              border: "1px solid #c4b5fd",
            }}>
              🏆 India&apos;s #1 Driving School Management Platform
            </span>

            <h1 style={{
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              color: "#1e1b4b",
              marginBottom: "1.5rem",
            }}>
              The Smartest Way to Run<br />
              <span style={{
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                Your Driving School
              </span>
            </h1>

            <p style={{
              fontSize: "1.2rem", color: "#475569", lineHeight: 1.7,
              maxWidth: "600px", margin: "0 auto 2.5rem",
            }}>
              MotoAdmin is a modern <strong>driving school management platform</strong> that
              helps you manage students, vehicles, documents, services &amp; revenue — all from
              one powerful dashboard.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/login" style={{
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff",
                padding: "0.9rem 2rem", borderRadius: "0.75rem", textDecoration: "none",
                fontWeight: 700, fontSize: "1rem",
                boxShadow: "0 8px 25px rgba(124,58,237,0.35)",
              }}>
                🚀 Start for Free — No Credit Card
              </Link>
              <a href="#features" style={{
                background: "#fff", color: "#7c3aed",
                padding: "0.9rem 2rem", borderRadius: "0.75rem", textDecoration: "none",
                fontWeight: 700, fontSize: "1rem", border: "2px solid #c4b5fd",
              }}>
                See Features →
              </a>
            </div>

            <p style={{ marginTop: "1.5rem", color: "#94a3b8", fontSize: "0.85rem" }}>
              ✅ Free forever for 1 school &nbsp;·&nbsp; ✅ No setup fees &nbsp;·&nbsp; ✅ Setup in 2 minutes
            </p>
          </div>
        </section>

        {/* ─── STATS ─── */}
        <section style={{ background: "#1e1b4b", padding: "3rem 2rem" }}>
          <div style={{
            maxWidth: "900px", margin: "0 auto", textAlign: "center",
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "2rem",
          }}>
            {stats.map((s, i) => (
              <div key={i}>
                <p style={{ fontSize: "2.5rem", fontWeight: 900, color: "#a78bfa", lineHeight: 1 }}>{s.value}</p>
                <p style={{ color: "#c4b5fd", fontSize: "0.95rem", marginTop: "0.4rem", fontWeight: 500 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section id="features" style={{ padding: "6rem 2rem", background: "#fafaf8" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 900, color: "#1e1b4b", marginBottom: "1rem" }}>
                Everything Your Driving School Needs
              </h2>
              <p style={{ color: "#64748b", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
                One platform. Zero complexity. Built specifically for Indian driving schools with RTO-friendly workflows.
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
              {features.map((f, i) => (
                <article key={i} style={{
                  background: "#fff", borderRadius: "1rem", padding: "2rem",
                  border: "1px solid #e8e4ff", boxShadow: "0 2px 12px rgba(124,58,237,0.06)",
                }}>
                  <div style={{ fontSize: "2.2rem", marginBottom: "1rem" }}>{f.icon}</div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1e1b4b", marginBottom: "0.6rem" }}>{f.title}</h3>
                  <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.6 }}>{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section style={{ padding: "6rem 2rem", background: "#fff" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 900, color: "#1e1b4b", marginBottom: "1rem" }}>
              Up and Running in Minutes
            </h2>
            <p style={{ color: "#64748b", fontSize: "1rem", marginBottom: "3rem" }}>
              No IT team needed. No complex setup. Just sign up and start managing your driving school.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem" }}>
              {[
                { step: "01", title: "Create Your School", desc: "Sign up and set up your driving school profile in under 2 minutes." },
                { step: "02", title: "Add Students & Vehicles", desc: "Import or add your students, fleet vehicles, and documents instantly." },
                { step: "03", title: "Manage Everything", desc: "Track services, payments, and documents from your live dashboard." },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #ede9fe, #c7d2fe)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.3rem", fontWeight: 900, color: "#7c3aed",
                    margin: "0 auto 1rem",
                  }}>{s.step}</div>
                  <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#1e1b4b", marginBottom: "0.5rem" }}>{s.title}</h3>
                  <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="pricing" style={{ padding: "6rem 2rem", background: "#f5f3ff" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 900, color: "#1e1b4b", marginBottom: "1rem" }}>
              Simple, Transparent Pricing
            </h2>
            <p style={{ color: "#64748b", marginBottom: "3rem", fontSize: "1rem" }}>
              No hidden fees. No surprises. Cancel anytime.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
              {[
                {
                  plan: "Starter", price: "Free",
                  desc: "Perfect for single driving schools just getting started.",
                  features: ["1 Driving School", "Up to 100 Students", "Vehicle Management", "Basic Reports"],
                  cta: "Get Started Free", highlight: false,
                },
                {
                  plan: "Pro", price: "₹999/mo",
                  desc: "For growing schools that need more power and automation.",
                  features: ["Unlimited Students", "Multi-Vehicle Fleet", "WhatsApp Alerts", "Advanced Analytics", "Priority Support"],
                  cta: "Start Pro Trial", highlight: true,
                },
                {
                  plan: "Enterprise", price: "Custom",
                  desc: "For chains and franchises managing multiple branches.",
                  features: ["Unlimited Schools", "Super Admin Panel", "API Access", "Custom Integrations", "Dedicated Support"],
                  cta: "Contact Us", highlight: false,
                },
              ].map((p, i) => (
                <div key={i} style={{
                  background: p.highlight ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "#fff",
                  borderRadius: "1rem", padding: "2rem",
                  border: p.highlight ? "none" : "1px solid #e8e4ff",
                  boxShadow: p.highlight ? "0 12px 40px rgba(124,58,237,0.35)" : "0 2px 10px rgba(0,0,0,0.05)",
                  color: p.highlight ? "#fff" : "#1e1b4b",
                  textAlign: "left",
                }}>
                  <p style={{ fontWeight: 700, fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.plan}</p>
                  <p style={{ fontSize: "2.2rem", fontWeight: 900, marginBottom: "0.5rem" }}>{p.price}</p>
                  <p style={{ fontSize: "0.9rem", opacity: 0.75, marginBottom: "1.5rem" }}>{p.desc}</p>
                  <ul style={{ listStyle: "none", padding: 0, marginBottom: "2rem" }}>
                    {p.features.map((f, j) => (
                      <li key={j} style={{ padding: "0.4rem 0", fontSize: "0.9rem", opacity: 0.9 }}>✓ {f}</li>
                    ))}
                  </ul>
                  <Link href="/login" style={{
                    display: "block", textAlign: "center",
                    background: p.highlight ? "#fff" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                    color: p.highlight ? "#7c3aed" : "#fff",
                    padding: "0.8rem", borderRadius: "0.6rem",
                    textDecoration: "none", fontWeight: 700, fontSize: "0.95rem",
                  }}>
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" style={{ padding: "6rem 2rem", background: "#fff" }}>
          <div style={{ maxWidth: "780px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 900, color: "#1e1b4b", marginBottom: "0.75rem", textAlign: "center" }}>
              Frequently Asked Questions
            </h2>
            <p style={{ color: "#64748b", textAlign: "center", marginBottom: "3rem" }}>
              Everything you need to know about MotoAdmin driving school management platform.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {faqs.map((faq, i) => (
                <details key={i} style={{
                  border: "1px solid #e8e4ff", borderRadius: "0.75rem",
                  padding: "1.25rem 1.5rem", background: "#fafaf8",
                }}>
                  <summary style={{
                    fontWeight: 700, fontSize: "1rem", color: "#1e1b4b",
                    cursor: "pointer", listStyle: "none",
                    display: "flex", justifyContent: "space-between",
                  }}>
                    {faq.q}
                    <span style={{ color: "#7c3aed", marginLeft: "1rem", flexShrink: 0 }}>▼</span>
                  </summary>
                  <p style={{ marginTop: "0.75rem", color: "#475569", lineHeight: 1.7, fontSize: "0.95rem" }}>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section style={{
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          padding: "5rem 2rem", textAlign: "center",
        }}>
          <h2 style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 900, color: "#fff", marginBottom: "1rem" }}>
            Ready to Transform Your Driving School?
          </h2>
          <p style={{ color: "#c4b5fd", fontSize: "1.1rem", maxWidth: "540px", margin: "0 auto 2.5rem" }}>
            Join 500+ driving schools already using MotoAdmin to save time, reduce paperwork, and grow their business.
          </p>
          <Link href="/login" style={{
            display: "inline-block", background: "#fff", color: "#7c3aed",
            padding: "1rem 2.5rem", borderRadius: "0.75rem", textDecoration: "none",
            fontWeight: 700, fontSize: "1.05rem", boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
          }}>
            🚀 Get Started Free Today
          </Link>
        </section>

        {/* ─── FOOTER ─── */}
        <footer style={{ background: "#0f0d1f", color: "#94a3b8", padding: "3rem 2rem", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "1.5rem" }}>
            <Image
              src="/logo.png"
              alt="MotoAdmin Logo"
              width={28}
              height={28}
              style={{ objectFit: "contain", filter: "brightness(1.5)" }}
            />
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#e2e8f0" }}>MotoAdmin</span>
          </div>
          <p style={{ fontSize: "0.9rem", marginBottom: "1.5rem", color: "#64748b" }}>
            India&apos;s #1 Driving School Management Platform — Manage Students, Fleet, Documents &amp; Revenue
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap", fontSize: "0.85rem", marginBottom: "2rem" }}>
            <a href="#features" style={{ color: "#64748b", textDecoration: "none" }}>Features</a>
            <a href="#pricing" style={{ color: "#64748b", textDecoration: "none" }}>Pricing</a>
            <a href="#faq" style={{ color: "#64748b", textDecoration: "none" }}>FAQ</a>
            <Link href="/login" style={{ color: "#64748b", textDecoration: "none" }}>Login</Link>
          </div>
          <p style={{ fontSize: "0.8rem", color: "#334155" }}>
            © {year} MotoAdmin. All rights reserved. | driving school management platform | moto admin
          </p>
        </footer>
      </div>
    </>
  );
}
