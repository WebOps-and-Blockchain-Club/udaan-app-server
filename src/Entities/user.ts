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

    @Column('boolean',{default:false})
    varified:boolean;

    @Column()
    coordinates: string;
    
    @Column()
    state: string

    @Column()
    city: string
}

export default User;