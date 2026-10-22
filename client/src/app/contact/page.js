"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { IconMail, IconPhone, IconClock, IconMapPin, IconArrowRight, IconCircleCheck, IconPackage, IconFlask2, IconRepeat, IconBuildingStore } from "@tabler/icons-react";
import { fetchApi } from "@/lib/utils";
import { formatUsPhone, isValidUsPhone } from "@/lib/us";
import { SITE_CONTACT } from "@/lib/siteContact";
import { Alert, Field, SubmitButton, isEmail } from "@/components/auth/AuthUI";

const SUBJECTS = ["Order support", "Product guidance", "Subscription question", "Wholesale / retail inquiry", "Ingredient question", "Other"];

const PATHS = [
  { Icon: IconPackage, title: "Order help", text: "Tracking, delivery, returns", subject: "Order support" },
  { Icon: IconFlask2, title: "Formula guidance", text: "Find the right fit for you", subject: "Product guidance" },
  { Icon: IconRepeat, title: "Subscriptions", text: "Manage or update your plan", subject: "Subscription question" },
  { Icon: IconBuildingStore, title: "Partner with MWP", text: "Wholesale and retail inquiries", subject: "Wholesale / retail inquiry" },
];

const EMPTY = { name: "", email: "", phone: "", subject: SUBJECTS[0], message: "", website: "" };
const MAX_MESSAGE = 2000;

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const formRef = useRef(null);

  const rules = {
    name: (v) => (v.trim().length < 2 ? "Please enter your name" : ""),
    email: (v) => (!v.trim() ? "Enter your email so we can reply" : !isEmail(v) ? "That does not look like an email address" : ""),
    phone: (v) => (v && !isValidUsPhone(v) ? "Use a US number like (562) 524-3557, or leave it empty" : ""),
    message: (v) => (v.trim().length < 10 ? "Tell us a little more (at least 10 characters)" : ""),
  };
  const errorOf = (name) => (touched[name] ? rules[name](form[name]) : "");

  const change = (e) => {
    const { name } = e.target;
    const value = name === "phone" ? formatUsPhone(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [name]: value }));
    setFormError("");
  };
  const blur = (e) => setTouched((t) => ({ ...t, [e.target.name]: true }));

  const pickPath = (subject) => {
    setForm((f) => ({ ...f, subject }));
    setSentTo("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setTouched({ name: true, email: true, phone: true, message: true });
    if (Object.keys(rules).some((k) => rules[k](form[k]))) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    // hidden field that real visitors never fill: bots do
    if (form.website) {
      setSentTo(form.email);
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await fetchApi("/content/contact", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone || undefined,
          subject: form.subject,
          message: form.message.trim(),
        }),
      });
      setSentTo(form.email.trim());
      setForm(EMPTY);
      setTouched({});
    } catch (error) {
      setFormError(error?.message || `Your message could not be sent. Please try again or email ${SITE_CONTACT.email}.`);
    } finally {
      setSubmitting(false);
    }
  };

  const f = (name) => ({ name, value: form[name], onChange: change, onBlur: blur, error: errorOf(name), disabled: submitting });

  return (
    <main className="bg-white text-[#12213F]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0B1530] via-[#12213F] to-[#1B2D52] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[#D4A437]/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-[#B3001B]/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-8 sm:pb-28 sm:pt-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#E6C26A]">Contact MWP</p>
          <h1 className="mt-4 max-w-2xl text-[38px] font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Let&apos;s talk about <span className="font-normal italic text-[#E6C26A]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>your power.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#CDD4E6] sm:text-lg">
            Questions about an order, an ingredient or which formula fits you? Our US-based team replies by email during support hours.
          </p>
        </div>
      </section>

      {/* Form + info */}
      <section className="relative z-10 mx-auto -mt-14 max-w-6xl px-5 pb-16 sm:-mt-16 sm:px-8 sm:pb-20">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div ref={formRef} className="rounded-[1.75rem] border border-[#E6DFC9] bg-white p-6 shadow-[0_30px_60px_-44px_#12213F88] sm:p-8">
            {sentTo ? (
              <div className="py-6 text-center">
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#EAF7EF] text-[#1F8A4C]"><IconCircleCheck size={44} stroke={1.3} /></span>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight">Message sent</h2>
                <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-[#5A6275]">
                  Thank you. We will reply to <strong className="text-[#12213F]">{sentTo}</strong> during support hours (Monday to Friday, 9 AM to 6 PM Pacific).
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button type="button" onClick={() => setSentTo("")} className="rounded-full border border-[#12213F]/25 px-6 py-3 text-sm font-semibold transition-colors hover:border-[#A8741F] hover:text-[#A8741F]">
                    Send another message
                  </button>
                  <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-[#12213F] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B3001B]">
                    Browse formulas <IconArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#A8741F]">Send a message</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Start a conversation</h2>
                <p className="mt-1.5 text-sm text-[#5A6275]">Tell us what you need and we will send it to the right person.</p>

                <form onSubmit={submit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
                  {formError && <Alert type="error" className="sm:col-span-2">{formError}</Alert>}

                  <Field label="Your name" autoComplete="name" maxLength={100} placeholder="Jane Doe" {...f("name")} />
                  <Field label="Email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" {...f("email")} />
                  <Field label="Phone (optional)" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={14} placeholder="(562) 524-3557" {...f("phone")} />

                  <div>
                    <label htmlFor="contact-subject" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4A5470]">How can we help?</label>
                    <select
                      id="contact-subject"
                      name="subject"
                      value={form.subject}
                      onChange={change}
                      disabled={submitting}
                      className="h-[52px] w-full rounded-xl border border-[#D9D3BF] bg-white px-4 text-[15px] text-[#12213F] outline-none transition-all focus:border-[#12213F] focus:ring-4 focus:ring-[#12213F]/10 disabled:bg-[#F3F4F7]"
                    >
                      {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="contact-message" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4A5470]">Your message</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={6}
                      maxLength={MAX_MESSAGE}
                      value={form.message}
                      onChange={change}
                      onBlur={blur}
                      disabled={submitting}
                      aria-invalid={errorOf("message") ? "true" : undefined}
                      placeholder="Write your message here. For order questions, include your order number."
                      className={`w-full resize-y rounded-xl border bg-white px-4 py-3.5 text-[15px] leading-relaxed text-[#12213F] outline-none transition-all placeholder:text-[#8A90A3] disabled:bg-[#F3F4F7] ${
                        errorOf("message") ? "border-[#D8434F] bg-[#FFF8F8] focus:ring-4 focus:ring-[#B3001B]/10" : "border-[#D9D3BF] focus:border-[#12213F] focus:ring-4 focus:ring-[#12213F]/10"
                      }`}
                    />
                    <div className="mt-1.5 flex items-start justify-between gap-3 text-[12.5px]">
                      <span className="font-medium text-[#B3001B]">{errorOf("message")}</span>
                      <span className="shrink-0 text-[#6B7388]">{form.message.length}/{MAX_MESSAGE}</span>
                    </div>
                  </div>

                  {/* honeypot */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label>Website<input tabIndex={-1} autoComplete="off" name="website" value={form.website} onChange={change} /></label>
                  </div>

                  <div className="sm:col-span-2">
                    <SubmitButton loading={submitting} loadingText="Sending your message...">
                      Send message <IconArrowRight size={18} stroke={1.8} />
                    </SubmitButton>
                    <p className="mt-3 text-center text-[12px] text-[#6B7388]">
                      By contacting us you agree to receive a reply from MWP Supplements. <Link className="underline underline-offset-2" href="/privacy-policy">Privacy policy</Link>
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>

          <div className="grid content-start gap-6">
            <section className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#12213F] to-[#0B1530] p-6 text-white sm:p-8">
              <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#D4A437]/25 blur-3xl" />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.3em] text-[#E6C26A]">Direct support</p>
              <h2 className="relative mt-2 text-2xl font-semibold leading-tight tracking-tight">Prefer to reach us directly?</h2>
              <ul className="relative mt-5 divide-y divide-white/10 border-t border-white/10">
                {[
                  { Icon: IconMail, title: "Email", value: SITE_CONTACT.email, href: `mailto:${SITE_CONTACT.email}` },
                  { Icon: IconPhone, title: "Call", value: SITE_CONTACT.phone, href: SITE_CONTACT.phoneHref },
                  { Icon: IconClock, title: "Support hours", value: SITE_CONTACT.hours },
                  { Icon: IconMapPin, title: "Mailing address", value: SITE_CONTACT.mailing },
                ].map(({ Icon, title, value, href }) => {
                  const inner = (
                    <>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#D4A437] text-[#12213F]"><Icon size={18} stroke={1.8} /></span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{title}</span>
                        <span className="block break-words text-[13px] text-[#CDD4E6]">{value}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={title}>
                      {href ? <a href={href} className="flex items-center gap-4 py-3.5 transition-opacity hover:opacity-80">{inner}</a> : <div className="flex items-center gap-4 py-3.5">{inner}</div>}
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-[1.75rem] border border-[#E6DFC9] bg-[#FAF8F2] p-6 sm:p-8">
              <h2 className="text-xl font-semibold tracking-tight">Choose your path</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {PATHS.map(({ Icon, title, text, subject }) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => pickPath(subject)}
                    className={`group rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#D4A437] ${form.subject === subject ? "border-[#A8741F] ring-2 ring-[#D4A437]/30" : "border-[#E6DFC9]"}`}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#12213F] text-[#E6C26A]"><Icon size={18} stroke={1.6} /></span>
                    <span className="mt-3 block text-[14px] font-semibold">{title}</span>
                    <span className="mt-0.5 block text-[12.5px] text-[#5A6275]">{text}</span>
                  </button>
                ))}
              </div>
              <p className="mt-5 text-[13px] text-[#5A6275]">
                Looking for quick answers? Visit the <Link href="/faqs" className="font-semibold text-[#A8741F] underline underline-offset-4">FAQs</Link>.
              </p>
            </section>
          </div>
        </div>

        <p className="mt-10 text-center text-[11px] font-medium uppercase tracking-[0.25em] text-[#6B7388]">{SITE_CONTACT.company}</p>
      </section>
    </main>
  );
}
