import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPresetCategoryScope1784105458871 implements MigrationInterface {
    name = 'AddPresetCategoryScope1784105458871'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_264e3fc23d3cda2a3660a181ea"`);
        await queryRunner.query(`ALTER TABLE "bot_custom_preset" ADD "categorySlug" character varying NOT NULL DEFAULT ''`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ded1ac2512a66afc5805a754be" ON "bot_custom_preset"  ("kind", "value", "categorySlug") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_ded1ac2512a66afc5805a754be"`);
        await queryRunner.query(`ALTER TABLE "bot_custom_preset" DROP COLUMN "categorySlug"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_264e3fc23d3cda2a3660a181ea" ON "bot_custom_preset" USING btree ("kind", "value") `);
    }

}
