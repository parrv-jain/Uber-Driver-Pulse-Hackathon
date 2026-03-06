package com.uber.models;

// The status of the goal after each trip
public class EarningGoal {

    private final double targetAmount;
    private double currentEarned;
    private EarningVelocity earningVelocity; // updated after each trip

    public EarningGoal(double targetAmount) {
        this.targetAmount = targetAmount;
        this.currentEarned = 0.0;
        this.earningVelocity = null;
    }

    public void addEarning(double amount) {
        this.currentEarned += amount;
    }

    public double getRemainingTarget() {
        return Math.max(0, targetAmount - currentEarned);
    }

    public boolean isGoalMet() {
        return currentEarned >= targetAmount;
    }

    public void setEarningVelocity(EarningVelocity ev) {
        this.earningVelocity = ev;
    }

    public double getTargetAmount()   { return targetAmount; }
    public double getCurrentEarned()  { return currentEarned; }
    public EarningVelocity getEarningVelocity(){ return earningVelocity; }

    @Override
    public String toString() {
        return String.format("EarningGoal[target=₹%.0f, earned=₹%.0f, remaining=₹%.0f]",
                targetAmount, currentEarned, getRemainingTarget());
    }
}
