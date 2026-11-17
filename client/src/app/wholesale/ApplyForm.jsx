"use client";

import { useState } from "react";
import { wsFetch } from "./wholesale-api";

const FORMULAS = ["Her Power", "Daily Vitality", "Power Max", "Rapid Boost", "Alpha Prime", "Ultra Pro"];

export default function ApplyForm() {
  const [state, setState] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setState("sending");
    try {
      await wsFetch("/apply", { method: "POST", form: new FormData(e.currentTarget) });
      setState("done");
    } catch (err) {
      setError(err.message);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="ws-done" role="status">
        <span className="ws-okIcon" aria-hidden="true">✓</span>
        <h3>Application received</h3>
        <p>Thank you. Our team will review your details and email your wholesale access code once you are approved.</p>
      </div>
    );
  }

  return (
    <form className="ws-form" onSubmit={onSubmit} encType="multipart/form-data">
      <label>Business name *<input name="business" required maxLength={140} placeholder="e.g. Sunset Nutrition LLC" /></label>
      <label>Contact name *<input name="contact" required maxLength={100} autoComplete="name" /></label>
      <label>Email *<input name="email" type="email" required maxLength={200} autoComplete="email" /></label>
      <label>Phone *<input name="phone" type="tel" required maxLength={40} autoComplete="tel" /></label>
      <label>Business type *
        <select name="businessType" required defaultValue="Retail store">
          <option>Retail store</option><option>Gym / fitness center</option><option>Pharmacy</option>
          <option>Online store</option><option>Distributor</option><option>Other</option>
        </select>
      </label>
      <label>EIN / Tax ID *<input name="ein" required maxLength={40} placeholder="XX-XXXXXXX" /></label>
      <label className="ws-full">Business shipping address *<input name="address" required maxLength={300} placeholder="Street, City, State, ZIP" autoComplete="street-address" /></label>
      <label>Resale certificate * (PDF or image, up to 10 MB)
        <input name="certificate" type="file" required accept=".pdf,image/jpeg,image/png,image/webp" />
      </label>
      <label>Expected monthly order
        <select name="volume" defaultValue="1–5 boxes">
          <option>1–5 boxes</option><option>6–20 boxes</option><option>21–50 boxes</option><option>50+ boxes</option>
        </select>
      </label>
      <fieldset className="ws-full">
        <legend>Formulas you are interested in</legend>
        <div className="ws-checks">
          {FORMULAS.map((f) => (
            <label className="ws-check" key={f}><input type="checkbox" name="products" value={f} defaultChecked /> {f}</label>
          ))}
        </div>
      </fieldset>
      <label className="ws-full">Anything else we should know?<textarea name="notes" rows={3} maxLength={1000} /></label>
      <div className="ws-hp" aria-hidden="true"><input name="website" tabIndex={-1} autoComplete="off" /></div>
      {error && <p className="ws-error ws-full" role="alert">{error}</p>}
      <button type="submit" className="ws-btn ws-btnPrimary ws-full" disabled={state === "sending"}>{state === "sending" ? "Sending..." : "Submit application"}</button>
      <p className="ws-fine ws-full">Your business details and certificate are used only to review your wholesale application.</p>
    </form>
  );
}
