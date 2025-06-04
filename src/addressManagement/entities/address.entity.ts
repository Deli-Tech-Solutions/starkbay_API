import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsEmail, IsOptional, IsString, IsBoolean, IsEnum, IsPhoneNumber, Length, Matches } from 'class-validator';

export enum AddressType {
  BILLING = 'billing',
  SHIPPING = 'shipping',
  BOTH = 'both'
}

export enum CountryCode {
  US = 'US',
  CA = 'CA',
  GB = 'GB',
  DE = 'DE',
  FR = 'FR',
  AU = 'AU',
  JP = 'JP',
  // Add more as needed
}

@Entity('addresses')
@Index(['userId', 'type'])
@Index(['userId', 'isDefault'])
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'enum', enum: AddressType })
  @IsEnum(AddressType)
  type: AddressType;

  @Column({ name: 'is_default', default: false })
  @IsBoolean()
  isDefault: boolean;

  @Column({ name: 'first_name' })
  @IsString()
  @Length(1, 50)
  firstName: string;

  @Column({ name: 'last_name' })
  @IsString()
  @Length(1, 50)
  lastName: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  company?: string;

  @Column({ name: 'address_line_1' })
  @IsString()
  @Length(1, 255)
  addressLine1: string;

  @Column({ name: 'address_line_2', nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  addressLine2?: string;

  @Column()
  @IsString()
  @Length(1, 100)
  city: string;

  @Column({ name: 'state_province' })
  @IsString()
  @Length(1, 100)
  stateProvince: string;

  @Column({ name: 'postal_code' })
  @IsString()
  @Length(1, 20)
  postalCode: string;

  @Column({ type: 'enum', enum: CountryCode })
  @IsEnum(CountryCode)
  country: CountryCode;

  @Column({ name: 'phone_number', nullable: true })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column({ name: 'formatted_address', nullable: true, type: 'text' })
  formattedAddress?: string;

  @Column({ name: 'address_nickname', nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  nickname?: string;

  @Column({ name: 'delivery_instructions', nullable: true, type: 'text' })
  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get fullAddress(): string {
    const parts = [
      this.addressLine1,
      this.addressLine2,
      this.city,
      this.stateProvince,
      this.postalCode,
      this.country
    ].filter(Boolean);
    return parts.join(', ');
  }
}