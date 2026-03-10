"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    id_departamento: "",
    id_puesto: "",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: c }, { data: d }, { data: p }] = await Promise.all([
      supabase
        .from("colaboradores")
        .select("*, departamentos(nombre), puestos(nombre)")
        .eq("activo", true)
        .order("nombre"),
      supabase.from("departamentos").select("*"),
      supabase.from("puestos").select("*"),
    ]);
    setColaboradores(c || []);
    setDepartamentos(d || []);
    setPuestos(p || []);
    setLoading(false);
  }

  async function handleGuardar() {
    if (!form.nombre || !form.apellido) {
      setError("Nombre y apellido son requeridos");
      return;
    }
    setSaving(true);
    setError("");
    const { error: e } = await supabase.from("colaboradores").insert({
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email || null,
      id_departamento: form.id_departamento || null,
      id_puesto: form.id_puesto || null,
    });
    if (e) {
      setError(e.message);
      setSaving(false);
      return;
    }
    setModalOpen(false);
    setForm({
      nombre: "",
      apellido: "",
      email: "",
      id_departamento: "",
      id_puesto: "",
    });
    fetchAll();
    setSaving(false);
  }

  const filtered = colaboradores.filter((c) =>
    `${c.nombre} ${c.apellido}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-100">
            👥 Colaboradores
          </h1>
          <p className="text-slate-500 text-sm">Personal registrado</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl transition-all"
        >
          + Nuevo Colaborador
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Buscar colaborador..."
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-indigo-500 mb-6"
      />

      {loading ? (
        <div className="text-indigo-400 animate-pulse">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id_colaborador}
              onClick={() => setSelected(c)}
              className="bg-slate-800 rounded-2xl p-5 border border-slate-700 cursor-pointer hover:border-indigo-500 transition-all"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-xl mb-3">
                👤
              </div>
              <p className="text-slate-100 font-bold text-lg">
                {c.nombre} {c.apellido}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                📁 {c.departamentos?.nombre || "—"}
              </p>
              <p className="text-slate-500 text-sm mt-1">
                💼 {c.puestos?.nombre || "—"}
              </p>
              {c.email && (
                <p className="text-slate-500 text-sm mt-1">✉️ {c.email}</p>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-slate-500 col-span-3 text-center py-12">
              No se encontraron colaboradores
            </p>
          )}
        </div>
      )}

      {/* Modal detalle colaborador */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-slate-100">
                Detalle Colaborador
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-100 text-xl"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl">
                👤
              </div>
              <div>
                <p className="text-slate-100 font-black text-xl">
                  {selected.nombre} {selected.apellido}
                </p>
                <span className="bg-indigo-900/50 text-indigo-400 text-xs font-bold px-2 py-1 rounded-lg">
                  Activo
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-900 rounded-xl p-4">
                <p className="text-slate-500 text-xs font-bold mb-1">
                  DEPARTAMENTO
                </p>
                <p className="text-slate-100 font-semibold">
                  📁 {selected.departamentos?.nombre || "—"}
                </p>
              </div>
              <div className="bg-slate-900 rounded-xl p-4">
                <p className="text-slate-500 text-xs font-bold mb-1">PUESTO</p>
                <p className="text-slate-100 font-semibold">
                  💼 {selected.puestos?.nombre || "—"}
                </p>
              </div>
              <div className="bg-slate-900 rounded-xl p-4">
                <p className="text-slate-500 text-xs font-bold mb-1">CORREO</p>
                <p className="text-slate-100 font-semibold">
                  ✉️ {selected.email || "—"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal nuevo colaborador */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              Nuevo Colaborador
            </h2>
            <div className="space-y-3">
              {[
                { label: "Nombre *", key: "nombre" },
                { label: "Apellido *", key: "apellido" },
                { label: "Correo electrónico", key: "email" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    {f.label}
                  </label>
                  <input
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
                  Departamento
                </label>
                <select
                  value={form.id_departamento}
                  onChange={(e) =>
                    setForm({ ...form, id_departamento: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccionar...</option>
                  {departamentos.map((d) => (
                    <option key={d.id_departamento} value={d.id_departamento}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">
                  Puesto
                </label>
                <select
                  value={form.id_puesto}
                  onChange={(e) =>
                    setForm({ ...form, id_puesto: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-slate-100 outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccionar...</option>
                  {puestos.map((p) => (
                    <option key={p.id_puesto} value={p.id_puesto}>
                      {p.nombre}
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
