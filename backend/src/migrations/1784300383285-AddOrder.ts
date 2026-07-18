import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrder1784300383285 implements MigrationInterface {
    name = 'AddOrder1784300383285'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "order" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "phone" character varying NOT NULL, "items" jsonb NOT NULL, "total" numeric(10,2) NOT NULL, "currency" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "sellerId" uuid NOT NULL, CONSTRAINT "PK_1031171c13130102495201e3e20" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8a583acc24e13bcf84b1b9d0d2" ON "order"  ("sellerId") `);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_8a583acc24e13bcf84b1b9d0d20" FOREIGN KEY ("sellerId") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_8a583acc24e13bcf84b1b9d0d20"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8a583acc24e13bcf84b1b9d0d2"`);
        await queryRunner.query(`DROP TABLE "order"`);
    }

}
