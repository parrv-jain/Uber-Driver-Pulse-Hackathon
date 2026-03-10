package com.uber.enums;

public enum PaceStatus {
    AHEAD,      // current velocity > 110% of required
    ON_TRACK,   // current velocity within ±10% of required
    BEHIND,     // current velocity 70–90% of required
    CRITICAL    // current velocity < 70% of required
}
