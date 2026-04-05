import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Invoice, AppSettings, Service, Customer, Employee } from '../types';

interface ThermalReceiptProps {
  invoice: Invoice;
  settings: AppSettings;
  services: Service[];
  customer: Customer | null;
  employees: Employee[];
}

const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ invoice, settings, services, customer, employees }) => {
  const fontStyle = { fontFamily: "'Source Code Pro', monospace" };

  const invoiceDate = new Date(invoice.date);
  const formattedDate = invoiceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const formattedTime = invoiceDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const aggregatedItems = invoice.items.reduce((acc, item) => {
    const existing = acc.find(i => i.serviceId === item.serviceId && i.employeeId === item.employeeId);
    if (existing) {
      existing.quantity++;
    } else {
      acc.push({ ...item, quantity: 1 });
    }
    return acc;
  }, [] as (typeof invoice.items[0] & { quantity: number })[]);

  const totalMRP = aggregatedItems.reduce((sum, item) => {
      const service = services.find(s => s.id === item.serviceId);
      // service.price is the original price (MRP)
      return sum + (service?.price || item.price) * item.quantity;
  }, 0);
  
  const totalQty = aggregatedItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-white text-black p-2 max-w-[300px] mx-auto text-xs" style={fontStyle}>
      <div className="text-center font-bold">
        <p>SEQUENCE TRADITIONAL SPA FOR WELLNESS</p>
      </div>
      <div className="text-center text-[10px] leading-tight">
        <p>RSM UNIT. 33, 34, RELIANCE MALL, 2ND FLOOR,</p>
        <p>OPP. APPLE HOSPITAL UDHANA DARWAJA</p>
        <p>SIRAT 395002</p>
        <p>PHONE: 9558436600</p>
      </div>
      
      <div className="border-t border-b border-black border-dashed my-2 py-1">
        <div className="flex justify-between">
            <span>NAME:</span>
            <span>{invoice.customerName.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
            <span>PHONE:</span>
            <span>{customer?.phone || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
            <span>BILL NO:</span>
            <span>{invoice.id}</span>
        </div>
        <div className="flex justify-between">
            <span>DATE: {formattedDate}</span>
            <span>TIME: {formattedTime}</span>
        </div>
      </div>
      
      <div className="font-bold">
          <div className="flex">
              <span className="w-1/2">ITEM NAME</span>
              <span className="w-1/4 text-center">QTY X PRICE</span>
              <span className="w-1/4 text-right">AMOUNT (SAVINGS)</span>
          </div>
      </div>
      <div className="border-t border-black border-dashed mt-1"></div>

      {aggregatedItems.map((item, index) => {
        const service = services.find(s => s.id === item.serviceId);
        const employee = employees.find(e => e.id === item.employeeId);
        const mrp = service?.price || item.price;
        const salePricePerUnit = item.price; // This is the price at time of sale
        const itemSavings = (mrp - salePricePerUnit) * item.quantity;
        const itemFinalPrice = salePricePerUnit * item.quantity;

        return (
             <div key={index} className="mt-1">
                <p className="font-bold">{service?.name.toUpperCase() || 'UNKNOWN ITEM'}</p>
                {employee && <p className="text-[10px] pl-2">THERAPIST: {employee.name.toUpperCase()}</p>}
                <div className="text-[10px]">
                    [MRP {mrp.toFixed(2)}]
                </div>
                <div className="flex">
                     <span className="w-1/2"></span>
                     <span className="w-1/4 text-center">{item.quantity}(HRS) X {salePricePerUnit.toFixed(2)}</span>
                     <span className="w-1/4 text-right">{itemFinalPrice.toFixed(2)} ({itemSavings.toFixed(2)})</span>
                </div>
             </div>
        );
      })}
      
      <div className="border-t border-black border-dashed my-2 pt-1">
        <div className="flex justify-between">
            <span>ITEMS/QTY: {aggregatedItems.length}/{totalQty.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>{totalMRP.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
            <span>DISCOUNT:</span>
            <span>{invoice.discount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex justify-between font-bold text-sm border-t-2 border-b-2 border-black my-1 py-1">
            <span>TOTAL AMOUNT:</span>
            <span>*{invoice.total.toFixed(2)}</span>
      </div>

      <div className="text-center mt-4 flex flex-col items-center space-y-4">
          {settings.thermalPrintSettings.showDynamicUPIQR && settings.upiId && (
            <div className="text-center border border-black border-dashed p-2 rounded">
              <p className="text-[8px] font-bold mb-1 uppercase">Scan to Pay (UPI)</p>
              <QRCodeSVG 
                value={`upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.merchantName)}&am=${invoice.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${invoice.id}`)}`}
                size={100}
              />
              <p className="text-[8px] mt-1">{settings.upiId}</p>
            </div>
          )}
          
          {settings.thermalPrintSettings.showGoogleReviewsQR && (
             <div className="text-center border border-black border-dashed p-2 rounded">
                <p className="text-[8px] font-bold mb-1 uppercase">Review Us</p>
                <QRCodeSVG value="https://g.page/r/your-google-review-link" size={100} />
             </div>
          )}

          <p className="font-bold">THANK YOU FOR YOUR VISIT!</p>
          <p className="text-[10px]">TERMS AND CONDITIONS</p>
      </div>
    </div>
  );
};

export default ThermalReceipt;