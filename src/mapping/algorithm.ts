import "reflect-metadata";

import AppDataSource from "../config";
import User from "../entities/user";

interface CadetInfo {
    user_id: string;
    distance: number;
    coordinates: string;
}

interface City {
    name: string;
    country: string;
    featureCode: string;
    adminCode: string;
    population: number;
    lat: number;
    lon: number;
}

const deg2rad = (degrees: any) => {// converts degree into radian
    return degrees * (Math.PI / 180);
};

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

const distancesFromUser = (user: User, cadets: CadetInfo[], cadets5km: string[], cadets10km: string[], cadetsmore: string[]) => {
    // calculates distance between user and given set of cadets
    // let shortestDistance = Number.MAX_SAFE_INTEGER;

    for (var i = 0; i < cadets.length; i++) {
        let user_lat = JSON.parse(user.coordinates).latitude;
        let user_long = JSON.parse(user.coordinates).longitude;
        let cadet_lat = JSON.parse(cadets[i].coordinates).latitude;
        let cadet_long = JSON.parse(cadets[i].coordinates).longitude;
        let dist = parseFloat(calculateDistance(user_lat, user_long, cadet_lat, cadet_long));

        cadets[i].distance = dist;
        if (dist <= 5) {
            cadets5km.push(cadets[i].user_id);
        } else if (dist <= 10) {
            cadets10km.push(cadets[i].user_id)
        } else {
            cadetsmore.push(cadets[i].user_id)
        }
    }

    return cadets;
}

const FindandMapCadets = async (req: any, res: any, next: any) => {
    console.log(`in FindandMapCadets`)
    const userRepo = AppDataSource.getRepository(User)

    const user = await userRepo.findOne({
        where: {
            user_id: req.user_id
        },
        select: ["user_id", "coordinates"]
    });

    if (!user?.user_id) {
        return res.status(404).json({ message: "User not found" })
    }

    try {
        let cadets5km: string[] = [];
        let cadets10km: string[] = [];
        let cadetsmore: string[] = [];

        // list of cadets nearby city-wise
        let cadetsList: CadetInfo[][] = []

        // list of ccadets in a city
        let cadets: CadetInfo[] = [];

        // cadets in the same city as user's.
        let cadetsClosest: CadetInfo[] = []

        // fetching cadets data in the same city as the user
        cadetsClosest = await userRepo.find({
            where: {
                city: user.city,
                role: 'cadet'
            },
            select: ["user_id", "distance", "coordinates"]
        });

        if (cadetsClosest) {
            cadetsList.push(cadetsClosest);
            distancesFromUser(user, cadetsClosest, cadets5km, cadets10km, cadetsmore)
        }

        // if no cadets in same city as user's, serarching cadets in nearby cities.

        // fetching nearby cities list.
        let latitude = JSON.parse(user.coordinates).latitude;
        let longitude = JSON.parse(user.coordinates).longitude;
        const url = `https://nearby-cities.netlify.app/.netlify/functions/search?latitude=${latitude}&longitude=${longitude}`;

        // list of nearby cities to users
        let nearbyCities: City[] = []
        try {
            const response = await fetch(url);
            const result = await response.json();

            nearbyCities = result;
        } catch (error) {
            console.error('Error fetching nearby cities:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // no nearby city data available
        if (!nearbyCities) {
            return res.status(404).json({ error: "no nearby cities data available" })
        }

        // maximum number of nearby cities to be searched for cadets.
        let maxSearches = 10;
        let foundEnoughData = false;

        let index = 0;

        while (!foundEnoughData && nearbyCities.length >= maxSearches) {
            while (index <= maxSearches) {
                cadets = await userRepo.find({
                    where: { city: nearbyCities[index].name }
                });

                if (cadets) {
                    cadetsList.push(cadets);
                    distancesFromUser(user, cadets, cadets5km, cadets10km, cadetsmore)
                }

                index++;
            }

            if (!cadetsList) {
                maxSearches += 10;
            } else {
                foundEnoughData = true;
            }
        }

        // enough cadets are found till this line of code.
        if (cadetsList.length == 0) {
            // we can fetch more cities list but for now it is giving 100 cities data, and i think that would be enough, if not we can choose a location may be at the fatherst city in the current list and fetch nearby-cities from that location.
            return res.status(404).json({ error: `No Cadets found in nearby ${nearbyCities.length} cities` });
        }

        req.data = {
            user_id: req.user_id,
            cadet_ids: [
                cadetsList[0],
                cadetsList[1],
                cadetsList[2],
                cadetsList[3],
                cadetsList[4]
            ],
            cadets: [
                cadets5km,
                cadets10km,
                cadetsmore
            ]
        };

        console.log((cadets5km).toString())

        next();
    } catch (error) {
        return console.error(`error ${error}`)
    }
}

export default FindandMapCadets
