#!/usr/bin/env node
/*
  Safe SQL migration runner for Postgres.
  Usage:
    DATABASE_URL=postgres://user:pass@host:port/db node tools/run-sql-migration.js tools/sql/20250829_add_clinic_prospect_flags.sql
*/
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Erro: caminho do arquivo .sql não informado.');
    console.error('Exemplo: node tools/run-sql-migration.js tools/sql/20250829_add_clinic_prospect_flags.sql');
    process.exit(1);
  }

  const sqlPath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(sqlPath)) {
    console.error(`Erro: arquivo não encontrado: ${sqlPath}`);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Erro: DATABASE_URL não definido no ambiente.');
    console.error('Defina DATABASE_URL ou use: DATABASE_URL=... node tools/run-sql-migration.js <arquivo.sql>');
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({ connectionString: databaseUrl });
  console.log(`Conectando ao Postgres...`);
  await client.connect();

  try {
    console.log(`Aplicando migração SQL: ${path.basename(sqlPath)}`);
    await client.query(sql);
    console.log('Migração aplicada com sucesso.');
  } catch (err) {
    console.error('Falha ao aplicar migração:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error('Erro inesperado:', e);
  process.exit(1);
});
