/**
 * SocialLead Pro - Subscription & Payment Lock Manager
 * Controls FREE (Locked) vs PRO (Unlocked) status, Payment Modals, and Admin Controls.
 */

class SubscriptionLicenseManager {
  constructor() {
    this.STORAGE_KEY = 'sociallead_license_status';
    this.PENDING_TRANSPERS_KEY = 'sociallead_pending_transfers';
    this.ADMIN_PIN = 'Puloma5.3';
    
    // Default Owner Payment Settings (Updated with user's actual accounts)
    this.paymentInfo = {
      bankBca: '2140639403',
      bankBcaName: 'Arif Febriyanto',
      bankMandiri: '2140639403',
      bankMandiriName: 'Arif Febriyanto (BCA)',
      danaOvo: '082113842783',
      danaOvoName: 'Arif Febriyanto (GoPay/DANA)',
      waAdmin: '6282113842783',
      price: 'Rp 99.000 / Seumur Hidup'
    };

    // Valid promo / VIP keys
    this.validKeys = ['PRO-2026-VIP', 'SOCIALLEAD-PRO', 'VIP-UNLOCKED-99', 'ADMIN-PASSED'];

    this.init();
  }

  init() {
    const savedStatus = localStorage.getItem(this.STORAGE_KEY);
    this.status = savedStatus === 'PRO' ? 'PRO' : 'FREE';
    this.updateUI();
  }

  isPro() {
    return this.status === 'PRO';
  }

  activatePro(licenseKey = null) {
    if (licenseKey && !this.validateKey(licenseKey)) {
      return { success: false, message: 'Kode Lisensi Tidak Valid atau Kadaluarsa!' };
    }
    
    this.status = 'PRO';
    localStorage.setItem(this.STORAGE_KEY, 'PRO');
    this.updateUI();
    return { success: true, message: 'Selamat! Akun Anda Berhasil Diaktifkan ke Status PRO VIP.' };
  }

  getPendingTransfers() {
    const raw = localStorage.getItem(this.PENDING_TRANSPERS_KEY);
    if (!raw) {
      // Seed initial sample request for demonstration
      const sample = [
        { id: 'tr-1', name: 'Budi Santoso', phone: '081299887766', bank: 'BCA (2140639403)', amount: 'Rp 99.000', date: new Date().toLocaleString('id-ID'), status: 'PENDING' }
      ];
      localStorage.setItem(this.PENDING_TRANSPERS_KEY, JSON.stringify(sample));
      return sample;
    }
    return JSON.parse(raw);
  }

  addPendingTransfer(userName = 'Pembeli Baru', userPhone = '-') {
    const list = this.getPendingTransfers();
    const newReq = {
      id: `tr-${Date.now()}`,
      name: userName,
      phone: userPhone,
      bank: 'BCA / GoPay',
      amount: 'Rp 99.000',
      date: new Date().toLocaleString('id-ID'),
      status: 'PENDING'
    };
    list.unshift(newReq);
    localStorage.setItem(this.PENDING_TRANSPERS_KEY, JSON.stringify(list));
    return newReq;
  }

  approveTransfer(id) {
    const list = this.getPendingTransfers();
    const item = list.find(t => t.id === id);
    if (item) {
      item.status = 'APPROVED';
      localStorage.setItem(this.PENDING_TRANSPERS_KEY, JSON.stringify(list));
      this.activatePro('ADMIN-PASSED');
      return true;
    }
    return false;
  }

  rejectTransfer(id) {
    const list = this.getPendingTransfers();
    const idx = list.findIndex(t => t.id === id);
    if (idx !== -1) {
      list.splice(idx, 1);
      localStorage.setItem(this.PENDING_TRANSPERS_KEY, JSON.stringify(list));
      return true;
    }
    return false;
  }

  validateKey(key) {
    if (!key) return false;
    const cleanKey = key.trim().toUpperCase();
    if (this.validKeys.includes(cleanKey)) return true;
    // Pattern check: PRO-xxxx-xxxx
    if (/^PRO-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleanKey)) return true;
    return false;
  }

  generateKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let r1 = '', r2 = '';
    for (let i = 0; i < 4; i++) {
      r1 += chars.charAt(Math.floor(Math.random() * chars.length));
      r2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const key = `PRO-${r1}-${r2}`;
    this.validKeys.push(key);
    return key;
  }

  updateUI() {
    const badgeEl = document.getElementById('planStatusBadge');
    const exportBtnExcel = document.getElementById('btnExportExcel');
    const exportBtnPdf = document.getElementById('btnExportPdf');
    const adminIndicator = document.getElementById('adminIndicator');

    if (badgeEl) {
      if (this.isPro()) {
        badgeEl.className = 'plan-badge pro';
        badgeEl.innerHTML = '<i class="fas fa-crown"></i> PRO VIP ACTIVE';
      } else {
        badgeEl.className = 'plan-badge free';
        badgeEl.innerHTML = '<i class="fas fa-lock"></i> FREE PLAN (Download Terkunci)';
      }
    }

    // Toggle locked overlay on export buttons
    if (exportBtnExcel) {
      if (this.isPro()) exportBtnExcel.classList.remove('locked');
      else exportBtnExcel.classList.add('locked');
    }
    if (exportBtnPdf) {
      if (this.isPro()) exportBtnPdf.classList.remove('locked');
      else exportBtnPdf.classList.add('locked');
    }

    if (adminIndicator) {
      adminIndicator.style.display = this.isPro() ? 'flex' : 'none';
    }
  }

  /**
   * Opens the Payment Modal when user clicks locked export or upgrade button
   */
  openPaymentModal(reason = 'Fitur Download PDF & Excel Terkunci!') {
    const modal = document.getElementById('paymentModal');
    if (!modal) return;

    document.getElementById('paymentModalReason').innerText = reason;
    document.getElementById('bcaNumber').innerText = this.paymentInfo.bankBca;
    document.getElementById('bcaName').innerText = this.paymentInfo.bankBcaName;
    document.getElementById('mandiriNumber').innerText = this.paymentInfo.bankMandiri;
    document.getElementById('mandiriName').innerText = this.paymentInfo.bankMandiriName;
    document.getElementById('danaNumber').innerText = this.paymentInfo.danaOvo;
    document.getElementById('priceTagText').innerText = this.paymentInfo.price;

    const waLink = `https://wa.me/${this.paymentInfo.waAdmin}?text=${encodeURIComponent('Halo Admin ARIF SOFT, saya sudah melakukan transfer pembayaran paket VIP. Mohon bantu konfirmasi dan aktifkan akun saya.')}`;
    document.getElementById('btnWaConfirmPayment').href = waLink;

    modal.classList.add('active');
  }

  closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.classList.remove('active');
  }

  openAdminModal() {
    const modal = document.getElementById('adminModal');
    if (!modal) return;

    // Refresh current values in form
    document.getElementById('adminStatusToggle').checked = this.isPro();
    document.getElementById('adminBcaInput') ? document.getElementById('adminBcaInput').value = this.paymentInfo.bankBca : null;
    document.getElementById('adminWaInput') ? document.getElementById('adminWaInput').value = this.paymentInfo.waAdmin : null;

    this.renderPendingTransfersTable();

    modal.classList.add('active');
  }

  renderPendingTransfersTable() {
    const container = document.getElementById('adminPendingList');
    if (!container) return;

    const list = this.getPendingTransfers();
    if (list.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1rem; font-size: 0.82rem;">Tidak ada permintaan transfer yang menggantung (pending).</div>`;
      return;
    }

    container.innerHTML = list.map(item => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: rgba(0,0,0,0.3); border: 1px solid var(--border-glass); border-radius: var(--radius-md); margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div style="font-weight: 700; color: white; font-size: 0.88rem;">${item.name} <span style="font-size: 0.75rem; font-weight: normal; color: var(--cyan);">(${item.phone || '-'})</span></div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${item.bank} • ${item.amount} • ${item.date}</div>
        </div>
        <div style="display: flex; gap: 0.4rem; align-items: center;">
          ${item.phone && item.phone !== '-' ? `
            <a href="https://wa.me/${item.phone.replace(/[^0-9]/g, '')}" target="_blank" class="btn-secondary" style="padding: 0.35rem 0.6rem; font-size: 0.75rem; color: #34d399; border-color: rgba(16,185,129,0.3);">
              <i class="fab fa-whatsapp"></i> Chat
            </a>
          ` : ''}
          ${item.status === 'APPROVED' ? `
            <span class="badge" style="background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4);">
              <i class="fas fa-check-circle"></i> TER-APPROVE
            </span>
          ` : `
            <button class="btn-primary btn-approve-tr" data-id="${item.id}" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; background: linear-gradient(135deg, #10b981, #059669);">
              <i class="fas fa-check"></i> Approve Aktivasi
            </button>
            <button class="btn-secondary btn-reject-tr" data-id="${item.id}" style="padding: 0.35rem 0.6rem; font-size: 0.78rem; color: var(--danger); border-color: rgba(239,68,68,0.3);" title="Hapus">
              <i class="fas fa-trash"></i>
            </button>
          `}
        </div>
      </div>
    `).join('');

    // Event handlers for approve/reject buttons
    container.querySelectorAll('.btn-approve-tr').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        this.approveTransfer(id);
        window.app.showToast('Aktivasi Berhasil Di-Approve! Fitur Pembeli Unlocked PRO.', 'success');
        this.renderPendingTransfersTable();
      });
    });

    container.querySelectorAll('.btn-reject-tr').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        this.rejectTransfer(id);
        window.app.showToast('Permintaan transfer berhasil dihapus.', 'info');
        this.renderPendingTransfersTable();
      });
    });
  }

  closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.remove('active');
  }
}

// Global License Instance
window.licenseManager = new SubscriptionLicenseManager();
