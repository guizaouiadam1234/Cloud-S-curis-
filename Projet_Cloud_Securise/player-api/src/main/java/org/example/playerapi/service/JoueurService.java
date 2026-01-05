package org.example.playerapi.service;

import org.example.playerapi.model.Joueur;
import org.example.playerapi.repository.JoueurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.Optional;

@Service
public class JoueurService {
    @Autowired
    private JoueurRepository joueurRepository;

    @Autowired
    private RestTemplate restTemplate;


    public String getUserIdByToken(String token) {
        String authUrl = "http://auth-api:8081/api/auth/validate?token=" + token;
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(authUrl, String.class);
            System.out.println("Response: " + response);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody(); // Return the user ID
            } else {
                throw new RuntimeException("Invalid or expired token");
            }
        } catch (ResourceAccessException e) {
            System.err.println("Connection refused: " + e.getMessage());
            throw new RuntimeException("Unable to connect to auth service", e);
        } catch (RestClientException e) {
            System.err.println("Error during REST call: " + e.getMessage());
            throw new RuntimeException("Error during REST call", e);
        }
    }

    public Optional<Joueur> getJoueurByToken(String token) {
        String userId = getUserIdByToken(token);
        Optional<Joueur> joueurOpt = joueurRepository.findByUserId(userId);
        if (joueurOpt.isEmpty()) {
            Joueur newJoueur = new Joueur();
            newJoueur.setUserId(userId);
            newJoueur.setLevel(1);
            newJoueur.setExperience(0);
            newJoueur.setMonstres(new ArrayList<>());
            joueurRepository.save(newJoueur);
            return Optional.of(newJoueur);
        }
        return joueurOpt;
    }

    public Joueur gainExperience(String token, int experience) {
        Optional<Joueur> joueurOpt = getJoueurByToken(token);
        if (joueurOpt.isPresent()) {
            Joueur j = joueurOpt.get();
            j.setExperience(j.getExperience() + experience);
            while (j.getExperience() >= getExperienceThreshold(j.getLevel())) {
                j.setExperience(j.getExperience() - getExperienceThreshold(j.getLevel()));
                j.setLevel(j.getLevel() + 1);
            }
            return joueurRepository.save(j);
        }
        return null;
    }


    public Joueur addMonstre(String monstreId, String token) {
        Optional<Joueur> joueurOpt = getJoueurByToken(token);
        if (joueurOpt.isPresent()) {
            Joueur joueur = joueurOpt.get();
            if (joueur.getMonstres().size() < joueur.getLevel() + 10) {
                joueur.getMonstres().add(monstreId);
                return joueurRepository.save(joueur);
            }
        }
        return null;
    }

    public Joueur removeMonstre(String monstreId, String token) {
        Optional<Joueur> joueurOpt = getJoueurByToken(token);
        if (joueurOpt.isPresent()) {
            Joueur joueur = joueurOpt.get();
            joueur.getMonstres().remove(monstreId);
            return joueurRepository.save(joueur);
        }
        return null;
    }

    private int getExperienceThreshold(int level) {
        return (int) (50 * Math.pow(1.1, level - 1));
    }
}