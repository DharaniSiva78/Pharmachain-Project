let provider, signer, contract;

async function connectToBlockchain() {
  if (window.ethereum) {
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      signer = await provider.getSigner();
      
      await loadConfig();
      contract = new ethers.Contract(CONFIG.contractAddress, CONFIG.contractABI, signer);
      console.log("✅ Connected to contract");
      
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

document.addEventListener('DOMContentLoaded', async () => {
  await connectToBlockchain();
});

document.getElementById("connectWallet").addEventListener("click", connectToBlockchain);

document.getElementById("updateBtn").addEventListener("click", async () => {
  const batchId = document.getElementById("updateBatchId").value.trim();
  const newHash = document.getElementById("newHash").value.trim();

  if (!batchId || !newHash) {
    showResult("❌ Please fill in all fields.", "error");
    return;
  }

  try {
    showResult("⏳ Checking batch ownership...", "loading");
    
    // Check if batch exists and current holder
    const batchDetails = await contract.getBatchDetails(batchId);
    const currentHolder = batchDetails[10];
    const userAddress = await signer.getAddress();
    
    if (currentHolder.toLowerCase() !== userAddress.toLowerCase()) {
      showResult("❌ You are not the current holder of this batch.", "error");
      return;
    }

    if (batchDetails[6]) { // expired
      showResult("❌ Cannot update certificate for expired batch.", "error");
      return;
    }

    if (batchDetails[7]) { // spoiled
      showResult("❌ Cannot update certificate for spoiled batch.", "error");
      return;
    }

    showResult("⏳ Updating certificate...", "loading");
    
    const tx = await contract.updateCertificateHash(batchId, newHash);
    showResult("⏳ Transaction submitted. Waiting for confirmation...", "loading");
    
    await tx.wait();
    showResult("📜 Certificate updated successfully!", "success");
    
    // Clear form
    document.getElementById("updateBatchId").value = "";
    document.getElementById("newHash").value = "";
    
  } catch (err) {
    console.error("Update error:", err);
    let errorMessage = "❌ Error updating certificate.";
    
    if (err.reason) {
      errorMessage = `❌ ${err.reason}`;
    } else if (err.message && err.message.includes("user rejected")) {
      errorMessage = "❌ Transaction rejected by user.";
    } else if (err.message && err.message.includes("Batch does not exist")) {
      errorMessage = "❌ Batch does not exist.";
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