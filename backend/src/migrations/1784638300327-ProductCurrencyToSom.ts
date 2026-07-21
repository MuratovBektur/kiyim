import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductCurrencyToSom1784638300327 implements MigrationInterface {
    name = 'ProductCurrencyToSom1784638300327'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "product" SET "currency" = 'сом' WHERE "currency" <> 'сом'`);
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "currency" SET DEFAULT 'сом'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product" ALTER COLUMN "currency" SET DEFAULT 'KZT'`);
    }

}
