package com.library.management.issue;

import java.time.LocalDate;
import java.math.BigDecimal;
import com.library.management.book.Book;
import com.library.management.student.Student;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "issued_books")
public class IssuedBook {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "issue_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(name = "fine", precision = 10, scale = 2, nullable = false)
    private BigDecimal fine = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IssueStatus status;

    protected IssuedBook() {
    }

    public IssuedBook(Book book, Student student, LocalDate issueDate, LocalDate dueDate) {
        this.book = book;
        this.student = student;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.status = IssueStatus.ISSUED;
    }

    public Long getId() { return id; }
    public Book getBook() { return book; }
    public Student getStudent() { return student; }
    public LocalDate getIssueDate() { return issueDate; }
    public LocalDate getDueDate() { return dueDate; }
    public LocalDate getReturnDate() { return returnDate; }
    public IssueStatus getStatus() { return status; }

    public BigDecimal getFine() {
    return fine;
    }
   public void markReturned(LocalDate date, BigDecimal fine) {
    if (status == IssueStatus.RETURNED) {
        throw new IllegalStateException("This book has already been returned.");
    }

    this.returnDate = date;
    this.fine = fine;
    this.status = IssueStatus.RETURNED;
    }
}
