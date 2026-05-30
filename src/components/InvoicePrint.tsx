import { Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '../lib/supabase';

interface InvoicePrintProps {
  invoices: Invoice[];
  monthYear: string;
  companySettings?: any;
  onClose: () => void;
}

export default function InvoicePrint({ invoices, monthYear, companySettings, onClose }: InvoicePrintProps) {
  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' });

  const formatMonth = (my: string) => {
    const [year, month] = my.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  };

  const unitGroups = invoices.reduce((acc, inv) => {
    const unitId = inv.check_in?.unit_id;
    if (!unitId) return acc;
    if (!acc[unitId]) {
      acc[unitId] = {
        unit: inv.check_in?.unit,
        guests: [],
        totalFee: 0,
      };
    }
    acc[unitId].guests.push({
      name: inv.check_in?.guest_name,
      date: inv.check_in?.check_in_date,
    });
    acc[unitId].totalFee += Number(inv.cleaning_fee);
    return acc;
  }, {} as Record<string, any>);

 const grandTotal = Object.values(unitGroups).reduce(
  (sum, g: any) => sum + g.totalFee,
  0
);

const handlePrint = () => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFontSize(18);

  doc.text(
    companySettings?.company_name || 'CHECK IN POINT RESOURCES',
    14,
    20
  );

  doc.setFontSize(11);

  doc.text(
    `Monthly Cleaning Invoice - ${formatMonth(monthYear)}`,
    14,
    28
  );

  const rows = Object.values(unitGroups).map(
    (unitData: any, index) => [
      index + 1,
      unitData.unit?.name || '-',
      unitData.guests.map((g: any) => g.name).join(', '),
      unitData.guests.length.toString(),
      `RM ${unitData.totalFee.toFixed(2)}`
    ]
  );

  autoTable(doc, {
    startY: 36,
    head: [['No', 'Unit', 'Guests', 'Count', 'Amount']],
    body: rows,
    foot: [[
      '',
      '',
      '',
      'TOTAL',
      `RM ${grandTotal.toFixed(2)}`
    ]],
    styles: {
      fontSize: 10,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [37, 99, 235],
      halign: 'center',
    },
    footStyles: {
      fontStyle: 'bold',
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 35 },
      2: { cellWidth: 80 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'right', cellWidth: 30 },
    },
  });

  doc.save(`Invoice-${monthYear}.pdf`);
};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-gray-500">Unit summary invoice for {formatMonth(monthYear)}</p>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Printer size={16} />
          Print / Save PDF
        </button>
      </div>
      

      <div className="print-area">
       <div className="invoice-box border border-gray-200 rounded-xl p-8 bg-white">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{companySettings?.company_name || 'CHECK IN POINT RESOURCES'}</h1>
              <p className="text-gray-500 mt-2">Monthly Cleaning Service Invoice</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Invoice Date</p>
              <p className="font-semibold text-gray-900 text-lg">{formatDate(new Date().toISOString().split('T')[0])}</p>
              <p className="text-sm text-gray-500 mt-3">Billing Period</p>
              <p className="font-semibold text-gray-900 text-lg">{formatMonth(monthYear)}</p>
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left text-sm font-bold text-gray-700 pb-3">Unit</th>
                <th className="text-left text-sm font-bold text-gray-700 pb-3">Guest(s)</th>
                <th className="text-center text-sm font-bold text-gray-700 pb-3">Count</th>
                <th className="text-right text-sm font-bold text-gray-700 pb-3">Fee (RM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.values(unitGroups).map((unitData: any, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-4 font-medium text-gray-900">{unitData.unit?.name}</td>
                  <td className="py-4 text-gray-700 text-sm">
                    {unitData.guests.map((g: any, j: number) => (
                      <div key={j}>{g.name}</div>
                    ))}
                  </td>
                  <td className="py-4 text-center text-gray-700 font-medium">{unitData.guests.length}</td>
                  <td className="py-4 text-right font-bold text-gray-900">RM {unitData.totalFee.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td colSpan={3} className="pt-4 text-right font-bold text-gray-900">Total</td>
                <td className="pt-4 text-right font-bold text-xl text-gray-900">RM {grandTotal.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          {companySettings?.bank_name && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3">Bank Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Bank Name</p>
                  <p className="font-semibold text-gray-900">{companySettings.bank_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Account Holder</p>
                  <p className="font-semibold text-gray-900">{companySettings.account_holder}</p>
                </div>
              </div>
              {companySettings.account_number && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Account Number</p>
                  <p className="font-mono font-semibold text-gray-900">{companySettings.account_number}</p>
                </div>
              )}
            </div>
          )}

          {companySettings?.invoice_remark && (
            <div className="border-t border-gray-300 pt-6">
              <h3 className="font-bold text-gray-900 mb-2">Terms & Remarks</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{companySettings.invoice_remark}</p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors print:hidden"
      >
        Close
      </button>
    </div>
  );
}
