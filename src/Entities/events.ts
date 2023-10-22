import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "Events" })
export class Events {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 200 })
  title: string;

  @Column()
  description: string;

  @Column("timestamp with time zone") // Use 'timestamp with time zone' for PostgreSQL
  date: Date;

  @Column("varchar", { length: 200 })
  location: string;

  @Column("varchar", { length: 200 })
  registrationlink: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}