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

document.getElementById("expireBtn").addEventListener("click", async () => {
  const batchId = document.getElementById("expireBatchId").value.trim();

  if (!batchId) {
    showResult("❌ Please enter a Batch ID.", "error");
    return;
  }

  try {
    showResult("⏳ Checking batch expiration status...", "loading");
    
    // Check batch details first
    const batchDetails = await contract.getBatchDetails(batchId);
    const isExpired = batchDetails[6];
    const expiryDate = Number(batchDetails[5]);
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (isExpired) {
      showResult("⏰ Batch is already expired.", "warning");
      return;
    }

    if (currentTime < expiryDate) {
      const daysRemaining = Math.ceil((expiryDate - currentTime) / (60 * 60 * 24));
      showResult(`✅ Batch is not expired yet. ${daysRemaining} days remaining.`, "success");
      return;
    }

    showResult("⏰ Batch is expired. Marking as expired...", "loading");
    
    const tx = await contract.autoExpire(batchId);
    showResult("⏳ Transaction submitted. Waiting for confirmation...", "loading");
    
    await tx.wait();
    showResult("⏰ Batch marked as expired successfully!", "success");
    
    // Clear form
    document.getElementById("expireBatchId").value = "";
    
  } catch (err) {
    console.error("Expire error:", err);
    let errorMessage = "❌ Error checking expiration.";
    
    if (err.reason) {
      errorMessage = `❌ ${err.reason}`;
    } else if (err.message && err.message.includes("user rejected")) {
      errorMessage = "❌ Transaction rejected by user.";
    } else if (err.message && err.message.includes("Batch does not exist")) {
      errorMessage = "❌ Batch does not exist.";
    } else if (err.message && err.message.includes("Batch not yet expired")) {
      errorMessage = "✅ Batch is not expired yet.";
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
  } else if (type === "warning") {
    resultDiv.style.color = "#f59e0b";
    resultDiv.style.borderLeft = "4px solid #f59e0b";
  }
  
  resultDiv.classList.remove("hidden");
}