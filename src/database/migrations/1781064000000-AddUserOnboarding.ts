import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserOnboarding1781064000000 implements MigrationInterface {
  name = 'AddUserOnboarding1781064000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "profile_completed" boolean`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "onboarding_completed" boolean`,
    );
    await queryRunner.query(
      `UPDATE "users" SET "profile_completed" = true, "onboarding_completed" = true`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "profile_completed" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "profile_completed" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "onboarding_completed" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "onboarding_completed" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "onboarding_completed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "profile_completed"`,
    );
  }
}
