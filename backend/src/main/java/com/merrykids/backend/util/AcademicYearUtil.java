package com.merrykids.backend.util;

import java.time.LocalDate;

public class AcademicYearUtil {

    private AcademicYearUtil() {}

    /**
     * Returns the current academic year string, e.g. "2025/2026".
     * Academic year starts in September:
     * - Sep–Dec of year Y  → "Y/(Y+1)"
     * - Jan–Aug of year Y  → "(Y-1)/Y"
     */
    public static String getCurrent() {
        LocalDate today = LocalDate.now();
        int y = today.getYear();
        if (today.getMonthValue() >= 9) {
            return y + "/" + (y + 1);
        } else {
            return (y - 1) + "/" + y;
        }
    }
}
