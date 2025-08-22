import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import Role from './enum/role.enum';

@Entity({ name: 'users' })
export default class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  fullname!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  password!: string;

  @Column({ type: 'date', nullable: true })
  dob!: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avt!: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role!: Role;

  @Column({ type: 'boolean', default: true })
  status!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  refreshToken!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
