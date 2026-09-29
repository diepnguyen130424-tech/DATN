package com.example.bangiay.repository;

import com.example.bangiay.entity.KichCo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KichCoRepository extends JpaRepository<KichCo, Long> {
    boolean existsByTenKichCo(String tenKichCo);
    boolean existsByTenKichCoAndIdNot(String tenKichCo, Long id);
}
