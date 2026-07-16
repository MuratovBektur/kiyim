import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSellerProfileAndAdmin1784202986737 implements MigrationInterface {
    name = 'AddSellerProfileAndAdmin1784202986737'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seller" ADD "whatsapp" text`);
        await queryRunner.query(`ALTER TABLE "seller" ADD "telegramContact" text`);
        await queryRunner.query(`ALTER TABLE "seller" ADD "instagram" text`);
        await queryRunner.query(`ALTER TABLE "seller" ADD "isAdmin" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "seller" DROP COLUMN "isAdmin"`);
        await queryRunner.query(`ALTER TABLE "seller" DROP COLUMN "instagram"`);
        await queryRunner.query(`ALTER TABLE "seller" DROP COLUMN "telegramContact"`);
        await queryRunner.query(`ALTER TABLE "seller" DROP COLUMN "whatsapp"`);
    }

}
