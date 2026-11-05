package com.library.management.dashboard;

import java.time.LocalDate;

import com.library.management.book.BookRepository;
import com.library.management.issue.IssueStatus;
import com.library.management.issue.IssuedBookRepository;
import com.library.management.student.StudentRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final BookRepository bookRepository;
    private final StudentRepository studentRepository;
    private final IssuedBookRepository issueRepository;

    public DashboardController(BookRepository bookRepository, StudentRepository studentRepository,
            IssuedBookRepository issueRepository) {
        this.bookRepository = bookRepository;
        this.studentRepository = studentRepository;
        this.issueRepository = issueRepository;
    }

    @GetMapping
    public DashboardResponse summary() {
        return new DashboardResponse(bookRepository.countAllCopies(), bookRepository.countAvailableCopies(),
                issueRepository.countByStatus(IssueStatus.ISSUED),
                issueRepository.countByStatusAndDueDateBefore(IssueStatus.ISSUED, LocalDate.now()),
                studentRepository.count());
    }
}
