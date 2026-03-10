package com.uber.service;

import com.uber.enums.PaceStatus;
import com.uber.enums.RideStatus;
import com.uber.models.Driver;
import com.uber.models.EarningVelocity;
import com.uber.models.Shift;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class EarningVelocityService {

    private final CsvLogger csvLogger;

    public EarningVelocityService(CsvLogger csvLogger) {
        this.csvLogger = csvLogger;
    }

    public EarningVelocity calculate(Driver driver, Shift shift, LocalDateTime currentTimestamp) {
        double earned = driver.getTotalEarned(currentTimestamp);
        double target = driver.getEarningGoal().getTargetAmount();
        double hoursWorked = shift.getHoursWorked();
        double hoursLeft = shift.getHoursRemaining();

        double currentVelocity  = (hoursWorked > 0) ? earned / hoursWorked  : 0.0;
        double requiredVelocity = (hoursLeft > 0) ? (target - earned) / hoursLeft : Double.MAX_VALUE;

        PaceStatus paceStatus = derivePaceStatus(currentVelocity, requiredVelocity);
        EarningVelocity ev = new EarningVelocity(currentVelocity, requiredVelocity, paceStatus);

        driver.getEarningGoal().setEarningVelocity(ev);
        csvLogger.logEarningVelocity(ev, driver, driver.getCurrentShift());
        System.out.println("[EarningVelocityService] " + ev.getSummary());
        return ev;
    }

    public double getProjectedEarnings(Driver driver, Shift shift, LocalDateTime currentTimestamp) {
        double hoursWorked = shift.getHoursWorked();
        double totalShiftHours = shift.getTotalShiftHours();
        if (hoursWorked == 0) return 0.0;
        double currentVelocity = driver.getTotalEarned(currentTimestamp) / hoursWorked;
        return currentVelocity * totalShiftHours;
    }

    private PaceStatus derivePaceStatus(double current, double required) {
        if (required <= 0 || required == Double.MAX_VALUE) return PaceStatus.CRITICAL;
        double ratio = current / required;
        if(ratio > 1.10) return PaceStatus.AHEAD;
        else if (ratio > 0.90) return PaceStatus.ON_TRACK;
        else if (ratio > 0.70) return PaceStatus.BEHIND;
        else return PaceStatus.CRITICAL;
    }
}