package com.library.management.dashboard;

public record DashboardResponse(
        long totalBooks,
        long availableBooks,
        long issuedBooks,
        long overdueBooks,
        long totalStudents
) {
}
