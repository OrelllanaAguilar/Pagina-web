"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Despacho = {
  id_despacho: string;
  no_despacho: number;
  fecha: string;
  anulado: boolean;
  completado: boolean;
  colaboradores: any;
};

export default function DespachosPage() {
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [articulos, setArticulos] = useState<any[]>([]);
  const [noDespacho, setNoDespacho] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [colaboradorId, setColaboradorId] = useState("");
  const [detalles, setDetalles] = useState([{ codigo: "", cantidad: "" }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDespachos();
    fetchColaboradores();
    fetchArticulos();
  }, []);

  async function fetchDespachos() {
    setLoading(true);
    const { data } = await supabase
      .from("despachos")
      .select(
        `id_despacho, no_despacho, fecha, anulado, completado,
        colaboradores (nombre, apellido, departamentos (nombre))`,
      )
      .eq("anulado", false)
      .eq("completado", false)
      .order("no_despacho", { ascending: false });
    setDespachos(data || []);
    setLoading(false);
  }

  async function fetchColaboradores() {
    const { data } = await supabase
      .from("colaboradores")
      .select("id_colaborador, nombre, apellido")
      .eq("activo", true);
    setColaboradores(data || []);
  }

  async function fetchArticulos() {
    const { data } = await supabase
      .from("articulos")
      .select("codigo_articulo, descripcion, precio_unitario")
      .eq("activo", true);
    setArticulos(data || []);
  }

  async function handleGuardar() {
    if (!noDespacho || !colaboradorId) {
      setError("Completa todos los campos");
      return;
    }
    if (detalles.some((d) => !d.codigo || !d.cantidad)) {
      setError("Completa todos los artículos");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data: despacho, error: e1 } = await supabase
        .from("despachos")
        .insert({
          no_despacho: parseInt(noDespacho),
          fecha,
          id_colaborador: colaboradorId,
        })
        .select()
        .single();
      if (e1) throw e1;

      const detalleInsert = detalles.map((d) => {
        const art = articulos.find((a) => a.codigo_articulo === d.codigo);
        return {
          id_despacho: despacho.id_despacho,
          codigo_articulo: d.codigo,
          cantidad: parseInt(d.cantidad),
          precio_unitario: art?.precio_unitario || 0,
        };
      });
      const { error: e2 } = await supabase
        .from("detalle_despacho")
        .insert(detalleInsert);
      if (e2) throw e2;

      setModalOpen(false);
      setNoDespacho("");
      setColaboradorId("");
      setDetalles([{ codigo: "", cantidad: "" }]);
      fetchDespachos();
    } catch (err: any) {
      setError(err.message);
    }
    setSaving(false);
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100">📋 Despachos</h1>
          <p className="text-slate-500 text-sm">Despachos pendientes</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all"
        >
          + Nuevo Despacho
        </button>
      </div>

      {loading ? (
        <div className="text-indigo-400 animate-pulse">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {despachos.length === 0 && (
            <p className="text-slate-500 col-span-3 text-center py-12">
              No hay despachos pendientes
            </p>
          )}
          {despachos.map((d) => (
            <div
              key={d.id_despacho}
              className="bg-slate-800 rounded-2xl p-5 border border-slate-700"
            >
              <div className="flex gap-2 mb-3">
                <span className="bg-indigo-900 text-indigo-300 text-xs font-bold px-3 py-1 rounded-lg">
                  #{d.no_despacho}
                </span>
                <span className="bg-amber-900/50 text-amber-400 text-xs font-bold px-3 py-1 rounded-lg">
                  ⏳ Pendiente
                </span>
              </div>
              <p className="text-slate-100 font-bold">
                {d.colaboradores?.[0]?.nombre} {d.colaboradores?.[0]?.apellido}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                📁 {d.colaboradores?.[0]?.departamentos?.[0]?.nombre}
              </p>
              <p className="text-slate-500 text-sm mt-1">📅 {d.fecha}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              Nuevo Despacho
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  No. Despacho
                </label>
                <input
                  type="number"
                  value={noDespacho}
                  onChange={(e) => setNoDespacho(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 outline-none focus:border-indigo-500"
                  placeholder="Ej: 325"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-2">
                  Colaborador
                </label>
                <div className="flex flex-wrap gap-2">
                  {colaboradores.map((c) => (
                    <button
                      key={c.id_colaborador}
                      onClick={() => setColaboradorId(c.id_colaborador)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${colaboradorId === c.id_colaborador ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-500"}`}
                    >
                      {c.nombre} {c.apellido}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-2">
                  Artículos
                </label>
                {detalles.map((d, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      value={d.codigo}
                      onChange={(e) => {
                        const u = [...detalles];
                        u[i].codigo = e.target.value;
                        setDetalles(u);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-indigo-500 text-sm"
                      placeholder="Código"
                    />
                    <input
                      type="number"
                      value={d.cantidad}
                      onChange={(e) => {
                        const u = [...detalles];
                        u[i].cantidad = e.target.value;
                        setDetalles(u);
                      }}
                      className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-indigo-500 text-sm"
                      placeholder="Cant."
                    />
                    <button
                      onClick={() =>
                        detalles.length > 1 &&
                        setDetalles(detalles.filter((_, j) => j !== i))
                      }
                      className="text-red-400 hover:text-red-300 font-bold px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setDetalles([...detalles, { codigo: "", cantidad: "" }])
                  }
                  className="w-full border border-indigo-600 text-indigo-400 rounded-xl py-2 text-sm font-bold hover:bg-indigo-900/30 transition-all"
                >
                  + Agregar artículo
                </button>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-900/30 rounded-xl p-3">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-60"
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
