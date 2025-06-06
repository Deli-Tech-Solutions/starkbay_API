import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
    Index,
    BeforeInsert,
    BeforeUpdate,
  } from 'typeorm';
  import { IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
  
  @Entity('categories')
  @Index(['slug'], { unique: true })
  @Index(['parentId'])
  @Index(['status'])
  export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 255 })
    @IsNotEmpty()
    @MaxLength(255)
    name: string;
  
    @Column({ type: 'varchar', length: 255, unique: true })
    slug: string;
  
    @Column({ type: 'text', nullable: true })
    @IsOptional()
    description?: string;
  
    @Column({ type: 'varchar', length: 500, nullable: true })
    @IsOptional()
    imageUrl?: string;
  
    @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
    status: 'active' | 'inactive';
  
    @Column({ type: 'int', default: 0 })
    sortOrder: number;
  
    @Column({ type: 'text', nullable: true })
    path?: string; // Materialized path for efficient queries
  
    @Column({ type: 'int', default: 0 })
    level: number;
  
    // Self-referencing relationship
    @Column({ type: 'uuid', nullable: true })
    parentId?: string;
  
    @ManyToOne(() => Category, (category) => category.children, {
      onDelete: 'CASCADE',
      nullable: true,
    })
    @JoinColumn({ name: 'parentId' })
    parent?: Category;
  
    @OneToMany(() => Category, (category) => category.parent, {
      cascade: true,
    })
    children: Category[];
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    @BeforeInsert()
    @BeforeUpdate()
    generateSlug() {
      if (this.name && !this.slug) {
        this.slug = this.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }
    }
  }
  