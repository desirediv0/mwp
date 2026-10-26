"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconUser, IconRepeat, IconMail, IconLock, IconMapPin, IconPackage, IconRefresh, IconHeart, IconTruckDelivery,
  IconShieldCheck, IconFileText, IconHelp, IconLogout, IconTrash, IconChevronRight, IconCamera, IconAlertTriangle,
  IconLoader2, IconX, IconCheck, IconCertificate,
} from "@tabler/icons-react";
import { useAuth } from "@/lib/auth-context";
import { fetchApi } from "@/lib/utils";
import { formatUsPhone } from "@/lib/us";
import { ProtectedRoute } from "@/components/protected-route";
import { ClientOnly } from "@/components/client-only";
import "./settings.css";

function Row({ icon: Icon, title, sub, href, onClick, danger, right }) {
  const body = (
    <>
      <span className="mwp-set-ico"><Icon size={20} stroke={1.5} /></span>
      <span className="mwp-set-txt">
        <strong>{title}</strong>
        {sub ? <small>{sub}</small> : null}
      </span>
      {right || <IconChevronRight size={18} stroke={1.5} className="mwp-set-chev" />}
    </>
  );
  const cls = `mwp-set-row${danger ? " danger" : ""}`;
  return href ? <Link href={href} className={cls}>{body}</Link> : <button type="button" onClick={onClick} className={cls}>{body}</button>;
}

const Group = ({ title, children }) => (
  <section className="mwp-set-group">
    {title && <h2>{title}</h2>}
    <div className="mwp-set-card">{children}</div>
  </section>
);

export default function AccountPage() {
  const { user, logout, updateProfile } = useAuth();
  const router = useRouter();
  const fileRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [counts, setCounts] = useState({ addresses: null, orders: null });
  const [imgFailed, setImgFailed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name || "", phone: user.phone ? formatUsPhone(user.phone) : "" });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchApi("/users/addresses", { credentials: "include" }).then((r) => setCounts((c) => ({ ...c, addresses: (r.data.addresses || []).length }))).catch(() => {});
    fetchApi("/users/orders?limit=1", { credentials: "include" }).then((r) => setCounts((c) => ({ ...c, orders: r.data.pagination?.total ?? 0 }))).catch(() => {});
  }, [user?.id]);

  const photo = !imgFailed && (user?.profileImageUrl || user?.profileImage);
  const initials = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();
  const emailVerified = user?.otpVerified !== false;
  const noPassword = user?.hasPassword === false;

  const save = async (e) => {
    e.preventDefault();
    setFormError("");
    const name = form.name.trim();
    if (name.length < 2) return setFormError("Enter your full name");
    setSaving(true);
    try {
      await updateProfile({ name, phone: form.phone.trim() });
      setEditing(false);
      toast.success("Profile updated");
    } catch (err) {
      setFormError(err.message || "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return toast.error("Choose an image under 5 MB");
    setUploading(true);
    try {
      await updateProfile({ name: user.name || "", profileImage: file });
      setImgFailed(false);
      toast.success("Photo updated");
    } catch (err) {
      toast.error(err.message || "Could not upload the photo");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    setUploading(true);
    try {
      await updateProfile({ removeImage: true });
      toast.success("Photo removed");
    } catch (err) {
      toast.error(err.message || "Could not remove the photo");
    } finally {
      setUploading(false);
    }
  };

  const verifyEmail = async () => {
    setVerifying(true);
    try {
      await fetchApi("/users/resend-verification", { method: "POST", body: JSON.stringify({ email: user.email }) });
      router.push(`/verify-otp?email=${encodeURIComponent(user.email)}`);
    } catch (err) {
      toast.error(err.message || "Could not send the code. Try again in a minute.");
      setVerifying(false);
    }
  };

  const requestDelete = async () => {
    try {
      await fetchApi("/users/request-account-deletion", { method: "POST", credentials: "include" });
      setConfirmDelete(false);
      toast.success("Check your email for a link to confirm deleting your account.");
    } catch (err) {
      toast.error(err.message || "Could not start account deletion");
    }
  };

  const signOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <ProtectedRoute>
      <ClientOnly>
        <div>
          <h1 className="mwp-set-title">Settings</h1>

          <div className="mwp-set-profile">
            <button type="button" className="mwp-set-avatar" onClick={() => fileRef.current?.click()} aria-label="Change profile photo" disabled={uploading}>
              {photo ? <img src={photo} alt="" onError={() => setImgFailed(true)} /> : <span>{initials}</span>}
              <i>{uploading ? <IconLoader2 size={14} className="animate-spin" /> : <IconCamera size={14} />}</i>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
            <div className="mwp-set-id">
              <strong>{user?.name || "Add your name"}</strong>
              <span>{user?.phone ? formatUsPhone(user.phone) : "Add a phone number"}</span>
              <span className="mwp-set-mail">{user?.email}</span>
            </div>
            <button type="button" className="mwp-set-edit" onClick={() => setEditing(true)}>Edit</button>
          </div>

          {!emailVerified && (
            <button type="button" className="mwp-set-verify" onClick={verifyEmail} disabled={verifying}>
              <IconAlertTriangle size={22} stroke={1.6} />
              <span><strong>Verify your email</strong><small>For added security and order updates</small></span>
              {verifying ? <IconLoader2 size={18} className="animate-spin" /> : <IconChevronRight size={18} />}
            </button>
          )}

          <Group title="Account">
            <Row icon={IconUser} title="Personal info" sub="Name and phone number" onClick={() => setEditing(true)} />
            <Row
              icon={IconMail}
              title="Email"
              sub={user?.email}
              right={<span className={`mwp-set-pill ${emailVerified ? "ok" : "warn"}`}>{emailVerified ? "Verified" : "Not verified"}</span>}
              onClick={emailVerified ? () => toast.info("Contact support to change your email address") : verifyEmail}
            />
            <Row
              icon={IconLock}
              title={noPassword ? "Set a password" : "Password"}
              sub={noPassword ? "You checked out as a guest and have no password yet" : "Change your password"}
              href="/account/change-password"
            />
          </Group>

          <Group title="Orders and shopping">
            <Row icon={IconPackage} title="Orders" sub={counts.orders == null ? "Track and view your orders" : `${counts.orders} ${counts.orders === 1 ? "order" : "orders"}`} href="/account/orders" />
            <Row icon={IconMapPin} title="Addresses" sub={counts.addresses == null ? "Delivery addresses" : counts.addresses ? `${counts.addresses} saved` : "Add a delivery address"} href="/account/addresses" />
            <Row icon={IconRepeat} title="Subscriptions" sub="Monthly deliveries. Skip or cancel any time" href="/account/subscriptions" />
            <Row icon={IconRefresh} title="Returns" sub="Request and track returns" href="/account/returns" />
            <Row icon={IconHeart} title="Wishlist" sub="Formulas you saved" href="/wishlist" />
          </Group>

          {/* Rewards (referral) hidden for now: re-enable by restoring the Refer a friend row */}

          <Group title="Help and legal">
            <Row icon={IconHelp} title="Contact us" sub="We usually reply within one business day" href="/contact" />
            <Row icon={IconTruckDelivery} title="Shipping policy" href="/shipping-policy" />
            <Row icon={IconRefresh} title="Return policy" href="/return-policy" />
            <Row icon={IconShieldCheck} title="Privacy policy" sub="How we use and protect your data" href="/privacy-policy" />
            <Row icon={IconFileText} title="Terms of service" href="/terms" />
            <Row icon={IconCertificate} title="Lab reports and certificates" href="/certificates" />
          </Group>

          <Group>
            <Row icon={IconLogout} title="Sign out" onClick={signOut} />
            <Row icon={IconTrash} title="Delete account" sub="Permanently remove your account and saved data" danger onClick={() => setConfirmDelete(true)} />
          </Group>

          <p className="mwp-set-foot">MWP Supplements. Made in the USA.</p>
        </div>

        {editing && (
          <div className="mwp-set-modal" role="dialog" aria-modal="true" aria-label="Edit personal info" onClick={(e) => e.target === e.currentTarget && setEditing(false)}>
            <form onSubmit={save} className="mwp-set-sheet">
              <div className="mwp-set-sheet-head">
                <h3>Personal info</h3>
                <button type="button" onClick={() => setEditing(false)} aria-label="Close"><IconX size={20} /></button>
              </div>
              {formError && <p className="mwp-set-err" role="alert">{formError}</p>}
              <div className="mwp-set-photo">
                <span className="mwp-set-avatar sm">{photo ? <img src={photo} alt="" onError={() => setImgFailed(true)} /> : <span>{initials}</span>}</span>
                <button type="button" className="mwp-btn ghost sm" onClick={() => fileRef.current?.click()} disabled={uploading}>{photo ? "Change photo" : "Add photo"}</button>
                {photo && <button type="button" className="mwp-btn ghost sm" onClick={removePhoto} disabled={uploading}>Remove</button>}
              </div>
              <label>Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
              <label>US phone<input type="tel" placeholder="(562) 524-3557" value={form.phone} onChange={(e) => setForm({ ...form, phone: formatUsPhone(e.target.value) })} autoComplete="tel" /></label>
              <label>Email<input value={user?.email || ""} disabled /></label>
              <button disabled={saving} className="mwp-set-save">{saving ? <IconLoader2 size={16} className="animate-spin" /> : <IconCheck size={16} />} Save</button>
            </form>
          </div>
        )}

        {confirmDelete && (
          <div className="mwp-set-modal" role="dialog" aria-modal="true" aria-label="Delete account" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(false)}>
            <div className="mwp-set-sheet">
              <div className="mwp-set-sheet-head"><h3>Delete your account?</h3></div>
              <p className="mwp-set-sub">We will email you a confirmation link. Once you confirm, your account and saved addresses are removed. Past order records we must keep for tax and legal reasons stay on file.</p>
              <button className="mwp-set-save danger" onClick={requestDelete}>Email me the link</button>
              <button className="mwp-set-cancel" onClick={() => setConfirmDelete(false)}>Keep my account</button>
            </div>
          </div>
        )}
      </ClientOnly>
    </ProtectedRoute>
  );
}
