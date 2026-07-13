const pool = require('./src/config/db');

(async () => {
  try {
    const result = await pool.query(`
      UPDATE assets 
      SET kategori = 
        CASE 
          WHEN asset_name ILIKE '%PC%' OR asset_name ILIKE '%Laptop%' OR asset_name ILIKE '%Komputer%' THEN 'PC/Laptop'
          WHEN asset_name ILIKE '%Printer%' THEN 'Printer'
          WHEN asset_name ILIKE '%Switch%' OR asset_name ILIKE '%Router%' THEN 'Switch'
          ELSE kategori
        END
      WHERE kategori IS NULL
    `);
    console.log('Rows updated:', result.rowCount);

    const check = await pool.query('SELECT kategori, COUNT(*) FROM assets GROUP BY kategori');
    console.table(check.rows);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
