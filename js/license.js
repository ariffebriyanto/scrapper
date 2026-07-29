/**
 * SocialLead Pro - Subscription & Payment Lock Manager
 * Controls FREE (Locked) vs PRO (Unlocked) status, Payment Modals, and Admin Controls.
 */

class SubscriptionLicenseManager {
  constructor() {
    this.STORAGE_KEY = 'sociallead_license_status';
    this.ADMIN_PIN = '1234';
    
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

  deactivatePro() {
    this.status = 'FREE';
    localStorage.setItem(this.STORAGE_KEY, 'FREE');
    this.updateUI();
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
    document.getElementById('adminBcaInput').value = this.paymentInfo.bankBca;
    document.getElementById('adminMandiriInput').value = this.paymentInfo.bankMandiri;
    document.getElementById('adminWaInput').value = this.paymentInfo.waAdmin;

    modal.classList.add('active');
  }

  closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.classList.remove('active');
  }
}

// Global License Instance
window.licenseManager = new SubscriptionLicenseManager();
