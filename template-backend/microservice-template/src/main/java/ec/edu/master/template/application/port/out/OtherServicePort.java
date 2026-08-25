package ec.edu.master.template.application.port.out;

/**
 * Output port: synchronous communication with another microservice,
 * expressed with no transport detail at all (no RestClient here).
 * OtherServiceAdapter (adapter.out.client) implements it over REST. Delete it
 * together with its adapter if your service does not need to call another
 * one.
 */
public interface OtherServicePort {

    RemoteResource get(Long id);

    /** Local copy of what the other service returns. */
    record RemoteResource(Long id, String name, boolean active) {}
}
