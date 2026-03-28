package com.durjavnici.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class NightlySleepEntry {
    /** "YYYY-MM-DD" — the calendar date on which the night started (evening side) */
    private String date;
    /** Hours of sleep inferred from STILL movement during 22:00-08:00 UTC */
    private double hours;
    /** true if hours < 5 or hours > 10 */
    private boolean anomaly;
}
