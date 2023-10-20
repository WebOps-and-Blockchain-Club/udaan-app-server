import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "User" })
class User {
    @PrimaryGeneratedColumn("uuid")
    user_id: string;

    @Column()
    username: string;

    @Column()
    email: string;

    @Column()
    password: string;
}

export default User;