package com.library.management.issue;

import java.util.List;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/issues")
public class IssueController {
    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }

    @GetMapping
    public List<IssueResponse> list() {
        return issueService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IssueResponse issue(@Valid @RequestBody IssueBookRequest request) {
        return issueService.issue(request);
    }

    @PostMapping("/{id}/return")
    public ReturnResponse returnBook(@PathVariable Long id) {
        return issueService.returnBook(id);
    }
}
