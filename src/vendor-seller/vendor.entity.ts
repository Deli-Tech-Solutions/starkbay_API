import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';
import { VendorCommission } from './vendor-commission.entity';
import { VendorPerformance } from './vendor-performance.entity';

export enum VendorStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export enum BusinessType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  PARTNERSHIP = 'partnership'
}

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  businessName: string;

  @Column()
  contactPerson: string;

  @Column()
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: BusinessType, default: BusinessType.INDIVIDUAL })
  businessType: BusinessType;

  @Column({ nullable: true })
  businessRegistrationNumber: string;

  @Column({ nullable: true })
  taxId: string;

  @Column({ type: 'json', nullable: true })
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Column({ type: 'json', nullable: true })
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber: string;
  };

  @Column({ type: 'enum', enum: VendorStatus, default: VendorStatus.PENDING })
  status: VendorStatus;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ type: 'json', nullable: true })
  socialLinks: {
    website?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };

  @Column({ type: 'json', nullable: true })
  verificationDocuments: {
    businessLicense?: string;
    taxCertificate?: string;
    identityDocument?: string;
  };

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Product, product => product.vendor)
  products: Product[];

  @OneToOne(() => VendorCommission, commission => commission.vendor, { cascade: true })
  commission: VendorCommission;

  @OneToOne(() => VendorPerformance, performance => performance.vendor, { cascade: true })
  performance: VendorPerformance;
}
