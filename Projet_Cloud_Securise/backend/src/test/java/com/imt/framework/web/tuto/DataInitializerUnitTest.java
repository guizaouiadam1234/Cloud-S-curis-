package com.imt.framework.web.tuto;

import com.imt.framework.web.tuto.repositories.LivreRepository;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DataInitializerUnitTest {

    @Test
    void run_seedsThreeLivresWhenRepositoryIsEmpty() throws Exception {
        LivreRepository repo = mock(LivreRepository.class);
        when(repo.count()).thenReturn(0L);

        DataInitializer initializer = new DataInitializer();
        inject(initializer, "livreRepository", repo);

        initializer.run();

        verify(repo, times(3)).save(any());
    }

    @Test
    void run_doesNotSeedWhenRepositoryNotEmpty() throws Exception {
        LivreRepository repo = mock(LivreRepository.class);
        when(repo.count()).thenReturn(5L);

        DataInitializer initializer = new DataInitializer();
        inject(initializer, "livreRepository", repo);

        initializer.run();

        verify(repo, never()).save(any());
    }

    private static void inject(Object target, String fieldName, Object value) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, value);
    }
}
