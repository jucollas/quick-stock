"use client";

import React, { memo, useState } from "react";
import {
  Plus,
  Package,
  Tag,
  DollarSign,
  Boxes,
  AlertTriangle,
  Barcode,
  CheckCircle,
  XCircle,
  TrendingUp,
  Archive,
} from "lucide-react";

type ProductoForm = {
  product_id: string;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
};

type InventoryFormProps = {
  onCrear: (form: ProductoForm) => Promise<boolean>;
};

type IconType = React.ComponentType<{ size?: number; className?: string }>;

type InputWithIconProps = {
  icon: IconType;
  label: string;
  placeholder: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string | number;
  step?: string | number;
  prefix?: string;
  suffix?: string;
  description?: string;

  
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  error?: string;
};

const InputWithIcon = memo(function InputWithIcon({
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  step,
  prefix,
  suffix,
  description,
  isFocused,
  onFocus,
  onBlur,
  error,
}: InputWithIconProps) {
  const hasError = !!error;
  const hasValue = value !== "" && value !== 0;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative group">
        <div
          className={`
            absolute left-3 top-1/2 -translate-y-1/2 transform transition-all duration-200 z-10
            ${isFocused ? "text-blue-500 scale-110" : "text-gray-400 group-hover:text-gray-600"}
            ${hasError ? "text-red-500" : ""}
          `}
        >
          <Icon size={18} />
        </div>

        {prefix && (
          <div className="absolute left-11 top-1/2 -translate-y-1/2 transform text-sm font-medium text-gray-500 z-10">
            {prefix}
          </div>
        )}

        <input
          type={type}
          className={`
            w-full ${prefix ? "pl-16" : "pl-11"} ${suffix ? "pr-16" : "pr-4"} py-4 rounded-2xl border-2 text-sm font-medium
            transition-all duration-300 ease-out
            placeholder:text-gray-400 placeholder:font-normal
            focus:outline-none focus:ring-0
            ${
              isFocused
                ? hasError
                  ? "border-red-400 bg-red-50/50 shadow-lg shadow-red-100/50"
                  : "border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-100/50 scale-[1.02]"
                : hasError
                ? "border-red-300 hover:border-red-400"
                : hasValue
                ? "border-green-300 bg-green-50/30 hover:border-green-400"
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }
          `}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          required={required}
          min={min as any}
          step={step as any}
          autoComplete="off"
        />

        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 transform text-sm font-medium text-gray-500">
            {suffix}
          </div>
        )}

      </div>

      {description && <p className="ml-1 text-xs text-gray-500">{description}</p>}
      {hasError && <p className="ml-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
});

export default function InventoryForm({ onCrear }: InventoryFormProps) {
  const [form, setForm] = useState<ProductoForm>({
    product_id: "",
    name: "",
    price: 0,
    stock: 0,
    min_stock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<ProductoForm>>({});

  const handleFocus = (fieldName: string) => setFocusedField(fieldName);
  const handleBlur = () => setFocusedField(null);

  
  const handleInputChange = (field: keyof ProductoForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    
    if (field in errors) {
      setErrors((prev) => {
        const next = { ...prev };
        delete (next as any)[field];
        return next;
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await onCrear(form);
      if (success) {
        setForm({ product_id: "", name: "", price: 0, stock: 0, min_stock: 0 });
        setErrors({});
      }
    } finally {
      setLoading(false);
    }
  };

  // Progreso (solo visual)
  const completedFields = Object.values(form).filter((v) => v !== "" && v !== 0).length;
  const totalFields = Object.keys(form).length;
  const progressPercent = (completedFields / totalFields) * 100;

  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 opacity-60" />

      <div className="relative rounded-3xl border border-white/50 bg-white/80 p-8 shadow-xl shadow-purple-100/20 backdrop-blur-sm">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
                Nuevo Producto
              </h2>
              <p className="text-gray-600">Agrega productos a tu inventario</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Info básica */}
          <div className="space-y-6">
            <div className="mb-4 flex items-center gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Información Básica</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <InputWithIcon
                icon={Barcode}
                label="ID del Producto"
                placeholder="Ej: PROD-001, SKU123"
                value={form.product_id}
                onChange={(v) => handleInputChange("product_id", v)}
                isFocused={focusedField === "product_id"}
                onFocus={() => handleFocus("product_id")}
                onBlur={handleBlur}
                description="Código único para identificar el producto"
                error={errors.product_id}
              />

              <InputWithIcon
                icon={Package}
                label="Nombre del Producto"
                placeholder="Ej: Camiseta Nike, Laptop Dell"
                value={form.name}
                onChange={(v) => handleInputChange("name", v)}
                isFocused={focusedField === "name"}
                onFocus={() => handleFocus("name")}
                onBlur={handleBlur}
                description="Nombre descriptivo del producto"
                error={errors.name}
              />
            </div>
          </div>

          {/* Precio y stock */}
          <div className="space-y-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-red-950 to-pink-500 p-2 shadow-md">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Precio y Stock</h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Información comercial
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <InputWithIcon
                icon={DollarSign}
                label="Precio de Venta"
                placeholder="0.00"
                value={form.price}
                onChange={(v) => handleInputChange("price", Number(v))}
                type="number"
                isFocused={focusedField === "price"}
                onFocus={() => handleFocus("price")}
                onBlur={handleBlur}
                min="0.01"
                step="0.01"
                suffix="COP"
                description="Precio unitario de venta"
              />

              <InputWithIcon
                icon={Boxes}
                label="Stock Inicial"
                placeholder="0"
                value={form.stock}
                onChange={(v) => handleInputChange("stock", Number(v))}
                type="number"
                isFocused={focusedField === "stock"}
                onFocus={() => handleFocus("stock")}
                onBlur={handleBlur}
                min=""
                suffix="unidades"
                description="Cantidad inicial en inventario"
              />

              <InputWithIcon
                icon={AlertTriangle}
                label="Stock Mínimo"
                placeholder="0"
                value={form.min_stock}
                onChange={(v) => handleInputChange("min_stock", Number(v))}
                type="number"
                isFocused={focusedField === "min_stock"}
                onFocus={() => handleFocus("min_stock")}
                onBlur={handleBlur}
                min=""
                suffix="unidades"
                description="Alerta cuando llegue a esta cantidad"
              />
            </div>
          </div>

          {/* Preview */}
          {form.name && (
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
                <Archive className="h-5 w-5" />
                Vista previa del producto
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">ID:</span>
                  <span className="ml-2 font-semibold">{form.product_id || "Sin definir"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <span className="ml-2 font-semibold">{form.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Precio:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    ${form.price.toLocaleString("es-CO")} COP
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Stock:</span>
                  <span
                    className={`ml-2 font-semibold ${
                      form.stock > form.min_stock ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    {form.stock} unidades
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center gap-4 pt-6">
            <button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className={`
                flex-1 flex items-center justify-center gap-3 rounded-2xl py-4 px-6 font-semibold text-white
                transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                ${
                  loading || Object.keys(errors).length > 0
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-gradient-to-r from-red-300 to-red-600 shadow-lg hover:from-pink-600 hover:to-pink-800 hover:shadow-xl"
                }
              `}
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creando producto...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Agregar Producto al Inventario
                </>
              )}
            </button>

            {(form.product_id || form.name || form.price || form.stock || form.min_stock) && (
              <button
                type="button"
                onClick={() => {
                  setForm({ product_id: "", name: "", price: 0, stock: 0, min_stock: 0 });
                  setErrors({});
                }}
                className="rounded-2xl bg-gray-100 px-4 py-4 text-gray-700 transition-colors hover:bg-gray-200"
              >
                Limpiar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
