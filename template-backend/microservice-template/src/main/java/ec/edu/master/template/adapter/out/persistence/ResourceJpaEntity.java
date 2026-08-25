package ec.edu.master.template.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

/**
 * JPA mapping. An implementation detail of the persistence adapter: nothing
 * outside this package should use it directly, only ResourceRepositoryAdapter
 * (which translates it to/from the domain.Resource that the rest of the
 * application knows).
 *
 * The matching DDL does NOT live here: every microservice assumes its table
 * already exists (infra/postgres/init/*.sql). `ddl-auto: validate` only
 * compares this mapping against the real schema; if they don't match, the
 * service fails to start instead of failing in production with an
 * unexpected column.
 *
 * Equivalent DDL example to try locally:
 *
 *   CREATE TABLE resources (
 *       id          BIGSERIAL PRIMARY KEY,
 *       name        VARCHAR(120) NOT NULL,
 *       description VARCHAR(255),
 *       active      BOOLEAN NOT NULL DEFAULT true,
 *       created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
 *   );
 */
@Entity
@Table(name = "resources")
class ResourceJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected ResourceJpaEntity() {}

    ResourceJpaEntity(Long id, String name, String description, boolean active) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.active = active;
    }

    Long getId() { return id; }
    String getName() { return name; }
    String getDescription() { return description; }
    boolean isActive() { return active; }
    OffsetDateTime getCreatedAt() { return createdAt; }
}
