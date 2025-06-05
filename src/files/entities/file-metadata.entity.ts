import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity'; 

@Entity({ name: 'file_metadata' })
export class FileMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  filename: string;      

  @Column()
  originalName: string; 

  @Column()
  mimeType: string;      

  @Column({ type: 'int' })
  size: number;         

  @CreateDateColumn()
  uploadDate: Date;

  @Column()
  url: string;           // Publicly accessible URL or path

  @ManyToOne(() => User, (user) => user.files, { onDelete: 'CASCADE' })
  owner: User;

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedType?: string;  // e.g. “Project”, “Post”

  @Column({ type: 'varchar', length: 36, nullable: true })
  relatedId?: string;    // ID of the related entity
}
