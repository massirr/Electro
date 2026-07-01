"use client";

import { useState } from "react";

export interface KitComponent {
  id: string;
  sku: string;
  quantity_per_unit: number;
}

export interface CatalogKit {
  id: string;
  slug: string;
  name: string;
  default_hu: number;
  catalog_kit_components: KitComponent[];
}

const inputCls = "w-full bg-transparent border border-[var(--hairline)] rounded px-2 py-1 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]";

function KitRow({ kit, onUpdate, onDelete }: {
  kit: CatalogKit;
  onUpdate: (k: CatalogKit) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ slug: kit.slug, name: kit.name, default_hu: kit.default_hu });
  const [components, setComponents] = useState<KitComponent[]>(kit.catalog_kit_components);
  const [newComp, setNewComp] = useState({ sku: "", quantity_per_unit: 1 });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch(`/api/catalog/kits/${kit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, components }),
    });
    if (res.ok) {
      const updated: CatalogKit = await res.json();
      onUpdate(updated);
      setComponents(updated.catalog_kit_components);
      setEditing(false);
    }
    setBusy(false);
  }

  async function deleteKit() {
    setBusy(true);
    await fetch(`/api/catalog/kits/${kit.id}`, { method: "DELETE" });
    onDelete(kit.id);
    setBusy(false);
  }

  function addComponent() {
    if (!newComp.sku) return;
    setComponents((cs) => [...cs, { id: `new-${Date.now()}`, sku: newComp.sku, quantity_per_unit: newComp.quantity_per_unit }]);
    setNewComp({ sku: "", quantity_per_unit: 1 });
  }

  function removeComponent(id: string) {
    setComponents((cs) => cs.filter((c) => c.id !== id));
  }

  return (
    <div className="border border-[var(--hairline)] rounded-md mb-2" style={{ background: "var(--surface-1)" }}>
      {/* Kit header row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button onClick={() => setExpanded((e) => !e)} className="text-[var(--ink-muted)] text-xs w-4 shrink-0">
          {expanded ? "▾" : "▸"}
        </button>
        {editing ? (
          <>
            <input className={`${inputCls} flex-1`} value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Kit name" autoFocus />
            <input className={`${inputCls} w-20`} value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} placeholder="slug" />
            <span className="text-xs text-[var(--ink-muted)] shrink-0">h/u</span>
            <input className={`${inputCls} w-16`} type="number" step="0.01" value={draft.default_hu} onChange={(e) => setDraft((d) => ({ ...d, default_hu: parseFloat(e.target.value) }))} />
            <button onClick={save} disabled={busy} className="text-xs px-2 py-1 rounded bg-[var(--accent)] text-white disabled:opacity-40 shrink-0">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs px-2 py-1 rounded border border-[var(--hairline)] text-[var(--ink-subtle)] shrink-0">Cancel</button>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm text-[var(--ink)] font-medium">{kit.name}</span>
            <span className="text-xs font-mono text-[var(--ink-muted)]">{kit.slug}</span>
            <span className="text-xs text-[var(--ink-muted)] shrink-0">{kit.default_hu}h/u</span>
            <button onClick={() => { setEditing(true); setExpanded(true); }} className="text-xs px-2 py-1 rounded border border-[var(--hairline)] text-[var(--ink-subtle)] hover:text-[var(--ink)] shrink-0">Edit</button>
            <button onClick={deleteKit} disabled={busy} className="text-xs px-2 py-1 rounded border border-[var(--hairline)] text-[#e5533d] hover:border-[#e5533d] disabled:opacity-40 shrink-0">×</button>
          </>
        )}
      </div>

      {/* Components (expanded) */}
      {expanded && (
        <div className="border-t border-[var(--hairline)] px-3 py-2" style={{ background: "var(--surface-2)" }}>
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--ink-muted)] mb-2">Components</p>
          {components.length === 0 && (
            <p className="text-xs text-[var(--ink-subtle)] mb-2">No components yet.</p>
          )}
          {components.map((c) => (
            <div key={c.id} className="flex items-center gap-2 mb-1">
              {editing ? (
                <>
                  <input
                    className={`${inputCls} flex-1`}
                    value={c.sku}
                    onChange={(e) => setComponents((cs) => cs.map((x) => x.id === c.id ? { ...x, sku: e.target.value } : x))}
                  />
                  <input
                    className={`${inputCls} w-16`}
                    type="number"
                    step="0.01"
                    value={c.quantity_per_unit}
                    onChange={(e) => setComponents((cs) => cs.map((x) => x.id === c.id ? { ...x, quantity_per_unit: parseFloat(e.target.value) } : x))}
                  />
                  <span className="text-xs text-[var(--ink-muted)] shrink-0">per kit</span>
                  <button onClick={() => removeComponent(c.id)} className="text-xs text-[#e5533d] shrink-0">×</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-xs font-mono text-[var(--ink)]">{c.sku}</span>
                  <span className="text-xs text-[var(--ink-muted)]">× {c.quantity_per_unit}</span>
                </>
              )}
            </div>
          ))}

          {editing && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--hairline)]">
              <input
                className={`${inputCls} flex-1`}
                placeholder="SKU"
                value={newComp.sku}
                onChange={(e) => setNewComp((c) => ({ ...c, sku: e.target.value }))}
              />
              <input
                className={`${inputCls} w-16`}
                type="number"
                step="0.01"
                value={newComp.quantity_per_unit}
                onChange={(e) => setNewComp((c) => ({ ...c, quantity_per_unit: parseFloat(e.target.value) }))}
              />
              <span className="text-xs text-[var(--ink-muted)] shrink-0">per kit</span>
              <button onClick={addComponent} disabled={!newComp.sku} className="text-xs px-2 py-1 rounded border border-[var(--hairline)] text-[var(--accent)] disabled:opacity-40 shrink-0">+ Add</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function KitsTable({ initial }: { initial: CatalogKit[] }) {
  const [kits, setKits] = useState<CatalogKit[]>(initial);
  const [adding, setAdding] = useState(false);
  const [newKit, setNewKit] = useState({ slug: "", name: "", default_hu: 0 });
  const [newComponents, setNewComponents] = useState<Array<{ sku: string; quantity_per_unit: number }>>([]);
  const [newComp, setNewComp] = useState({ sku: "", quantity_per_unit: 1 });
  const [busy, setBusy] = useState(false);

  function updateKit(updated: CatalogKit) {
    setKits((ks) => ks.map((k) => (k.id === updated.id ? updated : k)));
  }

  function deleteKit(id: string) {
    setKits((ks) => ks.filter((k) => k.id !== id));
  }

  function addNewComp() {
    if (!newComp.sku) return;
    setNewComponents((cs) => [...cs, { ...newComp }]);
    setNewComp({ sku: "", quantity_per_unit: 1 });
  }

  async function createKit() {
    if (!newKit.slug || !newKit.name) return;
    setBusy(true);
    const res = await fetch("/api/catalog/kits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newKit, components: newComponents }),
    });
    if (res.ok) {
      const created: CatalogKit = await res.json();
      setKits((ks) => [...ks, created].sort((a, b) => a.name.localeCompare(b.name)));
      setAdding(false);
      setNewKit({ slug: "", name: "", default_hu: 0 });
      setNewComponents([]);
    }
    setBusy(false);
  }

  const inputCls2 = "bg-transparent border border-[var(--hairline)] rounded px-2 py-1 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]";

  return (
    <div>
      {kits.map((k) => (
        <KitRow key={k.id} kit={k} onUpdate={updateKit} onDelete={deleteKit} />
      ))}

      {adding ? (
        <div className="border border-[var(--accent)] rounded-md p-3 mt-2" style={{ background: "var(--surface-1)" }}>
          <p className="text-xs font-semibold text-[var(--ink-muted)] mb-2 uppercase tracking-widest">New kit</p>
          <div className="flex gap-2 mb-2">
            <input className={`${inputCls2} flex-1`} placeholder="Name (e.g. EV Charger install)" value={newKit.name} onChange={(e) => setNewKit((k) => ({ ...k, name: e.target.value }))} autoFocus />
            <input className={`${inputCls2} w-32`} placeholder="slug" value={newKit.slug} onChange={(e) => setNewKit((k) => ({ ...k, slug: e.target.value }))} />
            <input className={`${inputCls2} w-16`} type="number" step="0.01" placeholder="h/u" value={newKit.default_hu || ""} onChange={(e) => setNewKit((k) => ({ ...k, default_hu: parseFloat(e.target.value) }))} />
          </div>

          <p className="text-xs text-[var(--ink-muted)] mb-1">Components</p>
          {newComponents.map((c, i) => (
            <div key={i} className="flex items-center gap-2 mb-1 text-xs text-[var(--ink)]">
              <span className="font-mono flex-1">{c.sku}</span>
              <span>× {c.quantity_per_unit}</span>
              <button onClick={() => setNewComponents((cs) => cs.filter((_, j) => j !== i))} className="text-[#e5533d]">×</button>
            </div>
          ))}
          <div className="flex gap-2 mt-1">
            <input className={`${inputCls2} flex-1`} placeholder="SKU" value={newComp.sku} onChange={(e) => setNewComp((c) => ({ ...c, sku: e.target.value }))} />
            <input className={`${inputCls2} w-16`} type="number" step="0.01" value={newComp.quantity_per_unit} onChange={(e) => setNewComp((c) => ({ ...c, quantity_per_unit: parseFloat(e.target.value) }))} />
            <button onClick={addNewComp} disabled={!newComp.sku} className="text-xs px-2 py-1 rounded border border-[var(--hairline)] text-[var(--accent)] disabled:opacity-40">+ Add</button>
          </div>

          <div className="flex gap-2 mt-3">
            <button onClick={createKit} disabled={busy || !newKit.slug || !newKit.name} className="text-xs px-3 py-1.5 rounded bg-[var(--accent)] text-white disabled:opacity-40">Create kit</button>
            <button onClick={() => { setAdding(false); setNewKit({ slug: "", name: "", default_hu: 0 }); setNewComponents([]); }} className="text-xs px-3 py-1.5 rounded border border-[var(--hairline)] text-[var(--ink-subtle)]">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-2 text-xs text-[var(--accent)] hover:underline">
          + Add kit
        </button>
      )}
    </div>
  );
}
