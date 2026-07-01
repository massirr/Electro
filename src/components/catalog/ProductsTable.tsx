"use client";

import { useState } from "react";

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  supplier: string;
  price: number;
  category: string;
}

const inputCls = "w-full bg-transparent border border-[var(--hairline)] rounded px-2 py-1 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]";
const cellCls = "px-3 py-2 text-xs text-[var(--ink)]";

function fmt(n: number) {
  return n.toLocaleString("fr-BE", { style: "currency", currency: "EUR" });
}

export function ProductsTable({ initial }: { initial: CatalogProduct[] }) {
  const [products, setProducts] = useState<CatalogProduct[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<CatalogProduct>>({});
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState<Partial<CatalogProduct>>({});
  const [busy, setBusy] = useState(false);

  function startEdit(p: CatalogProduct) {
    setEditingId(p.id);
    setDraft({ ...p });
  }

  async function saveEdit() {
    if (!editingId) return;
    setBusy(true);
    const res = await fetch(`/api/catalog/products/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      const updated: CatalogProduct = await res.json();
      setProducts((ps) => ps.map((p) => (p.id === editingId ? updated : p)));
      setEditingId(null);
    }
    setBusy(false);
  }

  async function deleteProduct(id: string) {
    setBusy(true);
    await fetch(`/api/catalog/products/${id}`, { method: "DELETE" });
    setProducts((ps) => ps.filter((p) => p.id !== id));
    setBusy(false);
  }

  async function addProduct() {
    if (!newRow.sku || !newRow.name) return;
    setBusy(true);
    const res = await fetch("/api/catalog/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newRow, price: parseFloat(String(newRow.price ?? 0)) }),
    });
    if (res.ok) {
      const created: CatalogProduct = await res.json();
      setProducts((ps) => [...ps, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewRow({});
      setAdding(false);
    }
    setBusy(false);
  }

  const headers = ["SKU", "Name", "Supplier", "Price", "Category", ""];

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--hairline)]">
              {headers.map((h) => (
                <th key={h} className="px-3 py-2 text-xs font-semibold tracking-widest uppercase text-[var(--ink-muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) =>
              editingId === p.id ? (
                <tr key={p.id} className="border-b border-[var(--hairline)]">
                  <td className="px-3 py-1.5"><input className={inputCls} value={draft.sku ?? ""} onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))} /></td>
                  <td className="px-3 py-1.5"><input className={inputCls} value={draft.name ?? ""} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} /></td>
                  <td className="px-3 py-1.5"><input className={inputCls} value={draft.supplier ?? ""} onChange={(e) => setDraft((d) => ({ ...d, supplier: e.target.value }))} /></td>
                  <td className="px-3 py-1.5"><input className={inputCls} type="number" step="0.01" value={draft.price ?? ""} onChange={(e) => setDraft((d) => ({ ...d, price: parseFloat(e.target.value) }))} /></td>
                  <td className="px-3 py-1.5"><input className={inputCls} value={draft.category ?? ""} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} /></td>
                  <td className="px-3 py-1.5 flex gap-1.5 whitespace-nowrap">
                    <button onClick={saveEdit} disabled={busy} className="text-xs px-2 py-1 rounded bg-[var(--accent)] text-white disabled:opacity-40">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 rounded border border-[var(--hairline)] text-[var(--ink-subtle)]">Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={p.id} className="border-b border-[var(--hairline)] hover:bg-[var(--surface-2)]">
                  <td className={`${cellCls} font-mono`}>{p.sku}</td>
                  <td className={cellCls}>{p.name}</td>
                  <td className={cellCls}>{p.supplier}</td>
                  <td className={`${cellCls} tabular-nums`}>{fmt(p.price)}</td>
                  <td className={`${cellCls} text-[var(--ink-muted)]`}>{p.category}</td>
                  <td className="px-3 py-2 flex gap-1.5 whitespace-nowrap">
                    <button onClick={() => startEdit(p)} className="text-xs px-2 py-1 rounded border border-[var(--hairline)] text-[var(--ink-subtle)] hover:text-[var(--ink)]">Edit</button>
                    <button onClick={() => deleteProduct(p.id)} disabled={busy} className="text-xs px-2 py-1 rounded border border-[var(--hairline)] text-[#e5533d] hover:border-[#e5533d] disabled:opacity-40">×</button>
                  </td>
                </tr>
              )
            )}

            {adding && (
              <tr className="border-b border-[var(--hairline)] bg-[var(--surface-2)]">
                <td className="px-3 py-1.5"><input className={inputCls} placeholder="SKU" value={newRow.sku ?? ""} onChange={(e) => setNewRow((r) => ({ ...r, sku: e.target.value }))} autoFocus /></td>
                <td className="px-3 py-1.5"><input className={inputCls} placeholder="Name" value={newRow.name ?? ""} onChange={(e) => setNewRow((r) => ({ ...r, name: e.target.value }))} /></td>
                <td className="px-3 py-1.5"><input className={inputCls} placeholder="Supplier" value={newRow.supplier ?? ""} onChange={(e) => setNewRow((r) => ({ ...r, supplier: e.target.value }))} /></td>
                <td className="px-3 py-1.5"><input className={inputCls} type="number" step="0.01" placeholder="0.00" value={newRow.price ?? ""} onChange={(e) => setNewRow((r) => ({ ...r, price: parseFloat(e.target.value) }))} /></td>
                <td className="px-3 py-1.5"><input className={inputCls} placeholder="Category" value={newRow.category ?? ""} onChange={(e) => setNewRow((r) => ({ ...r, category: e.target.value }))} /></td>
                <td className="px-3 py-1.5 flex gap-1.5">
                  <button onClick={addProduct} disabled={busy || !newRow.sku || !newRow.name} className="text-xs px-2 py-1 rounded bg-[var(--accent)] text-white disabled:opacity-40">Add</button>
                  <button onClick={() => { setAdding(false); setNewRow({}); }} className="text-xs px-2 py-1 rounded border border-[var(--hairline)] text-[var(--ink-subtle)]">Cancel</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!adding && (
        <button onClick={() => setAdding(true)} className="mt-3 text-xs text-[var(--accent)] hover:underline">
          + Add product
        </button>
      )}
    </div>
  );
}
