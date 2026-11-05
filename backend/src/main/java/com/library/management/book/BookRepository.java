package com.library.management.book;

import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookRepository extends JpaRepository<Book, Long> {
    @Query("""
            select b from Book b
            where lower(b.title) like lower(concat('%', :query, '%'))
               or lower(b.author) like lower(concat('%', :query, '%'))
               or lower(b.category) like lower(concat('%', :query, '%'))
               or lower(coalesce(b.isbn, '')) like lower(concat('%', :query, '%'))
            order by b.title
            """)
    List<Book> search(@Param("query") String query);

    @Query("select coalesce(sum(b.quantity), 0) from Book b")
    long countAllCopies();

    @Query("select coalesce(sum(b.availableQuantity), 0) from Book b")
    long countAvailableCopies();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Book b where b.id = :id")
    Optional<Book> findByIdForUpdate(@Param("id") Long id);
}
