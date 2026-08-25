package ec.edu.master.template.dto;

import java.time.OffsetDateTime;

/** What the HTTP client sees. Never the JPA entity (Resource) serialized directly. */
public record ResourceResponse(
        Long id,
        String name,
        String description,
        boolean active,
        OffsetDateTime createdAt) {}
