import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('payments', (table) => {
    table.uuid('id').primary();
    table.string('cpf', 11).notNullable().index();
    table.string('description').notNullable();
    table.decimal('amount', 14, 2).notNullable();
    table.string('payment_method').notNullable();
    table.string('status').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('payments');
}