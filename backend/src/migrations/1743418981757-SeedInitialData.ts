import { hash } from "bcryptjs";
import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedInitialData1743418981757 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const sysAdminPassword = await hash('securepassword', 10);
    const compAdminPassword = await hash('securepassword', 10);
    const userPassword = await hash('securepassword', 10);

    await queryRunner.query(`
      -- Temizlik
      TRUNCATE TABLE user_activities CASCADE;
      TRUNCATE TABLE sensors CASCADE;
      TRUNCATE TABLE users CASCADE;
      TRUNCATE TABLE companies CASCADE;

      -- Şirketler
      INSERT INTO companies (id, name, description, code, "isActive", "createdAt", "updatedAt")
      VALUES 
        ('11111111-1111-1111-1111-111111111111', 'System Şirketi', 'Sistem içindir', 'SYSTEM01', true, now(), now()),
        ('22222222-2222-2222-2222-222222222222', 'Demo Şirket', 'Demo açıklaması', 'DEMO01', true, now(), now());

      -- Kullanıcılar
      INSERT INTO users (id, "firstName", "lastName", email, password, role, "isActive", "companyId", "createdAt", "updatedAt")
      VALUES 
        ('2ff0dfb2-93c3-473e-8f3c-a4a8e5498d6c', 'Sistem', 'Admin', 'sysadmin@example.com', '${sysAdminPassword}', 'system_admin', true, '11111111-1111-1111-1111-111111111111', now(), now()),
        ('e8733826-3d4e-47b2-9b49-77b8fce09761', 'Firma', 'Admin', 'compadmin@example.com', '${compAdminPassword}', 'company_admin', true, '22222222-2222-2222-2222-222222222222', now(), now()),
        ('4c3f905d-1f9e-4061-8b4e-353f38550b48', 'Normal', 'Kullanıcı', 'user@example.com', '${userPassword}', 'user', true, '22222222-2222-2222-2222-222222222222', now(), now());

      -- Sensörler
      INSERT INTO sensors (id, name, description, type, "isActive", "isPublic", location, metadata, "companyId", "mqttTopic", "createdAt", "updatedAt")
      VALUES 
        ('a65bcb8e-caf3-4a25-8725-f47b723bd2c2', 'Sıcaklık Sensörü', 'Ofis sıcaklık sensörü', 'temperature', true, true, 'Ofis A', '{}', '22222222-2222-2222-2222-222222222222', 'sensors/temp-sensor-1', now(), now()),
        ('b21dc5a0-c00a-42a0-857f-aaaabababab1', 'Nem Sensörü', 'Depo nem sensörü', 'humidity', true, true, 'Depo B', '{}', '22222222-2222-2222-2222-222222222222', 'sensors/humidity-sensor-1', now(), now()),
        ('c42fe1a0-d123-4b00-9432-cccccccccc12', 'Işık Sensörü', 'Koridor ışık sensörü', 'light', true, true, 'Koridor C', '{}', '22222222-2222-2222-2222-222222222222', 'sensors/light-sensor-1', now(), now()),
        ('d7e9f12b-a354-4f98-b31c-ae6708c45d33', 'İnaktif Sensör', 'İnaktif Sensör S1', 'temperature', false, true, 'İnaktif C', '{}', '22222222-2222-2222-2222-222222222222', 'sensors/light-sensor-1', now(), now());

    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      TRUNCATE TABLE user_activities CASCADE;
      TRUNCATE TABLE sensors CASCADE;
      TRUNCATE TABLE users CASCADE;
      TRUNCATE TABLE companies CASCADE;
    `);
  }
}
