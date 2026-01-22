document.getElementById('search-button').addEventListener('click', () => {
    const input = document.getElementById('search-input').value;
    if (!input) return;
    
    console.log('Searching for:', input);
    // Future: Add API fetch and visualization logic here
    document.getElementById('placeholder-message').innerText = `Visualizing ${input}... (Feature coming soon)`;
});
