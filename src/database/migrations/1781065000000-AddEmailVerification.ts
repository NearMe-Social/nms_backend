import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1781065000000 implements MigrationInterface {
  name = 'AddEmailVerification1781065000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "email_verified" boolean`);
    await queryRunner.query(`UPDATE "users" SET "email_verified" = true`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email_verified" SET DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "email_verified" SET NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "email_verifications" (
        "email_verification_id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "code_hash" character varying NOT NULL,
        "attempt_count" integer NOT NULL DEFAULT 0,
        "expires_at" TIMESTAMP NOT NULL,
        "last_sent_at" TIMESTAMP NOT NULL,
        "consumed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_email_verifications_email" UNIQUE ("email"),
        CONSTRAINT "PK_email_verifications" PRIMARY KEY ("email_verification_id")
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "email_verifications"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified"`);
  }
}
