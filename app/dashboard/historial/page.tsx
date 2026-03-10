"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function HistorialPage() {
  const [stats, setStats] = useState({
    total: 0,
    completados: 0,
    pendientes: 0,
    anulados: 0,
  });
  const [top, setTop] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);

    const { data: todos } = await supabase
      .from("despachos")
      .select("id_despacho, completado, anulado");
    const total = todos?.length || 0;
    const completados = todos?.filter((d: any) => d.completado).length || 0;
    const anulados = todos?.filter((d: any) => d.anulado).length || 0;
    const pendientes = total - completados - anulados;
    setStats({ total, completados, pendientes, anulados });

    const { data: detalle } = await supabase
      .from("detalle_despacho")
      .select("codigo_articulo, cantidad");
    const mapa: Record<string, number> = {};
    (detalle || []).forEach((d: any) => {
      mapa[d.codigo_articulo] =
        (mapa[d.codigo_articulo] || 0) + Number(d.cantidad);
    });

    const topItems = await Promise.all(
      Object.entries(mapa)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(async ([cod, cant]) => {
          const { data: art } = await supabase
            .from("articulos")
            .select("descripcion")
            .eq("codigo_articulo", cod)
            .single();
          return {
            codigo: cod,
            descripcion: art?.descripcion || cod,
            cantidad: cant,
          };
        }),
    );
    setTop(topItems);

    const { data: hist } = await supabase
      .from("despachos")
      .select("no_despacho, fecha, completado, anulado, id_colaborador")
      .order("no_despacho", { ascending: false })
      .limit(20);

    const histConNombre = await Promise.all(
      (hist || []).map(async (d: any) => {
        const { data: c } = await supabase
          .from("colaboradores")
          .select("nombre, apellido")
          .eq("id_colaborador", d.id_colaborador)
          .single();
        return {
          ...d,
          colaborador: `${c?.nombre || ""} ${c?.apellido || ""}`.trim(),
        };
      }),
    );
    setHistorial(histConNombre);
    setLoading(false);
  }

  if (loading)
    return <div className="p-8 text-indigo-400 animate-pulse">Cargando...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-slate-100 mb-6">📊 Historial</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total",
            value: stats.total,
            color: "text-indigo-400",
            bg: "border-indigo-500/30",
          },
          {
            label: "Completados",
            value: stats.completados,
            color: "text-green-400",
            bg: "border-green-500/30",
          },
          {
            label: "Pendientes",
            value: stats.pendientes,
            color: "text-amber-400",
            bg: "border-amber-500/30",
          },
          {
            label: "Anulados",
            value: stats.anulados,
            color: "text-red-400",
            bg: "border-red-500/30",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`bg-slate-800 rounded-2xl p-6 border ${s.bg} text-center`}
          >
            <p className={`text-4xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top artículos */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-sm font-bold text-indigo-400 mb-4 tracking-wide">
            🏆 ARTÍCULOS MÁS DESPACHADOS
          </h2>
          {top.map((a, i) => (
            <div
              key={a.codigo}
              className="flex items-center gap-3 py-3 border-b border-slate-700/50 last:border-0"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-xs font-black text-white">
                #{i + 1}
              </div>
              <div className="flex-1">
                <p className="text-slate-100 font-semibold text-sm">
                  {a.descripcion}
                </p>
                <p className="text-slate-500 text-xs">{a.codigo}</p>
              </div>
              <span className="bg-slate-900 text-green-400 font-bold text-sm px-3 py-1 rounded-xl">
                {a.cantidad} uds
              </span>
            </div>
          ))}
        </div>

        {/* Historial */}
        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h2 className="text-sm font-bold text-indigo-400 mb-4 tracking-wide">
            📋 ÚLTIMOS DESPACHOS
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {historial.map((d) => (
              <div
                key={d.no_despacho}
                className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-100 font-bold">
                      #{d.no_despacho}
                    </span>
                    {d.completado && (
                      <span className="bg-green-900/50 text-green-400 text-xs font-bold px-2 py-0.5 rounded-lg">
                        ✓ Completado
                      </span>
                    )}
                    {d.anulado && (
                      <span className="bg-red-900/50 text-red-400 text-xs font-bold px-2 py-0.5 rounded-lg">
                        ✗ Anulado
                      </span>
                    )}
                    {!d.completado && !d.anulado && (
                      <span className="bg-amber-900/50 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-lg">
                        ⏳ Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {d.colaborador}
                  </p>
                </div>
                <span className="text-slate-500 text-xs">{d.fecha}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
