import axios from 'axios';

import "reflect-metadata";
import AppDataSource from "../config";

import User from "../entities/user";

const calculateDistance = (lat1: any, lon1: any, lat2: any, lon2: any) => {// calculating the distance between two locations
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =// just math
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance.toFixed(2); // Distance rounded to 2 decimal places
};

const deg2rad = (degrees: any) => {// converts degree into radian
    return degrees * (Math.PI / 180);
};

const nearestCadet = (user: User, cadets: any) => {
    let shortestDistance = Number.MAX_SAFE_INTEGER;

    for (var i = 0; i < cadets.length; i++) {
        let user_lat = JSON.parse(user.coordinates).latitude;
        let user_long = JSON.parse(user.coordinates).longitude;
        let cadet_lat = JSON.parse(cadets[i].coordinates).latitude;
        let cadet_long = JSON.parse(cadets[i].coordinates).longitude;
        let dist = parseFloat(calculateDistance(user_lat, user_long, cadet_lat, cadet_long));

        if (dist < shortestDistance) {
            shortestDistance = dist;
        }
        cadets[i].distance = dist;
    }
    // cadets.sort()
    return cadets;
}

const getCadetUserId = async (req: any, res: any) => {
    const userRepo = AppDataSource.getRepository(User)
    const userId = req.params.userId;
    const user = await userRepo.findOne({
        where: { user_id: userId }
    });

    if (user) {
        let cadets: any = [];

        const cadetRepo = AppDataSource.getRepository(User);
        cadets = await cadetRepo.find({
            where: { 
                city: user.city,
                role: 'cadet'
            }
        });
        
        if(cadets.length == 0){
            console.log("no cadets in your city, searching in nearby cities")
            let latitude = JSON.parse(user.coordinates).latitude;
            let longitude = JSON.parse(user.coordinates).longitude;
            const url = `https://nearby-cities.netlify.app/.netlify/functions/search?latitude=${latitude}&longitude=${longitude}`;

            let nearbyCities:any = []
            try {
                const response = await axios.get(url);
                nearbyCities = response.data;
                console.log((nearbyCities.length > 0) ? nearbyCities.length : undefined);
            } catch (error) {
                console.error('Error fetching nearby cities:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            if (nearbyCities.length === 0) {
                return res.status(404).json({ error: 'No cadets in your nearby cities.' });
            }

            let i = 0;
            let maxIterations = 10;

            while (cadets.length == 0 && i <= maxIterations) {
                console.log(i,cadets.length)
                console.log(nearbyCities[i].name)
                cadets = await cadetRepo.find({
                    where: { city: nearbyCities[i].name }
                });

                i++;

                if (cadets) break;
            }
            
            if(cadets.length == 0){
                return res.status(404).json({ error: 'No Cadets found near your region.' });
            }
        }

        const nearestCadets = await nearestCadet(user as User, cadets)

        let firstBatch: any = []
        let secondBatch: any = []
        let thirdBatch: any = []
        
        for (let i = 0; i < nearestCadets.length; i++) {
            if (nearestCadets[i].distance <= 5) {
                firstBatch.push(nearestCadets[i].cadet_id)
            } else if (nearestCadets[i].distance > 5 && (nearestCadets[i].distance <= 10)) {
                secondBatch.push(nearestCadets[i].cadet_id)
            } else {
                thirdBatch.push(nearestCadets[i].cadet_id)
            }
        }

        res.send({
            user: userId,
            cadet_ids: {
                "5km": firstBatch,
                "10km": secondBatch,
                "more": thirdBatch
            }
        })
    }
}

// const addCadet = async (req: any, res: any) => {
//     const cadetRepo = AppDataSource.getRepository(User)
//     let newCadet = { ...req.body }
//     newCadet.isAvailable = true
//     newCadet.coordinates = req.body.coordinates
//     let cadetInserted = await cadetRepo.save(newCadet)
//     res.send(cadetInserted)
// }

// const addUser = async (req: any, res: any) => {
//     const userRepo = AppDataSource.getRepository(User)
//     let newUser = { ...req.body }
//     let userInserted = await userRepo.save(newUser)
//     res.send(userInserted)
// }



export const controller = {
    getCadetUserId,
    // addCadet,
    // addUser,
};