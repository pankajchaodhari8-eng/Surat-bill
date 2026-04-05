import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Invoice, AppSettings, Service, Customer, Employee } from '../types';

interface StandardReceiptProps {
  invoice: Invoice;
  settings: AppSettings;
  services: Service[];
  customer: Customer | null;
  employees: Employee[];
}

const StandardReceipt: React.FC<StandardReceiptProps> = ({ invoice, settings, services, customer, employees }) => {
  const invoiceDate = new Date(invoice.date);

  return (
    <div className="bg-white text-black p-8 max-w-4xl mx-auto text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <header className="flex justify-between items-start pb-6 border-b-2 border-gray-800">
        <div>
          {settings.thermalPrintSettings.companyLogo && (
            <img src={settings.thermalPrintSettings.companyLogo} alt="Company Logo" className="h-16 mb-4" />
          )}
          <h1 className="text-3xl font-bold" style={{ fontSize: `${settings.thermalPrintSettings.orgNameFontSize}px` }}>SEQUENCE TRADITIONAL SPA</h1>
          <div style={{ fontSize: `${settings.thermalPrintSettings.companyNameFontSize}px` }}>
            <p>RSM UNIT. 33, 34, RELIANCE MALL, 2ND FLOOR,</p>
            <p>OPP. APPLE HOSPITAL UDHANA DARWAJA, SIRAT 395002</p>
            <p>Phone: 9558436600</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-light uppercase text-gray-600">Invoice</h2>
          <p className="mt-2"><strong>Invoice #:</strong> {invoice.id}</p>
          <p><strong>Date:</strong> {invoiceDate.toLocaleDateString()}</p>
        </div>
      </header>

      <section className="my-8 flex justify-between">
        <div>
          <h3 className="font-bold mb-2 text-gray-700">Bill To:</h3>
          <p>{invoice.customerName}</p>
          {customer && <p>{customer.phone}</p>}
        </div>
        <div className="text-right">
          <h3 className="font-bold mb-2 text-gray-700">Payment Details:</h3>
          <p><strong>Payment Method:</strong> <span className="capitalize">{invoice.paymentMode}</span></p>
        </div>
      </section>

      <section>
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="p-3 font-semibold">Item Description</th>
              <th className="p-3 w-48 font-semibold">Therapist</th>
              <th className="p-3 w-32 text-right font-semibold">Price</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => {
              const service = services.find(s => s.id === item.serviceId);
              const employee = employees.find(e => e.id === item.employeeId);
              return (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-3">{service?.name || 'Unknown Item'}</td>
                  <td className="p-3">{employee?.name || 'N/A'}</td>
                  <td className="p-3 text-right">${item.price.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="my-8 flex justify-between items-end">
        <div className="flex space-x-4">
          {settings.thermalPrintSettings.showDynamicUPIQR && settings.upiId && (
            <div className="text-center border p-2 rounded bg-gray-50">
              <p className="text-[10px] font-bold mb-1 uppercase">Scan to Pay (UPI)</p>
              <QRCodeSVG 
                value={`upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.merchantName)}&am=${invoice.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.id}`)}`}
                size={80}
              />
              <p className="text-[8px] mt-1">{settings.upiId}</p>
            </div>
          )}
          {settings.thermalPrintSettings.showGoogleReviewsQR && (
             <div className="text-center border p-2 rounded bg-gray-50">
                <p className="text-[10px] font-bold mb-1 uppercase">Review Us</p>
                <QRCodeSVG value="https://g.page/r/your-google-review-link" size={80} />
             </div>
          )}
        </div>
        <div className="w-full max-w-sm space-y-2 text-gray-700">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-${invoice.discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({settings.vatRate}%):</span>
            <span>${invoice.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-xl border-t-2 border-gray-800 pt-2 mt-2 text-black">
            <span>Total:</span>
            <span>${invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </section>

      <footer className="mt-12 pt-6 border-t border-gray-300 text-center text-gray-500">
        {settings.thermalPrintSettings.printTerms && <p className="text-xs mb-2">Terms and conditions apply.</p>}
        <p>{settings.thermalPrintSettings.notes}</p>
        <p className="mt-2 font-bold">Thank you for your business!</p>
      </footer>
    </div>
  );
};

export default StandardReceipt;