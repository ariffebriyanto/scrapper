/**
 * SocialLead Pro - Main Application Logic & UI Controller
 */

class SocialLeadApp {
  constructor() {
    this.leads = [...SAMPLE_LEADS];
    this.filteredLeads = [...SAMPLE_LEADS];
    this.activePlatform = 'all';
    this.selectedLeadIds = new Set();
    
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.bindEvents();
      this.renderTable();
      this.updateStats();

      // Set initial placeholder for default 'all' platform
      const queryInput = document.getElementById('searchQueryInput');
      if (queryInput) {
        queryInput.placeholder = 'Masukkan Kata Kunci Target (Pencarian Otomatis ke SEMUA Platform: FB, TikTok, IG, Google, YouTube)';
      }
    });
  }

  bindEvents() {
    // Platform selector buttons
    const platformBtns = document.querySelectorAll('.platform-btn');
    platformBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        platformBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activePlatform = btn.dataset.platform;
        
        // Update input placeholder dynamically
        const queryInput = document.getElementById('searchQueryInput');
        if (this.activePlatform === 'url') {
          queryInput.placeholder = 'Masukkan URL Web / Sosmed (Contoh: https://instagram.com/toko_baju)';
        } else if (this.activePlatform === 'all') {
          queryInput.placeholder = 'Masukkan Kata Kunci Target (Pencarian Otomatis ke SEMUA Platform: FB, TikTok, IG, Google, YouTube)';
        } else {
          queryInput.placeholder = `Masukkan Kata Kunci Target (Contoh: Kuliner ${this.activePlatform.toUpperCase()} Jakarta)`;
        }
      });
    });

    // Scrape Form Submit
    const scrapeForm = document.getElementById('scrapeForm');
    if (scrapeForm) {
      scrapeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleStartScraping();
      });
    }

    // Export Buttons
    const btnExcel = document.getElementById('btnExportExcel');
    if (btnExcel) {
      btnExcel.addEventListener('click', () => {
        window.dataExporter.exportToExcel(this.getSelectedOrAllLeads());
      });
    }

    const btnPdf = document.getElementById('btnExportPdf');
    if (btnPdf) {
      btnPdf.addEventListener('click', () => {
        window.dataExporter.exportToPDF(this.getSelectedOrAllLeads());
      });
    }

    // Search and Table Filters
    const tableSearchInput = document.getElementById('tableSearchInput');
    if (tableSearchInput) {
      tableSearchInput.addEventListener('input', () => this.filterData());
    }

    const filterPlatformSelect = document.getElementById('filterPlatformSelect');
    if (filterPlatformSelect) {
      filterPlatformSelect.addEventListener('change', () => this.filterData());
    }

    const filterHasEmail = document.getElementById('filterHasEmail');
    const filterHasWa = document.getElementById('filterHasWa');
    if (filterHasEmail) filterHasEmail.addEventListener('change', () => this.filterData());
    if (filterHasWa) filterHasWa.addEventListener('change', () => this.filterData());

    // Select All Checkbox
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        this.filteredLeads.forEach(lead => {
          if (isChecked) this.selectedLeadIds.add(lead.id);
          else this.selectedLeadIds.delete(lead.id);
        });
        this.renderTable();
      });
    }

    // User Account Register & Login Handlers
    const btnUserAuthNav = document.getElementById('btnUserAuthNav');
    const btnUserLogoutNav = document.getElementById('btnUserLogoutNav');
    const registerModal = document.getElementById('registerModal');
    const btnCloseRegisterModal = document.getElementById('btnCloseRegisterModal');

    const tabLoginBtn = document.getElementById('tabAuthLoginBtn');
    const tabRegisterBtn = document.getElementById('tabAuthRegisterBtn');
    const loginSection = document.getElementById('authLoginSection');
    const registerSection = document.getElementById('authRegisterSection');

    if (tabLoginBtn && tabRegisterBtn) {
      tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.style.background = 'var(--primary)';
        tabLoginBtn.style.color = 'white';
        tabRegisterBtn.style.background = 'transparent';
        tabRegisterBtn.style.color = 'var(--text-muted)';
        if (loginSection) loginSection.style.display = 'block';
        if (registerSection) registerSection.style.display = 'none';
      });

      tabRegisterBtn.addEventListener('click', () => {
        tabRegisterBtn.style.background = 'var(--primary)';
        tabRegisterBtn.style.color = 'white';
        tabLoginBtn.style.background = 'transparent';
        tabLoginBtn.style.color = 'var(--text-muted)';
        if (registerSection) registerSection.style.display = 'block';
        if (loginSection) loginSection.style.display = 'none';
      });
    }

    const updateNavUserStatus = () => {
      const currUser = (window.licenseManager && window.licenseManager.getCurrentUser) ? window.licenseManager.getCurrentUser() : null;
      const btnAuthNav = document.getElementById('btnUserAuthNav');
      const profileBadge = document.getElementById('userProfileBadge');
      const profileText = document.getElementById('userProfileText');
      const btnLogoutNav = document.getElementById('btnUserLogoutNav');

      if (currUser) {
        // Logged In: HIDE Daftar/Login button, SHOW Profile badge & Logout button
        if (btnAuthNav) btnAuthNav.style.display = 'none';
        if (profileBadge) profileBadge.style.display = 'inline-flex';
        if (profileText) profileText.innerText = `${currUser.name} (${currUser.status})`;
        if (btnLogoutNav) btnLogoutNav.style.display = 'inline-flex';
      } else {
        // Logged Out: SHOW Daftar/Login button, HIDE Profile badge & Logout button
        if (btnAuthNav) btnAuthNav.style.display = 'inline-flex';
        if (profileBadge) profileBadge.style.display = 'none';
        if (btnLogoutNav) btnLogoutNav.style.display = 'none';
      }
    };
    updateNavUserStatus();

    // User Profile Modal Handlers
    const profileModal = document.getElementById('profileModal');
    const btnCloseProfileModal = document.getElementById('btnCloseProfileModal');
    const profileBadge = document.getElementById('userProfileBadge');

    const openProfileModal = () => {
      const currUser = window.licenseManager.getCurrentUser();
      if (!currUser) return;

      if (document.getElementById('profName')) document.getElementById('profName').innerText = currUser.name;
      if (document.getElementById('profEmail')) document.getElementById('profEmail').innerText = currUser.email;
      if (document.getElementById('profPhone')) document.getElementById('profPhone').innerText = currUser.phone || '-';

      const profStatusBadge = document.getElementById('profStatusBadge');
      const profExpireText = document.getElementById('profExpireText');

      if (currUser.status === 'PRO') {
        if (profStatusBadge) {
          profStatusBadge.className = 'badge badge-google';
          profStatusBadge.innerHTML = '<i class="fas fa-crown"></i> PRO VIP ACTIVE';
        }
        if (profExpireText) profExpireText.innerText = currUser.vipExpiresAt ? `s.d. ${currUser.vipExpiresAt}` : 'Aktif';
      } else {
        if (profStatusBadge) {
          profStatusBadge.className = 'badge badge-fb';
          profStatusBadge.innerText = 'FREE PLAN';
        }
        if (profExpireText) profExpireText.innerText = 'Belum Berlangganan';
      }

      if (profileModal) profileModal.classList.add('active');
    };

    if (profileBadge) profileBadge.addEventListener('click', openProfileModal);

    if (btnCloseProfileModal) {
      btnCloseProfileModal.addEventListener('click', () => {
        if (profileModal) profileModal.classList.remove('active');
      });
    }

    const btnProfUpgrade = document.getElementById('btnProfUpgrade');
    if (btnProfUpgrade) {
      btnProfUpgrade.addEventListener('click', () => {
        if (profileModal) profileModal.classList.remove('active');
        openUpgradeModal();
      });
    }

    const btnProfLogout = document.getElementById('btnProfLogout');
    if (btnProfLogout) {
      btnProfLogout.addEventListener('click', () => {
        if (profileModal) profileModal.classList.remove('active');
        window.licenseManager.logoutUser();
        this.showToast('Berhasil keluar dari akun.', 'info');
        updateNavUserStatus();
        this.renderTable();
      });
    }

    if (btnUserLogoutNav) {
      btnUserLogoutNav.addEventListener('click', () => {
        window.licenseManager.logoutUser();
        this.showToast('Berhasil keluar dari akun.', 'info');
        updateNavUserStatus();
        this.renderTable();
      });
    }

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const identity = document.getElementById('loginIdentityInput').value.trim();
        const res = window.licenseManager.loginUser(identity);
        if (res.success) {
          this.showToast(res.message, 'success');
          if (registerModal) registerModal.classList.remove('active');
          updateNavUserStatus();
          this.renderTable();
          if (res.user.status === 'FREE') {
            setTimeout(() => openUpgradeModal(), 300);
          }
        } else {
          this.showToast(res.message, 'error');
        }
      });
    }

    if (btnUserAuthNav) {
      btnUserAuthNav.addEventListener('click', () => {
        if (registerModal) registerModal.classList.add('active');
      });
    }

    if (btnCloseRegisterModal) {
      btnCloseRegisterModal.addEventListener('click', () => {
        if (registerModal) registerModal.classList.remove('active');
      });
    }

    // Payment Modal Triggers (Enforces Registration First!)
    const openUpgradeModal = () => {
      const currUser = window.licenseManager.getCurrentUser();

      // Step 1: If user is not logged in/registered, FORCE registration modal first!
      if (!currUser) {
        this.showToast('Silakan daftar akun terlebih dahulu sebelum memilih paket berlangganan!', 'info');
        if (registerModal) registerModal.classList.add('active');
        return;
      }

      // Step 2: If user is registered but FREE, open Payment Modal with user details pre-filled
      if (!window.licenseManager.isPro()) {
        const titleText = currUser ? `Form Berlangganan VIP untuk Akun: ${currUser.name}` : 'Form Berlangganan VIP';
        window.licenseManager.openPaymentModal(titleText);
        if (document.getElementById('userSubmitName')) document.getElementById('userSubmitName').value = currUser ? currUser.name : '';
        if (document.getElementById('userSubmitPhone')) document.getElementById('userSubmitPhone').value = currUser ? currUser.phone : '';
      } else {
        this.showToast(`Akun ${currUser.name} Sudah Berstatus PRO VIP Active!`, 'success');
      }
    };

    const btnPlanBadge = document.getElementById('planStatusBadge');
    if (btnPlanBadge) btnPlanBadge.addEventListener('click', openUpgradeModal);

    const btnUpgradeProNav = document.getElementById('btnUpgradeProNav');
    if (btnUpgradeProNav) btnUpgradeProNav.addEventListener('click', openUpgradeModal);

    const btnUpgradeBanner = document.getElementById('btnUpgradeBanner');
    if (btnUpgradeBanner) btnUpgradeBanner.addEventListener('click', openUpgradeModal);

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();

        const res = window.licenseManager.registerUser(name, email, phone);
        if (res.success) {
          this.showToast(res.message, 'success');
          if (registerModal) registerModal.classList.remove('active');
          updateNavUserStatus();
          this.renderTable();

          // Automatically proceed to Payment Modal right after registering!
          setTimeout(() => {
            openUpgradeModal();
          }, 300);
        }
      });
    }

    // Pricing Plan Card Selection Event Handlers
    const planOptions = document.querySelectorAll('.plan-card-option');
    planOptions.forEach(card => {
      card.addEventListener('click', () => {
        planOptions.forEach(c => {
          c.classList.remove('active-plan');
          c.style.border = '1px solid var(--border-glass)';
          c.style.background = 'rgba(255,255,255,0.03)';
        });
        card.classList.add('active-plan');
        card.style.border = '2px solid var(--warning)';
        card.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(139, 92, 246, 0.2))';
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });

    const btnSubmitActivationRequest = document.getElementById('btnSubmitActivationRequest');
    if (btnSubmitActivationRequest) {
      btnSubmitActivationRequest.addEventListener('click', (e) => {
        e.preventDefault();
        const userName = (document.getElementById('userSubmitName')?.value || '').trim();
        const userPhone = (document.getElementById('userSubmitPhone')?.value || '').trim();
        const selectedRadio = document.querySelector('input[name="subPlanSelect"]:checked');
        const planKey = selectedRadio ? selectedRadio.value : '1_year';

        if (!userName || !userPhone) {
          this.showToast('Silakan lengkapi Nama & Nomor WhatsApp Anda!', 'warning');
          return;
        }

        const planObj = window.licenseManager.plans[planKey] || window.licenseManager.plans['1_year'];
        window.licenseManager.addPendingTransfer(userName, userPhone, planKey);
        this.showToast(`Form Pengajuan Paket ${planObj.name} (${planObj.price}) berhasil dikirim ke Admin!`, 'success');
        
        // Open WhatsApp admin as fallback confirmation
        const waText = encodeURIComponent(`Halo Admin ARIF SOFT, saya ${userName} (${userPhone}) telah mengirim konfirmasi transfer Paket ${planObj.name} (${planObj.price}). Mohon bantu approve aktivasi.`);
        window.open(`https://wa.me/${window.licenseManager.paymentInfo.waAdmin}?text=${waText}`, '_blank');
      });
    }

    const btnWaConfirmPayment = document.getElementById('btnWaConfirmPayment');
    if (btnWaConfirmPayment) {
      btnWaConfirmPayment.addEventListener('click', () => {
        const userName = prompt('Masukkan Nama Anda (Untuk Catatan Konfirmasi Transfer Admin):') || 'Pembeli Baru';
        window.licenseManager.addPendingTransfer(userName);
        this.showToast('Permintaan Konfirmasi Transfer Telah Dikirim ke Panel Admin!', 'info');
      });
    }

    const btnClosePaymentModal = document.getElementById('btnClosePaymentModal');
    if (btnClosePaymentModal) {
      btnClosePaymentModal.addEventListener('click', () => {
        window.licenseManager.closePaymentModal();
      });
    }

    // License key redemption inside payment modal
    const btnRedeemKey = document.getElementById('btnRedeemKey');
    if (btnRedeemKey) {
      btnRedeemKey.addEventListener('click', () => {
        const keyInput = document.getElementById('inputLicenseKey').value;
        const res = window.licenseManager.activatePro(keyInput);
        if (res.success) {
          this.showToast(res.message, 'success');
          window.licenseManager.closePaymentModal();
          this.renderTable();
        } else {
          this.showToast(res.message, 'error');
        }
      });
    }

    // Admin Controls Modal
    const btnAdminToggle = document.getElementById('btnAdminToggle');
    if (btnAdminToggle) {
      btnAdminToggle.addEventListener('click', () => {
        const pin = prompt('Masukkan Password Admin / Owner:');
        if (pin === window.licenseManager.ADMIN_PIN) {
          window.licenseManager.openAdminModal();
        } else if (pin !== null) {
          this.showToast('Password Admin Salah!', 'error');
        }
      });
    }

    const btnCloseAdminModal = document.getElementById('btnCloseAdminModal');
    if (btnCloseAdminModal) {
      btnCloseAdminModal.addEventListener('click', () => {
        window.licenseManager.closeAdminModal();
      });
    }

    // Admin Toggle Status Switch
    const adminStatusToggle = document.getElementById('adminStatusToggle');
    if (adminStatusToggle) {
      adminStatusToggle.addEventListener('change', (e) => {
        if (e.target.checked) window.licenseManager.activatePro('ADMIN-PASSED');
        else window.licenseManager.deactivatePro();
        this.renderTable();
      });
    }

    // Admin Generate License Key Button
    const btnGenerateKey = document.getElementById('btnGenerateKey');
    if (btnGenerateKey) {
      btnGenerateKey.addEventListener('click', () => {
        const newKey = window.licenseManager.generateKey();
        document.getElementById('generatedKeyDisplay').value = newKey;
        this.showToast(`Kode Lisensi Dibuat: ${newKey}`, 'success');
      });
    }

    // Copy Account Buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-copy-acc') || e.target.parentElement.classList.contains('btn-copy-acc')) {
        const btn = e.target.classList.contains('btn-copy-acc') ? e.target : e.target.parentElement;
        const targetId = btn.dataset.target;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          navigator.clipboard.writeText(targetEl.innerText);
          this.showToast(`Nomor Rekening ${targetEl.innerText} Berhasil Disalin!`, 'success');
        }
      }
    });
  }

  async handleStartScraping() {
    const queryInput = document.getElementById('searchQueryInput');
    const limitSelect = document.getElementById('limitSelect');
    const chkEmail = document.getElementById('chkEmail').checked;
    const chkWA = document.getElementById('chkWA').checked;
    const chkAddress = document.getElementById('chkAddress').checked;
    
    const query = queryInput ? queryInput.value.trim() : '';
    const limit = limitSelect ? parseInt(limitSelect.value) : 10;

    if (!query) {
      this.showToast('Silakan masukkan kata kunci target atau URL!', 'warning');
      return;
    }

    const btnScrape = document.getElementById('btnStartScrape');
    const progressBar = document.getElementById('scrapeProgress');
    const progressFill = document.getElementById('progressBarFill');
    const progressText = document.getElementById('progressStatusText');

    btnScrape.disabled = true;
    progressBar.classList.add('active');
    progressFill.style.width = '0%';

    try {
      const newLeads = await window.scraperEngine.scrape({
        platform: this.activePlatform,
        query: query,
        limit: limit,
        extractEmail: chkEmail,
        extractWA: chkWA,
        extractAddress: chkAddress,
        onProgress: (percent, statusMsg) => {
          progressFill.style.width = `${percent}%`;
          if (progressText) progressText.innerText = statusMsg;
        }
      });

      // Add newly scraped leads to the beginning of the list
      this.leads = [...newLeads, ...this.leads];
      this.filterData();
      this.updateStats();
      this.showToast(`Berhasil mengekstraksi ${newLeads.length} lead baru dari ${this.activePlatform.toUpperCase()}!`, 'success');
    } catch (err) {
      console.error(err);
      this.showToast('Gagal melakukan ekstraksi lead: ' + err.message, 'error');
    } finally {
      btnScrape.disabled = false;
      setTimeout(() => {
        progressBar.classList.remove('active');
      }, 1000);
    }
  }

  filterData() {
    const searchTerm = (document.getElementById('tableSearchInput')?.value || '').toLowerCase();
    const platformFilter = document.getElementById('filterPlatformSelect')?.value || 'all';
    const hasEmail = document.getElementById('filterHasEmail')?.checked;
    const hasWa = document.getElementById('filterHasWa')?.checked;

    this.filteredLeads = this.leads.filter(lead => {
      // Search term filter
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm) ||
        lead.email.toLowerCase().includes(searchTerm) ||
        lead.phone.toLowerCase().includes(searchTerm) ||
        lead.address.toLowerCase().includes(searchTerm) ||
        lead.handle.toLowerCase().includes(searchTerm);

      // Platform filter
      const matchesPlatform = platformFilter === 'all' || lead.platform === platformFilter;

      // Contact options filter
      const matchesEmail = !hasEmail || (lead.email && lead.email !== '-');
      const matchesWa = !hasWa || (lead.wa && lead.wa !== '');

      return matchesSearch && matchesPlatform && matchesEmail && matchesWa;
    });

    this.renderTable();
  }

  getSelectedOrAllLeads() {
    if (this.selectedLeadIds.size > 0) {
      return this.leads.filter(lead => this.selectedLeadIds.has(lead.id));
    }
    return this.filteredLeads;
  }

  maskEmail(email) {
    if (!email || email === '-') return '-';
    const clean = email.trim();
    const parts = clean.split('@');
    if (parts.length !== 2) return '*****@domain.com';
    const user = parts[0];
    const domain = parts[1];
    const maskedUser = user.length <= 2 ? user.substring(0, 1) + '*****' : user.substring(0, 2) + '*****';
    return `${maskedUser}@${domain}`;
  }

  maskPhoneNumber(phone) {
    if (!phone || phone === '-') return '-';
    const clean = phone.trim();
    if (clean.length <= 6) return clean.substring(0, 3) + '*****';
    const prefix = clean.substring(0, 6);
    const suffix = clean.substring(clean.length - 3);
    return `${prefix}*****${suffix}`;
  }

  renderTable() {
    const tbody = document.getElementById('leadTableBody');
    if (!tbody) return;

    if (this.filteredLeads.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 0.5rem; display: block; opacity: 0.5;"></i>
            Tidak ada data lead ditemukan. Coba ubah kata kunci pencarian atau lakukan ekstraksi baru.
          </td>
        </tr>
      `;
      return;
    }

    const isPro = window.licenseManager ? window.licenseManager.isPro() : false;

    const rows = this.filteredLeads.map((item, idx) => {
      const isChecked = this.selectedLeadIds.has(item.id);
      
      // Email masking for FREE users
      const rawEmail = item.email || '-';
      const displayEmail = (!isPro && rawEmail !== '-') ? this.maskEmail(rawEmail) : rawEmail;

      // Phone number masking for FREE users
      const rawPhone = item.phone || (item.wa ? `+${item.wa}` : '-');
      const displayPhone = (!isPro && rawPhone !== '-') ? this.maskPhoneNumber(rawPhone) : rawPhone;

      // WhatsApp Chat button lock for FREE users
      let waButton = '-';
      if (item.wa) {
        if (isPro) {
          waButton = `
            <a href="https://wa.me/${item.wa}?text=${encodeURIComponent(`Halo ${item.name}, saya tertarik dengan produk/jasa Anda.`)}" target="_blank" class="btn-wa-action">
              <i class="fab fa-whatsapp"></i> Chat WA
            </a>
          `;
        } else {
          waButton = `
            <button class="btn-wa-action btn-wa-locked" data-name="${item.name}">
              <i class="fas fa-lock" style="color: var(--warning);"></i> 🔒 Chat WA
            </button>
          `;
        }
      }

      // Profile Link action lock for FREE users
      let actionLink = '-';
      if (item.url) {
        if (isPro) {
          actionLink = `
            <a href="${item.url}" target="_blank" style="color: var(--primary); font-size: 0.8rem; text-decoration: none; font-weight: 600;">
              <i class="fas fa-external-link-alt"></i> Buka Link
            </a>
          `;
        } else {
          actionLink = `
            <button class="btn-link-locked" data-name="${item.name}" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); color: var(--text-muted); padding: 0.35rem 0.7rem; border-radius: var(--radius-md); font-size: 0.78rem; cursor: pointer; transition: var(--transition);">
              <i class="fas fa-lock" style="color: var(--warning);"></i> 🔒 Buka Link
            </button>
          `;
        }
      }

      const platformBadge = this.getPlatformBadge(item.platform, item.platformName);

      return `
        <tr>
          <td>
            <input type="checkbox" class="lead-checkbox" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
          </td>
          <td>${platformBadge}</td>
          <td>
            <div style="font-weight: 700; color: white;">${item.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${item.handle} • ${item.followers || ''}</div>
          </td>
          <td>
            <span style="font-weight: 600; color: ${!isPro ? 'var(--warning)' : (item.email !== '-' ? 'var(--cyan)' : 'var(--text-dim)')};">
              ${displayEmail}
            </span>
          </td>
          <td>
            <div style="font-weight: 600; color: ${!isPro ? 'var(--warning)' : 'white'};">${displayPhone}</div>
            <div style="margin-top: 0.2rem;">${waButton}</div>
          </td>
          <td>
            <div style="max-width: 200px; font-size: 0.78rem; color: var(--text-muted); line-clamp: 2;">
              ${item.address}
            </div>
          </td>
          <td>
            ${actionLink}
          </td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = rows;

    // Attach individual checkbox listeners & locked WA / Link listeners
    tbody.querySelectorAll('.lead-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        if (e.target.checked) this.selectedLeadIds.add(id);
        else this.selectedLeadIds.delete(id);
      });
    });

    tbody.querySelectorAll('.btn-wa-locked').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const leadName = btn.dataset.name || 'Lead';
        window.licenseManager.openPaymentModal(`Fitur Direct Chat WA (${leadName}) Terkunci! Silakan Berlangganan PRO VIP.`);
        this.showToast('Fitur Direct Chat WA Terkunci! Silakan berlangganan untuk akses kontak.', 'warning');
      });
    });

    tbody.querySelectorAll('.btn-link-locked').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const leadName = btn.dataset.name || 'Lead';
        window.licenseManager.openPaymentModal(`Link Profil Target (${leadName}) Terkunci! Silakan Berlangganan PRO VIP.`);
        this.showToast('Link Profil Target Terkunci untuk Pengguna Free! Silakan berlangganan PRO VIP.', 'warning');
      });
    });
  }

  getPlatformBadge(platform, name) {
    const p = platform ? platform.toLowerCase() : 'facebook';
    const badgeClasses = {
      facebook: 'badge-fb',
      tiktok: 'badge-tiktok',
      instagram: 'badge-ig',
      google: 'badge-google',
      youtube: 'badge-yt',
      twitter: 'badge-twitter',
      url: 'badge-url'
    };
    const iconClasses = {
      facebook: 'fab fa-facebook',
      tiktok: 'fab fa-tiktok',
      instagram: 'fab fa-instagram',
      google: 'fab fa-google',
      youtube: 'fab fa-youtube',
      twitter: 'fab fa-twitter',
      url: 'fas fa-globe'
    };

    const cls = badgeClasses[p] || 'badge-fb';
    const icon = iconClasses[p] || 'fas fa-globe';

    return `<span class="badge ${cls}"><i class="${icon}"></i> ${name || platform}</span>`;
  }

  updateStats() {
    const totalLeads = this.leads.length;
    const totalWa = this.leads.filter(l => l.wa && l.wa !== '').length;
    const totalEmails = this.leads.filter(l => l.email && l.email !== '-').length;
    const totalAddresses = this.leads.filter(l => l.address && l.address !== '-').length;

    document.getElementById('statTotalLeads').innerText = totalLeads;
    document.getElementById('statTotalWa').innerText = totalWa;
    document.getElementById('statTotalEmails').innerText = totalEmails;
    document.getElementById('statTotalAddresses').innerText = totalAddresses;
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '<i class="fas fa-check-circle" style="color: var(--success);"></i>',
      warning: '<i class="fas fa-exclamation-triangle" style="color: var(--warning);"></i>',
      error: '<i class="fas fa-times-circle" style="color: var(--danger);"></i>',
      info: '<i class="fas fa-info-circle" style="color: var(--primary);"></i>'
    };

    toast.innerHTML = `${icons[type] || icons.info} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Global App Instance
window.app = new SocialLeadApp();
