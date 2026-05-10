import { MigrationInterface, QueryRunner } from "typeorm";

export class InitDatabase1778404872382 implements MigrationInterface {
    name = 'InitDatabase1778404872382'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_blocks" ("user_block_id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "blocker_id" integer NOT NULL, "blocked_user_id" integer NOT NULL, CONSTRAINT "UQ_c4ba1cac6a804c93a6e9d396739" UNIQUE ("blocker_id", "blocked_user_id"), CONSTRAINT "PK_4f5e9337a0520f103fbb13da304" PRIMARY KEY ("user_block_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reports_target_type_enum" AS ENUM('POST', 'COMMENT', 'USER', 'MESSAGE')`);
        await queryRunner.query(`CREATE TYPE "public"."reports_status_enum" AS ENUM('PENDING', 'REVIEWED')`);
        await queryRunner.query(`CREATE TABLE "reports" ("report_id" SERIAL NOT NULL, "target_type" "public"."reports_target_type_enum" NOT NULL, "target_id" integer NOT NULL, "reason" text NOT NULL, "status" "public"."reports_status_enum" NOT NULL DEFAULT 'PENDING', "reviewed_at" TIMESTAMP, "moderator_note" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "reporter_id" integer NOT NULL, "reviewed_by" integer, CONSTRAINT "PK_e5cb9f2cacc967a3de2f6635323" PRIMARY KEY ("report_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('SYSTEM', 'MESSAGE', 'COMMENT', 'REPORT')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("notification_id" SERIAL NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "related_id" integer NOT NULL, "message" text NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_eaedfe19f0f765d26afafa85956" PRIMARY KEY ("notification_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."messages_status_enum" AS ENUM('SENT', 'DELETED')`);
        await queryRunner.query(`CREATE TABLE "messages" ("message_id" SERIAL NOT NULL, "conversation_id" integer NOT NULL, "sender_id" integer NOT NULL, "content" text NOT NULL, "status" "public"."messages_status_enum" NOT NULL DEFAULT 'SENT', "read_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6187089f850b8deeca0232cfeba" PRIMARY KEY ("message_id"))`);
        await queryRunner.query(`CREATE TABLE "conversations" ("conversation_id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c00ef2d6a90778048c6b8150819" PRIMARY KEY ("conversation_id"))`);
        await queryRunner.query(`CREATE TABLE "conversation_participants" ("conversation_participant_id" SERIAL NOT NULL, "conversation_id" integer NOT NULL, "user_id" integer NOT NULL, "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7578ab061222b308217e55aecb5" PRIMARY KEY ("conversation_participant_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_gender_enum" AS ENUM('female', 'male', 'non-binary', 'prefer-not')`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`CREATE TABLE "users" ("user_id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "password_hash" character varying NOT NULL, "birthday" date, "gender" "public"."users_gender_enum", "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER', "profile_image" character varying, "bio" text, "current_latitude" numeric(10,7), "current_longitude" numeric(10,7), "location_updated_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("user_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reactions_type_enum" AS ENUM('LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY')`);
        await queryRunner.query(`CREATE TABLE "reactions" ("reaction_id" SERIAL NOT NULL, "type" "public"."reactions_type_enum" NOT NULL DEFAULT 'LIKE', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "post_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_74284e58c3f69f9a643d2957a7f" PRIMARY KEY ("reaction_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."posts_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'REMOVED')`);
        await queryRunner.query(`CREATE TABLE "posts" ("post_id" SERIAL NOT NULL, "title" character varying NOT NULL, "content" text NOT NULL, "latitude" numeric(10,7) NOT NULL, "longitude" numeric(10,7) NOT NULL, "visibility_radius" integer NOT NULL DEFAULT '200', "status" "public"."posts_status_enum" NOT NULL DEFAULT 'ACTIVE', "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "PK_e55cc433639d0e21c3dbf637bce" PRIMARY KEY ("post_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."comments_status_enum" AS ENUM('ACTIVE', 'REMOVED')`);
        await queryRunner.query(`CREATE TABLE "comments" ("comment_id" SERIAL NOT NULL, "content" text NOT NULL, "status" "public"."comments_status_enum" NOT NULL DEFAULT 'ACTIVE', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "post_id" integer NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_eb0d76f2ca45d66a7de04c7c72b" PRIMARY KEY ("comment_id"))`);
        await queryRunner.query(`ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_dfcd8a81016d1de587fbd2d70bf" FOREIGN KEY ("blocker_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_fdb57b48a77dcae7569297fded7" FOREIGN KEY ("blocked_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead" FOREIGN KEY ("reporter_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reports" ADD CONSTRAINT "FK_e8fa0bffcaebc921b1e8e42a82f" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_1559e8a16b828f2e836a2312800" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_377d4041a495b81ee1a85ae026f" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_a1ac38351a456da43cd26d38be8" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reactions" ADD CONSTRAINT "FK_dde6062145a93649adc5af3946e" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_259bf9825d9d198608d1b46b0b5"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_c4f9a7bd77b489e711277ee5986"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_dde6062145a93649adc5af3946e"`);
        await queryRunner.query(`ALTER TABLE "reactions" DROP CONSTRAINT "FK_a1ac38351a456da43cd26d38be8"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_377d4041a495b81ee1a85ae026f"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_1559e8a16b828f2e836a2312800"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_e8fa0bffcaebc921b1e8e42a82f"`);
        await queryRunner.query(`ALTER TABLE "reports" DROP CONSTRAINT "FK_9459b9bf907a3807ef7143d2ead"`);
        await queryRunner.query(`ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_fdb57b48a77dcae7569297fded7"`);
        await queryRunner.query(`ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_dfcd8a81016d1de587fbd2d70bf"`);
        await queryRunner.query(`DROP TABLE "comments"`);
        await queryRunner.query(`DROP TYPE "public"."comments_status_enum"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TYPE "public"."posts_status_enum"`);
        await queryRunner.query(`DROP TABLE "reactions"`);
        await queryRunner.query(`DROP TYPE "public"."reactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
        await queryRunner.query(`DROP TABLE "conversation_participants"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TYPE "public"."messages_status_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TABLE "reports"`);
        await queryRunner.query(`DROP TYPE "public"."reports_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."reports_target_type_enum"`);
        await queryRunner.query(`DROP TABLE "user_blocks"`);
    }

}
