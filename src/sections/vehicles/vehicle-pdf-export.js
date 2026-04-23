import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportVehiclePdf({ vehicle, policies = [], taxes = [], ztlList = [], maintenance = [] }) {
  const doc = new jsPDF();
  const plate = vehicle?.plate || '—';
  const now = new Date().toLocaleDateString('it-IT');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Scheda Veicolo — ${plate}`, 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generato il ${now}`, 14, 25);

  let y = 32;

  // ─── ANAGRAFICA ───────────────────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Anagrafica veicolo', 14, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    styles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    body: [
      ['Targa', plate],
      ['Marca / Modello', `${vehicle?.make || ''} ${vehicle?.model || ''}`.trim() || '—'],
      ['Telaio (VIN)', vehicle?.vin || '—'],
      ['Immatricolazione', vehicle?.registration_date || '—'],
      ['Alimentazione', vehicle?.fuel_type || '—'],
      ['Potenza', vehicle?.kw ? `${vehicle.kw} kW` : '—'],
      ['Cilindrata', vehicle?.engine_cc ? `${vehicle.engine_cc} cc` : '—'],
      ['Stato', vehicle?.status || '—'],
      ['Proprietario', vehicle?.owner_name || '—'],
      ['Assegnatario', vehicle?.assignee_name || '—'],
      ['Telepass', vehicle?.telepass_serial || '—'],
    ],
  });

  y = doc.lastAutoTable.finalY + 8;

  // ─── POLIZZE ──────────────────────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Polizze assicurative', 14, y);
  y += 2;

  if (policies.length === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Nessuna polizza registrata', 14, y + 5);
    y += 12;
  } else {
    autoTable(doc, {
      startY: y,
      theme: 'striped',
      styles: { fontSize: 8 },
      head: [['N° Polizza', 'Compagnia', 'Coperture', 'Scadenza', 'Premio', 'Stato']],
      body: policies.map((p) => [
        p.policy_number,
        p.insurer,
        (p.policy_types || []).join(', ') || '—',
        p.end_date || '—',
        p.premium_amount ? `€ ${Number(p.premium_amount).toLocaleString('it-IT')}` : '—',
        p.status,
      ]),
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── BOLLO ────────────────────────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bollo & Superbollo', 14, y);
  y += 2;

  if (taxes.length === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Nessun bollo registrato', 14, y + 5);
    y += 12;
  } else {
    autoTable(doc, {
      startY: y,
      theme: 'striped',
      styles: { fontSize: 8 },
      head: [['Anno', 'Targa', 'Regione', 'Bollo', 'Superbollo', 'Totale', 'N° Versamento', 'Stato']],
      body: taxes.map((t) => [
        t.year,
        plate,
        t.region || '—',
        `€ ${Number(t.bollo_amount).toLocaleString('it-IT')}`,
        Number(t.superbollo_amount) > 0 ? `€ ${Number(t.superbollo_amount).toLocaleString('it-IT')}` : '—',
        `€ ${Number(t.total_amount).toLocaleString('it-IT')}`,
        t.payment_reference || '—',
        t.status,
      ]),
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── ZTL ──────────────────────────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ZTL', 14, y);
  y += 2;

  if (ztlList.length === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Nessuna ZTL registrata', 14, y + 5);
    y += 12;
  } else {
    autoTable(doc, {
      startY: y,
      theme: 'striped',
      styles: { fontSize: 8 },
      head: [['Targa', 'Proprietario', 'Città', 'N° Autorizzazione', 'Tipologia', 'Scadenza']],
      body: ztlList.map((z) => [
        plate,
        vehicle?.owner_name || '—',
        z.city || '—',
        z.authorization_number || '—',
        z.permit_type || '—',
        z.valid_until || '—',
      ]),
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── MANUTENZIONI ─────────────────────────────────────────────────────────
  if (maintenance.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Manutenzioni', 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      theme: 'striped',
      styles: { fontSize: 8 },
      head: [['Tipo', 'Titolo', 'Data', 'Km', 'Importo', 'Prossima scadenza']],
      body: maintenance.map((m) => [
        m.maintenance_type,
        m.title,
        m.maintenance_date || '—',
        m.mileage ? m.mileage.toLocaleString('it-IT') : '—',
        m.amount ? `€ ${Number(m.amount).toLocaleString('it-IT')}` : '—',
        m.next_due_date || '—',
      ]),
    });
  }

  doc.save(`veicolo-${plate}-${now.replace(/\//g, '-')}.pdf`);
}
