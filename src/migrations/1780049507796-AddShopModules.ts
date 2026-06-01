import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShopModules1780049507796 implements MigrationInterface {
  name = 'AddShopModules1780049507796';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE TABLE "products" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "brand" character varying(100) NOT NULL, "type" character varying(100) NOT NULL, "originalPrice" bigint NOT NULL, "sellingPrice" bigint NOT NULL, "stockHN" integer NOT NULL DEFAULT \'0\', "stockQB" integer NOT NULL DEFAULT \'0\', "stockSG" integer NOT NULL DEFAULT \'0\', "imageUrl" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))',
    );
    await queryRunner.query('CREATE INDEX "IDX_61fac54950763ae56ee51f17fd" ON "products" ("brand") ');
    await queryRunner.query(
      'CREATE TABLE "customers" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "phone" character varying(20) NOT NULL, "address" text, "orderCount" integer NOT NULL DEFAULT \'0\', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_88acd889fbe17d0e16cc4bc9174" UNIQUE ("phone"), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))',
    );
    await queryRunner.query('CREATE INDEX "IDX_88acd889fbe17d0e16cc4bc917" ON "customers" ("phone") ');
    await queryRunner.query(
      'CREATE TABLE "order_items" ("id" SERIAL NOT NULL, "orderId" integer NOT NULL, "productId" integer, "productName" character varying NOT NULL, "quantity" integer NOT NULL, "price" bigint NOT NULL, "originalPrice" bigint NOT NULL, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))',
    );
    await queryRunner.query('CREATE INDEX "IDX_f1d359a55923bb45b057fbdab0" ON "order_items" ("orderId") ');
    await queryRunner.query('CREATE INDEX "IDX_cdb99c05982d5191ac8465ac01" ON "order_items" ("productId") ');
    await queryRunner.query('CREATE TYPE "public"."orders_status_enum" AS ENUM(\'Unpaid\', \'Paid\')');
    await queryRunner.query("CREATE TYPE \"public\".\"orders_warehouse_enum\" AS ENUM('HN', 'QB', 'SG')");
    await queryRunner.query(
      'CREATE TABLE "orders" ("id" SERIAL NOT NULL, "customerId" integer, "customerName" character varying NOT NULL, "phone" character varying(20) NOT NULL, "address" text NOT NULL DEFAULT \'\', "status" "public"."orders_status_enum" NOT NULL DEFAULT \'Unpaid\', "warehouse" "public"."orders_warehouse_enum" NOT NULL, "totalAmount" bigint NOT NULL, "profit" bigint NOT NULL DEFAULT \'0\', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))',
    );
    await queryRunner.query('CREATE INDEX "IDX_e5de51ca888d8b1f5ac25799dd" ON "orders" ("customerId") ');
    await queryRunner.query('CREATE INDEX "IDX_775c9f06fc27ae3ff8fb26f2c4" ON "orders" ("status") ');
    await queryRunner.query('CREATE INDEX "IDX_1f4b9818a08b822a31493fdee9" ON "orders" ("createdAt") ');
    await queryRunner.query('CREATE INDEX "IDX_d5e3786a82fe691d8bbbb1e256" ON "orders" ("status", "createdAt") ');
    await queryRunner.query(
      'CREATE TABLE "order_note_products" ("id" SERIAL NOT NULL, "orderNoteId" integer NOT NULL, "name" character varying NOT NULL, "quantity" integer NOT NULL DEFAULT \'1\', CONSTRAINT "PK_07406b4e6c71790c23931bca32c" PRIMARY KEY ("id"))',
    );
    await queryRunner.query('CREATE INDEX "IDX_f27e93d6d2a6768899f0d02e1d" ON "order_note_products" ("orderNoteId") ');
    await queryRunner.query(
      'CREATE TABLE "order_notes" ("id" SERIAL NOT NULL, "orderCode" character varying(100) NOT NULL, "note" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_98b207341585da2a0faa9b841ed" PRIMARY KEY ("id"))',
    );
    await queryRunner.query('CREATE INDEX "IDX_ce9fd505aa76200943c5fd1aa8" ON "order_notes" ("orderCode") ');
    await queryRunner.query('CREATE INDEX "IDX_87d66ceee7243523f17fedd2eb" ON "order_notes" ("createdAt") ');
    await queryRunner.query('ALTER TABLE "user" ADD "avatarUrl" text');
    await queryRunner.query('ALTER TABLE "user" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()');
    await queryRunner.query('ALTER TABLE "user" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()');
    await queryRunner.query('ALTER TYPE "public"."user_roles_enum" RENAME TO "user_roles_enum_old"');
    await queryRunner.query('CREATE TYPE "public"."user_roles_enum" AS ENUM(\'admin\', \'user\')');
    await queryRunner.query('ALTER TABLE "user" ALTER COLUMN "roles" DROP DEFAULT');
    await queryRunner.query(
      'ALTER TABLE "user" ALTER COLUMN "roles" TYPE "public"."user_roles_enum" USING (CASE "roles"::"text" WHEN \'premium\' THEN \'admin\' ELSE \'user\' END)::"public"."user_roles_enum"',
    );
    await queryRunner.query('ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT \'user\'');
    await queryRunner.query('DROP TYPE "public"."user_roles_enum_old"');
    await queryRunner.query(
      'ALTER TABLE "order_items" ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "order_items" ADD CONSTRAINT "FK_cdb99c05982d5191ac8465ac010" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "orders" ADD CONSTRAINT "FK_e5de51ca888d8b1f5ac25799dd1" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "order_note_products" ADD CONSTRAINT "FK_f27e93d6d2a6768899f0d02e1df" FOREIGN KEY ("orderNoteId") REFERENCES "order_notes"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "order_note_products" DROP CONSTRAINT "FK_f27e93d6d2a6768899f0d02e1df"');
    await queryRunner.query('ALTER TABLE "orders" DROP CONSTRAINT "FK_e5de51ca888d8b1f5ac25799dd1"');
    await queryRunner.query('ALTER TABLE "order_items" DROP CONSTRAINT "FK_cdb99c05982d5191ac8465ac010"');
    await queryRunner.query('ALTER TABLE "order_items" DROP CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d"');
    await queryRunner.query('CREATE TYPE "public"."user_roles_enum_old" AS ENUM(\'standard\', \'premium\')');
    await queryRunner.query('ALTER TABLE "user" ALTER COLUMN "roles" DROP DEFAULT');
    await queryRunner.query(
      'ALTER TABLE "user" ALTER COLUMN "roles" TYPE "public"."user_roles_enum_old" USING (CASE "roles"::"text" WHEN \'admin\' THEN \'premium\' ELSE \'standard\' END)::"public"."user_roles_enum_old"',
    );
    await queryRunner.query('ALTER TABLE "user" ALTER COLUMN "roles" SET DEFAULT \'standard\'');
    await queryRunner.query('DROP TYPE "public"."user_roles_enum"');
    await queryRunner.query('ALTER TYPE "public"."user_roles_enum_old" RENAME TO "user_roles_enum"');
    await queryRunner.query('ALTER TABLE "user" DROP COLUMN "updatedAt"');
    await queryRunner.query('ALTER TABLE "user" DROP COLUMN "createdAt"');
    await queryRunner.query('ALTER TABLE "user" DROP COLUMN "avatarUrl"');
    await queryRunner.query('DROP INDEX "public"."IDX_87d66ceee7243523f17fedd2eb"');
    await queryRunner.query('DROP INDEX "public"."IDX_ce9fd505aa76200943c5fd1aa8"');
    await queryRunner.query('DROP TABLE "order_notes"');
    await queryRunner.query('DROP INDEX "public"."IDX_f27e93d6d2a6768899f0d02e1d"');
    await queryRunner.query('DROP TABLE "order_note_products"');
    await queryRunner.query('DROP INDEX "public"."IDX_d5e3786a82fe691d8bbbb1e256"');
    await queryRunner.query('DROP INDEX "public"."IDX_1f4b9818a08b822a31493fdee9"');
    await queryRunner.query('DROP INDEX "public"."IDX_775c9f06fc27ae3ff8fb26f2c4"');
    await queryRunner.query('DROP INDEX "public"."IDX_e5de51ca888d8b1f5ac25799dd"');
    await queryRunner.query('DROP TABLE "orders"');
    await queryRunner.query('DROP TYPE "public"."orders_warehouse_enum"');
    await queryRunner.query('DROP TYPE "public"."orders_status_enum"');
    await queryRunner.query('DROP INDEX "public"."IDX_cdb99c05982d5191ac8465ac01"');
    await queryRunner.query('DROP INDEX "public"."IDX_f1d359a55923bb45b057fbdab0"');
    await queryRunner.query('DROP TABLE "order_items"');
    await queryRunner.query('DROP INDEX "public"."IDX_88acd889fbe17d0e16cc4bc917"');
    await queryRunner.query('DROP TABLE "customers"');
    await queryRunner.query('DROP INDEX "public"."IDX_61fac54950763ae56ee51f17fd"');
    await queryRunner.query('DROP TABLE "products"');
  }
}
