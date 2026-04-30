import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBirthdayAndGenderToUsers1776890000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'birthday',
        type: 'date',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'gender',
        type: 'enum',
        enum: ['female', 'male', 'non-binary', 'prefer-not'],
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'gender');
    await queryRunner.dropColumn('users', 'birthday');
  }
}
