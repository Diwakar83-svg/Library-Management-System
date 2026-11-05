package com.library.management.book;

import java.util.List;

import com.library.management.common.ConflictException;
import com.library.management.common.ResourceNotFoundException;
import com.library.management.issue.IssuedBookRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookService {
    private final BookRepository bookRepository;
    private final IssuedBookRepository issuedBookRepository;

    public BookService(BookRepository bookRepository, IssuedBookRepository issuedBookRepository) {
        this.bookRepository = bookRepository;
        this.issuedBookRepository = issuedBookRepository;
    }

    @Transactional(readOnly = true)
    public List<Book> search(String query) {
        if (query == null || query.isBlank()) {
            return bookRepository.findAll();
        }
        return bookRepository.search(query.trim());
    }

    @Transactional
    public Book create(BookRequest request) {
        try {
            return bookRepository.save(new Book(
                    request.title().trim(), request.author().trim(), request.category().trim(),
                    normalizeIsbn(request.isbn()), request.quantity()));
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("A book with this ISBN already exists.");
        }
    }

    @Transactional
    public Book update(Long id, BookRequest request) {
        Book book = bookRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found."));
        book.update(request.title().trim(), request.author().trim(), request.category().trim(),
                normalizeIsbn(request.isbn()), request.quantity());
        try {
            return bookRepository.save(book);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("A book with this ISBN already exists.");
        }
    }

    @Transactional
    public void delete(Long id) {
        Book book = bookRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found."));
        if (issuedBookRepository.existsByBookId(id)) {
            throw new ConflictException("This book has issue history and cannot be deleted.");
        }
        bookRepository.delete(book);
    }

    private String normalizeIsbn(String isbn) {
        return isbn == null || isbn.isBlank() ? null : isbn.trim();
    }
}
