/**
 * ARIF SOFT - Dedicated Admin Portal Logic & Controller
 */

class AdminPortal {
  constructor() {
    this.AUTH_KEY = 'arifsoft_admin_authenticated';
    this.ADMIN_PIN = 'Puloma5.3';
    
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.checkAuth();
      this.bindEvents();
    });
  }

  checkAuth() {
    const isAuth = sessionStorage.getItem(this.AUTH_KEY) === 'true';
    const loginScreen = document.getElementById('adminLoginScreen');
    const dashboardScreen = document.getElementById('adminDashboardScreen');

    if (isAuth) {
      if (loginScreen) loginScreen.style.display = 'none';
      if (dashboardScreen) dashboardScreen.style.display = 'block';
      this.renderDashboard();
    } else {
      if (loginScreen) loginScreen.style.display = 'block';
      if (dashboardScreen) dashboardScreen.style.display = 'none';
    }
  }

  bindEvents() {
    // Admin Login Form
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = document.getElementById('adminPasswordInput').value.trim();
        if (pwd === this.ADMIN_PIN) {
          sessionStorage.setItem(this.AUTH_KEY, 'true');
          this.showToast('Login Admin Berhasil! Selamat datang Owner ARIF SOFT.', 'success');
          this.checkAuth();
        } else {
          this.showToast('Password Admin Salah! Silakan coba lagi.', 'error');
        }
      });
    }

    // Admin Logout Button
    const btnLogout = document.getElementById('btnAdminLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem(this.AUTH_KEY);
        this.showToast('Berhasil keluar dari Panel Admin.', 'info');
        this.checkAuth();
      });
    }

    // Key Generator Button
    const btnGenerate = document.getElementById('btnAdmGenerateKey');
    if (btnGenerate) {
      btnGenerate.addEventListener('click', () => {
        const key = window.licenseManager.generateKey();
        document.getElementById('admGeneratedKey').value = key;
        this.showToast(`Kode Lisensi Berhasil Dibuat: ${key}`, 'success');
      });
    }
  }

  renderDashboard() {
    this.renderPendingTable();
    this.renderUsersTable();
    this.updateAdminMetrics();
  }

  renderPendingTable() {
    const tbody = document.getElementById('adminPendingTableBody');
    if (!tbody) return;

    const list = window.licenseManager.getPendingTransfers();

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Tidak ada permintaan transfer pembeli yang perlu di-approve.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td style="font-weight: 700; color: white;">${item.name}</td>
        <td>
          ${item.phone && item.phone !== '-' ? `
            <a href="https://wa.me/${item.phone.replace(/[^0-9]/g, '')}" target="_blank" style="color: #34d399; text-decoration: none; font-weight: 600;">
              <i class="fab fa-whatsapp"></i> ${item.phone}
            </a>
          ` : '-'}
        </td>
        <td><span class="badge" style="background: rgba(139,92,246,0.2); color: #c084fc; border: 1px solid rgba(139,92,246,0.3);">${item.planName || '1 Tahun'}</span></td>
        <td style="font-weight: 800; color: var(--cyan);">${item.amount || 'Rp 1.000.000'}</td>
        <td style="font-size: 0.78rem; color: var(--text-muted);">${item.date}</td>
        <td>
          ${item.status === 'APPROVED' ? `
            <span class="badge" style="background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(16,185,129,0.4);">
              <i class="fas fa-check-circle"></i> TER-APPROVE
            </span>
          ` : `
            <button class="btn-primary btn-adm-approve" data-id="${item.id}" data-plan="${item.planKey || '1_year'}" style="padding: 0.35rem 0.75rem; font-size: 0.78rem; background: linear-gradient(135deg, #10b981, #059669);">
              <i class="fas fa-check"></i> Approve VIP
            </button>
            <button class="btn-secondary btn-adm-reject" data-id="${item.id}" style="padding: 0.35rem 0.6rem; font-size: 0.78rem; color: var(--danger); border-color: rgba(239,68,68,0.3);">
              <i class="fas fa-trash"></i>
            </button>
          `}
        </td>
      </tr>
    `).join('');

    // Attach approve / reject click listeners
    tbody.querySelectorAll('.btn-adm-approve').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        const planKey = btn.dataset.plan || '1_year';
        window.licenseManager.approveTransfer(id);
        this.showToast('Permintaan Pembayaran Berhasil Di-Approve! Status Pembeli Aktif VIP.', 'success');
        this.renderDashboard();
      });
    });

    tbody.querySelectorAll('.btn-adm-reject').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        window.licenseManager.rejectTransfer(id);
        this.showToast('Permintaan transfer dihapus.', 'info');
        this.renderDashboard();
      });
    });
  }

  renderUsersTable() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    const users = window.licenseManager.getRegisteredUsers();

    if (users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            Belum ada pengguna terdaftar di sistem.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = users.map((u, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td style="font-weight: 700; color: white;">${u.name}</td>
        <td>${u.email}</td>
        <td>${u.phone || '-'}</td>
        <td style="font-size: 0.78rem; color: var(--text-muted);">${u.registeredAt || '-'}</td>
        <td>${u.vipExpiresAt ? `<span style="color: #34d399; font-weight: 700;">s.d. ${u.vipExpiresAt}</span>` : '-'}</td>
        <td>
          <button class="btn-secondary btn-toggle-user-status" data-id="${u.id}" style="padding: 0.3rem 0.75rem; font-size: 0.78rem; ${u.status === 'PRO' ? 'background: rgba(16,185,129,0.2); color: #34d399; border-color: rgba(16,185,129,0.4);' : 'color: var(--warning);'}">
            ${u.status === 'PRO' ? 'VIP PRO ACTIVE' : 'FREE PLAN (Klik untuk VIP)'}
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-toggle-user-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const userId = btn.dataset.id;
        const usersList = window.licenseManager.getRegisteredUsers();
        const user = usersList.find(x => x.id === userId);
        if (user) {
          if (user.status === 'PRO') {
            user.status = 'FREE';
            user.vipExpiresAt = null;
          } else {
            user.status = 'PRO';
            const exp = new Date();
            exp.setDate(exp.getDate() + 365);
            user.vipExpiresAt = exp.toLocaleDateString('id-ID');
          }
          localStorage.setItem(window.licenseManager.USERS_KEY, JSON.stringify(usersList));
          
          // Update current session if same user
          const curr = window.licenseManager.getCurrentUser();
          if (curr && curr.id === user.id) {
            localStorage.setItem(window.licenseManager.CURRENT_USER_KEY, JSON.stringify(user));
            window.licenseManager.updateUI();
          }

          this.showToast(`Status pengguna ${user.name} diubah menjadi ${user.status}.`, 'success');
          this.renderDashboard();
        }
      });
    });
  }

  updateAdminMetrics() {
    const list = window.licenseManager.getPendingTransfers();
    const pendingCount = list.filter(x => x.status === 'PENDING').length;
    const users = window.licenseManager.getRegisteredUsers();
    const proUsersCount = users.filter(x => x.status === 'PRO').length;

    const elPending = document.getElementById('admStatPending');
    const elPro = document.getElementById('admStatPro');
    const elUsers = document.getElementById('admStatUsers');

    if (elPending) elPending.innerText = pendingCount;
    if (elPro) elPro.innerText = proUsersCount;
    if (elUsers) elUsers.innerText = users.length;
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Global Admin Portal Instance
window.adminPortal = new AdminPortal();
