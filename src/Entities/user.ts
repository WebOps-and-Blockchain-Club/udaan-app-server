import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "User" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  user_id: string;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  coordinates: string;

  @Column()
  state: string;

  @Column()
  role: string

  @Column('boolean', { default: true })
  isAvailable: boolean

  @Column('boolean', { default: false })
  verified: boolean

  @Column()
  city: string;

  @Column()
  fcmToken: string;
}

export default User;