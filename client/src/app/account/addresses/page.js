"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { IconMapPin, IconPlus, IconLoader2 } from "@tabler/icons-react";
import { fetchApi } from "@/lib/utils";
import { formatUsPhone, formatCityLine } from "@/lib/us";
import AddressForm from "@/components/AddressForm";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    try {
      const r = await fetchApi("/users/addresses", { credentials: "include" });
      if (r.success) setAddresses(r.data.addresses || []);
    } catch {
      toast.error("We could not load your addresses");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const done = () => { setAdding(false); setEditing(null); load(); };

  const remove = async (id) => {
    setBusyId(id);
    try {
      const r = await fetchApi(`/users/addresses/${id}`, { method: "DELETE", credentials: "include" });
      if (r.success) { toast.success("Address deleted"); setConfirmId(null); load(); }
    } catch (e) {
      toast.error(e.message || "Could not delete the address");
    } finally {
      setBusyId(null);
    }
  };

  const makeDefault = async (id) => {
    setBusyId(id);
    try {
      const r = await fetchApi(`/users/addresses/${id}/default`, { method: "PATCH", credentials: "include" });
      if (r.success) { toast.success("Default address updated"); load(); }
    } catch (e) {
      toast.error(e.message || "Could not update the default address");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="mwp-spin"><IconLoader2 className="animate-spin" /></div>;

  const formOpen = adding || editing;

  return (
    <div className="mwp-set-stack">
      {formOpen ? (
        <div className="mwp-set-card pad">
          <h2 className="mwp-card-title">{editing ? "Edit address" : "Add a new address"}</h2>
          <AddressForm existingAddress={editing || undefined} onSuccess={done} onCancel={() => { setAdding(false); setEditing(null); }} />
        </div>
      ) : addresses.length === 0 ? (
        <div className="mwp-empty">
          <IconMapPin size={34} stroke={1.3} />
          <h3>No saved addresses</h3>
          <p>Save a US delivery address so checkout is one tap faster.</p>
          <button className="mwp-btn" onClick={() => setAdding(true)}><IconPlus size={16} /> Add address</button>
        </div>
      ) : (
        <>
          <div className="mwp-set-card">
            {addresses.map((a) => (
              <div key={a.id} className="mwp-addr">
                <div className="mwp-addr-head">
                  <strong>{a.name}</strong>
                  {a.isDefault && <span className="mwp-chip s-DELIVERED">Default</span>}
                </div>
                <p>{a.street}</p>
                <p>{formatCityLine(a)}</p>
                {a.phone && <p>{formatUsPhone(a.phone)}</p>}
                <div className="mwp-addr-actions">
                  {confirmId === a.id ? (
                    <>
                      <button className="mwp-btn sm" style={{ background: "#b3001b" }} disabled={busyId === a.id} onClick={() => remove(a.id)}>Yes, delete</button>
                      <button className="mwp-btn ghost sm" onClick={() => setConfirmId(null)}>Keep it</button>
                    </>
                  ) : (
                    <>
                      <button className="mwp-btn ghost sm" onClick={() => setEditing(a)}>Edit</button>
                      {!a.isDefault && <button className="mwp-btn ghost sm" disabled={busyId === a.id} onClick={() => makeDefault(a.id)}>Make default</button>}
                      <button className="mwp-btn ghost sm" onClick={() => setConfirmId(a.id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="mwp-btn ghost block" onClick={() => setAdding(true)}><IconPlus size={16} /> Add a new address</button>
        </>
      )}
    </div>
  );
}
