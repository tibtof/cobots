///usr/bin/env jbang "$0" "$@" ; exit $?
//JAVA 21

import java.util.List;
import java.util.Optional;

/**
 * Compiling proof of every pattern documented in java-idioms/SKILL.md.
 * Run: jbang scripts/VerifyExamples.java
 * If this file does not compile, the skill's examples have rotted — fix both.
 */
public class VerifyExamples {

    // ADT: sealed interface + record cases; exhaustive switch, no default arm.
    sealed interface Shape permits Circle, Rectangle {}
    record Circle(double radius) implements Shape {}
    record Rectangle(double width, double height) implements Shape {}

    static double area(Shape shape) {
        return switch (shape) {
            case Circle c -> Math.PI * c.radius() * c.radius();
            case Rectangle r -> r.width() * r.height();
        };
    }

    // No primitive obsession: wrap ids; validate in the constructor.
    record UserId(String value) {
        UserId {
            if (value == null || value.isBlank()) {
                throw new IllegalArgumentException("user id cannot be blank");
            }
        }
    }

    // Defensive copy in the compact constructor; "modification" returns a new instance.
    record Playlist(String name, List<String> tracks) {
        Playlist {
            tracks = List.copyOf(tracks);
        }
        Playlist withTrack(String track) {
            var extended = new java.util.ArrayList<>(tracks);
            extended.add(track);
            return new Playlist(name, extended);
        }
    }

    // Errors as values: sealed outcome type instead of exceptions for expected failure.
    sealed interface ParseResult permits Parsed, ParseError {}
    record Parsed(int value) implements ParseResult {}
    record ParseError(String message) implements ParseResult {}

    static ParseResult parsePort(String raw) {
        try {
            int port = Integer.parseInt(raw);
            return (port >= 1 && port <= 65535)
                ? new Parsed(port)
                : new ParseError("port out of range: " + port);
        } catch (NumberFormatException e) {
            return new ParseError("not a number: " + raw);
        }
    }

    // Absence is Optional, never null.
    static Optional<String> firstLongTrack(Playlist playlist) {
        return playlist.tracks().stream()
            .filter(t -> t.length() > 10)
            .findFirst();
    }

    public static void main(String[] args) {
        var playlist = new Playlist("focus", List.of("one", "a-very-long-track"))
            .withTrack("two");
        var summary = switch (parsePort("8080")) {
            case Parsed p -> "port " + p.value();
            case ParseError e -> "error: " + e.message();
        };
        System.out.printf("ok: area=%.1f, tracks=%d, %s, long=%s%n",
            area(new Circle(1)), playlist.tracks().size(), summary,
            firstLongTrack(playlist).orElse("none"));
    }
}
