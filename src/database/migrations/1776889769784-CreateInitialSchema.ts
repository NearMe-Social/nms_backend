import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1776889769784 implements MigrationInterface {
  name = 'CreateInitialSchema1776889769784';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_gender_enum" AS ENUM('female', 'male', 'non-binary', 'prefer-not')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('USER', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."posts_status_enum" AS ENUM('ACTIVE', 'EXPIRED', 'REMOVED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."comments_status_enum" AS ENUM('ACTIVE', 'REMOVED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reactions_type_enum" AS ENUM('LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."messages_status_enum" AS ENUM('SENT', 'DELETED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('SYSTEM', 'MESSAGE', 'COMMENT', 'REPORT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reports_target_type_enum" AS ENUM('POST', 'COMMENT', 'USER', 'MESSAGE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."reports_status_enum" AS ENUM('PENDING', 'REVIEWED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "user_id" SERIAL NOT NULL,
        "username" character varying NOT NULL,
        "email" character varying NOT NULL,
        "first_name" character varying NOT NULL,
        "last_name" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "birthday" date,
        "gender" "public"."users_gender_enum",
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'USER',
        "profile_image" character varying,
        "bio" text,
        "current_latitude" numeric(10,7),
        "current_longitude" numeric(10,7),
        "location_updated_at" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("user_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "posts" (
        "post_id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "latitude" numeric(10,7) NOT NULL,
        "longitude" numeric(10,7) NOT NULL,
        "visibility_radius" integer NOT NULL DEFAULT 200,
        "status" "public"."posts_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_posts" PRIMARY KEY ("post_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "comments" (
        "comment_id" SERIAL NOT NULL,
        "post_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "content" text NOT NULL,
        "status" "public"."comments_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comments" PRIMARY KEY ("comment_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reactions" (
        "reaction_id" SERIAL NOT NULL,
        "post_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "type" "public"."reactions_type_enum" NOT NULL DEFAULT 'LIKE',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reactions" PRIMARY KEY ("reaction_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_blocks" (
        "user_block_id" SERIAL NOT NULL,
        "blocker_id" integer NOT NULL,
        "blocked_user_id" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_blocks_blocker_blocked" UNIQUE ("blocker_id", "blocked_user_id"),
        CONSTRAINT "PK_user_blocks" PRIMARY KEY ("user_block_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "conversation_id" SERIAL NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations" PRIMARY KEY ("conversation_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "conversation_participants" (
        "conversation_participant_id" SERIAL NOT NULL,
        "conversation_id" integer NOT NULL,
        "user_id" integer NOT NULL,
        "joined_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversation_participants" PRIMARY KEY ("conversation_participant_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "message_id" SERIAL NOT NULL,
        "conversation_id" integer NOT NULL,
        "sender_id" integer NOT NULL,
        "content" text NOT NULL,
        "status" "public"."messages_status_enum" NOT NULL DEFAULT 'SENT',
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_messages" PRIMARY KEY ("message_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "notification_id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "type" "public"."notifications_type_enum" NOT NULL,
        "related_id" integer NOT NULL,
        "message" text NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("notification_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "reports" (
        "report_id" SERIAL NOT NULL,
        "reporter_id" integer NOT NULL,
        "target_type" "public"."reports_target_type_enum" NOT NULL,
        "target_id" integer NOT NULL,
        "reason" text NOT NULL,
        "status" "public"."reports_status_enum" NOT NULL DEFAULT 'PENDING',
        "reviewed_by" integer,
        "reviewed_at" TIMESTAMP,
        "moderator_note" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reports" PRIMARY KEY ("report_id")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "FK_posts_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_post" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_comments_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reactions" ADD CONSTRAINT "FK_reactions_post" FOREIGN KEY ("post_id") REFERENCES "posts"("post_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reactions" ADD CONSTRAINT "FK_reactions_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_user_blocks_blocker" FOREIGN KEY ("blocker_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" ADD CONSTRAINT "FK_user_blocks_blocked_user" FOREIGN KEY ("blocked_user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_conversation_participants_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_conversation_participants_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" ADD CONSTRAINT "FK_messages_sender" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" ADD CONSTRAINT "FK_reports_reporter" FOREIGN KEY ("reporter_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" ADD CONSTRAINT "FK_reports_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reviewed_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reports" DROP CONSTRAINT "FK_reports_reporter"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_sender"`,
    );
    await queryRunner.query(
      `ALTER TABLE "messages" DROP CONSTRAINT "FK_messages_conversation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_conversation_participants_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_conversation_participants_conversation"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_user_blocks_blocked_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_blocks" DROP CONSTRAINT "FK_user_blocks_blocker"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reactions" DROP CONSTRAINT "FK_reactions_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reactions" DROP CONSTRAINT "FK_reactions_post"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_comments_post"`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "FK_posts_user"`,
    );

    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "conversation_participants"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TABLE "user_blocks"`);
    await queryRunner.query(`DROP TABLE "reactions"`);
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TABLE "users"`);

    await queryRunner.query(`DROP TYPE "public"."reports_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."reports_target_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."messages_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."reactions_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."comments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."posts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
  }
}
