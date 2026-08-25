package ec.edu.master.template.dto;

import jakarta.validation.constraints.NotBlank;

/** Request to update an existing resource. */
public record UpdateResourceRequest(
        @NotBlank String name,
        String description,
        boolean active) {}
