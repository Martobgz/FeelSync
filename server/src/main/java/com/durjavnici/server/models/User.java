package com.durjavnici.server.models;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(name = "expo_push_token", length = 255)
    private String expoPushToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private UserRole role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = true)
    private User patient;

    public User(String username, String email, String passwordHash, String expoPushToken) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.expoPushToken = expoPushToken;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public void setPatient(User patient) {
        this.patient = patient;
    }
}
