package ec.edu.master.template.dto;

import jakarta.validation.constraints.NotBlank;

/** Request to create a resource. The JPA entity is never exposed directly. */
public record CreateResourceRequest(
        @NotBlank String name,
        String description) {}
