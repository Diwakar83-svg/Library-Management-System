package com.library.management.student;

import java.util.List;
import java.util.Locale;

import com.library.management.common.ConflictException;
import com.library.management.common.ResourceNotFoundException;
import com.library.management.issue.IssuedBookRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentService {
    private final StudentRepository studentRepository;
    private final IssuedBookRepository issuedBookRepository;

    public StudentService(StudentRepository studentRepository, IssuedBookRepository issuedBookRepository) {
        this.studentRepository = studentRepository;
        this.issuedBookRepository = issuedBookRepository;
    }

    @Transactional(readOnly = true)
    public List<Student> search(String query) {
        if (query == null || query.isBlank()) {
            return studentRepository.findAll();
        }
        String value = query.trim();
        return studentRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(value, value);
    }

    @Transactional
    public Student create(StudentRequest request) {
        String email = normalizeEmail(request.email());
        if (studentRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("A student with this email already exists.");
        }
        return studentRepository.save(toStudent(request, email));
    }

    @Transactional
    public Student update(Long id, StudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found."));
        String email = normalizeEmail(request.email());
        if (!student.getEmail().equalsIgnoreCase(email)
                && studentRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("A student with this email already exists.");
        }
        student.update(request.name().trim(), email, request.phone(), request.address());
        try {
            return studentRepository.save(student);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("A student with this email already exists.");
        }
    }

    @Transactional
    public void delete(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found."));
        if (issuedBookRepository.existsByStudentId(id)) {
            throw new ConflictException("This student has issue history and cannot be deleted.");
        }
        studentRepository.delete(student);
    }

    private Student toStudent(StudentRequest request, String email) {
        return new Student(request.name().trim(), email, request.phone(), request.address());
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
