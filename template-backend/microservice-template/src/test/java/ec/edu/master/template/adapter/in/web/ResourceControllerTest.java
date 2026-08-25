package ec.edu.master.template.adapter.in.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ec.edu.master.template.application.port.in.ResourceUseCase;
import ec.edu.master.template.domain.exception.NotFoundException;
import ec.edu.master.template.dto.ResourceResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Tests only the input adapter: serialization, status codes, and that
 * ErrorHandler translates domain exceptions correctly. The input port is
 * mocked — its logic is already covered by ResourceServiceTest.
 */
@WebMvcTest(ResourceController.class)
class ResourceControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ResourceUseCase useCase;

    @Test
    void createReturns201WithTheCreatedResource() throws Exception {
        when(useCase.create(any())).thenReturn(
                new ResourceResponse(1L, "Court 1", "Indoor", true, null));

        mockMvc.perform(post("/api/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Court 1","description":"Indoor"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Court 1"));
    }

    @Test
    void createWithBlankNameReturns400() throws Exception {
        mockMvc.perform(post("/api/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION"));
    }

    @Test
    void getWithUnknownIdReturns404() throws Exception {
        when(useCase.get(99L)).thenThrow(new NotFoundException("Resource 99 does not exist"));

        mockMvc.perform(get("/api/resources/{id}", 99))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }
}
