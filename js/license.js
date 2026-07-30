/**
 * SocialLead Pro - Subscription & Payment Lock Manager
 * Controls FREE (Locked) vs PRO (Unlocked) status, Payment Modals, and Admin Controls.
 */

class SubscriptionLicenseManager {
  constructor() {
    this.STORAGE_KEY = 'sociallead_license_status';
    this.USERS_KEY = 'sociallead_registered_users';
    this.CURRENT_USER_KEY = 'sociallead_current_user';
    this.PENDING_TRANSPERS_KEY = 'sociallead_pending_transfers';
    this.ADMIN_PIN = 'Puloma5.3';
    
    // Owner Payment Settings
    this.paymentInfo = {
      bankBca: '2140639403',
      bankBcaName: 'Arif Febriyanto',
      bankMandiri: '2140639403',
      bankMandiriName: 'Arif Febriyanto (BCA)',
      danaOvo: '082113842783',
      danaOvoName: 'Arif Febriyanto (GoPay/DANA)',
      waAdmin: '6282113842783'
    };

    // Pricing tiers definition
    this.plans = {
      '1_month': { name: '1 Bulan', price: 'Rp 150.000', days: 30 },
      '3_months': { name: '3 Bulan', price: 'Rp 400.000', days: 90 },
      '6_months': { name: '6 Bulan', price: 'Rp 800.000', days: 180 },
      '1_year': { name: '1 Tahun (Paling Hemat)', price: 'Rp 1.000.000', days: 365 }
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

  loginUser(identity) {
    if (!identity) return { success: false, message: 'Silakan masukkan Email atau No. WhatsApp Anda!' };
    const cleanId = identity.trim().toLowerCase();
    const users = this.getRegisteredUsers();
    
    const user = users.find(u => 
      u.email.toLowerCase() === cleanId || 
      (u.phone && u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, ''))
    );

    if (user) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      this.status = user.status || 'FREE';
      localStorage.setItem(this.STORAGE_KEY, this.status);
      this.updateUI();
      return { success: true, user: user, message: `Selamat datang kembali, ${user.name} (${user.status})!` };
    }

    return { success: false, message: 'Akun tidak ditemukan. Silakan klik tab "Daftar Akun Baru".' };
  }

  registerUser(name, email, phone) {
    const users = this.getRegisteredUsers();
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existing) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(existing));
      this.updateUI();
      return { success: true, user: existing, isNew: false, message: `Selamat datang kembali, ${existing.name}!` };
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name,
      email: email,
      phone: phone,
      status: 'FREE', // Default status = FREE
      registeredAt: new Date().toLocaleDateString('id-ID'),
      vipExpiresAt: null
    };

    if (window.cloudDB) window.cloudDB.saveUser(newUser);
    else {
      users.push(newUser);
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }

    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(newUser));
    this.updateUI();
    return { success: true, user: newUser, isNew: true, message: `Pendaftaran berhasil! Akun Anda berstatus FREE PLAN.` };
  }

  getRegisteredUsers() {
    let list = [];
    if (window.cloudDB && typeof window.cloudDB.getUsers === 'function') {
      list = window.cloudDB.getUsers();
    } else {
      const raw = localStorage.getItem(this.USERS_KEY);
      try { list = raw ? JSON.parse(raw) : []; } catch (e) { list = []; }
    }
    return Array.isArray(list) ? list : [];
  }

  getCurrentUser() {
    const raw = localStorage.getItem(this.CURRENT_USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  logoutUser() {
    localStorage.removeItem(this.CURRENT_USER_KEY);
    this.status = 'FREE';
    localStorage.setItem(this.STORAGE_KEY, 'FREE');
    this.updateUI();
  }

  isPro() {
    const currUser = this.getCurrentUser();
    if (currUser && currUser.status === 'PRO') return true;
    return this.status === 'PRO';
  }

  activatePro(licenseKey = null, planKey = '1_year') {
    const currUser = this.getCurrentUser();
    const targetPlan = this.plans[planKey] || this.plans['1_year'];
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + targetPlan.days);
    const expDateStr = expDate.toLocaleDateString('id-ID');

    if (currUser) {
      currUser.status = 'PRO';
      currUser.vipExpiresAt = expDateStr;
      currUser.planName = targetPlan.name;
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(currUser));

      // Update in registered users array
      const users = this.getRegisteredUsers();
      const idx = users.findIndex(u => u.id === currUser.id);
      if (idx !== -1) {
        users[idx] = currUser;
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      }
    }

    this.status = 'PRO';
    localStorage.setItem(this.STORAGE_KEY, 'PRO');
    this.updateUI();
    return { success: true, message: `Selamat! Paket PRO VIP ${targetPlan.name} Berhasil Diaktifkan s.d. ${expDateStr}.` };
  }

  getPendingTransfers() {
    const raw = localStorage.getItem(this.PENDING_TRANSPERS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  addPendingTransfer(userName = 'Pembeli Baru', userPhone = '-', planKey = '1_year') {
    const list = this.getPendingTransfers();
    const plan = this.plans[planKey] || this.plans['1_year'];
    const newReq = {
      id: `tr-${Date.now()}`,
      name: userName,
      phone: userPhone,
      planKey: planKey,
      planName: plan.name,
      amount: plan.price,
      bank: 'BCA / GoPay',
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
      this.activatePro('ADMIN-PASSED', item.planKey || '1_year');
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
    const freeBanner = document.getElementById('freeBannerCallout');
    const navUpgradeBtn = document.getElementById('btnUpgradeProNav');

    if (badgeEl) {
      if (this.isPro()) {
        badgeEl.className = 'plan-badge pro';
        badgeEl.innerHTML = '<i class="fas fa-crown"></i> PRO VIP ACTIVE';
      } else {
        badgeEl.className = 'plan-badge free';
        badgeEl.innerHTML = '<i class="fas fa-lock"></i> FREE PLAN (Download Terkunci)';
      }
    }

    if (freeBanner) {
      freeBanner.style.display = this.isPro() ? 'none' : 'flex';
    }

    if (navUpgradeBtn) {
      if (this.isPro()) {
        navUpgradeBtn.style.display = 'none';
      } else {
        navUpgradeBtn.style.display = 'inline-flex';
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

    const modalReason = document.getElementById('paymentModalReason');
    if (modalReason) modalReason.innerText = reason;

    const bcaNum = document.getElementById('bcaNumber');
    if (bcaNum) bcaNum.innerText = this.paymentInfo.bankBca;

    const bcaNm = document.getElementById('bcaName');
    if (bcaNm) bcaNm.innerText = this.paymentInfo.bankBcaName;

    const danaNum = document.getElementById('danaNumber');
    if (danaNum) danaNum.innerText = this.paymentInfo.danaOvo;

    const priceTag = document.getElementById('priceTagText');
    if (priceTag) priceTag.innerText = this.paymentInfo.price;

    const waLink = `https://wa.me/${this.paymentInfo.waAdmin}?text=${encodeURIComponent('Halo Admin ARIF SOFT, saya sudah melakukan transfer pembayaran paket VIP. Mohon bantu konfirmasi dan aktifkan akun saya.')}`;
    const btnWa = document.getElementById('btnWaConfirmPayment');
    if (btnWa) btnWa.href = waLink;

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
