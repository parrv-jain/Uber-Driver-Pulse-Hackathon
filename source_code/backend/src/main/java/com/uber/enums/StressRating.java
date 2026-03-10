package com.uber.enums;

public enum StressRating {
    LOW(0, 0.30),
    MEDIUM(0.30, 0.60),
    HIGH(0.60, 0.85),
    CRITICAL(0.85, 1.0);

    private final double minScore;
    private final double maxScore;

    StressRating(double minScore, double maxScore) {
        this.minScore = minScore;
        this.maxScore = maxScore;
    }

    public static StressRating fromScore(double score) {
        for (StressRating rating : values()) {
            if (score >= rating.minScore && score <= rating.maxScore) {
                return rating;
            }
        }
        return CRITICAL;
    }

    public double getMinScore() { return minScore; }
    public double getMaxScore() { return maxScore; }
}
