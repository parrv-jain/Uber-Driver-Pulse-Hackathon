package com.uber.enums;

public enum MotionRating {
    GRADUAL(0.00, 0.01),
    MODERATE(0.01, 0.99),
    HARSH(0.99, 1.00);

    private final double min;
    private final double max;

    MotionRating(double min, double max) {
        this.min = min;
        this.max = max;
    }

    public static MotionRating from(double score) {
        for (MotionRating level : values()) {
            if (score < level.max) return level;
        }
        return HARSH;
    }
}
