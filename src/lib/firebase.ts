// BU DOSYA KULLANILMIYOR - Tum Firebase baglantilari src/config/firebase.js uzerinden yapiliyor.
// Bu dosya sadece geri-uyumluluk icin re-export saglar.
// YENI KOD YAZARKEN: import { auth, db } from '../config/firebase'; kullanin.

export { app, auth, db, storage, googleProvider } from '../config/firebase';
export const isMockMode = false;
