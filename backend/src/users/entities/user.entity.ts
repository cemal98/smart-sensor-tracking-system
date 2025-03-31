import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
  } from 'typeorm';
  import { Company } from '../../companies/entities/company.entity';
  import { UserActivity } from '../../user-activity/entities/user-activity.entity';
  import { Exclude } from 'class-transformer';
  
  export enum UserRole {
    SYSTEM_ADMIN = 'system_admin',
    COMPANY_ADMIN = 'company_admin',
    USER = 'user',
  }
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ length: 100 })
    firstName: string;
  
    @Column({ length: 100 })
    lastName: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column()
    @Exclude()
    password: string;
  
    @Column({
      type: 'enum',
      enum: UserRole,
      default: UserRole.USER,
    })
    role: UserRole;
  
    @Column({ default: true })
    isActive: boolean;
  
    @ManyToOne(() => Company, company => company.users, { nullable: true })
    @JoinColumn({ name: 'companyId' })
    company: Company;
  
    @Column({ nullable: true })
    companyId: string;
  
    @OneToMany(() => UserActivity, activity => activity.user)
    activities: UserActivity[];
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    // Virtual field for full name
    get fullName(): string {
      return `${this.firstName} ${this.lastName}`;
    }
  
    // Helper method to determine if user is System Admin
    isSystemAdmin(): boolean {
      return this.role === UserRole.SYSTEM_ADMIN;
    }
  
    // Helper method to determine if user is Company Admin
    isCompanyAdmin(): boolean {
      return this.role === UserRole.COMPANY_ADMIN;
    }
  }