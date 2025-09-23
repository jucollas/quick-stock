"use client";
import { InvoiceProvider } from "./components/InvoiceContext";
import InvoiceHeader from "./components/InvoiceHeader";
import CustomerSellerForm from "./components/CustomerSellerForm";
import ProductForm from "./components/ProductForm";
import ItemsTable from "./components/ItemsTable";
import Totals from "./components/Totals";
import ActionsBar from "./components/ActionsBar";
import InvoicePreview from "./components/InvoicePreview";


export default function Page() {
  return (
    <InvoiceProvider>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 print:px-0">
        {/* Encabezado */}
        <InvoiceHeader />

        {/* Layout principal */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Columna izquierda: formularios */}
          <section className="lg:col-span-2 space-y-6 print:hidden">
            <CustomerSellerForm />
            <ProductForm />
            <ItemsTable />
          </section>

          {/* Columna derecha: totales y acciones */}
          <aside className="space-y-6 print:hidden">
            <Totals />
            <ActionsBar />
          </aside>
        </div>

        {/* Vista imprimible */}
        <section className="mt-8">
          <InvoicePreview />
        </section>
      </main>
    </InvoiceProvider>
  );
}
