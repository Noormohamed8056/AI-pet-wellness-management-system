//Pet.java
package com.jeeva.petcare.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.*;

@JsonIgnoreProperties({
    "hibernateLazyInitializer",
    "handler"
})
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "pets")
public class Pet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String species;
    private String breed;
    private Integer age;
    private String gender;

    @Column(length = 2048)
    private String imageUrl;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    @JsonIgnoreProperties({
        "password",
        "verificationToken",
        "emailVerified",
        "pets",
        "vetProfile",
        "userProfile"
    })
    private User owner;


    @OneToMany(mappedBy = "pet", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<HealthMetric> healthMetrics;

    @OneToMany(mappedBy = "pet",cascade = CascadeType.ALL)
    @JsonIgnoreProperties("pet")
    private List<Vaccination> vaccinations;


}
