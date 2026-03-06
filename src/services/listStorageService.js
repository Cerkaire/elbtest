import { db } from '../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'epic_lists';

// ========== LOCAL STORAGE ==========

function getLocalLists() {
    try {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function saveLocalList(list) {
    const lists = getLocalLists();
    const index = lists.findIndex(l => l.id === list.id);
    if (index >= 0) {
        lists[index] = list;
    } else {
        lists.push(list);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lists));
}

function deleteLocalList(listId) {
    const lists = getLocalLists().filter(l => l.id !== listId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lists));
}

// ========== FIRESTORE ==========

async function getFirestoreLists(uid) {
    try {
        const ref = collection(db, 'users', uid, 'lists');
        const snapshot = await getDocs(ref);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error('Erreur Firestore (lecture):', err);
        return [];
    }
}

async function saveFirestoreList(uid, list) {
    try {
        const ref = doc(db, 'users', uid, 'lists', list.id);
        await setDoc(ref, list);
    } catch (err) {
        console.error('Erreur Firestore (écriture):', err);
    }
}

async function deleteFirestoreList(uid, listId) {
    try {
        const ref = doc(db, 'users', uid, 'lists', listId);
        await deleteDoc(ref);
    } catch (err) {
        console.error('Erreur Firestore (suppression):', err);
    }
}

// ========== API EXPORTÉE ==========

export async function saveListe(list, user) {
    saveLocalList(list);
    if (user) {
        await saveFirestoreList(user.uid, list);
    }
}

export async function loadAllListes(user) {
    const localLists = getLocalLists();

    if (!user) return localLists;

    const firestoreLists = await getFirestoreLists(user.uid);

    // Merge : plus récent gagne par id
    const merged = new Map();
    for (const list of localLists) {
        merged.set(list.id, list);
    }
    for (const list of firestoreLists) {
        const existing = merged.get(list.id);
        if (!existing || new Date(list.dateModification) > new Date(existing.dateModification)) {
            merged.set(list.id, list);
        }
    }

    return Array.from(merged.values());
}

export async function deleteListe(listId, user) {
    deleteLocalList(listId);
    if (user) {
        await deleteFirestoreList(user.uid, listId);
    }
}
