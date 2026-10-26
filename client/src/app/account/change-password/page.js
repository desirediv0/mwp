"use client";

import { useState } from "react";
import { IconEye, IconEyeOff, IconLoader2 } from "@tabler/icons-react";
import { useAuth } from "@/lib/auth-context";
import { fetchApi } from "@/lib/utils";

function PasswordField({ id, label, value, onChange, hint, autoComplete }) {
    const [show, setShow] = useState(false);
    return (
        <label className="mwp-field" htmlFor={id}>
            {label}
            <span className="mwp-pw">
                <input id={id} name={id} type={show ? "text" : "password"} value={value} onChange={onChange} autoComplete={autoComplete} required />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
            </span>
            {hint && <small>{hint}</small>}
        </label>
    );
}

export default function ChangePasswordPage() {
    const { user, refreshUser } = useAuth();
    const noPassword = user?.hasPassword === false;
    const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });
        if (!noPassword && !form.currentPassword) return setMessage({ type: "error", text: "Enter your current password" });
        if (form.newPassword.length < 8) return setMessage({ type: "error", text: "Your new password must be at least 8 characters" });
        if (form.newPassword !== form.confirmPassword) return setMessage({ type: "error", text: "The new passwords do not match" });
        setBusy(true);
        try {
            await fetchApi("/users/change-password", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
            });
            setMessage({ type: "ok", text: noPassword ? "Password set. You can now sign in with it." : "Password changed." });
            setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            refreshUser?.();
        } catch (err) {
            setMessage({ type: "error", text: err.message || "Could not change the password. Try again." });
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className="mwp-set-card pad mwp-set-stack">
            <p className="mwp-set-sub">
                {noPassword
                    ? "You checked out as a guest, so you have no password yet. Set one to sign in faster next time."
                    : "Use at least 8 characters, with a mix of letters, numbers and symbols."}
            </p>
            {message.text && <p role="alert" className={`mwp-alert${message.type === "ok" ? " ok" : ""}`}>{message.text}</p>}
            {!noPassword && <PasswordField id="currentPassword" label="Current password" value={form.currentPassword} onChange={set("currentPassword")} autoComplete="current-password" />}
            <PasswordField id="newPassword" label="New password" value={form.newPassword} onChange={set("newPassword")} hint="At least 8 characters" autoComplete="new-password" />
            <PasswordField id="confirmPassword" label="Confirm new password" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" />
            <button className="mwp-btn block" disabled={busy}>
                {busy && <IconLoader2 size={16} className="animate-spin" />} {noPassword ? "Set password" : "Update password"}
            </button>
        </form>
    );
}
