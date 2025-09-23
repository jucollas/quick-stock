
"use client";

import React, { memo, useState } from "react";
import { BadgeCheck, User, UserCheck, Mail, Phone, MapPin, CreditCard } from "lucide-react";
import { useInvoice } from "./InvoiceContext";

type IconType = React.ComponentType<{ size?: number; className?: string }>;

type InputWithIconProps = {
  icon: IconType;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
};

const InputWithIcon = memo(function InputWithIcon({
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  isFocused,
  onFocus,
  onBlur,
}: InputWithIconProps) {
  return (
    <div className="relative group">
      <div
        className={`
          absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-200
          ${isFocused ? "text-blue-500 scale-110" : "text-gray-400 group-hover:text-gray-600"}
        `}
      >
        <Icon size={18} />
      </div>
      <input
        type={type}
        className={`
          w-full pl-11 pr-4 py-3 rounded-2xl border-2 text-sm font-medium
          transition-all duration-300 ease-out
          placeholder:text-gray-400 placeholder:font-normal
          focus:outline-none focus:ring-0
          ${isFocused
            ? "border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-100/50 scale-[1.02]"
            : "border-gray-200 hover:border-gray-300 hover:shadow-md"}
          ${value ? "bg-green-50/30 border-green-200" : ""}
        `}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        required={required}
        autoComplete="off"
      />
    </div>
  );
});

/* =========================================================
   Formulario
   ========================================================= */
export default function CustomerSellerForm() {
  const {
    state: { customer, seller, notes },
    dispatch,
  } = useInvoice();

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const isF = (name: string) => focusedField === name;

  const focus = (name: string) => () => setFocusedField(name);
  const blur = () => setFocusedField(null);

  return (
    <div className="relative">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-60"></div>

      <div className="relative rounded-3xl border border-white/50 bg-white/80 p-8 shadow-xl shadow-blue-100/20 backdrop-blur-sm">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div>
            <h2 className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-2xl font-bold text-transparent">
              Información de Facturación
            </h2>
            <p className="text-sm text-gray-600">Complete los datos del cliente y vendedor</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Sección Cliente */}
          <div className="space-y-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-pink-400 to-pink-100 p-2 shadow-md">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Cliente</h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Información del comprador
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <InputWithIcon
                icon={User}
                placeholder="Nombre completo del cliente"
                value={customer.name ?? ""} // <- siempre string
                onChange={(value) => dispatch({ type: "SET_CUSTOMER", payload: { name: value } })} // <- SET_CUSTOMER
                isFocused={isF("customer-name")}
                onFocus={focus("customer-name")}
                onBlur={blur}
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputWithIcon
                  icon={CreditCard}
                  placeholder="Documento de identidad"
                  value={customer.document ?? ""}
                  onChange={(value) => dispatch({ type: "SET_CUSTOMER", payload: { document: value } })}
                  isFocused={isF("customer-document")}
                  onFocus={focus("customer-document")}
                  onBlur={blur}
                />
                <InputWithIcon
                  icon={Phone}
                  placeholder="Número de teléfono"
                  value={customer.phone ?? ""}
                  onChange={(value) => dispatch({ type: "SET_CUSTOMER", payload: { phone: value } })}
                  isFocused={isF("customer-phone")}
                  onFocus={focus("customer-phone")}
                  onBlur={blur}
                />
              </div>

              <InputWithIcon
                icon={Mail}
                placeholder="Correo electrónico"
                value={customer.email ?? ""}
                onChange={(value) => dispatch({ type: "SET_CUSTOMER", payload: { email: value } })}
                type="email"
                isFocused={isF("customer-email")}
                onFocus={focus("customer-email")}
                onBlur={blur}
              />

              <InputWithIcon
                icon={MapPin}
                placeholder="Dirección de facturación"
                value={customer.address ?? ""}
                onChange={(value) => dispatch({ type: "SET_CUSTOMER", payload: { address: value } })}
                isFocused={isF("customer-address")}
                onFocus={focus("customer-address")}
                onBlur={blur}
              />
            </div>
          </div>

          {/* Sección Vendedor */}
          <div className="space-y-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-pink-800 to-purple-300 p-2 shadow-md">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Vendedor</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Información del responsable</p>
              </div>
            </div>

            <div className="space-y-4">
              <InputWithIcon
                icon={UserCheck}
                placeholder="Nombre del vendedor"
                value={seller.name ?? ""} // <- siempre string
                onChange={(value) => dispatch({ type: "SET_SELLER", payload: { name: value } })}
                isFocused={isF("seller-name")}
                onFocus={focus("seller-name")}
                onBlur={blur}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputWithIcon
                  icon={CreditCard}
                  placeholder="Identificación"
                  value={seller.document ?? ""}
                  onChange={(value) => dispatch({ type: "SET_SELLER", payload: { document: value } })}
                  isFocused={isF("seller-document")}
                  onFocus={focus("seller-document")}
                  onBlur={blur}
                />
                <InputWithIcon
                  icon={Mail}
                  placeholder="Correo del vendedor"
                  value={seller.email ?? ""}
                  onChange={(value) => dispatch({ type: "SET_SELLER", payload: { email: value } })}
                  type="email"
                  isFocused={isF("seller-email")}
                  onFocus={focus("seller-email")}
                  onBlur={blur}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Notas */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Notas adicionales</h3>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Comentarios opcionales
              </p>
            </div>
          </div>

          <div className="relative group">
            <div
              className={`
                absolute left-4 top-4 z-10 transition-all duration-200
                ${isF("notes") ? "text-purple-500 scale-110" : "text-gray-400 group-hover:text-gray-600"}
              `}
            >
              <BadgeCheck size={18} />
            </div>
            <textarea
              className={`
                w-full resize-none rounded-2xl border-2 p-4 pl-12 text-sm font-medium
                transition-all duration-300 ease-out placeholder:text-gray-400 placeholder:font-normal
                focus:outline-none focus:ring-0
                ${isF("notes")
                  ? "border-purple-400 bg-purple-50/50 shadow-lg shadow-purple-100/50"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"}
                ${notes ? "bg-green-50/30 border-green-200" : ""}
              `}
              placeholder="Agregue notas, términos de pago, condiciones especiales o cualquier información adicional para esta factura..."
              value={notes ?? ""}
              onChange={(e) => dispatch({ type: "SET_NOTES", payload: e.target.value })}
              onFocus={focus("notes")}
              onBlur={blur}
              rows={4}
            />
          </div>
        </div>

        {/* Indicadores de progreso */}
        <div className="mt-6 border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progreso del formulario:</span>
            <div className="flex items-center gap-2">
              {[customer.name, seller.name].map((field, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    field ? "bg-green-400 shadow-md shadow-green-200" : "bg-gray-200"
                  }`}
                />
              ))}
              <span className="ml-2 text-xs font-semibold text-gray-700">
                {[customer.name, seller.name].filter(Boolean).length}/2 campos requeridos
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
