"use client";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useInvoice } from "./InvoiceContext";


export default function ItemsTable() {
  const { state, dispatch } = useInvoice();
  const items = state.items;


return (
  <div className="card">
    <h2 className="mb-3 text-base font-semibold">Ítems agregados</h2>
    {items.length === 0 ? (
      <p className="text-sm text-slate-500">Aún no has agregado productos.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2">Cantidad</th>
              <th className="px-3 py-2">Precio</th>
              <th className="px-3 py-2">Subtotal</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const subtotal = item.quantity * item.price;
              return (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t"
                >
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded-lg border p-2"
                      value={item.name}
                      onChange={(e) =>
                        dispatch({ type: "UPDATE_ITEM", payload: { id: item.id, patch: { name: e.target.value } } })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      className="w-24 rounded-lg border p-2"
                      value={item.quantity}
                      onChange={(e) =>
                        dispatch({ type: "UPDATE_ITEM", payload: { id: item.id, patch: { quantity: Number(e.target.value) } } })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      className="w-28 rounded-lg border p-2"
                      value={item.price}
                      onChange={(e) =>
                        dispatch({ type: "UPDATE_ITEM", payload: { id: item.id, patch: { price: Number(e.target.value) } } })
                      }
                    />
                  </td>
                  <td className="px-3 py-2 font-medium">{subtotal.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      className="inline-flex items-center rounded-lg border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => dispatch({ type: "REMOVE_ITEM", payload: { id: item.id } })}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
}