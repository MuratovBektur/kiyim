import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExternalSourceToProduct1788942285158 implements MigrationInterface {
    name = 'AddExternalSourceToProduct1788942285158'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" ADD "externalSource" text`);
        await queryRunner.query(`ALTER TABLE "product" ADD "externalId" text`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_product_external_source_id" ON "product" ("externalSource", "externalId") WHERE "externalSource" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_product_external_source_id"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "externalId"`);
        await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "externalSource"`);
    }

}
