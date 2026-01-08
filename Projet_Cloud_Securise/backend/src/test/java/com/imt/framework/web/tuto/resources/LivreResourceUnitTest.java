package com.imt.framework.web.tuto.resources;

import com.imt.framework.web.tuto.entities.Livre;
import com.imt.framework.web.tuto.repositories.LivreRepository;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class LivreResourceUnitTest {

    @Test
    void getBooks_withoutMaxPrice_returnsAllBooksAndSetsCorsHeader() throws Exception {
        LivreRepository repo = mock(LivreRepository.class);
        LivreResource resource = new LivreResource();
        inject(resource, "livreRepository", repo);

        Livre a = new Livre();
        a.setTitre("A");
        Livre b = new Livre();
        b.setTitre("B");
        when(repo.findAll()).thenReturn(List.of(a, b));

        Response response = resource.getBooks(null);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getHeaders().getFirst("Access-Control-Allow-Origin")).isEqualTo("*");
        assertThat(response.getEntity()).isInstanceOf(List.class);
        @SuppressWarnings("unchecked")
        List<Livre> entity = (List<Livre>) response.getEntity();
        assertThat(entity).hasSize(2);
        verify(repo).findAll();
        verify(repo, never()).getBooksWithMaxPrice(any());
    }

    @Test
    void getBooks_withMaxPrice_filtersBooksAndSetsCorsHeader() throws Exception {
        LivreRepository repo = mock(LivreRepository.class);
        LivreResource resource = new LivreResource();
        inject(resource, "livreRepository", repo);

        Livre a = new Livre();
        a.setTitre("Cheap");
        when(repo.getBooksWithMaxPrice(10.0)).thenReturn(List.of(a));

        Response response = resource.getBooks(10.0);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(response.getHeaders().getFirst("Access-Control-Allow-Origin")).isEqualTo("*");
        @SuppressWarnings("unchecked")
        List<Livre> entity = (List<Livre>) response.getEntity();
        assertThat(entity).extracting(Livre::getTitre).containsExactly("Cheap");
        verify(repo).getBooksWithMaxPrice(10.0);
        verify(repo, never()).findAll();
    }

    @Test
    void createBook_savesLivre() throws Exception {
        LivreRepository repo = mock(LivreRepository.class);
        LivreResource resource = new LivreResource();
        inject(resource, "livreRepository", repo);

        Livre livre = new Livre();
        livre.setTitre("X");

        resource.createBook(livre);

        verify(repo).save(livre);
    }

    @Test
    void deleteBook_deletesById() throws Exception {
        LivreRepository repo = mock(LivreRepository.class);
        LivreResource resource = new LivreResource();
        inject(resource, "livreRepository", repo);

        resource.deleteBook(123);

        verify(repo).deleteById(123);
    }

    @Test
    void updateBook_throwsWhenLivreNotFound() throws Exception {
        LivreRepository repo = mock(LivreRepository.class);
        LivreResource resource = new LivreResource();
        inject(resource, "livreRepository", repo);

        when(repo.findById(1)).thenReturn(Optional.empty());

        Livre input = new Livre();
        input.setTitre("New");

        assertThrows(Exception.class, () -> resource.updateBook(1, input));
        verify(repo, never()).save(any());
    }

    @Test
    void updateBook_updatesFieldsAndSaves() throws Exception {
        LivreRepository repo = mock(LivreRepository.class);
        LivreResource resource = new LivreResource();
        inject(resource, "livreRepository", repo);

        Livre existing = new Livre();
        existing.setId(7);
        existing.setTitre("Old");
        existing.setAuteur("OldA");
        existing.setPrice(1.0);

        when(repo.findById(7)).thenReturn(Optional.of(existing));

        Livre input = new Livre();
        input.setTitre("New");
        input.setAuteur("NewA");
        input.setPrice(99.0);

        resource.updateBook(7, input);

        ArgumentCaptor<Livre> captor = ArgumentCaptor.forClass(Livre.class);
        verify(repo).save(captor.capture());
        Livre saved = captor.getValue();
        assertThat(saved.getId()).isEqualTo(7);
        assertThat(saved.getTitre()).isEqualTo("New");
        assertThat(saved.getAuteur()).isEqualTo("NewA");
        assertThat(saved.getPrice()).isEqualTo(99.0);
    }

    private static void inject(Object target, String fieldName, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, value);
    }
}
