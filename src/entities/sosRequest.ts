import { Entity, PrimaryGeneratedColumn, Column,CreateDateColumn ,UpdateDateColumn, Timestamp} from "typeorm";

@Entity({ name: "SOSRequestInfo" })
export class SOSRequestInfo {
  @PrimaryGeneratedColumn("uuid")
  sosRequest_ID: string;

  @Column()
  userID: string;

  @Column({default:"NONE"})
  cadetID: string;

  @Column({default:"URGENT HELP REQUIRED"})
  userMessage: string;

  @Column({default:false})
  isAccepted: boolean;

  @Column()
  createdAt: string;

  @Column({default:0})
  acceptedAt: string;
}

export default SOSRequestInfo;