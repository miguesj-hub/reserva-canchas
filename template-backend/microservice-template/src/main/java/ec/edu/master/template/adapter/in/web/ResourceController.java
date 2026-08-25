package ec.edu.master.template.adapter.in.web;

import ec.edu.master.template.application.port.in.ResourceUseCase;
import ec.edu.master.template.dto.CreateResourceRequest;
import ec.edu.master.template.dto.ResourceResponse;
import ec.edu.master.template.dto.UpdateResourceRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Input adapter (web): only translates HTTP &lt;-&gt; DTO and delegates to
 * the input port. Depends on the ResourceUseCase interface, never on
 * ResourceService directly — the adapter does not know which domain
 * implementation is behind it.
 *
 * If this microservice sits behind the gateway, the user's identity arrives
 * already resolved in the X-Usuario-Id / X-Usuario-Rol headers (see
 * BookingController in ms-reservas for the real example of how to read
 * them).
 */
@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceUseCase useCase;

    public ResourceController(ResourceUseCase useCase) {
        this.useCase = useCase;
    }

    @Operation(summary = "Creates a resource")
    @ApiResponse(responseCode = "201", description = "Resource created")
    @ApiResponse(responseCode = "400", description = "Duplicate or invalid name")
    @PostMapping
    public ResponseEntity<ResourceResponse> create(@Valid @RequestBody CreateResourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(useCase.create(request));
    }

    @Operation(summary = "Lists all resources")
    @GetMapping
    public List<ResourceResponse> list() {
        return useCase.list();
    }

    @Operation(summary = "Gets a resource by id")
    @ApiResponse(responseCode = "404", description = "Resource does not exist")
    @GetMapping("/{id}")
    public ResourceResponse get(@PathVariable Long id) {
        return useCase.get(id);
    }

    @Operation(summary = "Updates a resource")
    @PutMapping("/{id}")
    public ResourceResponse update(
            @PathVariable Long id, @Valid @RequestBody UpdateResourceRequest request) {
        return useCase.update(id, request);
    }

    @Operation(summary = "Deletes a resource")
    @ApiResponse(responseCode = "204", description = "Deleted")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        useCase.delete(id);
        return ResponseEntity.noContent().build();
    }
}
