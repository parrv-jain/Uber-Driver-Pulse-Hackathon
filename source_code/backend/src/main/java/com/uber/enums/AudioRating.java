package com.uber.enums;

public enum AudioRating {
    QUIET(0.00, 0.35),
    CONVERSATIONAL(0.35, 0.55),
    ARGUMENT(0.55, 0.80),
    VERY_LOUD(0.80, 1.00);

    private final double min;
    private final double max;

    AudioRating(double min, double max) {
        this.min = min;
        this.max = max;
    }

    public static AudioRating from(double score) {
        for (AudioRating level : values()) {
            if (score < level.max) return level;
        }
        return VERY_LOUD; // clamp for score == 1.0
    }
}
