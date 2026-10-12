"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { IconMail, IconPhone, IconClock, IconLoader2, IconArrowRight } from "@tabler/icons-react";
import { fetchApi } from "@/lib/utils";

const SUPPORT_EMAIL = "support@mwpsupplements.com";
const SUPPORT_PHONE = "562-524-3557";
const SUPPORT_PHONE_HREF = "tel:+15625243557";

const SUBJECTS = [
  "Order support",
  "Product guidance",
  "Subscription question",
  "Wholesale / retail inquiry",
  "Ingredient question",
  "Other",
];

const PATHS = [
  { title: "Order help", text: "Tracking, delivery, returns", subject: "Order support" },
  { title: "Formula guidance", text: "Find the right fit for you", subject: "Product guidance" },
  { title: "Subscriptions", text: "Manage or update your plan", subject: "Subscription question" },
  { title: "Partner with MWP", text: "Wholesale and retail inquiries", subject: "Wholesale / retail inquiry" },
];

const EMPTY = { name: "", email: "", phone: "", subject: SUBJECTS[0], message: "" };

const fieldClass =
  "w-full rounded-xl border border-[#e3d7c5] bg-white px-4 py-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900";
const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-[#8a6a35]";

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const formRef = useRef(null);

  const change = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFeedback(null);
  };

  const pickPath = (subject) => {
    setForm((f) => ({ ...f, subject }));
    setFeedback(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!form.name.trim() || !form.message.trim()) {
      setFeedback({ success: false, message: "Please enter your name and message." });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetchApi("/content/contact", {
        method: "POST",
        body: JSON.stringify({ ...form, name: form.name.trim(), email: form.email.trim(), message: form.message.trim() }),
      });
      setFeedback({ success: true, message: response.data?.message || "Your message has been sent. Our team will get back to you by email." });
      setForm(EMPTY);
    } catch (error) {
      setFeedback({ success: false, message: error.message || "Your message couldn't be sent. Try again or contact us by email." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#f6f1ea] text-neutral-900">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        {/* Intro */}
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#8a6a35] sm:text-xs">
          We are here for your next level
        </p>
        <h1 className="mt-4 text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
          Let&apos;s talk
          <br />
          about <span className="text-[#8f6f3a]">your</span>
          <br />
          <span className="text-[#8f6f3a]">power.</span>
        </h1>

        <div className="mt-8 grid items-end gap-6 lg:grid-cols-[1.2fr_1fr]">
          <p className="max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Questions about your order, ingredients, subscriptions, or choosing the right MWP formula?
            Our team is ready to help with clear answers and real support.
          </p>
          <p className="border-l border-neutral-400/60 pl-4 text-sm leading-relaxed text-neutral-600">
            Premium performance deserves personal support.
            <br />
            <strong className="font-semibold">Send us a message and we&apos;ll get back to you during support hours.</strong>
          </p>
        </div>

        {/* Form + side cards */}
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section
            ref={formRef}
            className="relative overflow-hidden rounded-[2rem] border border-[#e8dccb] bg-white p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)] sm:p-8"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 -top-6 select-none text-[11rem] font-black leading-none tracking-tighter text-[#f6f1ea] sm:text-[14rem]"
            >
              MWP
            </span>
            <div className="relative">
              <h2 className="text-2xl font-bold tracking-tight">Start a conversation</h2>
              <p className="mt-1 text-xs text-neutral-500">Tell us what you need help with. We&apos;ll route your message to the right team.</p>

              <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className={labelClass}>Your name</label>
                  <input id="contact-name" name="name" autoComplete="name" required maxLength={100} value={form.name} onChange={change} className={fieldClass} placeholder="Full name" />
                </div>
                <div>
                  <label htmlFor="contact-email" className={labelClass}>Email address</label>
                  <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={change} className={fieldClass} placeholder="you@example.com" />
                </div>
                <div>
                  <label htmlFor="contact-phone" className={labelClass}>Phone number</label>
                  <input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={change} className={fieldClass} placeholder="Optional" />
                </div>
                <div>
                  <label htmlFor="contact-subject" className={labelClass}>How can we help?</label>
                  <select id="contact-subject" name="subject" value={form.subject} onChange={change} className={fieldClass}>
                    {SUBJECTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="contact-message" className={labelClass}>Your message</label>
                  <textarea id="contact-message" name="message" rows={5} required maxLength={5000} value={form.message} onChange={change} className={`${fieldClass} resize-y`} placeholder="Write your message here..." />
                </div>
                <div className="sm:col-span-2">
                  <button
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111214] px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
                  >
                    {loading && <IconLoader2 className="h-4 w-4 animate-spin" />}
                    {loading ? "Sending..." : <>Send message <IconArrowRight size={16} /></>}
                  </button>
                  <p className="mt-4 text-center text-[11px] text-neutral-500">
                    By contacting us, you agree to receive a reply from MWP Supplements.{" "}
                    <Link className="underline underline-offset-2" href="/privacy-policy">Privacy policy</Link>
                  </p>
                </div>
              </form>

              {feedback && (
                <p
                  role={feedback.success ? "status" : "alert"}
                  className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                    feedback.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-neutral-300 bg-neutral-100 text-neutral-800"
                  }`}
                >
                  {feedback.message}
                </p>
              )}
            </div>
          </section>

          <div className="grid content-start gap-6">
            <section className="relative overflow-hidden rounded-[2rem] bg-[#111214] p-6 text-white sm:p-8">
              <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-16 h-56 w-56 rounded-full border border-[#c9a15a]/30" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#e5c56a]">Direct support</p>
              <h2 className="mt-3 max-w-xs text-3xl font-bold leading-tight tracking-tight">Good questions deserve good answers.</h2>
              <ul className="mt-6 divide-y divide-white/10 border-t border-white/10">
                {[
                  { Icon: IconMail, title: "Email our team", value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
                  { Icon: IconPhone, title: "Call us", value: SUPPORT_PHONE, href: SUPPORT_PHONE_HREF },
                  { Icon: IconClock, title: "Support hours", value: "Monday–Friday · 9:00 AM–6:00 PM" },
                ].map(({ Icon, title, value, href }) => {
                  const inner = (
                    <>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c9a15a] text-[#111214]">
                        <Icon size={18} stroke={2} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">{title}</span>
                        <span className="block text-xs text-neutral-300">{value}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={title}>
                      {href ? (
                        <a href={href} className="flex items-center gap-4 py-4 transition-opacity hover:opacity-80">{inner}</a>
                      ) : (
                        <div className="flex items-center gap-4 py-4">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-[2rem] border border-[#e8dccb] bg-white p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.2)] sm:p-8">
              <h2 className="text-2xl font-bold tracking-tight">Choose your path</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {PATHS.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => pickPath(p.subject)}
                    className="rounded-2xl border border-[#e8dccb] px-4 py-4 text-left transition-colors hover:border-neutral-900"
                  >
                    <span className="block text-[13px] font-bold">{p.title}</span>
                    <span className="mt-1 block text-[11px] text-neutral-500">{p.text}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 text-[11px] text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Mailing address: 531 Main Street, PMB 1127, El Segundo, CA 90245-3006</p>
          <p className="font-bold uppercase tracking-[0.15em] text-[#8a6a35]">MWP Supplements LLC</p>
        </div>
      </div>
    </main>
  );
}
