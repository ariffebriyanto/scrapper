/**
 * SocialLead Pro - Excel & PDF Exporter Module
 * Checks license subscription status before outputting files.
 */

class DataExporter {
  /**
   * Export leads to Excel (.xlsx)
   */
  exportToExcel(leads) {
    if (!window.licenseManager.isPro()) {
      window.licenseManager.openPaymentModal('Fitur Export Excel (.xlsx) hanya tersedia untuk Pengguna PRO VIP!');
      window.app.showToast('Fitur Export Terkunci! Silakan aktifkan lisensi PRO terlebih dahulu.', 'warning');
      return false;
    }

    if (!leads || leads.length === 0) {
      window.app.showToast('Tidak ada data lead untuk di-export!', 'warning');
      return false;
    }

    try {
      const formattedData = leads.map((item, idx) => ({
        'No': idx + 1,
        'Platform': item.platformName || item.platform,
        'Nama Lead / Bisnis': item.name,
        'Handle / Username': item.handle,
        'Email': item.email,
        'No WhatsApp / HP': item.phone || item.wa,
        'Alamat / Lokasi': item.address,
        'Kota': item.city,
        'Link Profil': item.url,
        'Bio / Deskripsi': item.bio,
        'Tanggal Scrape': item.scrapedAt
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      
      // Auto-fit column width
      const colWidths = [
        { wch: 5 },  // No
        { wch: 15 }, // Platform
        { wch: 30 }, // Nama Lead
        { wch: 20 }, // Handle
        { wch: 28 }, // Email
        { wch: 20 }, // Phone
        { wch: 35 }, // Address
        { wch: 15 }, // City
        { wch: 35 }, // Link Profil
        { wch: 45 }, // Bio
        { wch: 18 }  // Date
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'SocialLeads_Extracted');

      const fileName = `SocialLeads_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      window.app.showToast(`Berhasil mengekspor ${leads.length} data ke Excel (${fileName})`, 'success');
      return true;
    } catch (err) {
      console.error('Export Excel Error:', err);
      window.app.showToast('Gagal mengekspor ke Excel: ' + err.message, 'error');
      return false;
    }
  }

  /**
   * Export leads to PDF (.pdf)
   */
  exportToPDF(leads) {
    if (!window.licenseManager.isPro()) {
      window.licenseManager.openPaymentModal('Fitur Export PDF Document hanya tersedia untuk Pengguna PRO VIP!');
      window.app.showToast('Fitur Export Terkunci! Silakan aktifkan lisensi PRO terlebih dahulu.', 'warning');
      return false;
    }

    if (!leads || leads.length === 0) {
      window.app.showToast('Tidak ada data lead untuk di-export!', 'warning');
      return false;
    }

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape');

      // Title & Branding
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(30, 58, 138);
      doc.text('ARIF SOFT - Social Media & Web Lead Contact Extraction Report', 14, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')} | Total Lead: ${leads.length} Kontak`, 14, 28);

      // Table columns & rows
      const tableColumn = ["No", "Platform", "Nama Bisnis", "Email", "WhatsApp / HP", "Alamat / Lokasi"];
      const tableRows = [];

      leads.forEach((item, index) => {
        const leadData = [
          index + 1,
          item.platformName || item.platform,
          item.name,
          item.email || '-',
          item.phone || item.wa || '-',
          item.address || '-'
        ];
        tableRows.push(leadData);
      });

      // Render table using autoTable plugin
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 34,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85]
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { top: 34 }
      });

      const fileName = `SocialLeads_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);

      window.app.showToast(`Berhasil mengekspor ${leads.length} data ke PDF (${fileName})`, 'success');
      return true;
    } catch (err) {
      console.error('Export PDF Error:', err);
      window.app.showToast('Gagal mengekspor ke PDF: ' + err.message, 'error');
      return false;
    }
  }
}

// Global Exporter Instance
window.dataExporter = new DataExporter();
