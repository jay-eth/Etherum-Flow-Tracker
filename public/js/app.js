document.getElementById('search-button').addEventListener('click', () => {
    const inputField = document.getElementById('search-input');
    const input = inputField.value.trim();
    const statusTitle = document.getElementById('status-title');
    const statusText = document.getElementById('placeholder-message');
    
    if (!input) {
        inputField.classList.add('border-red-500');
        setTimeout(() => inputField.classList.remove('border-red-500'), 1000);
        return;
    }
    
    statusTitle.innerText = "Analyzing Flow...";
    statusText.innerText = `Establishing neural links for address ${input.substring(0, 6)}...${input.substring(input.length - 4)}`;
    
    console.log('Searching for:', input);
    
    // Simulate techy processing
    setTimeout(() => {
        statusTitle.innerText = "Flow Mapped";
        statusText.innerText = "Visualization engine initialized. View detailed breakdown below.";
    }, 1500);
});

// Handle enter key
document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('search-button').click();
    }
});
