import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedInitialData1743418981757 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM sensors WHERE "sensorId" = 'temp-sensor-1';
            DELETE FROM users WHERE email IN ('sysadmin@example.com', 'compadmin@example.com', 'user@example.com');
            DELETE FROM companies WHERE code = 'DEMO01';
            
            INSERT INTO companies (id, name, description, code, "isActive", "createdAt", "updatedAt")
            VALUES (
                '915cc224-f513-48fd-8ac4-b3454193bc72',
                'Demo Şirket',
                'Demo açıklaması',
                'DEMO01',
                true,
                now(),
                now()
            );
            
            INSERT INTO users (id, "firstName", "lastName", email, password, role, "isActive", "companyId", "createdAt", "updatedAt")
            VALUES 
                ('2ff0dfb2-93c3-473e-8f3c-a4a8e5498d6c', 'Sistem', 'Admin', 'sysadmin@example.com', '1234', 'system_admin', true, '915cc224-f513-48fd-8ac4-b3454193bc72', now(), now()),
                ('e8733826-3d4e-47b2-9b49-77b8fce09761', 'Firma', 'Admin', 'compadmin@example.com', '1234', 'company_admin', true, '915cc224-f513-48fd-8ac4-b3454193bc72', now(), now()),
                ('4c3f905d-1f9e-4061-8b4e-353f38550b48', 'Normal', 'Kullanıcı', 'user@example.com', '1234', 'user', true, '915cc224-f513-48fd-8ac4-b3454193bc72', now(), now());
            
            INSERT INTO sensors (id, "sensorId", name, description, type, "isActive", location, metadata, "companyId", "mqttTopic", "createdAt", "updatedAt")
            VALUES (
                'a65bcb8e-caf3-4a25-8725-f47b723bd2c2',
                'temp-sensor-1',
                'Sıcaklık Sensörü',
                'Ofis sıcaklık sensörü',
                'temperature',
                true,
                'Ofis A',
                '{}',
                '915cc224-f513-48fd-8ac4-b3454193bc72',
                'sensors/temp-sensor-1',
                now(),
                now()
            );
        `);
    }

    // down metodu da aynı şekilde düzenlenebilir
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM sensors WHERE "sensorId" = 'temp-sensor-1';
            DELETE FROM users WHERE email IN ('sysadmin@example.com', 'compadmin@example.com', 'user@example.com');
            DELETE FROM companies WHERE code = 'DEMO01';
        `);
    }
}