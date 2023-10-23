import { Entity ,Column, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "Otp" })
export class Otp {
  @PrimaryGeneratedColumn("uuid")
  user_id: string;

  @Column()
  otp: string;

  @Column()
  createdAt: number;

  @Column()
  expiresAt: number;
}

export default Otp;
