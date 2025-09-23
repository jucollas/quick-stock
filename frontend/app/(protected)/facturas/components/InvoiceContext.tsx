"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";

/** ===== Tipos ===== */
export type Producto = { product_id: string; name: string; price: number };

export type InvoiceItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  /** Enlace al inventario (para POST /billing/facturas) */
  productId?: string;
};

type Party = {
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type InvoiceState = {
  invoiceId: string | null;
  date: string;
  customer: Party;
  seller: Party;
  items: InvoiceItem[];
  taxRate: number; // 0.19 = 19%
  notes?: string;
  /** Catálogo cargado desde /inventory/products */
  products: Producto[];
};

type Action =
  | { type: "GENERATE_ID"; payload: string }
  | { type: "SET_DATE"; payload: string }
  | { type: "SET_CUSTOMER"; payload: Partial<Party> }
  | { type: "SET_SELLER"; payload: Partial<Party> }
  | { type: "SET_NOTES"; payload: string }
  | { type: "ADD_ITEM"; payload: InvoiceItem }
  | { type: "UPDATE_ITEM"; payload: { id: string; patch: Partial<InvoiceItem> } }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "REORDER_ITEMS"; payload: InvoiceItem[] }
  | { type: "SET_TAX"; payload: number }
  | { type: "SET_PRODUCTS"; payload: Producto[] }
  | { type: "CLEAR" };

/** ===== Helpers ===== */
const todayIso = () => new Date().toISOString().slice(0, 10);

const initialState: InvoiceState = {
  invoiceId: null,
  date: todayIso(),
  customer: { name: "" },
  seller: { name: "" },
  items: [],
  taxRate: 0.19,
  notes: "",
  products: [],
};

function reducer(state: InvoiceState, action: Action): InvoiceState {
  switch (action.type) {
    case "GENERATE_ID":
      return { ...state, invoiceId: action.payload };
    case "SET_DATE":
      return { ...state, date: action.payload };
    case "SET_CUSTOMER":
      return { ...state, customer: { ...state.customer, ...action.payload } };
    case "SET_SELLER":
      return { ...state, seller: { ...state.seller, ...action.payload } };
    case "SET_NOTES":
      return { ...state, notes: action.payload };
    case "ADD_ITEM":
      return { ...state, items: [...state.items, action.payload] };
    case "UPDATE_ITEM":
      return {
        ...state,
        items: state.items.map((it) =>
          it.id === action.payload.id ? { ...it, ...action.payload.patch } : it
        ),
      };
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((it) => it.id !== action.payload.id) };
    case "REORDER_ITEMS":
      return { ...state, items: action.payload };
    case "SET_TAX":
      return { ...state, taxRate: Math.max(0, action.payload) };
    case "SET_PRODUCTS":
      return { ...state, products: action.payload };
    case "CLEAR":
      return { ...initialState, invoiceId: null };
    default:
      return state;
  }
}

/** ===== Context ===== */
type Ctx = {
  state: InvoiceState;
  dispatch: React.Dispatch<Action>;
  generateId: () => void;
  addItemFromProduct: (p: Producto, qty: number) => void;
};

const InvoiceCtx = createContext<Ctx | null>(null);

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const generateId = () => {
    const id = crypto.randomUUID();
    dispatch({ type: "GENERATE_ID", payload: id });
  };

  const addItemFromProduct = (p: Producto, qty: number) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: crypto.randomUUID(),
        name: p.name,
        quantity: Math.max(1, qty || 1),
        price: Number(p.price),
        productId: p.product_id,
      },
    });
  };

  const value = useMemo(
    () => ({ state, dispatch, generateId, addItemFromProduct }),
    [state]
  );

  return <InvoiceCtx.Provider value={value}>{children}</InvoiceCtx.Provider>;
}

export function useInvoice() {
  const ctx = useContext(InvoiceCtx);
  if (!ctx) throw new Error("useInvoice must be used within InvoiceProvider");
  return ctx;
}

/** Totales + formato COP */
export function useInvoiceTotals(state: InvoiceState) {
  const subtotal = state.items.reduce((acc, it) => acc + it.quantity * it.price, 0);
  const tax = subtotal * state.taxRate;
  const total = subtotal + tax;
  const currency = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);
  return { subtotal, tax, total, currency };
}
