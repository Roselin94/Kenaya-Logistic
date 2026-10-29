require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('[DUMP] Connexion à MySQL...');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'kenaya_logistics'
  });

  const [tables] = await conn.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);

  let sqlDump = `-- =====================================================================\n`;
  sqlDump += `-- KENAYA LOGISTIC - EXPORT BASE DE DONNÉES CLOUD DE PRODUCTION\n`;
  sqlDump += `-- Compatible MySQL 8.0, TiDB Cloud, Aiven, Clever Cloud, PlanetScale\n`;
  sqlDump += `-- Date d'export : ${new Date().toISOString()}\n`;
  sqlDump += `-- =====================================================================\n\n`;
  sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  for (const table of tableNames) {
    const [[createTable]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    sqlDump += `-- Structure de la table \`${table}\`\n`;
    sqlDump += `DROP TABLE IF EXISTS \`${table}\`;\n`;
    sqlDump += `${createTable['Create Table']};\n\n`;

    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    if (rows.length > 0) {
      sqlDump += `-- Données de la table \`${table}\` (${rows.length} lignes)\n`;
      for (const row of rows) {
        const columns = Object.keys(row).map(c => `\`${c}\``).join(', ');
        const values = Object.values(row).map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val ? 1 : 0;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
        }).join(', ');
        sqlDump += `INSERT INTO \`${table}\` (${columns}) VALUES (${values});\n`;
      }
      sqlDump += `\n`;
    }
  }

  sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;

  const outputPath = path.join(__dirname, 'dump_kenaya_logistics.sql');
  fs.writeFileSync(outputPath, sqlDump, 'utf-8');
  console.log(`✅ Dump SQL généré avec succès dans : ${outputPath}`);
  console.log(`📊 Tables exportées : ${tableNames.join(', ')}`);

  await conn.end();
}

main().catch(err => {
  console.error('Erreur dump:', err);
  process.exit(1);
});

