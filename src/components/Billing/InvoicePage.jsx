import React, { useState } from "react";
import InvoiceTable from "./InvoiceTable";
import EditInvoiceModal from "./EditInvoiceModal";

const InvoicePage = () => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  return (
    <>
      <InvoiceTable
        invoices={invoices}
        loading={loading}
        onEdit={(invoice) => setSelectedInvoice(invoice)}
      />

      {selectedInvoice && (
        <EditInvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </>
  );
};

export default InvoicePage;
