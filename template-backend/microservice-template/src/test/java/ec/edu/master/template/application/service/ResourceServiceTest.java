package ec.edu.master.template.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import ec.edu.master.template.application.port.out.ResourceRepositoryPort;
import ec.edu.master.template.domain.Resource;
import ec.edu.master.template.domain.exception.BusinessRuleException;
import ec.edu.master.template.domain.exception.NotFoundException;
import ec.edu.master.template.dto.CreateResourceRequest;
import ec.edu.master.template.dto.ResourceResponse;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * The use case is tested with the output port mocked, with no Spring and no
 * real database — it runs in milliseconds, and does not care whether JPA or
 * anything else is behind the port. This is what is missing in the four
 * current microservices: none has a real test beyond the contextLoads that
 * Initializr generates.
 */
@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    ResourceRepositoryPort repository;

    ResourceService service;

    @Test
    void createSavesWhenNameIsNotTaken() {
        service = new ResourceService(repository);
        when(repository.existsByNameIgnoreCase("Court 1")).thenReturn(false);
        when(repository.save(any(Resource.class))).thenAnswer(inv -> inv.getArgument(0));

        ResourceResponse response = service.create(new CreateResourceRequest("Court 1", "Indoor"));

        assertThat(response.name()).isEqualTo("Court 1");
        assertThat(response.active()).isTrue();
    }

    @Test
    void createRejectsDuplicateName() {
        service = new ResourceService(repository);
        when(repository.existsByNameIgnoreCase("Court 1")).thenReturn(true);

        assertThatThrownBy(() -> service.create(new CreateResourceRequest("Court 1", null)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void getThrowsNotFoundWhenMissing() {
        service = new ResourceService(repository);
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(99L))
                .isInstanceOf(NotFoundException.class);
    }
}
