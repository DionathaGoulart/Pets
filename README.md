<div align="center">

# ADOÇÃO DE PETS
### PLATAFORMA DE ADOÇÃO

![React](https://img.shields.io/badge/react-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Vite](https://img.shields.io/badge/vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

<br />

**Plataforma para adoção responsável de animais com sistema de matching inteligente.**
**Conecta pessoas que querem adotar com animais que precisam de um lar.**

[Getting Started](#-getting-started) • [License](#-license)

</div>

---

## 🏗️ Architecture

This project uses a **Vite/React** frontend and a **Node.js** backend (or Django, depending on specific implementation version) with **MongoDB**.

```mermaid
graph TD;
    User-->Frontend[React App];
    Frontend-->Backend[API Server];
    Backend-->DB[(MongoDB)];
```

---

## 🚀 Applications

<div align="center">

| Application | Description | Tech Stack |
|:-----------:|:----------- |:---------- |
| **Frontend** | Interactive UI for browsing pets. | `React` `Vite` `Tailwind` |
| **Backend** | API for managing pet listings and adoptions. | `Node.js` `Express` `MongoDB` |

</div>

---

## 🛠️ Getting Started

### Prerequisites

*   **Node.js 18+**
*   **MongoDB**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/DionathaGoulart/Pets.git

# 2. Setup Backend
cd backend
npm install
npm start

# 3. Setup Frontend (in a new terminal)
cd ../frontend
npm install
npm run dev
```

---

## 📄 License

This project is proprietary and confidential.

**Copyright © 2026 Dionatha Goulart.**
All Rights Reserved.
