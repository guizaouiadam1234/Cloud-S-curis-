package com.imt.framework.web.tuto;

import com.imt.framework.web.tuto.entities.Livre;
import com.imt.framework.web.tuto.repositories.LivreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private LivreRepository livreRepository;

    @Override
    public void run(String... args) throws Exception {
        if (livreRepository.count() == 0) {
            Livre l1 = new Livre();
            l1.setTitre("Le Petit Prince");
            l1.setAuteur("Antoine de Saint-Exupéry");
            l1.setPrice(9.99);

            Livre l2 = new Livre();
            l2.setTitre("Exemple de Livre");
            l2.setAuteur("Auteur Exemple");
            l2.setPrice(12.5);

            Livre l3 = new Livre();
            l3.setTitre("Programmation Java");
            l3.setAuteur("Some Author");
            l3.setPrice(29.0);

            livreRepository.save(l1);
            livreRepository.save(l2);
            livreRepository.save(l3);
            System.out.println("DataInitializer: seeded 3 livres");
        } else {
            System.out.println("DataInitializer: database already has " + livreRepository.count() + " livres");
        }
    }

}
