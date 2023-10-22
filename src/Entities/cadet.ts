import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "Cadets" })
export class Cadet {
    @PrimaryGeneratedColumn("uuid")
    cadet_id: string;

    @Column()
    username: string;

    @Column()
    email: string;

    @Column()
    password: string;

    @Column()
    coordinates: string;

    @Column()
    state: string

    @Column()
    city: string
}

export default Cadet;