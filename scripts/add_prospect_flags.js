#!/usr/bin/env node
/**
 * Script seguro para adicionar flags de prospecção à tabela Clinic
 * Uso: node scripts/add_prospect_flags.js
 * 
 * Segurança:
 * - Usa transações para garantir atomicidade
 * - Verifica se as colunas já existem antes de adicionar
 * - Confirma antes de executar em produção
 * - Não usa ALTER TABLE direto, usa funções PG para verificação
 */

const { Client } = require('pg');
const readline = require('readline');

// String de conexão direta
const DATABASE_URL = 'postgresql://postgres:ddad72e29eb917430119@dpbdp1.easypanel.host:32102/aa?sslmode=disable';

// SQL seguro com verificação de existência e transação
const SQL_MIGRATION = `
BEGIN;

-- Função para adicionar coluna se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Clinic' AND column_name = 'prospectEmail'
  ) THEN
    ALTER TABLE "Clinic" ADD COLUMN "prospectEmail" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Coluna prospectEmail adicionada';
  ELSE
    RAISE NOTICE 'Coluna prospectEmail já existe';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Clinic' AND column_name = 'prospectCall'
  ) THEN
    ALTER TABLE "Clinic" ADD COLUMN "prospectCall" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Coluna prospectCall adicionada';
  ELSE
    RAISE NOTICE 'Coluna prospectCall já existe';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Clinic' AND column_name = 'prospectWhatsapp'
  ) THEN
    ALTER TABLE "Clinic" ADD COLUMN "prospectWhatsapp" BOOLEAN NOT NULL DEFAULT false;
    RAISE NOTICE 'Coluna prospectWhatsapp adicionada';
  ELSE
    RAISE NOTICE 'Coluna prospectWhatsapp já existe';
  END IF;
END $$;

COMMIT;
`;

async function main() {
  console.log('🔄 Iniciando migração para adicionar flags de prospecção à tabela Clinic');
  console.log(`🔌 Conectando ao banco de dados...`);
  
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar ambiente
    const dbInfo = await client.query(`
      SELECT current_database() as db_name, 
             inet_server_addr() as server_addr, 
             inet_server_port() as server_port
    `);
    
    const { db_name, server_addr, server_port } = dbInfo.rows[0];
    console.log(`\n📊 Informações do banco:`);
    console.log(`   - Database: ${db_name}`);
    console.log(`   - Servidor: ${server_addr}:${server_port}`);
    
    // Confirmar antes de executar
    const isProd = server_addr && !server_addr.toString().includes('127.0.0.1');
    if (isProd) {
      console.log('\n⚠️  ATENÇÃO: Você está conectado a um banco que parece ser de PRODUÇÃO!');
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('Deseja continuar? (digite "SIM" para confirmar): ', resolve);
      });
      
      rl.close();
      
      if (answer.trim().toUpperCase() !== 'SIM') {
        console.log('❌ Operação cancelada pelo usuário');
        await client.end();
        return;
      }
    }
    
    console.log('\n🔄 Aplicando migração...');
    await client.query(SQL_MIGRATION);
    
    console.log('\n✅ Migração aplicada com sucesso!');
    
    // Verificar se as colunas foram criadas
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Clinic' 
      AND column_name IN ('prospectEmail', 'prospectCall', 'prospectWhatsapp')
    `);
    
    console.log('\n📋 Verificação final:');
    const columnNames = columns.rows.map(row => row.column_name);
    
    ['prospectEmail', 'prospectCall', 'prospectWhatsapp'].forEach(col => {
      console.log(`   - ${col}: ${columnNames.includes(col) ? '✅ Presente' : '❌ Ausente'}`);
    });
    
  } catch (error) {
    console.error('\n❌ Erro durante a migração:', error.message);
    console.error('   Detalhes:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
    console.log('\n👋 Conexão encerrada');
  }
}

main();
