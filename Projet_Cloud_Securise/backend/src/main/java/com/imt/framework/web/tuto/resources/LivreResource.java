package com.imt.framework.web.tuto.resources;

import com.imt.framework.web.tuto.entities.Livre;
import com.imt.framework.web.tuto.repositories.LivreRepository;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Optional;

@Path("/books")
public class LivreResource {

    @Autowired
    private LivreRepository livreRepository;

    @GET
    @Produces("application/json")
    public Response getBooks(@QueryParam("maxPrice") final Double maxPrice){
        if(maxPrice != null){
            return Response.ok()
            .entity(livreRepository.getBooksWithMaxPrice(maxPrice))
            .header("Access-Control-Allow-Origin", "*")
            .build();
        }
        return Response.ok()
               .entity(livreRepository.findAll())
               .header("Access-Control-Allow-Origin", "*")
               .build();
    }

    @POST
    @Consumes("application/json")
    public void createBook(@NotNull @RequestBody Livre livre){
        livreRepository.save(livre);
    }

    @PATCH
    @Consumes
    @Path("/{id}")
    public void updateBook(@NotNull @PathParam("id") Integer id, @NotNull @RequestBody Livre livre) throws Exception {
        Optional<Livre> l = livreRepository.findById(id);

        if(l.isEmpty()) {
            throw new Exception("Livre inconnu");
        }
        else {
            Livre livreToUpdate = l.get();
            livreToUpdate.setAuteur(livre.getAuteur());
            livreToUpdate.setPrice(livre.getPrice());
            livreToUpdate.setTitre(livre.getTitre());

            livreRepository.save(livreToUpdate);
        }
    }

    @DELETE
    @Path("/{id}")
    public void deleteBook(@NotNull @PathParam("id") final Integer id){
        livreRepository.deleteById(id);
    }
}
