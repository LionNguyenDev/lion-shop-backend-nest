import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleAuth1780041646549 implements MigrationInterface {
  name = 'AddGoogleAuth1780041646549';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TYPE "public"."user_roles_enum" AS ENUM(\'standard\', \'premium\')');
    await queryRunner.query(
      'CREATE TABLE "user" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying, "googleId" character varying, "isActive" boolean NOT NULL DEFAULT true, "roles" "public"."user_roles_enum" NOT NULL DEFAULT \'standard\', CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))',
    );
    await queryRunner.query("CREATE TYPE \"public\".\"task_status_enum\" AS ENUM('open', 'in_progress', 'done')");
    await queryRunner.query(
      'CREATE TABLE "task" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" character varying, "status" "public"."task_status_enum" NOT NULL DEFAULT \'open\', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "task"');
    await queryRunner.query('DROP TYPE "public"."task_status_enum"');
    await queryRunner.query('DROP TABLE "user"');
    await queryRunner.query('DROP TYPE "public"."user_roles_enum"');
  }
}
