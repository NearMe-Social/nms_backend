import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRoleAndLocationColumnsToUsers1776890100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role',
        type: 'enum',
        enum: ['USER', 'ADMIN'],
        default: "'USER'",
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'current_latitude',
        type: 'decimal',
        precision: 10,
        scale: 7,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'current_longitude',
        type: 'decimal',
        precision: 10,
        scale: 7,
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'location_updated_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'location_updated_at');
    await queryRunner.dropColumn('users', 'current_longitude');
    await queryRunner.dropColumn('users', 'current_latitude');
    await queryRunner.dropColumn('users', 'role');
  }
}
