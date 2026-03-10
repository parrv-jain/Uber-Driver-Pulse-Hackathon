package com.uber.strategy;

import com.uber.models.MotionData;
import com.uber.models.Ride;
import com.uber.models.SensorReading;
import com.uber.models.StressSnapshot;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Computes a ride-level motion score in [0.0, 1.0] using the event-rate
 * methodology described in:
 *   Stavrakaki et al. (2020) "Estimating the Necessary Amount of Driving Data
 *   for Assessing Driving Behavior", Sensors 20(9), 2600.
 *
 * Algorithm
 * ---------
 * 1. Walk every SensorReading (assumed 1 Hz) in the ride.
 * 2. Detect discrete HA (harsh acceleration) and HB (harsh braking / cornering)
 *    events using the same axis thresholds already defined in StressScoreService,
 *    with a 3-reading cooldown to avoid counting one physical event multiple times.
 * 3. Accumulate total distance from speed (km/h × 1 s = km/3600).
 * 4. Compute per-km event rates:
 *      HA_rate = haCount  / totalDistanceKm
 *      HB_rate = hbCount  / totalDistanceKm
 * 5. Normalise each rate into [0, 1] using the aggressiveness thresholds from
 *    Table 2 of the paper (cautious → 0, aggressive → 1).
 * 6. Return the weighted average of the two normalised scores.
 *    HA weight 0.45 / HB weight 0.55 — braking events are slightly more
 *    safety-critical per the paper's convergence findings (Table 3).
 */
@Service
public class RideMotionScore {
    // ── Event-detection thresholds (mirrors StressScoreService) ──────────────
    /** Minimum |acc_x| (m/s²) to open a Harsh Acceleration event (forward axis). */
    private static final double HA_THRESHOLD = 2.0;   // 0.20 G

    /** Minimum |acc_x| or |acc_y| (m/s²) to open a Harsh Braking / cornering event. */
    private static final double HB_THRESHOLD = 3.0;   // 0.30 G

    private static final double SPEED_THRESHOLD = 60.0;

    /** Readings to skip after an event is registered (1 Hz → 3 seconds). */
    private static final int EVENT_COOLDOWN_READINGS = 3;

    // ── Normalisation bounds from the paper (Table 2) ────────────────────────
    /** HA rate (events/km): below this → score 0.0 (cautious). */
    private static final double HA_CAUTIOUS   = 0.11;
    /** HA rate (events/km): above this → score 1.0 (aggressive). */
    private static final double HA_AGGRESSIVE = 0.23;

    /** HB rate (events/km): below this → score 0.0 (cautious). */
    private static final double HB_CAUTIOUS   = 0.01;
    /** HB rate (events/km): above this → score 1.0 (aggressive). */
    private static final double HB_AGGRESSIVE = 0.12;

    private static final double SPEED_CAUTIOUS = 0.05;
    private static final double SPEED_AGGRESSIVE = 0.15;

    // ── Combination weights ───────────────────────────────────────────────────
    private static final double HA_WEIGHT = 0.30;
    private static final double HB_WEIGHT = 0.40;
    private static final double SPEED_WEIGHT = 0.30;

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns a ride-level motion score in [0.0, 1.0].
     * 0.0 = perfectly smooth / cautious driver.
     * 1.0 = maximally harsh / aggressive driver.
     *
     * Returns 0.0 if the ride has no sensor readings or zero distance travelled.
     */
    public double calculate(Ride ride) {

        List<SensorReading> readings = ride.getSensorReadings();
        if (readings == null || readings.isEmpty()) {
            System.out.println("[RideMotionScoreCalculator] No sensor readings for ride " + ride.getId());
            return 0.0;
        }

        int    haCount          = 0;
        int    hbCount          = 0;
        int overSpeedCount = 0;
        double totalDistanceKm  = ride.getRequest().getEstimatedDistance();
        int    haCooldown       = 0;   // readings remaining before next HA can be counted
        int    hbCooldown       = 0;   // readings remaining before next HB can be counted

        for (SensorReading reading : readings) {

            MotionData m = reading.getMotionData();
            // ── Decrement cooldown counters ───────────────────────────────────
            if (haCooldown > 0) haCooldown--;
            if (hbCooldown > 0) hbCooldown--;

            double acc_x = m.getAcc_x();
            double acc_y = m.getAcc_y();

            // ── Harsh Acceleration detection (positive forward axis) ──────────
            // An HA event fires when the forward component (acc_x) is positive
            // and exceeds the threshold, OR the lateral component is also positive
            // and exceeds the threshold.
            if (haCooldown == 0 && isHarshAcceleration(acc_x, acc_y)) {
                haCount++;
                haCooldown = EVENT_COOLDOWN_READINGS;
            }

            // ── Harsh Braking / cornering detection ───────────────────────────
            // A HB event fires on strong negative acc_x (braking) OR strong
            // lateral acc_y regardless of sign (cornering).  Per the paper,
            // harsh cornering is grouped with HB events.
            if (hbCooldown == 0 && isHarshBraking(acc_x, acc_y)) {
                hbCount++;
                hbCooldown = EVENT_COOLDOWN_READINGS;
            }

            // Overspeeding
            if(m.getSpeed() > SPEED_THRESHOLD) {
                overSpeedCount++;
            }
        }

        if (totalDistanceKm == 0.0) {
            System.out.println("[RideMotionScoreCalculator] Zero distance for ride " + ride.getId());
            return 0.0;
        }

        double haRate = haCount / totalDistanceKm;   // events / km
        double hbRate = hbCount / totalDistanceKm;
        double overSpeedRate = (double) overSpeedCount / readings.size();

        double haScore = normalise(haRate, HA_CAUTIOUS, HA_AGGRESSIVE);
        double hbScore = normalise(hbRate, HB_CAUTIOUS, HB_AGGRESSIVE);
        double speedScore = normalise(overSpeedRate, SPEED_CAUTIOUS, SPEED_AGGRESSIVE);

        double motionScore = (HA_WEIGHT * haScore) + (HB_WEIGHT * hbScore) + (SPEED_WEIGHT * speedScore);

        System.out.printf(
                "[RideMotionScoreCalculator] Ride %s | dist=%.2f km | " +
                        "HA=%d (%.3f/km → %.2f) | HB=%d (%.3f/km → %.2f) | motionScore=%.3f%n",
                ride.getId(), totalDistanceKm,
                haCount, haRate, haScore,
                hbCount, hbRate, hbScore,
                motionScore);

        return motionScore;
    }

    // ── Private helpers ───────────────────────────────────────────────────────
    private boolean isHarshAcceleration(double acc_x, double acc_y) {
        return (acc_x >= HA_THRESHOLD) || (acc_y >= HA_THRESHOLD);
    }
    private boolean isHarshBraking(double acc_x, double acc_y) {
        return (acc_x <= -HB_THRESHOLD) || (Math.abs(acc_y) >= HB_THRESHOLD);
    }

    /**
     * Linear normalisation.
     *   value ≤ cautiousThreshold  → 0.0
     *   value ≥ aggressiveThreshold → 1.0
     */
    private double normalise(double value, double cautiousThreshold, double aggressiveThreshold) {
        if (value <= cautiousThreshold)   return 0.0;
        if (value >= aggressiveThreshold) return 1.0;
        return (value - cautiousThreshold) / (aggressiveThreshold - cautiousThreshold);
    }
}