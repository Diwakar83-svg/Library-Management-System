package com.library.management.book;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class BookTest {
    @Test
    void issuingAndReturningCopiesKeepsInventoryConsistent() {
        Book book = new Book("The Hobbit", "J. R. R. Tolkien", "Fantasy", null, 2);

        book.issueCopy();
        assertEquals(1, book.getAvailableQuantity());

        book.returnCopy();
        assertEquals(2, book.getAvailableQuantity());
    }

    @Test
    void cannotIssueMoreCopiesThanAvailable() {
        Book book = new Book("The Hobbit", "J. R. R. Tolkien", "Fantasy", null, 1);
        book.issueCopy();

        assertThrows(IllegalArgumentException.class, book::issueCopy);
    }

    @Test
    void reducingQuantityBelowIssuedCopiesIsRejected() {
        Book book = new Book("The Hobbit", "J. R. R. Tolkien", "Fantasy", null, 2);
        book.issueCopy();

        assertThrows(IllegalArgumentException.class,
                () -> book.update("The Hobbit", "J. R. R. Tolkien", "Fantasy", null, 0));
    }
}
