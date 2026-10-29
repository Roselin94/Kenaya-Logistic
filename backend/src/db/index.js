const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const { getSeedData } = require('./seedData');

let pool = null;
let activeDriver = 'mysql';

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kenaya_logistics',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('tidbcloud.com') ? {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  } : undefined
};

// Fallback JSON-persisted relational simulator for zero-downtime offline execution
const jsonDbPath = path.join(__dirname, '../../data/kenaya_db.json');
let memoryStore = {
  users: [],
  clients: [],
  shipments: [],
  cargo_items: [],
  tracking_events: [],
  payments: [],
  expenses: [],
  invoices: []
};

function saveJsonStore() {
  try {
    const dir = path.dirname(jsonDbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(jsonDbPath, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DATABASE] Erreur sauvegarde JSON :', err.message);
  }
}

function loadJsonStore() {
  try {
    if (fs.existsSync(jsonDbPath)) {
      const content = fs.readFileSync(jsonDbPath, 'utf-8');
      memoryStore = JSON.parse(content);
    }
  } catch (err) {
    console.error('[DATABASE] Erreur chargement JSON :', err.message);
  }
}

async function query(sql, params = []) {
  if (activeDriver === 'mysql' && pool) {
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  // Fallback memory query handler
  return queryMemory(sql, params);
}

async function get(sql, params = []) {
  if (activeDriver === 'mysql' && pool) {
    const [rows] = await pool.query(sql, params);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  const rows = queryMemory(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

async function execute(sql, params = []) {
  if (activeDriver === 'mysql' && pool) {
    const [result] = await pool.execute(sql, params);
    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  }

  return executeMemory(sql, params);
}

function getDriver() {
  return activeDriver;
}

// Memory query interpreter for fallback
function queryMemory(sql, params = []) {
  const cleanSql = sql.trim();
  const lower = cleanSql.toLowerCase();

  // 1. SELECT COUNT(*) as count FROM table
  if (lower.startsWith('select count(*) as count from users') || lower.startsWith('select count(*) as count from')) {
    const tableName = lower.split('from')[1].trim().split(' ')[0];
    const items = memoryStore[tableName] || [];
    return [{ count: items.length }];
  }

  // 2. Simple dashboard queries
  if (lower.includes('from shipments') && lower.includes('count(*) as total')) {
    const all = memoryStore.shipments || [];
    let pending = 0, in_transit = 0, arrived = 0, delivered = 0, cancelled = 0;
    let total_cost = 0, paid_amount = 0;
    all.forEach(s => {
      if (s.status === 'en attente') pending++;
      else if (s.status === 'en transit') in_transit++;
      else if (s.status === 'arrivée à destination') arrived++;
      else if (s.status === 'livrée') delivered++;
      else if (s.status === 'annulée') cancelled++;
      total_cost += parseFloat(s.total_cost || 0);
      paid_amount += parseFloat(s.paid_amount || 0);
    });
    return [{
      total: all.length,
      pending,
      in_transit,
      arrived,
      delivered,
      cancelled,
      total_value: total_cost,
      total_paid: paid_amount,
      total_unpaid: total_cost - paid_amount
    }];
  }

  if (lower.includes('from cargo_items') && lower.includes('count(*) as total_items')) {
    const all = memoryStore.cargo_items || [];
    let weight = 0, volume = 0, val = 0, qty = 0;
    all.forEach(c => {
      qty += parseInt(c.quantity || 1, 10);
      weight += parseFloat(c.weight_kg || 0);
      volume += parseFloat(c.volume_cbm || 0);
      val += parseFloat(c.declared_value || 0);
    });
    return [{
      total_items: all.length,
      total_quantity: qty,
      total_weight_kg: weight,
      total_volume_cbm: volume,
      total_declared_value: val
    }];
  }

  if (lower.includes('from payments') && lower.includes('sum(amount)')) {
    const all = memoryStore.payments || [];
    const sum = all.reduce((acc, p) => acc + parseFloat(p.amount || 0), 0);
    return [{ total_revenue: sum, total: sum }];
  }

  if (lower.includes('from expenses') && lower.includes('sum(amount)')) {
    const all = memoryStore.expenses || [];
    const sum = all.reduce((acc, e) => acc + parseFloat(e.amount || 0), 0);
    return [{ total_expenses: sum, total: sum }];
  }

  if (lower.includes('from clients') && lower.includes('count(*) as total_clients')) {
    return [{ total_clients: (memoryStore.clients || []).length }];
  }

  // 3. Simple table lookups
  if (lower.startsWith('select * from users where email = ?')) {
    const email = params[0];
    const user = (memoryStore.users || []).find(u => u.email.toLowerCase() === email.toLowerCase());
    return user ? [user] : [];
  }

  if (lower.startsWith('select') && lower.includes('from users where id = ?')) {
    const id = parseInt(params[0], 10);
    const user = (memoryStore.users || []).find(u => u.id === id);
    return user ? [user] : [];
  }

  if (lower.includes('from users')) {
    return (memoryStore.users || []).map(u => ({ ...u, password: undefined }));
  }

  if (lower.includes('from clients c')) {
    const all = (memoryStore.clients || []).map(c => {
      const clientShipments = (memoryStore.shipments || []).filter(s => s.client_id === c.id);
      const clientCargo = (memoryStore.cargo_items || []).filter(ci => ci.client_id === c.id);
      const spent = clientShipments.reduce((sum, s) => sum + parseFloat(s.total_cost || 0), 0);
      const paid = clientShipments.reduce((sum, s) => sum + parseFloat(s.paid_amount || 0), 0);
      return {
        ...c,
        total_shipments: clientShipments.length,
        total_cargo: clientCargo.length,
        total_spent: spent,
        total_paid: paid,
        total_debt: spent - paid
      };
    });

    if (params.length > 0 && typeof params[0] === 'string' && params[0].startsWith('%')) {
      const term = params[0].replace(/%/g, '').toLowerCase();
      return all.filter(c => c.name.toLowerCase().includes(term) || (c.phone && c.phone.includes(term)));
    }
    return all;
  }

  if (lower.startsWith('select * from clients where id = ?')) {
    const id = parseInt(params[0], 10);
    const c = (memoryStore.clients || []).find(item => item.id === id);
    return c ? [c] : [];
  }

  if (lower.includes('from shipments s') && lower.includes('join clients c')) {
    return (memoryStore.shipments || []).map(s => {
      const client = (memoryStore.clients || []).find(c => c.id === s.client_id) || {};
      const cargo = (memoryStore.cargo_items || []).filter(ci => ci.shipment_id === s.id);
      const weight = cargo.reduce((sum, ci) => sum + parseFloat(ci.weight_kg || 0), 0);
      const vol = cargo.reduce((sum, ci) => sum + parseFloat(ci.volume_cbm || 0), 0);
      return {
        ...s,
        client_name: client.name || 'Client',
        client_phone: client.phone || '',
        client_city: client.city || '',
        cargo_count: cargo.length,
        total_weight: weight,
        total_volume: vol
      };
    }).sort((a, b) => b.id - a.id);
  }

  if (lower.includes('from shipments where id = ?') || lower.includes('from shipments s where s.id = ?')) {
    const id = parseInt(params[0], 10);
    const s = (memoryStore.shipments || []).find(item => item.id === id);
    if (!s) return [];
    const client = (memoryStore.clients || []).find(c => c.id === s.client_id) || {};
    return [{
      ...s,
      client_name: client.name || '',
      client_phone: client.phone || '',
      client_email: client.email || '',
      client_address: client.address || ''
    }];
  }

  if (lower.includes('from shipments s where upper(s.tracking_number) = ?')) {
    const code = String(params[0]).toUpperCase();
    const s = (memoryStore.shipments || []).find(item => String(item.tracking_number).toUpperCase() === code);
    if (!s) return [];
    const cargo = (memoryStore.cargo_items || []).filter(ci => ci.shipment_id === s.id);
    const weight = cargo.reduce((sum, ci) => sum + parseFloat(ci.weight_kg || 0), 0);
    return [{
      ...s,
      cargo_count: cargo.length,
      total_weight: weight
    }];
  }

  if (lower.includes('from cargo_items ci')) {
    return (memoryStore.cargo_items || []).map(ci => {
      const client = (memoryStore.clients || []).find(c => c.id === ci.client_id) || {};
      const shipment = (memoryStore.shipments || []).find(s => s.id === ci.shipment_id) || {};
      return {
        ...ci,
        client_name: client.name || '',
        client_phone: client.phone || '',
        tracking_number: shipment.tracking_number || null,
        shipment_status: shipment.status || null
      };
    }).sort((a, b) => b.id - a.id);
  }

  if (lower.includes('from cargo_items where shipment_id = ?')) {
    const shipmentId = parseInt(params[0], 10);
    return (memoryStore.cargo_items || []).filter(ci => ci.shipment_id === shipmentId);
  }

  if (lower.includes('from tracking_events where shipment_id = ?')) {
    const shipmentId = parseInt(params[0], 10);
    return (memoryStore.tracking_events || []).filter(te => te.shipment_id === shipmentId).sort((a, b) => a.id - b.id);
  }

  if (lower.includes('from payments')) {
    return (memoryStore.payments || []).map(p => {
      const client = (memoryStore.clients || []).find(c => c.id === p.client_id) || {};
      const shipment = (memoryStore.shipments || []).find(s => s.id === p.shipment_id) || {};
      return {
        ...p,
        client_name: client.name || '',
        client_phone: client.phone || '',
        tracking_number: shipment.tracking_number || null,
        origin: shipment.origin || '',
        destination: shipment.destination || ''
      };
    }).sort((a, b) => b.id - a.id);
  }

  if (lower.includes('from expenses')) {
    return (memoryStore.expenses || []).map(e => {
      const shipment = (memoryStore.shipments || []).find(s => s.id === e.shipment_id) || {};
      return {
        ...e,
        tracking_number: shipment.tracking_number || null
      };
    }).sort((a, b) => b.id - a.id);
  }

  if (lower.includes('from invoices')) {
    return (memoryStore.invoices || []).map(inv => {
      const client = (memoryStore.clients || []).find(c => c.id === inv.client_id) || {};
      const shipment = (memoryStore.shipments || []).find(s => s.id === inv.shipment_id) || {};
      return {
        ...inv,
        client_name: client.name || '',
        client_phone: client.phone || '',
        client_email: client.email || '',
        client_address: client.address || '',
        client_city: client.city || '',
        client_id_number: client.id_number || '',
        tracking_number: shipment.tracking_number || '',
        origin: shipment.origin || '',
        destination: shipment.destination || '',
        sender_name: shipment.sender_name || '',
        sender_phone: shipment.sender_phone || '',
        receiver_name: shipment.receiver_name || '',
        receiver_phone: shipment.receiver_phone || '',
        receiver_address: shipment.receiver_address || '',
        carrier_name: shipment.carrier_name || '',
        vehicle_plate: shipment.vehicle_plate || '',
        departure_date: shipment.departure_date || '',
        estimated_arrival: shipment.estimated_arrival || '',
        actual_arrival: shipment.actual_arrival || '',
        shipping_cost: shipment.shipping_cost || 0,
        insurance_cost: shipment.insurance_cost || 0,
        other_fees: shipment.other_fees || 0,
        shipment_status: shipment.status || ''
      };
    }).sort((a, b) => b.id - a.id);
  }

  return [];
}

function executeMemory(sql, params = []) {
  const lower = sql.trim().toLowerCase();

  if (lower.startsWith('insert into users')) {
    const id = (memoryStore.users.length ? Math.max(...memoryStore.users.map(u => u.id)) : 0) + 1;
    const [name, email, password, role, phone, status] = params;
    memoryStore.users.push({ id, name, email, password, role, phone, status: status || 'active', created_at: new Date().toISOString() });
    saveJsonStore();
    return { insertId: id, affectedRows: 1 };
  }

  if (lower.startsWith('insert into clients')) {
    const id = (memoryStore.clients.length ? Math.max(...memoryStore.clients.map(c => c.id)) : 0) + 1;
    const [name, phone, email, address, city, id_number, notes] = params;
    memoryStore.clients.push({ id, name, phone, email, address, city: city || 'Brazzaville', id_number, notes, created_at: new Date().toISOString() });
    saveJsonStore();
    return { insertId: id, affectedRows: 1 };
  }

  if (lower.startsWith('insert into shipments')) {
    const id = (memoryStore.shipments.length ? Math.max(...memoryStore.shipments.map(s => s.id)) : 0) + 1;
    const [
      tracking_number, client_id, origin, destination,
      sender_name, sender_phone, receiver_name, receiver_phone, receiver_address,
      carrier_name, carrier_phone, vehicle_plate,
      departure_date, estimated_arrival, actual_arrival_or_cost,
      insurance_cost_or_cost, ...rest
    ] = params;

    const item = {
      id,
      tracking_number,
      client_id: parseInt(client_id, 10),
      origin,
      destination,
      sender_name,
      sender_phone,
      receiver_name,
      receiver_phone,
      receiver_address,
      carrier_name,
      carrier_phone,
      vehicle_plate,
      departure_date,
      estimated_arrival,
      shipping_cost: parseFloat(params[14] || 0),
      insurance_cost: parseFloat(params[15] || 0),
      other_fees: parseFloat(params[16] || 0),
      total_cost: parseFloat(params[17] || 0),
      paid_amount: parseFloat(params[18] || 0),
      payment_status: params[19] || 'pending',
      status: params[20] || 'en attente',
      notes: params[21] || '',
      created_by: params[22] || 1,
      created_at: new Date().toISOString()
    };
    memoryStore.shipments.push(item);
    saveJsonStore();
    return { insertId: id, affectedRows: 1 };
  }

  if (lower.startsWith('insert into cargo_items')) {
    const id = (memoryStore.cargo_items.length ? Math.max(...memoryStore.cargo_items.map(c => c.id)) : 0) + 1;
    const [client_id, shipment_id, designation, category, quantity, unit, weight_kg, volume_cbm, declared_value, status, barcode] = params;
    memoryStore.cargo_items.push({
      id,
      client_id: parseInt(client_id, 10),
      shipment_id: shipment_id ? parseInt(shipment_id, 10) : null,
      designation,
      category,
      quantity: parseInt(quantity || 1, 10),
      unit: unit || 'Colis',
      weight_kg: parseFloat(weight_kg || 0),
      volume_cbm: parseFloat(volume_cbm || 0),
      declared_value: parseFloat(declared_value || 0),
      status: status || 'enregistrée',
      barcode,
      created_at: new Date().toISOString()
    });
    saveJsonStore();
    return { insertId: id, affectedRows: 1 };
  }

  if (lower.startsWith('insert into tracking_events')) {
    const id = (memoryStore.tracking_events.length ? Math.max(...memoryStore.tracking_events.map(t => t.id)) : 0) + 1;
    const [shipment_id, status, location, description, updated_by] = params;
    memoryStore.tracking_events.push({
      id,
      shipment_id: parseInt(shipment_id, 10),
      status,
      location,
      description,
      updated_by,
      created_at: new Date().toISOString()
    });
    saveJsonStore();
    return { insertId: id, affectedRows: 1 };
  }

  if (lower.startsWith('insert into payments')) {
    const id = (memoryStore.payments.length ? Math.max(...memoryStore.payments.map(p => p.id)) : 0) + 1;
    const [shipment_id, client_id, amount, payment_method, reference, recorded_by, notes] = params;
    memoryStore.payments.push({
      id,
      shipment_id: shipment_id ? parseInt(shipment_id, 10) : null,
      client_id: parseInt(client_id, 10),
      amount: parseFloat(amount),
      payment_method,
      reference,
      recorded_by,
      notes,
      payment_date: new Date().toISOString()
    });
    saveJsonStore();
    return { insertId: id, affectedRows: 1 };
  }

  if (lower.startsWith('insert into expenses')) {
    const id = (memoryStore.expenses.length ? Math.max(...memoryStore.expenses.map(e => e.id)) : 0) + 1;
    const [shipment_id, title, category, amount, expense_date, paid_to, payment_method, recorded_by, notes] = params;
    memoryStore.expenses.push({
      id,
      shipment_id: shipment_id ? parseInt(shipment_id, 10) : null,
      title,
      category,
      amount: parseFloat(amount),
      expense_date,
      paid_to,
      payment_method,
      recorded_by,
      notes,
      created_at: new Date().toISOString()
    });
    saveJsonStore();
    return { insertId: id, affectedRows: 1 };
  }

  if (lower.startsWith('insert into invoices')) {
    const id = (memoryStore.invoices.length ? Math.max(...memoryStore.invoices.map(i => i.id)) : 0) + 1;
    const [invoice_number, shipment_id, client_id, issue_date, due_date, subtotal, total_amount] = params;
    memoryStore.invoices.push({
      id,
      invoice_number,
      shipment_id: parseInt(shipment_id, 10),
      client_id: parseInt(client_id, 10),
      issue_date,
      due_date,
      subtotal: parseFloat(subtotal || 0),
      tax_rate: 0,
      tax_amount: 0,
      discount: 0,
      total_amount: parseFloat(total_amount || subtotal || 0),
      paid_amount: 0,
      status: 'unpaid',
      created_at: new Date().toISOString()
    });
    saveJsonStore();
    return { insertId: id, affectedRows: 1 };
  }

  // Update handlers
  if (lower.startsWith('update shipments set status = ?')) {
    const [status, actualArrival, id] = params;
    const s = memoryStore.shipments.find(item => item.id === parseInt(id, 10));
    if (s) {
      s.status = status;
      if (actualArrival) s.actual_arrival = actualArrival;
      saveJsonStore();
    }
    return { affectedRows: 1 };
  }

  if (lower.startsWith('update shipments set paid_amount = ?')) {
    const [paid_amount, payment_status, id] = params;
    const s = memoryStore.shipments.find(item => item.id === parseInt(id, 10));
    if (s) {
      s.paid_amount = parseFloat(paid_amount);
      s.payment_status = payment_status;
      saveJsonStore();
    }
    return { affectedRows: 1 };
  }

  if (lower.startsWith('update cargo_items set status = ? where shipment_id = ?')) {
    const [status, shipmentId] = params;
    memoryStore.cargo_items.forEach(ci => {
      if (ci.shipment_id === parseInt(shipmentId, 10)) ci.status = status;
    });
    saveJsonStore();
    return { affectedRows: 1 };
  }

  if (lower.startsWith('update cargo_items set shipment_id = ?')) {
    const [shipmentId, status, id] = params;
    const ci = memoryStore.cargo_items.find(item => item.id === parseInt(id, 10));
    if (ci) {
      ci.shipment_id = parseInt(shipmentId, 10);
      ci.status = status;
      saveJsonStore();
    }
    return { affectedRows: 1 };
  }

  if (lower.startsWith('update invoices set paid_amount = ?')) {
    const [paid_amount, status, shipmentId] = params;
    const inv = memoryStore.invoices.find(item => item.shipment_id === parseInt(shipmentId, 10));
    if (inv) {
      inv.paid_amount = parseFloat(paid_amount);
      inv.status = status;
      saveJsonStore();
    }
    return { affectedRows: 1 };
  }

  if (lower.startsWith('delete from clients where id = ?')) {
    const id = parseInt(params[0], 10);
    memoryStore.clients = memoryStore.clients.filter(c => c.id !== id);
    saveJsonStore();
    return { affectedRows: 1 };
  }

  if (lower.startsWith('delete from cargo_items where id = ?')) {
    const id = parseInt(params[0], 10);
    memoryStore.cargo_items = memoryStore.cargo_items.filter(c => c.id !== id);
    saveJsonStore();
    return { affectedRows: 1 };
  }

  if (lower.startsWith('delete from expenses where id = ?')) {
    const id = parseInt(params[0], 10);
    memoryStore.expenses = memoryStore.expenses.filter(e => e.id !== id);
    saveJsonStore();
    return { affectedRows: 1 };
  }

  if (lower.startsWith('delete from users where id = ?')) {
    const id = parseInt(params[0], 10);
    memoryStore.users = memoryStore.users.filter(u => u.id !== id);
    saveJsonStore();
    return { affectedRows: 1 };
  }

  return { insertId: 0, affectedRows: 0 };
}

// Initialisation globale
async function initDatabase() {
  console.log('[DATABASE] Tentative de connexion au serveur MySQL sur ' + DB_CONFIG.host + ':' + DB_CONFIG.port + '...');

  try {
    const rootConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      connectTimeout: 3000
    });

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    pool = mysql.createPool(DB_CONFIG);
    await pool.query('SELECT 1');
    activeDriver = 'mysql';
    console.log(`[DATABASE] Connecté avec succès à MySQL [${DB_CONFIG.database}] !`);
    await setupMysqlTables();
  } catch (mysqlErr) {
    console.warn(`[DATABASE] Note MySQL (${mysqlErr.message}). Utilisation du stockage dynamique sécurisé avec persistance locale.`);
    activeDriver = 'json-storage';
    loadJsonStore();
  }

  await seedIfEmpty();
}

async function setupMysqlTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'agent',
      phone VARCHAR(50) DEFAULT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      email VARCHAR(150) DEFAULT NULL,
      address VARCHAR(255) DEFAULT NULL,
      city VARCHAR(100) NOT NULL DEFAULT 'Brazzaville',
      id_number VARCHAR(50) DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shipments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tracking_number VARCHAR(50) NOT NULL UNIQUE,
      client_id INT NOT NULL,
      origin VARCHAR(100) NOT NULL DEFAULT 'Brazzaville',
      destination VARCHAR(100) NOT NULL DEFAULT 'Pointe-Noire',
      sender_name VARCHAR(150) NOT NULL,
      sender_phone VARCHAR(50) NOT NULL,
      receiver_name VARCHAR(150) NOT NULL,
      receiver_phone VARCHAR(50) NOT NULL,
      receiver_address VARCHAR(255) DEFAULT NULL,
      carrier_name VARCHAR(100) DEFAULT NULL,
      carrier_phone VARCHAR(50) DEFAULT NULL,
      vehicle_plate VARCHAR(50) DEFAULT NULL,
      departure_date DATE DEFAULT NULL,
      estimated_arrival DATE DEFAULT NULL,
      actual_arrival DATE DEFAULT NULL,
      shipping_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      insurance_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      other_fees DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
      status VARCHAR(50) NOT NULL DEFAULT 'en attente',
      notes TEXT DEFAULT NULL,
      created_by INT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cargo_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shipment_id INT DEFAULT NULL,
      client_id INT NOT NULL,
      designation VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'Marchandises Générales',
      quantity INT NOT NULL DEFAULT 1,
      unit VARCHAR(50) NOT NULL DEFAULT 'Colis',
      weight_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      volume_cbm DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      declared_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      status VARCHAR(50) NOT NULL DEFAULT 'enregistrée',
      barcode VARCHAR(100) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tracking_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shipment_id INT NOT NULL,
      status VARCHAR(50) NOT NULL,
      location VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      updated_by INT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shipment_id INT DEFAULT NULL,
      client_id INT NOT NULL,
      amount DECIMAL(12,2) NOT NULL,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'Espèces',
      reference VARCHAR(100) DEFAULT NULL,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      recorded_by INT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shipment_id INT DEFAULT NULL,
      title VARCHAR(200) NOT NULL,
      category VARCHAR(100) NOT NULL DEFAULT 'Carburant',
      amount DECIMAL(12,2) NOT NULL,
      expense_date DATE NOT NULL,
      paid_to VARCHAR(150) DEFAULT NULL,
      payment_method VARCHAR(50) NOT NULL DEFAULT 'Espèces',
      recorded_by INT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      invoice_number VARCHAR(50) NOT NULL UNIQUE,
      shipment_id INT NOT NULL,
      client_id INT NOT NULL,
      issue_date DATE NOT NULL,
      due_date DATE DEFAULT NULL,
      subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
      tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
      notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE RESTRICT,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function seedIfEmpty() {
  const usersCount = await get('SELECT COUNT(*) as count FROM users');
  const count = usersCount ? (usersCount.count || 0) : 0;

  if (count > 0) {
    console.log(`[DATABASE] Base de données prête (${count} utilisateurs répertoriés).`);
    return;
  }

  console.log('[DATABASE] Amorçage des données réelles de KENAYA LOGISTIC...');
  const seed = await getSeedData();

  if (activeDriver === 'mysql') {
    for (const u of seed.users) {
      await execute('INSERT INTO users (name, email, password, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
        [u.name, u.email, u.password, u.role, u.phone, u.status]);
    }
    for (const c of seed.clients) {
      await execute('INSERT INTO clients (name, phone, email, address, city, id_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [c.name, c.phone, c.email, c.address, c.city, c.id_number, c.notes]);
    }
    for (const s of seed.shipments) {
      await execute(`INSERT INTO shipments (
        tracking_number, client_id, origin, destination, sender_name, sender_phone, receiver_name, receiver_phone, receiver_address,
        carrier_name, carrier_phone, vehicle_plate, departure_date, estimated_arrival, actual_arrival, shipping_cost, insurance_cost,
        other_fees, total_cost, paid_amount, payment_status, status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.tracking_number, s.client_id, s.origin, s.destination, s.sender_name, s.sender_phone, s.receiver_name, s.receiver_phone, s.receiver_address,
        s.carrier_name, s.carrier_phone, s.vehicle_plate, s.departure_date, s.estimated_arrival, s.actual_arrival, s.shipping_cost, s.insurance_cost,
        s.other_fees, s.total_cost, s.paid_amount, s.payment_status, s.status, s.notes, s.created_by
      ]);
    }
    for (const ci of seed.cargoItems) {
      await execute(`INSERT INTO cargo_items (shipment_id, client_id, designation, category, quantity, unit, weight_kg, volume_cbm, declared_value, status, barcode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ci.shipment_id, ci.client_id, ci.designation, ci.category, ci.quantity, ci.unit, ci.weight_kg, ci.volume_cbm, ci.declared_value, ci.status, ci.barcode]);
    }
    for (const te of seed.trackingEvents) {
      await execute('INSERT INTO tracking_events (shipment_id, status, location, description, updated_by) VALUES (?, ?, ?, ?, 1)',
        [te.shipment_id, te.status, te.location, te.description]);
    }
    for (const p of seed.payments) {
      await execute('INSERT INTO payments (shipment_id, client_id, amount, payment_method, reference, payment_date, recorded_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [p.shipment_id, p.client_id, p.amount, p.payment_method, p.reference, p.payment_date, p.recorded_by, p.notes]);
    }
    for (const exp of seed.expenses) {
      await execute('INSERT INTO expenses (shipment_id, title, category, amount, expense_date, paid_to, payment_method, recorded_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [exp.shipment_id, exp.title, exp.category, exp.amount, exp.expense_date, exp.paid_to, exp.payment_method, exp.recorded_by, exp.notes]);
    }
    for (const inv of seed.invoices) {
      await execute(`INSERT INTO invoices (invoice_number, shipment_id, client_id, issue_date, due_date, subtotal, tax_rate, tax_amount, discount, total_amount, paid_amount, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [inv.invoice_number, inv.shipment_id, inv.client_id, inv.issue_date, inv.due_date, inv.subtotal, inv.tax_rate, inv.tax_amount, inv.discount, inv.total_amount, inv.paid_amount, inv.status, inv.notes]);
    }
  } else {
    // Populate JSON store
    memoryStore.users = seed.users.map((u, i) => ({ id: i + 1, ...u, created_at: new Date().toISOString() }));
    memoryStore.clients = seed.clients.map((c, i) => ({ id: i + 1, ...c, created_at: new Date().toISOString() }));
    memoryStore.shipments = seed.shipments.map((s, i) => ({ id: i + 1, ...s, created_at: new Date().toISOString() }));
    memoryStore.cargo_items = seed.cargoItems.map((ci, i) => ({ id: i + 1, ...ci, created_at: new Date().toISOString() }));
    memoryStore.tracking_events = seed.trackingEvents.map((te, i) => ({ id: i + 1, ...te, created_at: te.created_at || new Date().toISOString() }));
    memoryStore.payments = seed.payments.map((p, i) => ({ id: i + 1, ...p, payment_date: p.payment_date || new Date().toISOString() }));
    memoryStore.expenses = seed.expenses.map((e, i) => ({ id: i + 1, ...e, created_at: new Date().toISOString() }));
    memoryStore.invoices = seed.invoices.map((inv, i) => ({ id: i + 1, ...inv, created_at: new Date().toISOString() }));
    saveJsonStore();
  }

  console.log('[DATABASE] Données initiales insérées avec succès !');
}

module.exports = {
  initDatabase,
  query,
  get,
  execute,
  getDriver,
  DB_CONFIG
};
