package com.durjavnici.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Count of readings per GSR state over the requested period.
 * State values match the ESP32 GsrState enum:
 *   1=NORMAL, 2=TENSE, 3=SIGNIFICANTLY_STRESSED, 4=CALM, 5=HAPPY
 */
@Getter
@AllArgsConstructor
public class GsrDistribution {
    private int normal;
    private int tense;
    private int stressed;
    private int calm;
    private int happy;
}
