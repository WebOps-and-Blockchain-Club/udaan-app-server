import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "Otp" })
export class Otp {
  @PrimaryGeneratedColumn()
  opt_id: number;
  
  @Column()
  user_id: string;

  @Column()
  otp: string;

  @Column()
  createdAt: number;

  @Column()
  expiresAt: number;
}

export default Otp;
