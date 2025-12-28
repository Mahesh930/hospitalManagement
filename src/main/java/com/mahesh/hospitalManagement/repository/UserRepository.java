package com.mahesh.hospitalManagement.repository;

import com.mahesh.hospitalManagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
}