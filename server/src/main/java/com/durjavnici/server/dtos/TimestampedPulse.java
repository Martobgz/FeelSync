package com.durjavnici.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TimestampedPulse {
    /** ISO-8601 UTC string, e.g. "2026-03-28T10:30:00Z" */
    private String timestamp;
    private Float pulse;
}
