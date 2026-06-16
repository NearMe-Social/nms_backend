import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostImagesTable1781095000000 implements MigrationInterface {
  name = 'AddPostImagesTable1781095000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_images" ("post_image_id" SERIAL NOT NULL, "image_url" character varying NOT NULL, "display_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "post_id" integer NOT NULL, CONSTRAINT "PK_post_images_post_image_id" PRIMARY KEY ("post_image_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_images" ADD CONSTRAINT "FK_post_images_post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "post_images" ("post_id", "image_url", "display_order") SELECT "post_id", "image_url", 0 FROM "posts" WHERE "image_url" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_images" DROP CONSTRAINT "FK_post_images_post_id"`,
    );
    await queryRunner.query(`DROP TABLE "post_images"`);
  }
}
