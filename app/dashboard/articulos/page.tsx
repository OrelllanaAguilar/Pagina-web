"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Articulo = {
  id_articulo: string;
  codigo_articulo: string;
  descripcion: string;
  precio_unitario: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
  categorias_articulo: any;
};

export default function ArticulosPage() {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    codigo_articulo: "",
    descripcion: "",
    precio_unitario: "",
    stock_actual: "",
    stock_minimo: "",
    id_categoria: "",
  });

  useEffect(() => {
    fetchArticulos();
    fetchCategorias();
  }, []);

  async function fetchArticulos() {
    setLoading(true);
    const { data } = await supabase
      .from("articulos")
      .select("*, categorias_articulo (nombre)")
      .eq("activo", true)
      .order("codigo_articulo");
    setArticulos(data || []);
    setLoading(false);
  }

  async function fetchCategorias() {
    const { data } = await supabase.from("categorias_articulo").select("*");
    setCategorias(data || []);
  }

  async function handleGuardar() {
    if (!form.codigo_articulo || !form.descripcion || !form.precio_unitario) {
      setError("Completa los campos requeridos");
      return;
    }
    setSaving(true);
    setError("");
    const { error: e } = await supabase.from("articulos").insert({
      codigo_articulo: form.codigo_articulo,
      descripcion: form.descripcion,
      precio_unitario: parseFloat(form.precio_unitario),
      stock_actual: parseInt(form.stock_actual) || 0,
      stock_minimo: parseInt(form.stock_minimo) || 0,
      id_categoria: form.id_categoria || null,
    });
    if (e) {
      setError(e.message);
      setSaving(false);
      return;
    }
    setModalOpen(false);
    setForm({
      codigo_articulo: "",
      descripcion: "",
      precio_unitario: "",
      stock_actual: "",
      stock_minimo: "",
      id_categoria: "",
    });
    fetchArticulos();
    setSaving(false);
  }

  const filtered = articulos.filter(
    (a) =>
      a.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      a.codigo_articulo.toLowerCase().includes(search.toLowerCase()),
  );

  function stockColor(a: Articulo) {
    if (a.stock_actual <= 0) return "text-red-400";
    if (a.stock_actual <= a.stock_minimo) return "text-amber-400";
    return "text-green-400";
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100">📦 Artículos</h1>
          <p className="text-slate-500 text-sm">Inventario de bodega</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all"
        >
          + Nuevo Artículo
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Buscar artículo o código..."
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-indigo-500 mb-6"
      />

      {loading ? (
        <div className="text-indigo-400 animate-pulse">Cargando...</div>
      ) : (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400">
                  CÓDIGO
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400">
                  DESCRIPCIÓN
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400">
                  CATEGORÍA
                </th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-400">
                  PRECIO
                </th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-400">
                  STOCK
                </th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-400">
                  MÍN.
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id_articulo}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-all"
                >
                  <td className="px-4 py-3 text-indigo-400 font-mono text-sm">
                    {a.codigo_articulo}
                  </td>
                  <td className="px-4 py-3 text-slate-100 font-semibold">
                    {a.descripcion}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {a.categorias_articulo?.nombre || "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-100">
                    Q{Number(a.precio_unitario).toFixed(2)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${stockColor(a)}`}
                  >
                    {a.stock_actual}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {a.stock_minimo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-slate-500 text-center py-8">
              No se encontraron artículos
            </p>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              Nuevo Artículo
            </h2>
            <div className="space-y-3">
              {[
                { label: "Código *", key: "codigo_articulo", type: "text" },
                { label: "Descripción *", key: "descripcion", type: "text" },
                {
                  label: "Precio unitario *",
                  key: "precio_unitario",
                  type: "number",
                },
                { label: "Stock actual", key: "stock_actual", type: "number" },
                { label: "Stock mínimo", key: "stock_minimo", type: "number" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Categoría
                </label>
                <select
                  value={form.id_categoria}
                  onChange={(e) =>
                    setForm({ ...form, id_categoria: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 outline-none focus:border-indigo-500"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <p className="text-red-400 text-sm bg-red-900/30 rounded-xl p-3">
                  {error}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl hover:bg-slate-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-500 disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
