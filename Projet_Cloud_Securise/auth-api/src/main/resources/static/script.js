document.getElementById('loginButton').addEventListener('click', function() {
    document.getElementById('loginForm').style.display = 'block';
});

document.getElementById('form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch(`http://localhost:8081/api/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
        method: 'POST'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(token => {
            console.log('Token:', token);
            const successUrl = `success.html?token=${encodeURIComponent(token)}`;
            console.log('Redirecting to:', successUrl);
            window.location.href = successUrl;
        })
        .catch(error => console.error('Error:', error));
});