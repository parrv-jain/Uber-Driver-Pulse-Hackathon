package com.uber.service;

import com.uber.enums.PaceStatus;
import com.uber.models.Driver;
import com.uber.models.EarningVelocity;
import com.uber.models.Shift;

public class EarningVelocityService {

    // Called at regular intervals to recalculate pace
    public EarningVelocity calculate(Driver driver, Shift shift) { // main function for calculation of earningvelo
        double earned = driver.getTotalEarned();
        double target = driver.getEarningGoal().getTargetAmount();
        double hoursWorked = shift.getHoursWorked();
        double hoursLeft = shift.getHoursRemaining();

        // Avoid division by zero
        double currentVelocity  = (hoursWorked > 0) ? earned / hoursWorked  : 0.0;
        double requiredVelocity = (hoursLeft > 0) ? (target - earned) / hoursLeft : Double.MAX_VALUE; // FrontEnd mein Double.MAX_VALUE ka dekhna padega

        PaceStatus paceStatus = derivePaceStatus(currentVelocity, requiredVelocity);
        EarningVelocity ev = new EarningVelocity(currentVelocity, requiredVelocity, paceStatus);

        // Update the goal's velocity snapshot
        driver.getEarningGoal().setEarningVelocity(ev);

        System.out.println("[EarningVelocityService] " + ev.getSummary());
        return ev;
    }

    // Projected earnings if current pace continues until end of shift
    public double getProjectedEarnings(Driver driver, Shift shift) {
        double hoursWorked = shift.getHoursWorked();
        double totalShiftHours = shift.getTotalShiftHours();
        if (hoursWorked == 0) return 0.0;
        double currentVelocity = driver.getTotalEarned() / hoursWorked;
        return currentVelocity * totalShiftHours;
    }

    // Ratio of current to required velocity determines pace status
    private PaceStatus derivePaceStatus(double current, double required) {
        if (required <= 0 || required == Double.MAX_VALUE) return PaceStatus.CRITICAL;
        double ratio = current / required;
        if(ratio > 1.10) return PaceStatus.AHEAD;
        else if (ratio > 0.90) return PaceStatus.ON_TRACK;
        else if (ratio > 0.70) return PaceStatus.BEHIND;
        else return PaceStatus.CRITICAL;
    }
}
