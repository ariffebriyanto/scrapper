/**
 * ARIF SOFT - Cloud Database Sync Engine (Supabase / Firebase Realtime Integration)
 * Provides online cloud database persistence with fallback to local storage.
 */

class CloudDatabaseEngine {
  constructor() {
    // Default Supabase Configuration (Free Cloud Database)
    this.SUPABASE_URL = 'https://xyzcompany.supabase.co'; // Place your Supabase URL
    this.SUPABASE_ANON_KEY = 'public-anon-key-placeholder';
    this.client = null;
    
    this.init();
  }

  init() {
    if (window.supabase && this.SUPABASE_URL.includes('.supabase.co')) {
      try {
        this.client = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
        console.log('Cloud Database Supabase Connected!');
      } catch (e) {
        console.warn('Using LocalStorage DB fallback until Supabase credentials are configured.');
      }
    }
  }

  // Sync Registered Users
  async getUsers() {
    if (this.client) {
      try {
        const { data, error } = await this.client.from('users').select('*');
        if (!error && data) return data;
      } catch (e) { console.error('Cloud DB fetch users error:', e); }
    }
    const local = localStorage.getItem('sociallead_registered_users');
    return local ? JSON.parse(local) : [];
  }

  async saveUser(user) {
    // 1. Save to LocalStorage
    const users = await this.getUsers();
    const idx = users.findIndex(u => u.id === user.id || u.email === user.email);
    if (idx !== -1) users[idx] = user;
    else users.push(user);
    localStorage.setItem('sociallead_registered_users', JSON.stringify(users));

    // 2. Sync to Supabase Cloud DB if connected
    if (this.client) {
      try {
        await this.client.from('users').upsert(user);
      } catch (e) { console.error('Cloud DB save user error:', e); }
    }
    return user;
  }

  // Sync Pending Transfers
  async getPendingTransfers() {
    if (this.client) {
      try {
        const { data, error } = await this.client.from('transfers').select('*').order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (e) { console.error('Cloud DB fetch transfers error:', e); }
    }
    const local = localStorage.getItem('sociallead_pending_transfers');
    return local ? JSON.parse(local) : [];
  }

  async saveTransfer(transfer) {
    // 1. Save to LocalStorage
    const list = await this.getPendingTransfers();
    const idx = list.findIndex(t => t.id === transfer.id);
    if (idx !== -1) list[idx] = transfer;
    else list.unshift(transfer);
    localStorage.setItem('sociallead_pending_transfers', JSON.stringify(list));

    // 2. Sync to Supabase Cloud DB if connected
    if (this.client) {
      try {
        await this.client.from('transfers').upsert(transfer);
      } catch (e) { console.error('Cloud DB save transfer error:', e); }
    }
    return transfer;
  }
}

// Global Cloud Database Instance
window.cloudDB = new CloudDatabaseEngine();
