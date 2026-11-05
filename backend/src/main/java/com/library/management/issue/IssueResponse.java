package com.library.management.issue;

import java.math.BigDecimal;
import java.time.LocalDate;

public record IssueResponse(
        Long issueId,
        Long bookId,
        String bookTitle,
        Long studentId,
        String studentName,
        LocalDate issueDate,
        LocalDate dueDate,
        LocalDate returnDate,
        IssueStatus status,
        BigDecimal fine
) {
    public static IssueResponse from(IssuedBook issue) {
        return new IssueResponse(
                issue.getId(),
                issue.getBook().getId(),
                issue.getBook().getTitle(),
                issue.getStudent().getId(),
                issue.getStudent().getName(),
                issue.getIssueDate(),
                issue.getDueDate(),
                issue.getReturnDate(),
                issue.getStatus(),
                issue.getFine()
        );
    }
}