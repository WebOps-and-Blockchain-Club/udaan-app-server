import { Entity, Column, CreateDateColumn } from "typeorm";

@Entity({ name: "Otp" })
export class Otp {
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
