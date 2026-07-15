import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1783942568711 implements MigrationInterface {
    name = 'InitSchema1783942568711'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "category" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, CONSTRAINT "UQ_cb73208f151aa71cdd78f662d70" UNIQUE ("slug"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'KZT', "photos" text array NOT NULL DEFAULT '{}', "extraPhotos" text array NOT NULL DEFAULT '{}', "subtype" text, "brand" text, "originCountry" text, "materials" text array NOT NULL DEFAULT '{}', "sizes" text array NOT NULL DEFAULT '{}', "colors" text array NOT NULL DEFAULT '{}', "inStock" boolean NOT NULL DEFAULT true, "sellerUrl" text, "isPublished" boolean NOT NULL DEFAULT false, "publishedTelegram" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "sellerId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f7bf944ad9f1034110e8c2133a" ON "product"  ("title") `);
        await queryRunner.query(`CREATE INDEX "IDX_ff0c0301a95e517153df97f681" ON "product"  ("categoryId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d5cac481d22dacaf4d53f900a3" ON "product"  ("sellerId") `);
        await queryRunner.query(`CREATE TABLE "bot_allowed_phone" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying NOT NULL, "sellerId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b4219ee64be063c01232d1c2823" UNIQUE ("phone"), CONSTRAINT "PK_a8db9725b531e9594e36ed3f7af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bot_authorized_user" ("telegramId" character varying NOT NULL, "phone" character varying NOT NULL, "sellerId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5310f7ddac09cb029fecc46c127" PRIMARY KEY ("telegramId"))`);
        await queryRunner.query(`CREATE TABLE "seller" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "logoUrl" text, "description" text, "rating" double precision NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "contactPhone" text, "telegramChatId" text, "telegramChatTitle" text, CONSTRAINT "UQ_8700debd5a72afae92322fe5efe" UNIQUE ("slug"), CONSTRAINT "PK_36445a9c6e794945a4a4a8d3c9d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bot_custom_preset" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "kind" character varying NOT NULL, "value" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_964d94ca38ebc7469b0a86206d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_264e3fc23d3cda2a3660a181ea" ON "bot_custom_preset"  ("kind", "value") `);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_d5cac481d22dacaf4d53f900a3f" FOREIGN KEY ("sellerId") REFERENCES "seller"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product" ADD CONSTRAINT "FK_ff0c0301a95e517153df97f6812" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bot_allowed_phone" ADD CONSTRAINT "FK_91624d8de410d48adf1fd708945" FOREIGN KEY ("sellerId") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bot_authorized_user" ADD CONSTRAINT "FK_d18be8739c538fdfe92011ba649" FOREIGN KEY ("sellerId") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bot_authorized_user" DROP CONSTRAINT "FK_d18be8739c538fdfe92011ba649"`);
        await queryRunner.query(`ALTER TABLE "bot_allowed_phone" DROP CONSTRAINT "FK_91624d8de410d48adf1fd708945"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_ff0c0301a95e517153df97f6812"`);
        await queryRunner.query(`ALTER TABLE "product" DROP CONSTRAINT "FK_d5cac481d22dacaf4d53f900a3f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_264e3fc23d3cda2a3660a181ea"`);
        await queryRunner.query(`DROP TABLE "bot_custom_preset"`);
        await queryRunner.query(`DROP TABLE "seller"`);
        await queryRunner.query(`DROP TABLE "bot_authorized_user"`);
        await queryRunner.query(`DROP TABLE "bot_allowed_phone"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5cac481d22dacaf4d53f900a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff0c0301a95e517153df97f681"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f7bf944ad9f1034110e8c2133a"`);
        await queryRunner.query(`DROP TABLE "product"`);
        await queryRunner.query(`DROP TABLE "category"`);
    }

}
