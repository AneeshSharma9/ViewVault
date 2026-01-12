import { useState, useEffect } from "react";
import { auth, db } from "../utils/firebase";
import { ref, onValue } from "firebase/database";

const useUserVaults = () => {
    const [customVaults, setCustomVaults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uid, setUid] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setUid(user.uid);
                // Check both new and old paths for custom lists
                const vaultsRef = ref(db, `users/${user.uid}/customvaults`);
                const legacyWatchlistsRef = ref(db, `users/${user.uid}/customwatchlists`);

                let unsubVaults = null;
                let unsubLegacy = null;

                const handleData = (vaultsData, legacyData) => {
                    const combined = {};

                    if (legacyData) {
                        Object.keys(legacyData).forEach(key => {
                            combined[key] = { id: key, ...legacyData[key] };
                        });
                    }

                    if (vaultsData) {
                        Object.keys(vaultsData).forEach(key => {
                            combined[key] = { id: key, ...vaultsData[key] };
                        });
                    }

                    setCustomVaults(Object.values(combined));
                    setLoading(false);
                };

                let currentVaults = null;
                let currentLegacy = null;

                const unsubscribeVaults = onValue(vaultsRef, (snapshot) => {
                    currentVaults = snapshot.exists() ? snapshot.val() : null;
                    handleData(currentVaults, currentLegacy);
                }, (error) => {
                    console.error('Error fetching custom vaults:', error);
                });

                const unsubscribeLegacy = onValue(legacyWatchlistsRef, (snapshot) => {
                    currentLegacy = snapshot.exists() ? snapshot.val() : null;
                    handleData(currentVaults, currentLegacy);
                }, (error) => {
                    console.error('Error fetching legacy watchlists:', error);
                });

                return () => {
                    unsubscribeVaults();
                    unsubscribeLegacy();
                };
            } else {
                setUid(null);
                setCustomVaults([]);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return { customVaults, loading, uid };
};

export default useUserVaults;
