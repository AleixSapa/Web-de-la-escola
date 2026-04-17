# 🛠️ Llista de Codis Especial per a Betatesters
Aquests són els codis secrets reservats exclusivament pels comptes amb rol "Betatester", introduïts al moment de fer testos des de l'opció introduir codi manualment.

### 1. Activar Simulador (Entorn de Prova)
Aquests codis porten temporalment la persona a l'entorn on pot veure i accedir a la consola d'administració:
- **`beta-look`**
- **`admin-look`**
- **`codi-admin`**
- *(I també qualsevol altre codi afegit manualment per tu des de la base de dades/taula "admin_codes")*

### 2. Automatitzacions de Calendari
- **`aprovar-tot`** (o bé `approve-all`): Aprova de forma automàtica absolutament totes les propostes (d'aniversaris o esdeveniments) de qualsevol usuari i les fa visibles globalment.
- **`aprovar-aleix`** (o bé `approve-aleix`): Revisa i aprova únicament a l'instant aquelles propostes col·locades sota el nom d'Aleix.

### 3. Infiltració de Base de Dades (Múltiples Comptes)
Pots fer servir aquests codis de manera dinàmica substituint `[usuari]` pel nom de qualsevol persona de l'escola (per exemple: `get-pau` o `password-aleix`):
- **`password-[usuari]`**: Connecta temporalment amb la matriu d'usuaris (`users`), busca la persona dins de la base de dades i en destapa únicament la contrasenya actual.
- **`get-[usuari]`**: Cerca qualsevol usuari i n'extreu la fitxa completa per pantalla amb el nom exacte d'usuari de sistema i la contrasenya associada d'aquell compte.
