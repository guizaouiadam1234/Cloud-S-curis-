package com.imt.framework.web.tuto.repositories;

import com.imt.framework.web.tuto.entities.Livre;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class LivreRepositoryTest {

    @Autowired
    private LivreRepository livreRepository;

    @Test
    void getBooksWithMaxPrice_filtersByPriceInclusive() {
        Livre cheap = new Livre();
        cheap.setTitre("Cheap");
        cheap.setAuteur("A");
        cheap.setPrice(9.99);

        Livre equal = new Livre();
        equal.setTitre("Equal");
        equal.setAuteur("B");
        equal.setPrice(10.0);

        Livre expensive = new Livre();
        expensive.setTitre("Expensive");
        expensive.setAuteur("C");
        expensive.setPrice(10.01);

        livreRepository.saveAll(List.of(cheap, equal, expensive));

        List<Livre> result = livreRepository.getBooksWithMaxPrice(10.0);

        assertThat(result)
                .extracting(Livre::getTitre)
                .containsExactlyInAnyOrder("Cheap", "Equal")
                .doesNotContain("Expensive");
    }
}
