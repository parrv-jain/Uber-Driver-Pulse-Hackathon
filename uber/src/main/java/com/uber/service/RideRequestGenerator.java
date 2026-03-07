package com.uber.service;

import com.uber.models.Location;
import com.uber.models.RideRequest;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class RideRequestGenerator {

    // Mumbai locations with example coordinates of Mumbai
    private static final Object[][] MUMBAI_LOCATIONS = {
            { 19.0596, 72.8295, "Bandra West" },
            { 19.2183, 72.9781, "Thane" },
            { 19.0760, 72.8777, "Dadar" },
            { 19.1136, 72.8697, "Andheri East" },
            { 19.2288, 72.8580, "Borivali" },
            { 19.0728, 72.9000, "Kurla" },
            { 19.0522, 72.9005, "Chembur" },
            { 19.1670, 72.9370, "Mulund" },
            { 19.1176, 72.9060, "Powai" },
            { 19.1075, 72.8263, "Juhu" },
            { 18.9067, 72.8147, "Colaba" },
            { 19.0177, 72.8188, "Worli" },
            { 19.1663, 72.8526, "Goregaon" },
            { 19.1865, 72.8486, "Malad" },
            { 19.2052, 72.8564, "Kandivali" }
    };


    public static List<RideRequest> generate() {
        Random random = new Random();
        int count = 6 + random.nextInt(5); // 6 to 10 rides
        List<RideRequest> requests = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            // Pick distinct pickup and dropoff
            int pickupIdx = random.nextInt(MUMBAI_LOCATIONS.length);
            int dropoffIdx;
            do {
                dropoffIdx = random.nextInt(MUMBAI_LOCATIONS.length);
            } while (dropoffIdx == pickupIdx);

            Object[] p = MUMBAI_LOCATIONS[pickupIdx];
            Object[] d = MUMBAI_LOCATIONS[dropoffIdx];

            Location pickup  = new Location((double) p[0], (double) p[1], (String) p[2]);
            Location dropoff = new Location((double) d[0], (double) d[1], (String) d[2]);

            double distanceKm = Math.round(pickup.distanceTo(dropoff) * 10.0) / 10.0; // real distance
            int durationMinutes = (int) (distanceKm * 2.5) + random.nextInt(10);       // rough estimate + traffic noise
            double fare = Math.round((distanceKm * 11 + durationMinutes * 1.5) * 10.0) / 10.0; // fare calculation algorithm
            requests.add(new RideRequest(pickup, dropoff, fare, distanceKm, durationMinutes));
        }
        return requests;
    }
}