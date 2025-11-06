let provider, signer, contract;

async function connectToBlockchain() {
  if (window.ethereum) {
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = await provider.getSigner();
      
      // Wait for config to load
      await loadConfig();
      
      contract = new ethers.Contract(CONFIG.contractAddress, CONFIG.contractABI, signer);
      console.log("✅ Connected to contract:", CONFIG.contractAddress);
      
      // Update UI
      const address = await signer.getAddress();
      document.getElementById('walletAddress').textContent = 
        `Connected: ${address.substring(0, 6)}...${address.substring(38)}`;
      document.getElementById('connectWallet').textContent = '✅ Connected';
      
      return true;
    } catch (error) {
      console.error("Connection error:", error);
      alert("❌ Error connecting to blockchain");
      return false;
    }
  } else {
    alert("Please install MetaMask!");
    return false;
  }
}

// Connect wallet when page loads
document.addEventListener('DOMContentLoaded', async () => {
  await connectToBlockchain();
});

// Connect wallet button
document.getElementById("connectWallet").addEventListener("click", connectToBlockchain);

// Register batch function
document.getElementById("registerBtn").addEventListener("click", async () => {
  const batchId = document.getElementById("batchId").value.trim();
  const drugName = document.getElementById("drugName").value.trim();
  const manufacturer = document.getElementById("manufacturer").value.trim();
  const origin = document.getElementById("origin").value.trim();
  const manufactureDate = document.getElementById("manufactureDate").value;
  const expiryDate = document.getElementById("expiryDate").value;
  const certificateHash = document.getElementById("certificateHash").value.trim();

  // Validation
  if (!batchId || !drugName || !manufactureDate || !expiryDate) {
    showResult("❌ Please fill in all required fields.", "error");
    return;
  }

  // Date conversion
  const manufactureTimestamp = Math.floor(new Date(manufactureDate).getTime() / 1000);
  const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000);
  
  if (expiryTimestamp <= manufactureTimestamp) {
    showResult("❌ Expiry date must be after manufacture date.", "error");
    return;
  }

  try {
    showResult("⏳ Registering batch...", "loading");
    
    const tx = await contract.registerBatch(
      batchId,
      drugName,
      manufacturer,
      origin,
      manufactureTimestamp,
      expiryTimestamp,
      certificateHash || "initial_certificate"
    );
    
    showResult("⏳ Transaction submitted. Waiting for confirmation...", "loading");
    
    await tx.wait();
    
    showResult("✅ Batch registered successfully!", "success");
    
    // Clear form
    document.querySelectorAll("input").forEach(input => input.value = "");
    
  } catch (err) {
    console.error("Registration error:", err);
    let errorMessage = "❌ Error registering batch.";
    
    if (err.reason) {
      errorMessage = `❌ ${err.reason}`;
    } else if (err.message && err.message.includes("user rejected")) {
      errorMessage = "❌ Transaction rejected by user.";
    }
    
    showResult(errorMessage, "error");
  }
});

function showResult(message, type) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = message;
  resultDiv.className = "result";
  
  if (type === "success") {
    resultDiv.style.color = "#10b981";
    resultDiv.style.borderLeft = "4px solid #10b981";
  } else if (type === "error") {
    resultDiv.style.color = "#ef4444";
    resultDiv.style.borderLeft = "4px solid #ef4444";
  } else if (type === "loading") {
    resultDiv.style.color = "#f59e0b";
    resultDiv.style.borderLeft = "4px solid #f59e0b";
  }
  
  resultDiv.classList.remove("hidden");
}