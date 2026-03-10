package com.uber.models;

import com.uber.enums.PaceStatus;
import java.time.LocalDateTime;

public class EarningVelocity {

    private final double        currentVelocity;   // ₹ earned per hour so far
    private final double        requiredVelocity;  // ₹ per hour needed to hit goal
    private final double        velocityDelta;
    private final PaceStatus    paceStatus;
    private final LocalDateTime timestamp;

    public EarningVelocity(double currentVelocity,
                           double requiredVelocity,
                           PaceStatus paceStatus) {
        this.currentVelocity   = currentVelocity;
        this.requiredVelocity  = requiredVelocity;
        this.velocityDelta    = currentVelocity - requiredVelocity;
        this.paceStatus        = paceStatus;
        this.timestamp         = LocalDateTime.now();
    }

    public String getSummary() {
        return String.format(
            "Pace: %s | Current: ₹%.0f/hr | Required: ₹%.0f/hr",
            paceStatus, currentVelocity, requiredVelocity
        );
    }

    public double        getCurrentVelocity()   { return currentVelocity; }
    public double        getRequiredVelocity()  { return requiredVelocity; }
    public PaceStatus    getPaceStatus()        { return paceStatus; }
    public LocalDateTime getTimestamp()         { return timestamp; }
    public double        getVelocityDelta()    { return velocityDelta; }
}
