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

    @Column('boolean',{default:true})
    isAvailable: boolean

    @Column('boolean',{default:false})
    verified:boolean

    @Column()
    role: string
}

export default Cadet;