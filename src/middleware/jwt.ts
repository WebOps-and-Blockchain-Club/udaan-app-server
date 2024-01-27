import jwt, { JwtPayload } from "jsonwebtoken";

const fetchuser = async (req: any, res: any, next: any) => {
    console.log(`in fetchuser`)
    const jwt_secret = process.env.TOKEN_SECRET!;
    const token = req.headers['auth-token'];
    console.log(`auth-token: ${token}`)

    if (!token) {
        return res.status(401).json({ error: "user is not authenticated" });
    }

    try {
        console.log("user is authenticated")
        const payload: JwtPayload = jwt.verify(token, jwt_secret) as JwtPayload;
        console.log(`payload: ${payload}`)
        req.user_id = payload.id;
        console.log(`req.user_id ${req.user_id}`)
        next();
    } catch (error) {
        res.status(500).json({error: error });
    }
};

export default fetchuser;
