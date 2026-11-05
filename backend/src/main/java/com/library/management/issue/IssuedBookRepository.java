package com.library.management.issue;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface IssuedBookRepository extends JpaRepository<IssuedBook, Long> {
    boolean existsByBookId(Long bookId);
    boolean existsByStudentId(Long studentId);
    long countByStatus(IssueStatus status);
    long countByStatusAndDueDateBefore(IssueStatus status, java.time.LocalDate date);
    List<IssuedBook> findAllByOrderByIssueDateDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from IssuedBook i where i.id = :id")
    Optional<IssuedBook> findByIdForUpdate(@Param("id") Long id);
}
