package com.uber.models;

import com.uber.enums.AudioRating;
import com.uber.enums.MotionRating;
import com.uber.enums.StressRating;
import java.time.LocalDateTime;

public class StressSnapshot {

    private static final double AUDIO_FLAG_THRESHOLD  = 0.55;
    private static final double MOTION_FLAG_THRESHOLD = 0.5; // Increase to be more lenient, Decrease to be more strict

    private final LocalDateTime    timestamp;
    private final double           audioScore;
    private final AudioRating      audioLevel;
    private final double           motionScore;
    private final MotionRating     motionLevel;
    private final double           combinedScore;
    private final StressRating     combinedLevel;
    private final boolean          audioFlagged;
    private final boolean          motionFlagged;
    private final EarningVelocity  earningVelocity;  // instantaneous snapshot

    public StressSnapshot(LocalDateTime timestamp,
                          double audioScore,
                          double motionScore,
                          double combinedScore,
                          EarningVelocity earningVelocity) {
        this.timestamp       = timestamp;
        this.audioScore      = audioScore;
        this.audioLevel      = AudioRating.from(audioScore);
        this.motionScore     = motionScore;
        this.motionLevel     = MotionRating.from(motionScore);
        this.combinedScore   = combinedScore;
        this.combinedLevel   = StressRating.fromScore(combinedScore);
        this.audioFlagged    = audioScore  >= AUDIO_FLAG_THRESHOLD;
        this.motionFlagged   = motionScore >= MOTION_FLAG_THRESHOLD;
        this.earningVelocity = earningVelocity;
    }

    // totalFlagged = both audio OR motion flagged at this moment
    public boolean isTotalFlagged() { return audioFlagged || motionFlagged; }

    public LocalDateTime   getTimestamp()       { return timestamp; }
    public double          getAudioScore()      { return audioScore; }
    public AudioRating     getAudioLevel()      { return audioLevel; }
    public double          getMotionScore()     { return motionScore; }
    public MotionRating    getMotionLevel()     { return motionLevel; }
    public double          getCombinedScore()   { return combinedScore; }
    public StressRating    getCombinedLevel()   { return combinedLevel; }
    public boolean         isAudioFlagged()     { return audioFlagged; }
    public boolean         isMotionFlagged()    { return motionFlagged; }
    public EarningVelocity getEarningVelocity() { return earningVelocity; }

    @Override
    public String toString() {
        return String.format(
                "StressSnapshot[audio=%.2f(%s)%s, motion=%.2f(%s)%s, combined=%.2f(%s), pace=%s]",
                audioScore,  audioLevel,  audioFlagged  ? "⚑" : "",
                motionScore, motionLevel, motionFlagged ? "⚑" : "",
                combinedScore, combinedLevel,
                earningVelocity.getPaceStatus()
        );
    }
}