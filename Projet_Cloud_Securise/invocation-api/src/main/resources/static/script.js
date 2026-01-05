// script.js
document.getElementById('invokeButton').addEventListener('click', async () => {
    const resultElement = document.getElementById('result');
    const token = document.getElementById('tokenInput').value;
    resultElement.textContent = 'Invoking...';

    try {
        const response = await fetch('http://localhost:8084/api/invocation/invoke', {
            method: 'POST',
            headers: {
                'Authorization': `${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error('Failed to invoke monster');
        }

        const data = await response.json();
        resultElement.innerHTML = `
            <p>Name: ${data.name}</p>
            <p>Attack: ${data.attack}</p>
            <p>Defense: ${data.defense}</p>
            <p>HP: ${data.hp}</p>
            <p>Speed: ${data.speed}</p>
            <p>Element: ${data.element}</p>
            <p>Probability: ${data.probability}</p>
            <p>Skills:</p>
            <ul>
                ${data.skills.map(skill => `
                    <li>
                        <p>Name: ${skill.name}</p>
                        <p>Damage: ${skill.damage}</p>
                        <p>Damage Ratio: ${skill.damageRatio}</p>
                        <p>Cool Down: ${skill.coolDown}</p>
                        <p>Level: ${skill.level}</p>
                        <p>Level Max: ${skill.levelMax}</p>
                    </li>
                `).join('')}
            </ul>
        `;
    } catch (error) {
        resultElement.textContent = error.message;
    }
});