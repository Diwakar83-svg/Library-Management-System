package com.library.management.issue;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReturnResponse(
        Long issueId,
        IssueStatus status,
        LocalDate returnDate,
        long daysOverdue,
        BigDecimal fine
) {
}
