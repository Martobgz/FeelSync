package com.durjavnici.server.services.time;

import com.durjavnici.server.dtos.TimeWindowResponse;

import java.util.List;

public interface TimeWindowService {
    TimeWindowResponse calculateWindowMs(List<Integer> hours);
}

