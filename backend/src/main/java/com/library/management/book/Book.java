package com.library.management.book;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "books")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "book_id")
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String title;

    @NotBlank
    @Column(nullable = false)
    private String author;

    @NotBlank
    @Column(nullable = false)
    private String category;

    @Column(unique = true)
    private String isbn;

    @Min(0)
    @Column(nullable = false)
    private int quantity;

    @Min(0)
    @Column(name = "available_quantity", nullable = false)
    private int availableQuantity;

    @Version
    private long version;

    protected Book() {
    }

    public Book(String title, String author, String category, String isbn, int quantity) {
        this.title = title;
        this.author = author;
        this.category = category;
        this.isbn = isbn;
        this.quantity = quantity;
        this.availableQuantity = quantity;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public String getCategory() { return category; }
    public String getIsbn() { return isbn; }
    public int getQuantity() { return quantity; }
    public int getAvailableQuantity() { return availableQuantity; }

    public void update(String title, String author, String category, String isbn, int quantity) {
        if (quantity < this.quantity - availableQuantity) {
            throw new IllegalArgumentException("Quantity cannot be lower than the number of books currently issued.");
        }
        this.title = title;
        this.author = author;
        this.category = category;
        this.isbn = isbn;
        this.availableQuantity += quantity - this.quantity;
        this.quantity = quantity;
    }

    public void issueCopy() {
        if (availableQuantity < 1) {
            throw new IllegalArgumentException("No copies of this book are currently available.");
        }
        availableQuantity--;
    }

    public void returnCopy() {
        if (availableQuantity >= quantity) {
            throw new IllegalStateException("Returned copies cannot exceed the total quantity.");
        }
        availableQuantity++;
    }
}
