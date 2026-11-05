package com.library.management.issue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import com.library.management.book.Book;
import com.library.management.book.BookRepository;
import com.library.management.common.ResourceNotFoundException;
import com.library.management.student.Student;
import com.library.management.student.StudentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class IssueService {
    private final IssuedBookRepository issuedBookRepository;
    private final BookRepository bookRepository;
    private final StudentRepository studentRepository;
    private final BigDecimal finePerDay;

    public IssueService(IssuedBookRepository issuedBookRepository, BookRepository bookRepository,
            StudentRepository studentRepository, @Value("${library.fine-per-day}") BigDecimal finePerDay) {
        this.issuedBookRepository = issuedBookRepository;
        this.bookRepository = bookRepository;
        this.studentRepository = studentRepository;
        if (finePerDay.signum() < 0) {
            throw new IllegalArgumentException("FINE_PER_DAY cannot be negative.");
        }
        this.finePerDay = finePerDay;
    }

    @Transactional(readOnly = true)
    public List<IssueResponse> list() {
        return issuedBookRepository.findAllByOrderByIssueDateDesc().stream().map(IssueResponse::from).toList();
    }

    @Transactional
    public IssueResponse issue(IssueBookRequest request) {
        LocalDate today = LocalDate.now();
        if (!request.dueDate().isAfter(today)) {
            throw new IllegalArgumentException("Due date must be after today.");
        }

        Book book = bookRepository.findByIdForUpdate(request.bookId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found."));
        Student student = studentRepository.findById(request.studentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found."));
        book.issueCopy();
        IssuedBook issue = issuedBookRepository.save(new IssuedBook(book, student, today, request.dueDate()));
        return IssueResponse.from(issue);
    }

    @Transactional
    public ReturnResponse returnBook(Long issueId) {
        IssuedBook issue = issuedBookRepository.findByIdForUpdate(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue record not found."));
        if (issue.getStatus() == IssueStatus.RETURNED) {
            throw new IllegalArgumentException("This book has already been returned.");
        }
        Book book = bookRepository.findByIdForUpdate(issue.getBook().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found."));
        LocalDate returnedOn = LocalDate.now();

long daysOverdue = Math.max(
        0,
        ChronoUnit.DAYS.between(issue.getDueDate(), returnedOn)
);

BigDecimal fine = finePerDay.multiply(BigDecimal.valueOf(daysOverdue));

issue.markReturned(returnedOn, fine);
book.returnCopy();

return new ReturnResponse(
        issue.getId(),
        issue.getStatus(),
        returnedOn,
        daysOverdue,
        fine
);
    }
}
