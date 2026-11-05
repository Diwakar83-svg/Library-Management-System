package com.library.management.issue;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

public record IssueBookRequest(
        @NotNull Long bookId,
        @NotNull Long studentId,
        @NotNull LocalDate dueDate
) {
}
