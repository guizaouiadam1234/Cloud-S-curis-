import logo from './logo.svg';
import './App.css';

var books;

function App() {
  return (
    <div className="App">
      <img src='data:image/png;base64,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'/>
      <h1>Librair'IMT</h1>
      <div>
        <button onClick={getBooks}>Lister les livres</button>
        <div id='books'>
          
        </div>
      </div>
    </div>
  );
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

function getBooks () {
  fetch(`${API_BASE}/librairy/books`)
  .then(async response => {
    const ct = response.headers.get('content-type') || '';
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body}`);
    }
    if (ct.includes('application/json')) {
      return response.json();
    }
    // If the server returned HTML or other unexpected content, capture it
    const text = await response.text();
    throw new Error('Expected JSON but received: ' + text.slice(0,200));
  })
  .then(data => {
      const books = data;
      console.log(books)
      var divBooks = document.getElementById("books");
      divBooks.innerHTML = '';  
      if (!books || books.length === 0) {
          divBooks.innerText = 'Pas de livre dispo';
      } else {
          var booksHtml = document.createElement('div'); 
          books.forEach(book => {
              var htmlToInject = document.createElement('div');
              htmlToInject.innerText = book.titre;
              booksHtml.appendChild(htmlToInject);
          });
          divBooks.appendChild(booksHtml);
      }
  })
  .catch(error => console.log("Erreur lors de l'appel au back end de la librairie, Erreur : " + error));

}

export default App;
