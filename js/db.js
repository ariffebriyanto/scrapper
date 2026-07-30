/**
 * ARIF SOFT - Cloud Database Sync Engine (Supabase / Firebase Realtime Integration)
 * Provides instant synchronous local storage with silent background cloud database sync.
 */

class CloudDatabaseEngine {
  constructor() {
    this.SUPABASE_URL = 'https://ghmvrqstyjtriglrtxvf.supabase.co';
    this.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXZycXN0eWp0cmxnbHJ0eHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNDU3MTYsImV4cCI6MjEwMDkyMTcxNn0.rerh4jB0WPmZl-n_tFu-r-k_g3q1o3j2kWdWpdsFA4w';
    this.client = null;
    this.init();
  }

  init() {
    if (window.supabase && this.SUPABASE_URL && !this.SUPABASE_ANON_KEY.includes('placeholder')) {
      try {
        this.client = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
        console.log('✅ Supabase Cloud Database Terhubung!');
      } catch (e) {
        console.warn('Cloud DB fallback to LocalStorage:', e);
      }
    }
  }

  // Synchronous Get Users with background Cloud DB fetch
  getUsers() {
    let users = [];
    try {
      const local = localStorage.getItem('sociallead_registered_users');
      users = local ? JSON.parse(local) : [];
      if (!Array.isArray(users)) users = [];
    } catch (e) {
      users = [];
    }

    if (this.client) {
      this.client.from('users').select('*').then(({ data, error }) => {
        if (!error && Array.isArray(data) && data.length) {
          localStorage.setItem('sociallead_registered_users', JSON.stringify(data));
        }
      }).catch(() => {});
    }

    return users;
  }

  // Save User synchronously & sync to Cloud DB
  saveUser(user) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (idx !== -1) users[idx] = user;
    else users.push(user);
    localStorage.setItem('sociallead_registered_users', JSON.stringify(users));

    if (this.client) {
      this.client.from('users').upsert(user).then(() => {}).catch(() => {});
    }

    return user;
  }

  // Synchronous Get Transfers with background Cloud DB fetch
  getPendingTransfers() {
    let list = [];
    try {
      const local = localStorage.getItem('sociallead_pending_transfers');
      list = local ? JSON.parse(local) : [];
      if (!Array.isArray(list)) list = [];
    } catch (e) {
      list = [];
    }

    if (this.client) {
      this.client.from('transfers').select('*').then(({ data, error }) => {
        if (!error && Array.isArray(data) && data.length) {
          localStorage.setItem('sociallead_pending_transfers', JSON.stringify(data));
        }
      }).catch(() => {});
    }

    return list;
  }

  // Save Transfer synchronously & sync to Cloud DB
  saveTransfer(transfer) {
    const list = this.getPendingTransfers();
    const idx = list.findIndex(t => t.id === transfer.id);
    if (idx !== -1) list[idx] = transfer;
    else list.unshift(transfer);
    localStorage.setItem('sociallead_pending_transfers', JSON.stringify(list));

    if (this.client) {
      this.client.from('transfers').upsert(transfer).then(() => {}).catch(() => {});
    }

    return transfer;
  }
}

// Global Cloud Database Instance
window.cloudDB = new CloudDatabaseEngine();
