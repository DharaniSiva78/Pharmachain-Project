// --------------------- Contract Setup ---------------------
const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS"; // Replace with your deployed address
const contractABI = [
  // Paste ABI here
];

let provider, signer, contract;

// --------------------- Connect to MetaMask ---------------------
async function connectToBlockchain() {
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    console.log("✅ Connected to contract:", contractAddress);
  } else {
    alert("Please install MetaMask to interact with the blockchain!");
  }
}

connectToBlockchain();

// --------------------- UI Elements ---------------------
const navLinks = document.querySelectorAll(".nav-link");
const formContainer = document.getElementById("formContainer");
const batchDisplay = document.getElementById("batchDisplay");
const placeholder = document.getElementById("placeholder");

// --------------------- Navigation Event ---------------------
navLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    const action = link.getAttribute("data-action");
    renderForm(action);
  });
});

// --------------------- Render Form ---------------------
function renderForm(action) {
  // Reset view
  formContainer.innerHTML = "";
  formContainer.style.display = "none";
  batchDisplay.classList.add("hidden");
  placeholder.style.display = "flex";
  placeholder.style.flexDirection = "column";
  placeholder.style.justifyContent = "center";
  placeholder.style.alignItems = "center";

  const card = document.createElement("div");
  card.className = "card";
  let validAction = true;

  switch (action) {
    case "register":
      card.innerHTML = `
        <h2>🆕 Register New Batch</h2>
        <input type="text" id="batchId" placeholder="Batch ID" />
        <input type="text" id="drugName" placeholder="Drug Name" />
        <input type="text" id="manufacturer" placeholder="Manufacturer" />
        <input type="text" id="origin" placeholder="Origin" />
        <label>Manufacture Date</label>
        <input type="date" id="manufactureDate" />
        <label>Expiry Date</label>
        <input type="date" id="expiryDate" />
        <input type="text" id="certificateHash" placeholder="Certificate Hash" />
        <button id="registerBtn">Register</button>
      `;
      break;

    case "transfer":
      card.innerHTML = `
        <h2>🔄 Transfer Batch</h2>
        <input type="text" id="transferBatchId" placeholder="Batch ID" />
        <input type="text" id="transferTo" placeholder="Receiver Address" />
        <button id="transferBtn">Transfer</button>
      `;
      break;

    case "spoil":
      card.innerHTML = `
        <h2>⚠️ Mark Batch as Spoiled</h2>
        <input type="text" id="spoilBatchId" placeholder="Batch ID" />
        <input type="text" id="spoilReason" placeholder="Reason for Spoilage" />
        <button id="spoilBtn">Mark Spoiled</button>
      `;
      break;

    case "expire":
      card.innerHTML = `
        <h2>⏰ Auto Expire Batch</h2>
        <input type="text" id="expireBatchId" placeholder="Batch ID" />
        <button id="expireBtn">Check & Expire</button>
      `;
      break;

    case "updateCert":
      card.innerHTML = `
        <h2>📜 Update Certificate Hash</h2>
        <input type="text" id="updateBatchId" placeholder="Batch ID" />
        <input type="text" id="newHash" placeholder="New Certificate Hash" />
        <button id="updateBtn">Update</button>
      `;
      break;

    case "view":
      card.innerHTML = `
        <h2>🔍 View Batch Details</h2>
        <input type="text" id="viewBatchId" placeholder="Enter Batch ID" />
        <button id="viewBtn">View</button>
        <div id="viewResult" class="result"></div>
      `;
      break;

    default:
      validAction = false;
  }

  if (validAction) {
    placeholder.style.display = "none";
    formContainer.style.display = "flex";
    formContainer.appendChild(card);
  } else {
    placeholder.style.display = "flex";
  }

  // --------------------- Event Handlers ---------------------
  if (action === "register") {
    document.getElementById("registerBtn").addEventListener("click", async () => {
      const batchId = document.getElementById("batchId").value.trim();
      const drugName = document.getElementById("drugName").value.trim();
      const manufacturer = document.getElementById("manufacturer").value.trim();
      const origin = document.getElementById("origin").value.trim();
      const manufactureDate = Math.floor(new Date(document.getElementById("manufactureDate").value).getTime() / 1000);
      const expiryDate = Math.floor(new Date(document.getElementById("expiryDate").value).getTime() / 1000);
      const certificateHash = document.getElementById("certificateHash").value.trim();

      if (!batchId || !drugName) return alert("Please fill in all required fields.");

      try {
        const tx = await contract.registerBatch(batchId, drugName, manufacturer, origin, manufactureDate, expiryDate, certificateHash);
        await tx.wait();
        alert("✅ Batch registered successfully!");
      } catch (err) {
        console.error(err);
        alert("❌ Error registering batch.");
      }
    });
  }

  if (action === "transfer") {
    document.getElementById("transferBtn").addEventListener("click", async () => {
      const id = document.getElementById("transferBatchId").value;
      const to = document.getElementById("transferTo").value;
      try {
        const tx = await contract.transferBatch(id, to);
        await tx.wait();
        alert("✅ Batch transferred successfully!");
      } catch (err) {
        console.error(err);
        alert("❌ Error transferring batch.");
      }
    });
  }

  if (action === "spoil") {
    document.getElementById("spoilBtn").addEventListener("click", async () => {
      const id = document.getElementById("spoilBatchId").value;
      const reason = document.getElementById("spoilReason").value;
      try {
        const tx = await contract.markAsSpoiled(id, reason);
        await tx.wait();
        alert("⚠️ Batch marked as spoiled!");
      } catch (err) {
        console.error(err);
        alert("❌ Error marking batch spoiled.");
      }
    });
  }

  if (action === "expire") {
    document.getElementById("expireBtn").addEventListener("click", async () => {
      const id = document.getElementById("expireBatchId").value;
      try {
        const tx = await contract.autoExpire(id);
        await tx.wait();
        alert("⏰ Batch expiration checked!");
      } catch (err) {
        console.error(err);
        alert("❌ Error checking expiration.");
      }
    });
  }

  if (action === "updateCert") {
    document.getElementById("updateBtn").addEventListener("click", async () => {
      const id = document.getElementById("updateBatchId").value;
      const hash = document.getElementById("newHash").value;
      try {
        const tx = await contract.updateCertificateHash(id, hash);
        await tx.wait();
        alert("📜 Certificate updated successfully!");
      } catch (err) {
        console.error(err);
        alert("❌ Error updating certificate.");
      }
    });
  }

  if (action === "view") {
    document.getElementById("viewBtn").addEventListener("click", async () => {
      const id = document.getElementById("viewBatchId").value;
      if (!id) return alert("Enter a valid Batch ID.");

      try {
        const data = await contract.getBatchDetails(id);
        document.getElementById("viewResult").innerHTML = `
          <p><strong>Batch ID:</strong> ${data[0]}</p>
          <p><strong>Drug Name:</strong> ${data[1]}</p>
          <p><strong>Manufacturer:</strong> ${data[2]}</p>
          <p><strong>Origin:</strong> ${data[3]}</p>
          <p><strong>Manufacture Date:</strong> ${new Date(data[4] * 1000).toLocaleDateString()}</p>
          <p><strong>Expiry Date:</strong> ${new Date(data[5] * 1000).toLocaleDateString()}</p>
          <p><strong>Expired:</strong> ${data[6] ? "Yes" : "No"}</p>
          <p><strong>Spoiled:</strong> ${data[7] ? "Yes" : "No"}</p>
          <p><strong>Spoil Reason:</strong> ${data[8]}</p>
          <p><strong>Certificate Hash:</strong> ${data[9]}</p>
          <p><strong>Current Holder:</strong> ${data[10]}</p>
        `;
      } catch (err) {
        console.error(err);
        alert("❌ Batch not found or error fetching data.");
      }
    });
  }
}
