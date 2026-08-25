package ec.edu.master.template.domain;

import java.time.OffsetDateTime;

/**
 * Domain model. No JPA or Spring annotation: the business core does not know
 * a relational database exists. The table mapping lives in
 * adapter.out.persistence.ResourceJpaEntity.
 *
 * Rename it to your real domain (Court, User, etc.).
 */
public class Resource {

    private final Long id;
    private String name;
    private String description;
    private boolean active;
    private final OffsetDateTime createdAt;

    public Resource(String name, String description) {
        this(null, name, description, true, null);
    }

    public Resource(Long id, String name, String description, boolean active, OffsetDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.active = active;
        this.createdAt = createdAt;
    }

    public void update(String name, String description, boolean active) {
        this.name = name;
        this.description = description;
        this.active = active;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public boolean isActive() { return active; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
