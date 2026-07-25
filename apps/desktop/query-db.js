/* eslint-disable */
const { app } = require('electron');
const keytar = require('keytar');
const Database = require('better-sqlite3-multiple-ciphers');

app.whenReady().then(async () => {
  try {
    const key = await keytar.getPassword('Vyora', 'master-encryption-key');
    const dbPath = 'C:/Users/Harsh Patel/AppData/Roaming/@vyora/desktop/database/vyora.vyr';
    const db = new Database(dbPath);

    db.pragma(`KEY = '${key}'`);
    db.pragma('cipher_page_size = 4096');
    db.pragma('kdf_iter = 64000');
    db.pragma('cipher_hmac_algorithm = HMAC_SHA512');
    db.pragma('cipher_kdf_algorithm = PBKDF2_HMAC_SHA512');
    db.pragma('journal_mode = WAL');

    // Verify connection by reading schema version
    db.exec('PRAGMA schema_version;');

    console.log('--- Financial Years ---');
    console.log(db.prepare(`SELECT id, company_id, label, is_active FROM financial_years`).all());
    console.log('--- Companies ---');
    console.log(db.prepare(`SELECT id, legal_name FROM companies`).all());
    console.log('--- Settings ---');
    console.log(
      db.prepare(`SELECT key, value FROM app_settings WHERE key = 'active_company_id'`).all(),
    );
  } catch (error) {
    console.error(error);
  } finally {
    app.quit();
  }
});
