package com.imt.framework.web.tuto.repositories;

import com.imt.framework.web.tuto.entities.Livre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public interface LivreRepository extends JpaRepository<Livre, Integer> {

    @Query(value = "Select l from Livre l where price <= :maxPrice")
    List<Livre> getBooksWithMaxPrice(@Param("maxPrice") Double maxPrice);

}
