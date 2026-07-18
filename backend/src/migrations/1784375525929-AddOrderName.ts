import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderName1784375525929 implements MigrationInterface {
    name = 'AddOrderName1784375525929'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" ADD "name" character varying`);
        await queryRunner.query(`UPDATE "order" SET "name" = 'Не указано' WHERE "name" IS NULL`);
        await queryRunner.query(`ALTER TABLE "order" ALTER COLUMN "name" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "name"`);
    }

}
