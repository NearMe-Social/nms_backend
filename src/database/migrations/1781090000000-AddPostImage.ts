import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostImage1781090000000 implements MigrationInterface {
  name = 'AddPostImage1781090000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "image_url" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "image_url"`);
  }
}
