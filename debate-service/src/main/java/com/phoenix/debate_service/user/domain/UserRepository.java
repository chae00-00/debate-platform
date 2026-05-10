package com.phoenix.debate_service.user.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findBySocialIdAndProvider(String socialId, Provider provider);

    Optional<User> findByEmail(String email);
}
