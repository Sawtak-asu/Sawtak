| Phase | Component | Task / Feature | Technology |
| :--- | :--- | :--- | :--- |
| **1. Core** | **Encryption & Standards**| Define **AES-256-GCM** as the client-side encryption standard (for blockchain complaints). | (Standard) |
| | | Define **SHA-256** as the hashing standard (for the IPFS CID). | (Standard) |
| | **Persistence** | Provision **IPFS** pinning service (e.g., Pinata) for file storage. | IPFS |
| | **Hedera Hashgraph** | Create a unique **Hedera Token Service (HTS) NFT** to be the "Citizen Badge." | Hedera SDK (JS) |
| | | Create a public **Hedera Consensus Service (HCS) Topic** for all submissions. | Hedera SDK (JS) |
| | | Define the **HCS message format** (e.g., `{ "cid": "...", "category": "...", "area": "..." }`). | (Standard) |
| **2. Backend (System A)** | **Identity Service (JS)** | User account registration (email/password) for verification. | Node.js (Express/Fastify) |
| **(Accounts)** | | Secure account login and session management (JWT). | Node.js |
| | | Secure, encrypted database for `user <-> Egyptian ID <-> Hedera AccountID`. | Node.js, SQL, PGP |
| | | API endpoint to receive uploaded National ID document. | Node.js |
| | | API to link a user's account to their app-generated `AccountID`. | Node.js |
| | | **Attestation Service:** Issues the "Citizen Badge" (HTS NFT) to the user's `AccountID`. | Node.js, Hedera SDK (JS) |
| | | ** Traditional Complaint API:** `POST /complaint/normal` endpoint. | Node.js |
| | | ** Traditional Complaint DB:** New SQL table `normal_complaints` linked to `user_id`. | Node.js, SQL |
| | | ** Attachment Handling:** Secure file upload handler (e.g., S3/local) for normal complaints. | Node.js, (S3/Multer) |
| | | ** Traditional Complaint API:** `GET /complaint/normal` to list user's own complaints. | Node.js |
| | **Admin Portal** | Internal (non-public) dashboard for admins to log in. | React |
| | | Implement **Admin Roles** (e.g., `Verifier`, `SuperAdmin`, `ComplaintManager`). | Node.js, React |
| | | Dashboard to view pending verification requests (ID docs). | React |
| | | "Approve" / "Deny" buttons to trigger the HTS NFT transfer. | React |
| | | Securely manage the "Treasury" account key used for paying attestation fees. | Node.js (e.g., Vault) |
| | | ** Admin Complaint Dashboard:** View, manage, and update status of "normal" complaints. | React |
| **3. Backend (System B)** | **Privacy Relay (Go)** | `POST /submit/secure` endpoint for *anonymous* encrypted blobs. | **Go** |
| **(Complaints)** | | Forwards blobs to IPFS and returns the CID. | **Go** |
| | | **Strict privacy:** No logging of IP, User-Agent, or PII. | **Go** |
| | **Indexing Service (JS)**| Subscribes to the HCS Topic (e.g., via a Mirror Node). | Node.js, Hedera SDK (JS) |
| | | Caches HCS messages (hash, timestamp, AccountID, **category, area**). | Node.js, SQL |
| | | **Data Validation:** Indexer must verify the `AccountID` holds the NFT before caching. | Node.js, Hedera SDK (JS) |
| | **Verification API (JS)** | Public, read-only API to check if a hash is in the HCS topic (for the verifier). | Node.js (Express/Fastify) |
| | **Dashboard API (JS)** | Public API to serve aggregated *blockchain* complaint data, with filtering. | Node.js (Express/Fastify) |
| **4. Web Client** | **Web Client (Next.js)** | User registration/login forms (for System A). | Next.js |
| | | Secure "My Account" dashboard for ID upload and status check. | Next.js |
| | | ** "Normal Complaint" Form:** In-account form with text and file upload. | Next.js |
| | | ** "My Complaints" List:** View status of submitted *normal* complaints. | Next.js |
| | | **In-App Wallet:** Implement Hedera account generation (create new private/public key). | Next.js, Hedera SDK (JS) |
| | | **Key Management:** Implement secure key export (e.g., encrypted keystore file or mnemonic). | Next.js |
| | | **Key Management:** Implement "Wallet Unlock" (e.g., upload keystore + password). | Next.js |
| | | **Anonymous Submission:** "Connect" flow loads the *in-app* unlocked key. | Next.js, Hedera SDK (JS) |
| | | Checks on-chain if `AccountID` holds the "Citizen Badge" NFT before submit. | Next.js, Hedera SDK (JS) |
| | | *Blockchain* complaint form must include **`category` and `area`** dropdowns. | Next.js |
| | | E2E *blockchain* submission workflow (Encrypt $\rightarrow$ Upload $\rightarrow$ Sign & Submit to HCS). | Next.js, Hedera SDK (JS) |
| | | Display final receipt (IPFS CID & HCS Transaction ID/Timestamp). | Next.js |
| | | **Public Dashboard UI** (charts, map, lists of *blockchain* complaints). | Next.js |
| | | Dashboard UI controls for filtering *blockchain* complaints by `category` and `area`. | Next.js |
| | | Public Verification Tool UI (paste a CID to check its status). | Next.js |
| **5. Mobile Client** | **Mobile Client (React Native)** | All Account features from Web Client (registration, ID upload, status). | React Native |
| | | ** "Normal Complaint" Form:** Native form with text and file/camera upload. | React Native |
| | | ** "My Complaints" List:** View status of submitted *normal* complaints. | React Native |
| | | Native camera access for secure ID capture. | React Native |
| | | **In-App Wallet:** Implement native Hedera account generation. | React Native, Hedera SDK (JS) |
| | | **Key Management:** Store private key in **Secure Enclave / Keystore** (native module). | React Native |
| | | **Key Management:** Implement Biometric/PIN lock to access the key for signing. | React Native |
| | | All *blockchain* complaint features from Web Client (check NFT, submit with `category`/`area`). | React Native |
| | | **Public Dashboard UI** (mobile-optimized, *blockchain* complaints). | React Native |
| | | Mobile-native dashboard filtering controls. | React Native |
| **6. Validation** | **Testing** | E2E Test: Unverified user (no NFT) is blocked from submitting *blockchain* complaints. | (Testing) |
| | | E2E Test: Verified user (via System A) can submit (via System B). | (Testing) |
| | | E2E Test: Submitted *blockchain* complaint appears in HCS and is verifiable. | (Testing) |
| | | E2E Test: Submitted *blockchain* complaint appears on the public dashboard. | (Testing) |
| | | ** E2E Test:** Logged-in user can submit a *normal* complaint with an attachment. | (Testing) |
| | | ** E2E Test:** User can see their *normal* complaint status in their account. | (Testing) |
| | | ** E2E Test:** Admin can view and manage *normal* complaints and attachments. | (Testing) |
| | | **Security Test:** Audit Go Relay logs for PII. | (Testing) |
| | | **Security Test:** Confirm architectural firewall between System A & B. | (Testing) |
| | | **Security Test:** Confirm *normal* complaint attachments are not publicly accessible. | (Testing) |
| | | **Wallet Test:** E2E Test for account key export (web) and recovery (import). | (Testing) |
| | | **Wallet Test:** Confirm keys are not in `localStorage` (web) or plaintext (mobile). | (Testing) |
