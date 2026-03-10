"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function BoletasPage() {
  const [despachos, setDespachos] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [boleta, setBoleta] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBoleta, setLoadingBoleta] = useState(false);

  useEffect(() => {
    fetchDespachos();
  }, []);

  async function fetchDespachos() {
    setLoading(true);
    const { data } = await supabase
      .from("despachos")
      .select(
        "id_despacho, no_despacho, fecha, colaboradores(nombre, apellido)",
      )
      .eq("anulado", false)
      .eq("completado", false)
      .order("no_despacho", { ascending: false });
    setDespachos(data || []);
    setLoading(false);
  }

  async function fetchBoleta(d: any) {
    setSelected(d);
    setLoadingBoleta(true);
    setBoleta([]);

    const { data: despacho } = await supabase
      .from("despachos")
      .select("id_despacho, no_despacho, fecha, id_colaborador")
      .eq("id_despacho", d.id_despacho)
      .single();

    const { data: colab } = await supabase
      .from("colaboradores")
      .select("nombre, apellido, id_departamento, id_puesto")
      .eq("id_colaborador", despacho.id_colaborador)
      .single();

    const { data: depto } = await supabase
      .from("departamentos")
      .select("nombre")
      .eq("id_departamento", colab?.id_departamento)
      .single();

    const { data: puesto } = await supabase
      .from("puestos")
      .select("nombre")
      .eq("id_puesto", colab?.id_puesto)
      .single();

    const { data: detalle } = await supabase
      .from("detalle_despacho")
      .select("cantidad, precio_unitario, codigo_articulo")
      .eq("id_despacho", d.id_despacho);

    const items = await Promise.all(
      (detalle || []).map(async (item: any) => {
        const { data: art } = await supabase
          .from("articulos")
          .select("descripcion")
          .eq("codigo_articulo", item.codigo_articulo)
          .single();
        return {
          ...item,
          descripcion: art?.descripcion || item.codigo_articulo,
          colaborador: `${colab?.nombre} ${colab?.apellido}`,
          departamento: depto?.nombre || "",
          puesto: puesto?.nombre || "",
          no_despacho: despacho.no_despacho,
          fecha: despacho.fecha,
          subtotal: item.precio_unitario * item.cantidad,
        };
      }),
    );

    setBoleta(items);
    setLoadingBoleta(false);
  }

  async function handleImprimir() {
    if (!boleta.length) return;
    const b = boleta[0];
    const total = boleta.reduce((s, i) => s + i.subtotal, 0).toFixed(2);

    const html = `
      <html><head><style>
        body{font-family:Arial;padding:30px;font-size:13px}
        h2{text-align:center;margin-bottom:4px}
        h3{text-align:center;margin-top:0;color:#555}
        .info{margin-bottom:16px;border:1px solid #ccc;padding:12px;border-radius:6px}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        th{background:#1e293b;color:white;padding:8px;text-align:left;font-size:12px}
        td{padding:8px;border-bottom:1px solid #ddd;font-size:12px}
        .total{text-align:right;font-weight:bold;margin-top:16px;font-size:15px}
      </style></head>
      <body>
        <h2>Dirección Administrativa</h2>
        <h3>Boleta de Despacho</h3>
        <div class="info">
          <p><b>No. Despacho:</b> ${b.no_despacho} &nbsp;&nbsp; <b>Fecha:</b> ${b.fecha}</p>
        </div>
        <div class="info">
          <p><b>RECIBE</b></p>
          <p>Departamento: ${b.departamento}</p>
          <p>Colaborador: ${b.colaborador}</p>
          <p>Puesto: ${b.puesto}</p>
        </div>
        <table>
          <tr><th>Código</th><th>Descripción</th><th style="text-align:right">Precio</th><th style="text-align:center">Cantidad</th><th style="text-align:right">Subtotal</th></tr>
          ${boleta.map((i) => `<tr><td>${i.codigo_articulo}</td><td>${i.descripcion}</td><td style="text-align:right">Q${Number(i.precio_unitario).toFixed(2)}</td><td style="text-align:center">${i.cantidad}</td><td style="text-align:right">Q${i.subtotal.toFixed(2)}</td></tr>`).join("")}
        </table>
        <p class="total">Total: Q${total}</p>
      </body></html>`;

    const win = window.open("", "_blank");
    win?.document.write(html);
    win?.document.close();
    win?.print();

    await supabase
      .from("despachos")
      .update({ completado: true })
      .eq("id_despacho", selected.id_despacho);
    setSelected(null);
    setBoleta([]);
    fetchDespachos();
  }

  const total = boleta.reduce((s, i) => s + i.subtotal, 0).toFixed(2);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-slate-100 mb-2">🧾 Boletas</h1>
      <p className="text-slate-500 text-sm mb-6">Solo despachos pendientes</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista despachos */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 mb-3">
            SELECCIONA UN DESPACHO
          </h2>
          {loading ? (
            <div className="text-indigo-400 animate-pulse">Cargando...</div>
          ) : (
            <div className="space-y-2">
              {despachos.length === 0 && (
                <p className="text-slate-500">No hay despachos pendientes</p>
              )}
              {despachos.map((d) => (
                <button
                  key={d.id_despacho}
                  onClick={() => fetchBoleta(d)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id_despacho === d.id_despacho ? "bg-indigo-600 border-indigo-500" : "bg-slate-800 border-slate-700 hover:border-indigo-500"}`}
                >
                  <span
                    className={`font-bold ${selected?.id_despacho === d.id_despacho ? "text-white" : "text-slate-100"}`}
                  >
                    #{d.no_despacho}
                  </span>
                  <span
                    className={`text-sm ml-3 ${selected?.id_despacho === d.id_despacho ? "text-indigo-200" : "text-slate-400"}`}
                  >
                    {d.colaboradores?.[0]?.nombre}{" "}
                    {d.colaboradores?.[0]?.apellido} — {d.fecha}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Boleta */}
        <div>
          {loadingBoleta && (
            <div className="text-indigo-400 animate-pulse">
              Cargando boleta...
            </div>
          )}
          {boleta.length > 0 && !loadingBoleta && (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-lg font-black text-slate-100 text-center mb-1">
                Dirección Administrativa
              </h2>
              <p className="text-slate-400 text-sm text-center mb-4">
                Boleta de Despacho
              </p>

              <div className="bg-slate-900 rounded-xl p-4 mb-4 space-y-1">
                <p className="text-slate-400 text-sm">
                  <span className="font-bold">No. Despacho:</span> #
                  {boleta[0].no_despacho}
                </p>
                <p className="text-slate-400 text-sm">
                  <span className="font-bold">Fecha:</span> {boleta[0].fecha}
                </p>
                <p className="text-slate-400 text-sm">
                  <span className="font-bold">Colaborador:</span>{" "}
                  {boleta[0].colaborador}
                </p>
                <p className="text-slate-400 text-sm">
                  <span className="font-bold">Departamento:</span>{" "}
                  {boleta[0].departamento}
                </p>
                <p className="text-slate-400 text-sm">
                  <span className="font-bold">Puesto:</span> {boleta[0].puesto}
                </p>
              </div>

              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-xs text-slate-400">
                      Código
                    </th>
                    <th className="text-left py-2 text-xs text-slate-400">
                      Descripción
                    </th>
                    <th className="text-right py-2 text-xs text-slate-400">
                      Precio
                    </th>
                    <th className="text-center py-2 text-xs text-slate-400">
                      Cant.
                    </th>
                    <th className="text-right py-2 text-xs text-slate-400">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {boleta.map((item, i) => (
                    <tr key={i} className="border-b border-slate-700/50">
                      <td className="py-2 text-indigo-400 font-mono">
                        {item.codigo_articulo}
                      </td>
                      <td className="py-2 text-slate-100">
                        {item.descripcion}
                      </td>
                      <td className="py-2 text-right text-slate-300">
                        Q{Number(item.precio_unitario).toFixed(2)}
                      </td>
                      <td className="py-2 text-center text-slate-300">
                        {item.cantidad}
                      </td>
                      <td className="py-2 text-right text-green-400 font-bold">
                        Q{item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center mb-4">
                <span className="text-slate-400 font-bold">TOTAL:</span>
                <span className="text-green-400 font-black text-xl">
                  Q{total}
                </span>
              </div>

              <button
                onClick={handleImprimir}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all"
              >
                🖨️ Imprimir y Completar Despacho
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
