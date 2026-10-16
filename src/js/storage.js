
const STORAGE_KEY = "epfo-ecr-members";

export function saveMembers(members) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

export function loadMembers() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);

        if (!savedData) {
            return [];
        }

        const members = JSON.parse(savedData);

        return Array.isArray(members) ? members : [];
    } catch (error) {
        console.error("Could not load saved employee data:", error);
        return [];
    }
}

export function clearSavedMembers() {
    localStorage.removeItem(STORAGE_KEY);
}
